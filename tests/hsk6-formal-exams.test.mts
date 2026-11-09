import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { startFormal, saveFormalAnswer, submitFormal, formalView, studentPaper, examPhase, mayOpenPaper } from '../src/lib/formal-exams/hsk6/domain.ts';
import type { ExamPaper, Form } from '../src/lib/formal-exams/hsk6/types.ts';
const file=(p:string)=>readFileSync(p,'utf8');
const paper=(f:Form)=>JSON.parse(file(`src/lib/formal-exams/hsk6/data/${f}.json`)) as ExamPaper;
const now='2026-11-08T10:00:00Z',at=(n:number)=>new Date(Date.parse(now)+n*1000).toISOString();
test('HSK6 user-accepted snapshots and every deployed medium match pinned SHA256',()=>{
 const provenance=JSON.parse(file('src/lib/formal-exams/hsk6/data/provenance.json'));
 const accepted=["0a19782588c99d021a41cead9280dbc3f300b44a805ac8670db63f487a86c375", "da18552af891025a15d533334d9225dc74ca7532e41eda08dde54704dd0e33b3", "54bafbdf5782243d9aa46b77d640566f90482e977c88683b2157555a124748ce"];
 const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
 for(const [i,p] of provenance.entries()){
  assert.equal(p.paperSha256,accepted[i]);assert.equal(sha(`src/lib/formal-exams/hsk6/data/${p.form}.json`),p.runtimeSha256);
  assert.equal(p.media.length,18);
  for(const m of p.media)assert.equal(sha(`public/formal-media/hsk6-${p.form}-v1/${m.filename}`),m.sha256);
  assert.equal(p.media.find((m:{filename:string})=>m.filename==='listening-full.mp3').sha256,p.audioSha256);
 }
});
test('HSK6 82 tasks and nine groups expose safe picture IDs and both writing minima',()=>{
 for(const f of ['a','b','c'] as const){const p=paper(f),s=startFormal(p,'g','k',now),v=studentPaper(p);
  assert.equal(s.questions.length,82);assert.equal(p.parts.filter(x=>x.example).length,0);assert.equal(v.parts.length,9);
  assert.deepEqual(['listening','reading','writing'].map(x=>s.questions.filter(q=>q.dimension===x).length),[40,40,2]);
  assert.equal(Date.parse(s.deadlineAt)-Date.parse(now),7200000);assert.equal(s.band,'basic');assert(s.questions.every(q=>q.level===6));
  const text=JSON.stringify(formalView(s,p,now));for(const key of ['correctAnswer','referenceAnswer','acceptedExamples','audioScript','explanationEn','requiresHumanReview'])assert(!text.includes(key),key);
  assert.deepEqual(v.parts.filter(p=>p.section==='writing').map(p=>p.questions[0].essay?.minimumChineseCharacters),[150,300]);
  assert.equal(Object.keys(v.images).length,0);
  for(const part of v.parts)for(const q of part.questions){assert(!('answer' in q));if(q.essay)assert.deepEqual(Object.keys(q.essay),['minimumChineseCharacters']);if(q.pictureStory)assert.deepEqual(Object.keys(q.pictureStory),['imageIds']);}
 }
});
test('HSK6 authoritative boundaries preserve all 30+5+40+45 minutes',()=>{
 for(const [n,p] of [[1799,'listening'],[1800,'transfer'],[2099,'transfer'],[2100,'reading'],[4499,'reading'],[4500,'writing'],[7199,'writing'],[7200,'expired']] as const)assert.equal(examPhase(now,at(n)),p);
});
test('HSK6 full correct objective paper scores 80 while both references remain ungraded',()=>{
 for(const f of ['a','b','c'] as const){const p=paper(f);let s=startFormal(p,'g','k',now);
  for(const q of s.questions)s=saveFormalAnswer(s,{questionId:q.id,answer:q.correctAnswer,idempotencyKey:q.id,now:at(q.dimension==='listening'?100:q.dimension==='reading'?2200:4600)});
  const d=submitFormal(s,'submit',at(6000)),v=formalView(d,p,at(6000));assert.equal(v.result?.correct,80);assert.equal(v.result?.total,80);assert.equal(v.result?.listening,40);assert.equal(v.result?.reading,40);assert.equal(v.result?.items.filter(x=>x.manual&&x.correct===null).length,2);assert.equal(d.result?.percentage,100);assert.equal(submitFormal(d,'retry',at(7500)),d);
  assert.equal(v.result?.items.filter(x=>x.script.length>0).length,40);
 }
});
test('HSK6 both writing drafts allow multiline save clear and retry; enforce length and phase',()=>{
 for(const n of [81,82]){let s=startFormal(paper('a'),'g','k',now);const q=s.questions[n-1],x={questionId:q.id,answer:' 这是草稿。 ',idempotencyKey:'draft',now:at(4600)};
  s=saveFormalAnswer(s,x);assert.equal(s.answers[0].answer,'这是草稿。');assert.equal(saveFormalAnswer(s,x),s);assert.throws(()=>saveFormalAnswer(s,{...x,answer:'不同'}),/IDEMPOTENCY/);
  s=saveFormalAnswer(s,{...x,answer:'我'.repeat(n===81?150:300)+'。\n第二段。',idempotencyKey:'long'});assert(s.answers[0].answer.includes('\n'));
  s=saveFormalAnswer(s,{...x,answer:'',idempotencyKey:'clear'});assert.equal(s.answers[0].answer,'');
  for(const answer of ['我'.repeat(2001),'<script>','含\u0000字符'])assert.throws(()=>saveFormalAnswer(s,{...x,answer,idempotencyKey:answer}),/INVALID/);
  assert.throws(()=>saveFormalAnswer(s,{...x,idempotencyKey:'late',now:at(7200)}),/EXPIRED/);assert.throws(()=>saveFormalAnswer(s,{...x,idempotencyKey:'early',now:at(2200)}),/LOCKED/);
 }
});
test('HSK6 six-choice sentence insertion preserves five gaps and one unused sentence',()=>{
 for(const f of ['a','b','c'] as const){const p=paper(f),qs=p.parts.flatMap(p=>p.questions);
  for(const group of [[9,10,11],[12,13,14],[15,16,17],[18,19,20,21],[22,23,24,25],[26,27,28],[29,30,31,32],[33,34,35,36],[37,38,39,40]])assert.equal(new Set(group.map(n=>qs[n-1].audioSrc)).size,1);
  for(const part of p.parts.filter(p=>p.id.startsWith('R2'))){assert.equal(Object.keys(part.sharedOptions!).length,6);assert.equal(part.questions.length,5);assert.equal(new Set(part.questions.map(q=>q.answer)).size,5);assert.equal(Object.keys(part.sharedOptions!).filter(k=>!part.questions.some(q=>q.answer===k)).length,1);assert.equal(new Set(part.questions.map(q=>q.passageId)).size,1);}
 }
});

test('HSK6 gates Pro media before range streaming and separates exam namespaces',()=>{
 assert(mayOpenPaper('a','free'));for(const f of ['b','c'] as const){assert(!mayOpenPaper(f,'free'));assert(mayOpenPaper(f,'pro'));}
 const r=file('src/app/api/v1/formal-exams/hsk6/route.ts');assert(r.includes('hsk6-([abc])-v1'));assert(r.includes('formal:hsk6:'));assert(r.includes('identity.id, "basic", key'));
 const m=file('src/app/api/v1/formal-exams/hsk6/media/[form]/[filename]/route.ts');assert(m.indexOf('requirePaperAccess(form')<m.indexOf('env.ASSETS.fetch'));
 const ui=file('src/app/hsk-test-prep/hsk-6/mock/formal-runner.tsx');assert(ui.includes('hskkit_formal_hsk6_'));assert(ui.includes('Passage for sentence insertion'));assert(ui.includes('!part.sharedOptions && q.passageId'));assert(ui.includes('Math.max(3, i)'));assert(ui.includes('Math.max(7, i'));assert(ui.includes('minimumChineseCharacters'));assert(ui.includes('paper!.parts.length - 1'));assert(!ui.includes('five picture sentences'));
});
