import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createComparisonIndex,compareVocabulary,filterComparison,comparisonCsv,startComparisonStudy,parseComparisonStudy,nextStudyBatch,initialFilters,type ComparedWord} from '../src/lib/vocabulary-comparison/domain.ts';
import {ratePreview,repeatUncertain} from '../src/lib/learning/flashcard-preview.ts';

const manifest=JSON.parse(await readFile('src/lib/vocabulary-comparison/manifest.json','utf8'));
const raw=await readFile('public'+manifest.bankUrl);
const bank=JSON.parse(raw.toString('utf8'));
const index=createComparisonIndex(bank);
test('pins both real source inventories and retains all sixteen thousand source IDs',async()=>{
 assert.equal(createHash('sha256').update(raw).digest('hex'),manifest.bankSha256);
 const workbook=await readFile('content/sources/hsk2015/HSK-2015.xlsx');
 assert.equal(createHash('sha256').update(workbook).digest('hex'),manifest.sources.old.sha256);
 assert.equal(bank.old.length,5000);assert.equal(bank.new.length,11000);
 assert.equal(index.units.reduce((n,r)=>n+r.old.length,0),5000);
 assert.equal(index.units.reduce((n,r)=>n+r.updated.length,0),11000);
 assert.equal(new Set(bank.old.map((r:unknown[])=>r[0])).size,5000);
 assert.equal(new Set(bank.new.map((r:unknown[])=>r[0])).size,11000);
 assert.equal(manifest.summary.oldHeadwords,4992);assert.equal(manifest.summary.newHeadwords,10896);
 assert.equal(manifest.release,'hsk3-hsk123456789-2025-v11');
});
test('all forty-two level pairs reconcile four disjoint sets and independent cumulative totals',()=>{
 const oldCumulative=[150,300,600,1200,2500,5000],newCumulative=[300,500,1000,2000,3600,5400,11000];
 for(let old=1;old<=6;old++)for(let target=1;target<=7;target++){
  const result=compareVocabulary(index,old,target);
  assert.equal(result.oldEntries,oldCumulative[old-1]);assert.equal(result.targetEntries,newCumulative[target-1]);
  const oldSet=new Set(bank.old.filter((r:unknown[])=>Number(r[1])<=old).map((r:unknown[])=>r[3]));
  const newSet=new Set(bank.new.filter((r:unknown[])=>Number(r[1])<=target).map((r:unknown[])=>r[2]));
  assert.equal(result.rows.length,new Set([...oldSet,...newSet]).size);
  assert.equal(new Set(result.rows.map(r=>r.id)).size,result.rows.length);
  assert.equal(Object.values(result.counts).reduce((a,b)=>a+b),result.rows.length);
  assert.equal(result.counts.overlap,[...oldSet].filter(x=>newSet.has(x)).length);
  assert.equal(result.counts.gap,newSet.size-result.counts.overlap);
  assert.equal(result.oldHeadwords,oldSet.size);assert.equal(result.targetHeadwords,newSet.size);
  assert.ok(result.coverage>=0&&result.coverage<=100);
 }
});
test('homographs and grammatical qualifiers remain visible rather than overwriting meanings',()=>{
 const hua=index.units.find(r=>r.headword==='花')!,wei=index.units.find(r=>r.headword==='喂')!;
 assert.equal(hua.old.length,2);assert.deepEqual(hua.old.map(e=>e.sourceHeadword),['花（名词）','花（动词）']);
 assert.ok(hua.needsReview);assert.equal(wei.old.length,2);assert.equal(wei.updated.length,2);
 assert.deepEqual([...new Set(wei.old.map(e=>e.level))],[1,6]);
 const result=compareVocabulary(index,1,1);assert.equal(result.rows.find(r=>r.headword==='喂')?.category,'overlap');
 assert.equal(result.rows.filter(r=>r.headword==='喂').length,1,'A shared headword is not a claim that every reading is known.');
});
test('outside the selected old range means a gap even when the word exists at a later old level',()=>{
 const result=compareVocabulary(index,1,6);
 const later=result.rows.find(r=>r.category==='gap'&&r.old.some(e=>e.level>1));assert.ok(later);
 assert.ok(later.old.every(e=>e.level>1));
 const unlisted=compareVocabulary(index,6,7).rows.filter(r=>r.category==='unlisted');
 assert.ok(unlisted.length>0);assert.ok(unlisted.every(r=>r.updated.length===0));
 assert.throws(()=>compareVocabulary(index,7,3));assert.throws(()=>compareVocabulary(index,2,9));
});
test('Chinese, pinyin with tone marks, plain spelling and English search preserve the category boundary',()=>{
 const result=compareVocabulary(index,6,7);
 for(const query of ['学习','xuéxí','xuexi','study']){
  const rows=filterComparison(result,{...initialFilters,category:'overlap',query});
  assert.ok(rows.some(r=>r.headword==='学习'),query);assert.ok(rows.every(r=>r.category==='overlap'));
 }
 const review=filterComparison(result,{...initialFilters,category:'overlap',reviewOnly:true});assert.ok(review.length>0);assert.ok(review.every(r=>r.needsReview));
 const level=filterComparison(result,{...initialFilters,category:'overlap',newIntroduced:2});assert.ok(level.length>0);assert.ok(level.every(r=>r.updated.some(e=>e.level===2)));
 assert.deepEqual(filterComparison(result,{...initialFilters,query:'<script>not-a-word</script>'}),[]);
});
test('CSV exports the full filtered list with all source references and spreadsheet-safe cells',()=>{
 const rows=filterComparison(compareVocabulary(index,1,6),initialFilters);assert.ok(rows.length>100);
 const csv=comparisonCsv(rows);assert.equal(csv.split('\r\n').length,rows.length+2);
 assert.ok(csv.includes(rows.at(-1)!.updated[0].id));assert.ok(csv.startsWith('\ufeff'));
 const unsafe={...rows[0],headword:'=1+1',updated:[{...rows[0].updated[0],meaning:'He said "hello", then left.'}]} as ComparedWord;
 const safe=comparisonCsv([unsafe]);assert.ok(safe.includes('"\u0027=1+1"'));assert.ok(safe.includes('""hello""'));
});
test('study rounds retain exactly the filtered source IDs through batches, retry and reload',()=>{
 const result=compareVocabulary(index,4,4);const rows=filterComparison(result,{...initialFilters,newIntroduced:4}).slice(0,45);
 let study=startComparisonStudy(rows,result,manifest.version,20);
 assert.deepEqual(study.scopeIds,rows.map(r=>r.id));assert.equal(study.preview.order.length,20);
 for(let n=0;n<20;n++)study={...study,preview:ratePreview(study.preview,n===0?'retry':'known')};
 assert.equal(study.preview.round,2);assert.deepEqual(study.preview.order,[0]);
 study={...study,preview:ratePreview(study.preview,'retry')};assert.ok(study.preview.complete);
 const restored=parseComparisonStudy(JSON.parse(JSON.stringify(study)),index,manifest.version)!;assert.ok(restored);assert.deepEqual(restored,study);
 assert.deepEqual(repeatUncertain(restored.preview).order,[0]);
 const next=nextStudyBatch(restored);assert.equal(next.offset,20);assert.deepEqual(next.scopeIds,study.scopeIds);assert.equal(next.preview.order.length,20);
 const last=nextStudyBatch(next);assert.equal(last.offset,40);assert.equal(last.preview.order.length,5);assert.ok(parseComparisonStudy(last,index,manifest.version));
 assert.throws(()=>nextStudyBatch(last));
});
test('rejects outdated, corrupted and different-category saved rounds rather than choosing random replacement words',()=>{
 const result=compareVocabulary(index,4,4);const rows=filterComparison(result,initialFilters);const study=startComparisonStudy(rows,result,manifest.version,20);
 assert.equal(parseComparisonStudy(study,index,'new-bank-version'),null);
 assert.equal(parseComparisonStudy({...study,scopeIds:[study.scopeIds[0],study.scopeIds[0]]},index,manifest.version),null);
 assert.equal(parseComparisonStudy({...study,scopeIds:['unknown-id']},index,manifest.version),null);
 assert.equal(parseComparisonStudy({...study,scopeIds:[result.rows.find(r=>r.category==='overlap')!.id]},index,manifest.version),null);
 assert.equal(parseComparisonStudy({...study,preview:{...study.preview,cursor:999}},index,manifest.version),null);
 assert.equal(parseComparisonStudy({...study,preview:{...study.preview,ratings:{0:'<script>'}}},index,manifest.version),null);
 assert.equal(parseComparisonStudy({...study,preview:{...study.preview,complete:true}},index,manifest.version),null);
});
test('rejects duplicate source IDs and untrusted recording URLs in a malformed vocabulary file',()=>{
 assert.throws(()=>createComparisonIndex({...bank,old:[bank.old[0],bank.old[0]]}));
 const bad=[...bank.new[0]];bad[7]='https://untrusted.example/voice.mp3';assert.throws(()=>createComparisonIndex({...bank,new:[bad]}));
});
