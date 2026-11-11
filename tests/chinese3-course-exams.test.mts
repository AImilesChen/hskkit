import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=(p:string)=>readFileSync(p,'utf8');
const manifest=JSON.parse(read('src/lib/course-exams/chinese3-manifest.json'));

test('Chinese 3 has three distinct frozen banks and 37 protected files per paper',()=>{
 assert.deepEqual(Object.keys(manifest.papers),['a','b','c']);const sources=new Set<string>();
 for(const form of ['a','b','c']){
  const entry=manifest.papers[form],root=`public/formal-media/${entry.id}/`;
  assert.equal(entry.files.length,37);assert.equal(entry.files.filter((f:any)=>f.path.endsWith('.mp3')).length,21);
  for(const file of entry.files){const bytes=readFileSync(root+file.storagePath);assert.equal(bytes.length,file.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);}
  const bytes=readFileSync(root+'paper-data.json'),bank=JSON.parse(bytes.toString());
  assert.equal(entry.sourceSha256,createHash('sha256').update(bytes).digest('hex'));assert.equal(bank.id,`course-chinese-3-${form}-v1`);
  assert.equal(bank.questions.length,40);assert.equal(bank.materials.length,24);assert.equal(bank.tasks.length,4);
  assert.equal(bank.counts.speakingRecordings,5);assert.deepEqual(bank.sections.map((s:any)=>s.seconds),[1500,1800,1500,600]);
  assert.equal(bank.tasks[2].preparationSecondsPerPrompt,15);assert.equal(bank.tasks[2].responseSecondsPerPrompt,30);
  assert.equal(bank.tasks[3].preparationSeconds,60);assert.equal(bank.tasks[3].responseSeconds,120);
  for(const key of ['combinedScore','passCutoff','officialConversion'])assert.equal(bank.scoring[key],null);
  assert.equal(bank.provenance.teacherReview,false);assert.equal(bank.provenance.humanListeningAcceptance,false);
  for(const m of bank.materials){const text=JSON.stringify(m.script??m.text);assert.ok(!sources.has(text));sources.add(text);assert.deepEqual(bank.questions.filter((q:any)=>q.materialId===m.id).map((q:any)=>q.number),m.questionNumbers);}
  const audio=JSON.parse(read(root+'audio-manifest.json'));assert.equal(audio.timedTrack.pcmSeconds,1500);assert.deepEqual(audio.groups.map((g:any)=>g.pcmSeconds),[375,375,375,375]);
  assert.equal(audio.units.filter((u:any)=>u.kind==='listening-source').length,12);assert.equal(audio.units.filter((u:any)=>u.kind==='oral-prompt').length,4);
  assert.ok(read(root+'index.coursedoc').includes(`<base href="/api/v1/course-tests/chinese-3/${form}/file/">`));
  assert.ok(entry.files.filter((f:any)=>f.path.endsWith('.html')).every((f:any)=>f.storagePath.endsWith('.coursedoc')));
  assert.equal(read(root+'workspace.js'),read('scripts/course-exams/workspace-chinese3.js'));
 }
});

test('Chinese 3 shared sources, extended evidence and timing stay isolated from Chinese 1 and 2',()=>{
 const js=read('scripts/course-exams/workspace-chinese3.js');
 for(const term of ['25 + 30 + 25 + 10','25-minute track','one 25-minute clock','beginRecording(w.key,30)',"beginRecording('S2',120)",'auto:true,end:Date.now()+15000','q.evidence.additionalQuotes','m.questionNumbers','gloss(m)'])assert.ok(js.includes(term),term);
 assert.ok(read('scripts/course-exams/workspace.js').includes("beginRecording('S2',60)"));
 assert.ok(read('scripts/course-exams/workspace-chinese2.js').includes("beginRecording('S2',90)"));
 assert.ok(!js.includes('Chinese 2'));assert.ok(!js.includes('20-minute track'));
});

test('Chinese 3 GET HEAD and range requests reuse existing paid authorization',()=>{
 assert.ok(read('src/app/api/v1/course-tests/chinese-3/[form]/file/[...asset]/route.ts').includes('serveCourseAsset(req, form, asset.join("/"), 3)'));
 assert.ok(read('src/app/chinese-course-tests/chinese-3/[form]/practice/route.ts').includes('"index.html", 3'));
 for(const p of ['src/app/api/v1/course-tests/chinese-3/[form]/file/[...asset]/route.ts','src/app/chinese-course-tests/chinese-3/[form]/practice/route.ts'])assert.ok(read(p).includes('export const HEAD = GET'));
 const server=read('src/lib/course-exams/server.ts');assert.ok(server.indexOf('requirePaperAccess(form, await formalIdentity())')<server.indexOf('env.ASSETS.fetch'));
 assert.ok(server.includes('"private, no-store"'));assert.ok(read('src/lib/course-exams/catalog.ts').includes('level === 3 ? chinese3Manifest'));
 assert.ok(read('src/middleware.ts').includes('path.startsWith("/formal-media/")'));assert.ok(read('wrangler.jsonc').includes('"/formal-media/*"'));
});

test('Course hub and plans expose twelve papers with four free As and eight Pro B/Cs',()=>{
 const hub=read('src/app/chinese-course-tests/page.tsx');assert.ok(hub.includes('coursePaperHref(form, 3)'));assert.ok(hub.includes('id="chinese-3"'));assert.ok(hub.includes('90 minutes:'));
 assert.ok(hub.includes('twelve papers in total'));assert.ok(hub.includes('coursePaperHref(form, 4)'));
 const plan=read('src/lib/commercial/plan-presentation.ts');assert.ok(plan.includes('Twelve Chinese 1–4 course-review papers'));assert.ok(plan.includes('All four A papers are free; Pro adds eight B/C papers'));
 for(const f of ['src/app/site-navigation.ts','src/app/hsk-test-prep/page.tsx','src/app/pricing/page.tsx'])assert.ok(read(f).includes('Chinese 1–4'),f);
 assert.ok(read('src/app/chinese-course-tests/chinese-3/[form]/page.tsx').includes('level={3}'));
});
