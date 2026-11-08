import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {startFormal,saveFormalAnswer,submitFormal,formalView,studentPaper,examPhase,mayOpenPaper} from '../src/lib/formal-exams/hsk2/domain.ts';
import type {ExamPaper,Form} from '../src/lib/formal-exams/hsk2/types.ts';
const paper=(f:Form)=>JSON.parse(readFileSync(`src/lib/formal-exams/hsk2/data/${f}.json`,'utf8')) as ExamPaper;
const now='2026-11-08T10:00:00.000Z',at=(n:number)=>new Date(Date.parse(now)+n*1000).toISOString();
test('HSK2 accepted papers retain 60 items, nine examples and matching frozen audio',()=>{
 for(const f of ['a','b','c'] as const){const p=paper(f),s=startFormal(p,'guest','k',now);assert.equal(s.questions.length,60);assert.equal(p.parts.filter(x=>x.example).length,9);assert.equal(p.parts.length,11);assert.equal(Date.parse(s.deadlineAt)-Date.parse(now),3300000);assert.equal(s.startIdempotencyKey,`formal:hsk2:${f}:k`);
 const accepted=JSON.parse(readFileSync('src/lib/formal-exams/hsk2/data/provenance.json','utf8')).find((x: {form: string})=>x.form===f);assert.ok(accepted.acceptedOn);assert.equal(createHash('sha256').update(readFileSync(`public/formal-media/${p.id}/listening-full.mp3`)).digest('hex'),accepted.audioSha256);}
});
test('HSK2 projection excludes answers, source glyph identities and scripts; preserves component images and null examples',()=>{
 const p=studentPaper(paper('a'));assert.equal(p.parts[2].example,null);assert.equal(p.parts[7].example,null);for(const part of p.parts)for(const q of part.questions){assert(!Object.hasOwn(q,'answer'));assert(!Object.hasOwn(q,'audioScript'));assert(!Object.hasOwn(q,'explanation'));if(q.component)assert.deepEqual(Object.keys(q.component),['imageId']);}
 assert(!JSON.stringify(formalView(startFormal(paper('a'),'g','k',now),paper('a'),now)).includes('correctAnswer'));
});
test('HSK2 phase boundaries enforce 17+3+25+10 minutes',()=>{for(const [n,p] of [[1019,'listening'],[1020,'transfer'],[1199,'transfer'],[1200,'reading'],[2699,'reading'],[2700,'writing'],[3299,'writing'],[3300,'expired']] as const)assert.equal(examPhase(now,at(n)),p);});
test('all three HSK2 papers score 60/60 with separate 25/25/10 marks',()=>{
 for(const f of ['a','b','c'] as const){const p=paper(f);let s=startFormal(p,'g','k',now);for(const q of s.questions)s=saveFormalAnswer(s,{questionId:q.id,answer:q.correctAnswer,idempotencyKey:q.id,now:at(q.dimension==='listening'?10:q.dimension==='reading'?1300:2800)});s=submitFormal(s,'submit',at(3000));const v=formalView(s,p,at(3000));assert.equal(v.result?.correct,60);assert.equal(v.result?.total,60);assert.equal(v.result?.listening,25);assert.equal(v.result?.reading,25);assert.equal(v.result?.writing,10);assert.equal(s.result?.percentage,100);assert.equal(submitFormal(s,'retry',at(4000)),s);}
});
test('writing input accepts only one Hanzi or clear, normalizes spaces and preserves idempotency',()=>{
 let s=startFormal(paper('a'),'g','k',now);const q=s.questions[55];const input={questionId:q.id,answer:'　喝　',idempotencyKey:'save',now:at(2800)};s=saveFormalAnswer(s,input);assert.equal(s.answers[0].answer,'喝');assert.equal(saveFormalAnswer(s,input),s);assert.throws(()=>saveFormalAnswer(s,{...input,answer:'叫'}),/IDEMPOTENCY/);
 for(const answer of ['ABC','喝茶','1','<','あ'])assert.throws(()=>saveFormalAnswer(s,{...input,answer,idempotencyKey:answer}),/INVALID/);s=saveFormalAnswer(s,{...input,answer:'',idempotencyKey:'clear'});assert.equal(s.answers[0].answer,'');assert.equal(submitFormal(s,'done',at(3300)).result?.correctCount,0);
});
test('server locks writing before 45 minutes and prevents edits across closed sections or deadline',()=>{
 const s=startFormal(paper('a'),'g','k',now);for(const [i,n] of [[55,10],[55,1300],[0,1300],[25,2800],[55,3300]])assert.throws(()=>saveFormalAnswer(s,{questionId:s.questions[i].id,answer:s.questions[i].correctAnswer,idempotencyKey:'k',now:at(n)}),/SECTION_LOCKED|EXAM_TIME_EXPIRED/);
 assert.equal(saveFormalAnswer(s,{questionId:s.questions[0].id,answer:'A',idempotencyKey:'listen-transfer',now:at(1100)}).answers.length,1);
});
test('A remains free; B/C use existing Pro entitlement checks',()=>{assert(mayOpenPaper('a','free'));for(const f of ['b','c'] as const){assert(!mayOpenPaper(f,'free'));assert(mayOpenPaper(f,'pro'));}});
test('HSK2 route namespace and media fences cannot accept HSK1 attempts',()=>{
 const r=readFileSync('src/app/api/v1/formal-exams/hsk2/route.ts','utf8');assert(r.includes('hsk2-([abc])-v1'));assert(r.includes('formal:hsk2:${body.form}'));assert(r.includes("LIKE 'formal:hsk2-%'"));const m=readFileSync('src/app/api/v1/formal-exams/hsk2/media/[form]/[filename]/route.ts','utf8');assert(m.indexOf('requirePaperAccess(form')<m.indexOf('env.ASSETS.fetch'));assert(m.includes('allowed.has(filename)'));assert(m.includes('private, no-store'));
});
