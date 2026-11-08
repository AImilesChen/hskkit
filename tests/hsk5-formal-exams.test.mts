import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { startFormal, saveFormalAnswer, submitFormal, formalView, studentPaper, examPhase, mayOpenPaper } from '../src/lib/formal-exams/hsk5/domain.ts';
import type { ExamPaper, Form } from '../src/lib/formal-exams/hsk5/types.ts';
const file=(p:string)=>readFileSync(p,'utf8');
const paper=(f:Form)=>JSON.parse(file(`src/lib/formal-exams/hsk5/data/${f}.json`)) as ExamPaper;
const now='2026-11-08T10:00:00Z',at=(n:number)=>new Date(Date.parse(now)+n*1000).toISOString();
test('HSK5 user-accepted snapshots and every deployed medium match pinned SHA256',()=>{
 const provenance=JSON.parse(file('src/lib/formal-exams/hsk5/data/provenance.json'));
 const accepted=['79a42aa4ed11b86e99c8a18ca5b9a72fbd0b1644c70cf52a0bacaeda13c18e78','38cb49fdef0e9cdc325cf8679aba0d65c668beadfc04840201c15d4a94f5964e','f0cf13e9fc027127052c8b152982595f03084d1be3e214544f1b00543ba2ddd4'];
 const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
 for(const [i,p] of provenance.entries()){
  assert.equal(p.paperSha256,accepted[i]);assert.equal(sha(`src/lib/formal-exams/hsk5/data/${p.form}.json`),p.runtimeSha256);
  assert.equal(p.media.length,25);
  for(const m of p.media)assert.equal(sha(`public/formal-media/hsk5-${p.form}-v1/${m.filename}`),m.sha256);
  assert.equal(p.media.find((m:{filename:string})=>m.filename==='listening-full.mp3').sha256,p.audioSha256);
 }
});
test('HSK5 72 tasks and eight groups expose safe picture IDs and both writing minima',()=>{
 for(const f of ['a','b','c'] as const){const p=paper(f),s=startFormal(p,'g','k',now),v=studentPaper(p);
  assert.equal(s.questions.length,72);assert.equal(p.parts.filter(x=>x.example).length,0);assert.equal(v.parts.length,8);
  assert.deepEqual(['listening','reading','writing'].map(x=>s.questions.filter(q=>q.dimension===x).length),[35,35,2]);
  assert.equal(Date.parse(s.deadlineAt)-Date.parse(now),6300000);assert.equal(s.band,'basic');assert(s.questions.every(q=>q.level===5));
  const text=JSON.stringify(formalView(s,p,now));for(const key of ['correctAnswer','referenceAnswer','acceptedExamples','audioScript','explanationEn','requiresHumanReview'])assert(!text.includes(key),key);
  assert.deepEqual(v.parts.filter(p=>p.section==='writing').map(p=>p.questions[0].essay?.minimumChineseCharacters),[100,200]);
  assert.equal(v.parts[6].questions[0].pictureStory?.imageIds.length,4);
  for(const part of v.parts)for(const q of part.questions){assert(!('answer' in q));if(q.essay)assert.deepEqual(Object.keys(q.essay),['minimumChineseCharacters']);if(q.pictureStory)assert.deepEqual(Object.keys(q.pictureStory),['imageIds']);}
 }
});
test('HSK5 authoritative boundaries preserve all 25+5+35+40 minutes',()=>{
 for(const [n,p] of [[1499,'listening'],[1500,'transfer'],[1799,'transfer'],[1800,'reading'],[3899,'reading'],[3900,'writing'],[6299,'writing'],[6300,'expired']] as const)assert.equal(examPhase(now,at(n)),p);
});
test('HSK5 full correct objective paper scores 70 while both references remain ungraded',()=>{
 for(const f of ['a','b','c'] as const){const p=paper(f);let s=startFormal(p,'g','k',now);
  for(const q of s.questions)s=saveFormalAnswer(s,{questionId:q.id,answer:q.correctAnswer,idempotencyKey:q.id,now:at(q.dimension==='listening'?100:q.dimension==='reading'?1900:4000)});
  const d=submitFormal(s,'submit',at(6000)),v=formalView(d,p,at(6000));assert.equal(v.result?.correct,70);assert.equal(v.result?.total,70);assert.equal(v.result?.listening,35);assert.equal(v.result?.reading,35);assert.equal(v.result?.items.filter(x=>x.manual&&x.correct===null).length,2);assert.equal(d.result?.percentage,100);assert.equal(submitFormal(d,'retry',at(6500)),d);
  assert.equal(v.result?.items.filter(x=>x.script.length>0).length,35);
 }
});
test('HSK5 both writing drafts allow multiline save clear and retry; enforce length and phase',()=>{
 for(const n of [71,72]){let s=startFormal(paper('a'),'g','k',now);const q=s.questions[n-1],x={questionId:q.id,answer:' 这是草稿。 ',idempotencyKey:'draft',now:at(4000)};
  s=saveFormalAnswer(s,x);assert.equal(s.answers[0].answer,'这是草稿。');assert.equal(saveFormalAnswer(s,x),s);assert.throws(()=>saveFormalAnswer(s,{...x,answer:'不同'}),/IDEMPOTENCY/);
  s=saveFormalAnswer(s,{...x,answer:'我'.repeat(n===71?100:200)+'。\n第二段。',idempotencyKey:'long'});assert(s.answers[0].answer.includes('\n'));
  s=saveFormalAnswer(s,{...x,answer:'',idempotencyKey:'clear'});assert.equal(s.answers[0].answer,'');
  for(const answer of ['我'.repeat(2001),'<script>','含\u0000字符'])assert.throws(()=>saveFormalAnswer(s,{...x,answer,idempotencyKey:answer}),/INVALID/);
  assert.throws(()=>saveFormalAnswer(s,{...x,idempotencyKey:'late',now:at(6300)}),/EXPIRED/);assert.throws(()=>saveFormalAnswer(s,{...x,idempotencyKey:'early',now:at(2000)}),/LOCKED/);
 }
});
test('HSK5 paragraph ordering and shared reading/listening retain the accepted groups',()=>{
 for(const f of ['a','b','c'] as const){const p=paper(f),qs=p.parts.flatMap(p=>p.questions);
  for(const group of [[11,12],[13,14],[15,16],[17,18,19],[20,21],[22,23],[24,25,26],[27,28,29],[30,31,32],[33,34,35]])assert.equal(new Set(group.map(n=>qs[n-1].audioSrc)).size,1);
  for(const group of [[36,37,38],[39,40,41],[42,43,44,45],[56,57,58],[59,60,61,62],[63,64,65,66],[67,68,69,70]]){assert.equal(new Set(group.map(n=>qs[n-1].passageId)).size,1);assert(qs[group[0]-1].passageId);}
  for(const part of p.parts.filter(p=>p.id.startsWith('R2')))assert.deepEqual(part.questions.map(q=>q.answer).sort(),Object.keys(part.sharedOptions!).sort());
 }
});
test('HSK5 gates Pro media before range streaming and separates exam namespaces',()=>{
 assert(mayOpenPaper('a','free'));for(const f of ['b','c'] as const){assert(!mayOpenPaper(f,'free'));assert(mayOpenPaper(f,'pro'));}
 const r=file('src/app/api/v1/formal-exams/hsk5/route.ts');assert(r.includes('hsk5-([abc])-v1'));assert(r.includes('formal:hsk5:'));assert(r.includes('identity.id, "basic", key'));
 const m=file('src/app/api/v1/formal-exams/hsk5/media/[form]/[filename]/route.ts');assert(m.indexOf('requirePaperAccess(form')<m.indexOf('env.ASSETS.fetch'));
 const ui=file('src/app/hsk-test-prep/hsk-5/mock/formal-runner.tsx');assert(ui.includes('hskkit_formal_hsk5_'));assert(ui.includes('q.pictureStory'));assert(ui.includes('minimumChineseCharacters'));assert(ui.includes('paper!.parts.length - 1'));assert(!ui.includes('five picture sentences'));
});
