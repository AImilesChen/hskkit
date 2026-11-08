import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { startFormal, saveFormalAnswer, submitFormal, formalView, studentPaper, examPhase, mayOpenPaper } from '../src/lib/formal-exams/hsk4/domain.ts';
import type { ExamPaper, Form } from '../src/lib/formal-exams/hsk4/types.ts';
const file=(p:string)=>readFileSync(p,'utf8');
const paper=(f:Form)=>JSON.parse(file(`src/lib/formal-exams/hsk4/data/${f}.json`)) as ExamPaper;
const now='2026-11-08T10:00:00Z',at=(n:number)=>new Date(Date.parse(now)+n*1000).toISOString();

test('HSK4 accepted papers and every deployed medium match pinned SHA256 evidence',()=>{
 const provenance=JSON.parse(file('src/lib/formal-exams/hsk4/data/provenance.json'));
 const accepted=['525adb1ad064046f3831bfc56d02dfa4488a21b6003f289c94dae7f090d5c96d','90e2151ccd7a301235f9f3f7049b6505703b12271a92adecf5b72aebcb196b8d','45446bae3edc7c46cfdca5540a29ef80e8d06c3e2bcf5147c52bb4e03c56eaa0'];
 const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
 for(const [i,p] of provenance.entries()){
  assert.equal(p.paperSha256,accepted[i]);assert.equal(sha(`src/lib/formal-exams/hsk4/data/${p.form}.json`),p.runtimeSha256);
  for(const m of p.media)assert.equal(sha(`public/formal-media/hsk4-${p.form}-v1/${m.filename}`),m.sha256);
  assert.equal(p.media.find((m:{filename:string})=>m.filename==='listening-full.mp3').sha256,p.audioSha256);
 }
});
test('HSK4 70 tasks, no examples, 32+32+6, answer-safe student projection',()=>{
 for(const f of ['a','b','c'] as const){const p=paper(f),s=startFormal(p,'g','k',now),v=studentPaper(p);
  assert.equal(s.questions.length,70);assert.equal(p.parts.filter(x=>x.example).length,0);assert.equal(v.parts.length,9);
  assert.deepEqual(['listening','reading','writing'].map(x=>s.questions.filter(q=>q.dimension===x).length),[32,32,6]);
  assert.equal(Date.parse(s.deadlineAt)-Date.parse(now),4800000);assert.equal(s.band,'basic');assert(s.questions.every(q=>q.level===4));
  const text=JSON.stringify(formalView(s,p,now));for(const key of ['correctAnswer','referenceAnswer','acceptedExamples','audioScript','explanationEn','requiresHumanReview'])assert(!text.includes(key),key);
  assert.equal(v.parts.at(-1)?.questions[0].essay?.minimumChineseCharacters,80);
  for(const part of v.parts)for(const q of part.questions){assert(!('answer' in q));if(q.writing)assert.deepEqual(Object.keys(q.writing),['imageId','keyword']);if(q.essay)assert.deepEqual(Object.keys(q.essay),['minimumChineseCharacters']);}
 }
});
test('HSK4 authoritative boundaries: 20+5+30+25 minutes',()=>{
 for(const [n,p] of [[1199,'listening'],[1200,'transfer'],[1499,'transfer'],[1500,'reading'],[3299,'reading'],[3300,'writing'],[4799,'writing'],[4800,'expired']] as const)assert.equal(examPhase(now,at(n)),p);
});
test('HSK4 scores 64 objectives and leaves all six writing tasks ungraded, even exact reference matches',()=>{
 for(const f of ['a','b','c'] as const){const p=paper(f);let s=startFormal(p,'g','k',now);
  for(const q of s.questions)s=saveFormalAnswer(s,{questionId:q.id,answer:q.correctAnswer,idempotencyKey:q.id,now:at(q.dimension==='listening'?100:q.dimension==='reading'?1700:3500)});
  const d=submitFormal(s,'submit',at(4000)),v=formalView(d,p,at(4000));assert.equal(v.result?.correct,64);assert.equal(v.result?.total,64);assert.equal(v.result?.listening,32);assert.equal(v.result?.reading,32);assert.equal(v.result?.items.filter(x=>x.manual&&x.correct===null).length,6);assert.equal(d.result?.percentage,100);assert.equal(submitFormal(d,'retry',at(5000)),d);
 }
});
test('HSK4 essay permits saved draft below minimum, multiline 80+ characters, normalize, clear and retry',()=>{
 let s=startFormal(paper('a'),'g','k',now);const q=s.questions[69];const x={questionId:q.id,answer:' 这是草稿。 ',idempotencyKey:'draft',now:at(3500)};
 s=saveFormalAnswer(s,x);assert.equal(s.answers[0].answer,'这是草稿。');assert.equal(saveFormalAnswer(s,x),s);assert.throws(()=>saveFormalAnswer(s,{...x,answer:'不同'}),/IDEMPOTENCY/);
 s=saveFormalAnswer(s,{...x,answer:'我'.repeat(80)+'。\n第二段。',idempotencyKey:'long'});assert(s.answers[0].answer.includes('\n'));
 s=saveFormalAnswer(s,{...x,answer:'',idempotencyKey:'clear'});assert.equal(s.answers[0].answer,'');
 for(const answer of ['我'.repeat(2001),'<script>','含\u0000字符'])assert.throws(()=>saveFormalAnswer(s,{...x,answer,idempotencyKey:answer}),/INVALID/);
 assert.throws(()=>saveFormalAnswer(s,{...x,questionId:s.questions[64].id,answer:'我'.repeat(201),idempotencyKey:'sentence'}),/INVALID/);
 assert.throws(()=>saveFormalAnswer(s,{...x,idempotencyKey:'late',now:at(4800)}),/EXPIRED/);assert.throws(()=>saveFormalAnswer(s,{...x,idempotencyKey:'early',now:at(2000)}),/LOCKED/);
});
test('HSK4 shared reading passages retain blanks and groups; shared listening clips remain bound',()=>{
 for(const f of ['a','b','c'] as const){const p=paper(f),qs=p.parts.flatMap(p=>p.questions);
  for(const group of [[22,23],[24,25],[26,27],[28,29],[30,31,32]])assert.equal(new Set(group.map(n=>qs[n-1].audioSrc)).size,1);
  for(const group of [[51,52],[53,54],[55,56,57],[58,59,60],[61,62,63,64]]){assert.equal(new Set(group.map(n=>qs[n-1].passageId)).size,1);assert(qs[group[0]-1].passageId);assert(group.every(n=>qs[n-1].stem.length>40));}
 }
});
test('HSK4 free/Pro access and namespaces preserve existing exams; media authorize before streaming',()=>{
 assert(mayOpenPaper('a','free'));for(const f of ['b','c'] as const){assert(!mayOpenPaper(f,'free'));assert(mayOpenPaper(f,'pro'));}
 const r=file('src/app/api/v1/formal-exams/hsk4/route.ts');assert(r.includes('hsk4-([abc])-v1'));assert(r.includes('formal:hsk4:'));assert(r.includes('identity.id, "basic", key'));
 const m=file('src/app/api/v1/formal-exams/hsk4/media/[form]/[filename]/route.ts');assert(m.indexOf('requirePaperAccess(form')<m.indexOf('env.ASSETS.fetch'));assert(!m.includes('glyph-'));
 const ui=file('src/app/hsk-test-prep/hsk-4/mock/formal-runner.tsx');assert(ui.includes('hskkit_formal_hsk4_'));assert(ui.includes('q.passageId'));assert(ui.includes('minimumChineseCharacters'));assert(!ui.includes('unscored example'));assert(!ui.includes('Character writing'));
});
