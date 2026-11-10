import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read=(p:string)=>readFileSync(p,'utf8');
const manifest=JSON.parse(read('src/lib/course-exams/chinese2-manifest.json'));

test('Chinese 2 publishes three distinct banks with exact protected file hashes and 75-minute budgets',()=>{
 assert.deepEqual(Object.keys(manifest.papers),['a','b','c']);const seen=new Set<string>();
 for(const form of ['a','b','c']){
  const p=manifest.papers[form],root=`public/formal-media/${p.id}/`;
  assert.equal(p.files.length,45);assert.equal(p.files.filter((f:any)=>f.path.endsWith('.mp3')).length,29);
  for(const f of p.files){const b=readFileSync(root+f.storagePath);assert.equal(b.length,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);}
  const raw=readFileSync(root+'paper-data.json'),bank=JSON.parse(raw.toString());
  assert.equal(createHash('sha256').update(raw).digest('hex'),p.sourceSha256);
  assert.equal(bank.id,`course-chinese-2-${form}-v1`);assert.equal(bank.paperCode,form.toUpperCase());
  assert.deepEqual(bank.sections.map((s:any)=>s.seconds),[1200,1500,1200,600]);
  assert.equal(bank.questions.length,40);assert.equal(bank.tasks.length,4);assert.equal(bank.counts.speakingRecordings,5);
  assert.equal(bank.tasks[2].exchanges.length,4);assert.equal(bank.tasks[2].preparationSecondsPerPrompt,15);assert.equal(bank.tasks[2].responseSecondsPerPrompt,25);
  assert.equal(bank.tasks[3].preparationSeconds,60);assert.equal(bank.tasks[3].responseSeconds,90);
  assert.equal(bank.scoring.combinedScore,null);assert.equal(bank.scoring.officialConversion,null);assert.equal(bank.provenance.teacherReview,false);
  for(const m of bank.materials){const text=JSON.stringify(m.script??m.text);assert.ok(!seen.has(text));seen.add(text);}
  const html=read(root+'index.coursedoc');assert.ok(html.includes(`<base href="/api/v1/course-tests/chinese-2/${form}/file/">`));assert.ok(html.includes(`Chinese 2 · Paper ${form.toUpperCase()}`));
  const audio=JSON.parse(read(root+'audio-manifest.json'));assert.equal(audio.timedTrack.pcmSeconds,1200);
  assert.ok(p.files.filter((f:any)=>f.path.endsWith('.html')).every((f:any)=>f.storagePath.endsWith('.coursedoc')));
 }
});

test('Chinese 2 timing and lexical support are isolated from unchanged Chinese 1 delivery',()=>{
 const js=read('scripts/course-exams/workspace-chinese2.js');
 for(const term of ['20 + 25 + 20 + 10','Math.min(section().seconds-1,section().seconds-','auto:true,end:Date.now()+15000','beginRecording(w.key,25)',"beginRecording('S2',90)",'g.meaningEn','Chinese-2-Paper-'])assert.ok(js.includes(term),term);
 assert.ok(!js.includes('15-minute'));assert.ok(!js.includes('Chinese 1'));
 for(const f of ['a','b','c'])assert.equal(read(`public/formal-media/course-chinese-2-${f}-v1/workspace.js`),js);
 const old=read('public/formal-media/course-chinese-1-a-v1/workspace.js');assert.ok(old.includes('15 + 20 + 15 + 10'));assert.ok(old.includes("beginRecording('S2',60)"));
});

test('Chinese 2 routes use server authorization for every file including HEAD and Range',()=>{
 const api=read('src/app/api/v1/course-tests/chinese-2/[form]/file/[...asset]/route.ts');assert.ok(api.includes('serveCourseAsset(req, form, asset.join("/"), 2)'));assert.ok(api.includes('export const HEAD = GET'));
 const practice=read('src/app/chinese-course-tests/chinese-2/[form]/practice/route.ts');assert.ok(practice.includes('"index.html", 2'));assert.ok(practice.includes('req.method === "HEAD", 2'));
 const server=read('src/lib/course-exams/server.ts');assert.ok(server.indexOf('requirePaperAccess(form, await formalIdentity())')<server.indexOf('env.ASSETS.fetch'));assert.ok(server.includes('courseAsset(form, path, level)'));assert.ok(server.includes('"private, no-store"'));
 const catalog=read('src/lib/course-exams/catalog.ts');assert.ok(catalog.includes('level === 2 ? chinese2Manifest : manifest'));assert.ok(catalog.includes('p === ".."'));
});

test('Chinese 2 entry and plan copy expose six course papers without enabling Chinese 3 or 4',()=>{
 const hub=read('src/app/chinese-course-tests/page.tsx');assert.ok(hub.includes('id="chinese-2"'));assert.ok(hub.includes('coursePaperHref(form, 2)'));
 assert.ok(!hub.includes('/chinese-3/'));assert.ok(!hub.includes('/chinese-4/'));
 const plans=read('src/lib/commercial/plan-presentation.ts');assert.ok(plans.includes('Six Chinese 1–2 course-review papers'));assert.ok(plans.includes('Both A papers are free; Pro adds four B/C papers'));
 assert.ok(read('src/app/chinese-course-tests/chinese-2/[form]/page.tsx').includes('level={2}'));assert.ok(read('src/app/chinese-course-tests/paper-access.tsx').includes('coursePaperHref(form, level)'));
});
