import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { parseCourseRange, courseRangeStream } from "../src/lib/course-exams/byte-range.ts";
const read=(p:string)=>readFileSync(p,"utf8");
const manifest=JSON.parse(read("src/lib/course-exams/manifest.json"));
test("Course byte ranges handle asset-binding 200 responses without buffering the full file",async()=>{
 assert.deepEqual(parseCourseRange('bytes=3-7',12),{start:3,end:7});
 assert.deepEqual(parseCourseRange('bytes=-3',12),{start:9,end:11});
 assert.deepEqual(parseCourseRange('bytes=10-',12),{start:10,end:11});
 for(const range of ['bytes=12-','bytes=7-2','bytes=-0','bytes=1-2,4-5','invalid'])assert.equal(parseCourseRange(range,12),false);
 let cancelled=false,index=0;const source=new ReadableStream<Uint8Array>({pull(c){c.enqueue(new Uint8Array([index++,index++,index++,index++]));},cancel(){cancelled=true;}});
 const bytes=new Uint8Array(await new Response(courseRangeStream(source,3,7)).arrayBuffer());
 assert.deepEqual([...bytes],[3,4,5,6,7]);assert.equal(cancelled,true);
});
test("Chinese 1 publication preserves three distinct 40-question banks and protected artifacts",()=>{
 assert.deepEqual(Object.keys(manifest.papers),["a","b","c"]);const seen=new Set();
 for(const form of ["a","b","c"]){const p=manifest.papers[form],root=`public/formal-media/${p.id}/`;
  assert.equal(p.files.length,45);assert.equal(p.files.filter((f:any)=>f.path.endsWith('.mp3')).length,29);
  for(const f of p.files){assert.ok(existsSync(root+f.storagePath));const b=readFileSync(root+f.storagePath);assert.equal(b.length,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);}
  const bank=JSON.parse(read(root+'paper-data.json'));assert.equal(bank.paperCode,form.toUpperCase());assert.equal(bank.questions.length,40);assert.equal(bank.tasks.length,4);assert.equal(bank.tasks[2].exchanges.length,4);assert.equal(bank.counts.speakingRecordings,5);
  assert.deepEqual(bank.sections.map((s:any)=>s.seconds),[900,1200,900,600]);assert.equal(bank.scoring.officialConversion,null);assert.equal(bank.scoring.combinedScore,null);assert.equal(bank.provenance.teacherReview,false);
  for(const material of bank.materials){const text=JSON.stringify(material.script??material.text);assert.ok(!seen.has(text));seen.add(text);}
  const index=read(root+'index.coursedoc'),js=read(root+'workspace.js');assert.ok(index.includes(`<base href="/api/v1/course-tests/chinese-1/${form}/file/">`));assert.ok(index.includes(`Chinese 1 · Paper ${form.toUpperCase()}`));assert.ok(js.includes("'hskkit-'+paper.id+'-practice'"));assert.ok(js.includes('alignTimedAudio'));assert.ok(js.includes('getUserMedia'));assert.ok(js.includes("auto:true,end:Date.now()+10000"));assert.ok(js.includes('beginRecording(w.key,20)'));assert.ok(js.includes("beginRecording('S2',60)"));assert.ok(js.includes('paper.sections.find'));
  assert.ok(p.files.filter((f:any)=>f.path.endsWith('.html')).every((f:any)=>f.storagePath.endsWith('.coursedoc')));
 }
});
test("Chinese 1 all paid files use existing server-side entitlement checks",()=>{
 const server=read('src/lib/course-exams/server.ts');assert.ok(server.indexOf('requirePaperAccess(form, await formalIdentity())')<server.indexOf('const bytes = await readFile'));assert.ok(server.indexOf('requirePaperAccess(form, await formalIdentity())')<server.indexOf('env.ASSETS.fetch'));assert.ok(server.includes('"private, no-store"'));assert.ok(server.includes('form !== "a"'));
 const api=read('src/app/api/v1/course-tests/chinese-1/[form]/file/[...asset]/route.ts');assert.ok(api.includes('export const HEAD = GET'));assert.ok(read('src/lib/course-exams/catalog.ts').includes('p === ".."'));assert.ok(read('src/middleware.ts').includes('path.startsWith("/formal-media/")'));assert.ok(read('wrangler.jsonc').includes('"/formal-media/*"'));
});
test("Course entry and commercial copy describe published Chinese 1–3 content",()=>{
 for(const file of ['src/app/site-navigation.ts','src/app/hsk-test-prep/page.tsx','src/app/pricing/page.tsx','src/app/sitemap.ts'])assert.ok(read(file).includes('/chinese-course-tests'),file);
 const hub=read('src/app/chinese-course-tests/page.tsx');assert.ok(hub.includes('manual review'));assert.ok(hub.includes('this browser'));assert.ok(hub.includes('Schools')||hub.includes('varies by school'));assert.ok(hub.includes('coursePaperHref(form, 2)'));
 const plans=read('src/lib/commercial/plan-presentation.ts');assert.ok(plans.includes('Complete Chinese 1–3 course-review A papers'));assert.ok(plans.includes('Nine Chinese 1–3 course-review papers'));
});
