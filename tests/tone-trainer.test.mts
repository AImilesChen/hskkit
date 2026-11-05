import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { TONES, TONE_ITEMS, TONE_BANK_VERSION, createToneSession, answerToneSession, retryToneMistakes, toneAnswer, toneItem, toneSessionReport, parseToneSession, mergeToneHistory } from '../src/lib/tones/domain.ts';
import { pinyinDisplaySegments } from '../src/lib/dictionary/pinyin-display.ts';
import { publishedContentAudioAsset } from '../src/lib/audio/assets.ts';
import { mergeLearningStates } from '../src/lib/account/domain.ts';

const make = (mode: 'single'|'double'='single') => createToneSession(mode, 10, { id:'qa-session-001', random:()=>.42, now:'2026-11-04T15:00:00Z' });
test('foundation bank has 96 distinct published recordings with balanced single tones and unambiguous labels',()=>{
  assert.equal(TONE_ITEMS.length,96);assert.equal(new Set(TONE_ITEMS.map(i=>i.id)).size,96);
  for(const t of TONES)assert.equal(TONE_ITEMS.filter(i=>i.mode==='single'&&i.tones[0]===t).length,12);
  for(const item of TONE_ITEMS){
    assert.ok(fs.statSync('public'+item.audioSrc).size>1000);
    const asset=publishedContentAudioAsset(item.id,item.hanzi);assert.ok(asset);assert.equal(asset.src,item.audioSrc);assert.equal(asset.qa.content,'approved');
    assert.equal(item.tones.length,item.mode==='single'?1:2);assert.ok(item.tones.every(t=>TONES.includes(t)));
    assert.deepEqual(pinyinDisplaySegments(item.pinyin).filter(s=>s.text.trim()).map(s=>s.tone),item.tones);
    assert.ok(!/[一不]/.test(item.hanzi));assert.notEqual(item.tones.join('-'),'3-3');
  }
});
test('10/20 rounds balance tones and never repeat an item; focus uses only the requested pair',()=>{
  for(const size of [10,20] as const){const s=createToneSession('single',size);assert.equal(s.order.length,size);assert.equal(new Set(s.order).size,size);const counts=TONES.map(t=>s.order.filter(id=>toneItem(id)!.tones[0]===t).length);assert.ok(Math.max(...counts)-Math.min(...counts)<=1);const d=createToneSession('double',size);assert.equal(d.order.length,size);assert.equal(new Set(d.order).size,size);}
  const s=createToneSession('single',20,{focus:[2,3]});assert.equal(s.order.length,20);assert.ok(s.order.every(id=>[2,3].includes(toneItem(id)!.tones[0])));
});
test('unplayed, malformed and duplicate answers cannot advance or inflate a score',()=>{
  const s=make();const id=s.order[0];assert.throws(()=>answerToneSession(s,id,'1',false));assert.throws(()=>answerToneSession(s,id,'9',true));const one=answerToneSession(s,id,'1',true);assert.equal(one.answers.length,1);assert.throws(()=>answerToneSession(one,id,'1',true));assert.equal(s.answers.length,0);
});
test('retry contains only mistakes and leaves the first-pass score untouched',()=>{
  let s=make();for(let i=0;i<s.order.length;i++){const item=toneItem(s.order[i])!;s=answerToneSession(s,item.id,i===0?String(item.tones[0]===1?2:1):toneAnswer(item),true);}
  assert.equal(toneSessionReport(s).correct,9);let retry=retryToneMistakes(s,{id:'qa-retry-001'})!;assert.equal(retry.retryOf,s.id);assert.equal(retry.order.length,1);retry=answerToneSession(retry,retry.order[0],toneAnswer(toneItem(retry.order[0])!),true);assert.equal(toneSessionReport(retry).percent,100);assert.equal(toneSessionReport(s).percent,90);assert.equal(retryToneMistakes(retry),undefined);
});
test('double-tone report distinguishes whole-word accuracy, syllable position and confusion direction',()=>{
  const item=TONE_ITEMS.find(i=>i.mode==='double'&&i.tones[0]!==i.tones[1])!;const wrongFirst=item.tones[0]===1?2:1;
  const s={...make('double'),order:[item.id],answers:[`${wrongFirst}-${item.tones[1]}`]};const r=toneSessionReport(s);assert.equal(r.correct,0);assert.equal(r.positions[0].correct,0);assert.equal(r.positions[1].correct,1);assert.deepEqual(r.confusions,[{expected:item.tones[0],heard:wrongFirst,count:1}]);assert.equal(r.byTone.reduce((n,x)=>n+x.total,0),2);
});
test('persistence rejects stale bank versions, foreign items and oversized answers',()=>{
  const s=make();assert.ok(parseToneSession(s));for(const bad of [{...s,version:'old'},{...s,order:['fake']},{...s,answers:Array(21).fill('1')},{...s,order:[s.order[0],s.order[0]]},{...s,startedAt:'never'},{...s,focus:[1,1]},{...s,retryOf:s.id}])assert.equal(parseToneSession(bad),undefined);assert.equal(parseToneSession({...s,score:100})?.version,TONE_BANK_VERSION);
});
test('sync is monotonic and idempotent; stale tabs and divergent answers never overwrite saved progress',()=>{
  const s=make();const one=answerToneSession(s,s.order[0],'1',true);const two=answerToneSession(one,s.order[1],'2',true);assert.deepEqual(mergeToneHistory([two],[s,one,two]),[parseToneSession(two)]);const conflict={...two,answers:['4','4','4']};assert.deepEqual(mergeToneHistory([two],[conflict]),[parseToneSession(two)]);assert.equal(mergeToneHistory([one],[two])[0].answers.length,2);
});
test('existing account merge preserves separate tone history without adding mastery or SRS records',()=>{
  const empty=()=>({attempts:[],cards:[],mistakes:[],dailySessions:[]});const s=make();const result=mergeLearningStates({...empty(),toneTrainingSessions:[s]},empty());assert.equal(result.state.toneTrainingSessions?.length,1);assert.equal(result.state.cards.length,0);assert.equal(result.state.attempts.length,0);assert.equal(result.state.mistakes.length,0);
});
