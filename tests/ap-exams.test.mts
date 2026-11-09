import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
const read=(p:string)=>readFileSync(p,"utf8");
const manifest=JSON.parse(read("src/lib/ap-exams/manifest.json"));
test("AP publication has three complete distinct frozen papers and actual assets",()=>{
  assert.deepEqual(Object.keys(manifest.papers),["a","b","c"]);
  const banks=[];
  for(const form of ["a","b","c"]){
    const p=manifest.papers[form],root=`public/formal-media/${p.id}/`;
    assert.deepEqual(p.counts,{listening:25,reading:30,freeResponse:4,qaExchanges:4});
    assert.equal(p.files.length,33);
    for(const f of p.files){assert.ok(existsSync(root+f.storagePath));const bytes=readFileSync(root+f.storagePath);assert.equal(bytes.length,f.bytes);assert.equal(createHash("sha256").update(bytes).digest("hex"),f.sha256);}
    const bank=JSON.parse(read(root+"paper-data.json"));banks.push(bank);
    assert.equal(bank.paperCode,form.toUpperCase());assert.equal(bank.sets.flatMap((s:any)=>s.questions).length,55);
    assert.equal(bank.freeResponse.length,4);assert.equal(bank.freeResponse[1].exchanges.length,4);assert.equal(bank.timing.writing,1800);
    assert.equal(bank.scoring.officialScoreConversion,null);
    const index=read(root+"index.apdoc"),js=read(root+"paper.js");
    assert.ok(index.includes(`<base href="/api/v1/ap-chinese/2027/${form}/file/">`));
    assert.ok(index.includes(`AP Chinese · Paper ${form.toUpperCase()}`));
    assert.ok(js.includes(`hskkit-ap2027-${form}-`));assert.ok(js.includes("startingAudio=true"));
    assert.ok(js.includes(`>${form.toUpperCase()}<span>听`));
    assert.ok(js.includes("Recorded")||js.includes("recording"));
    assert.equal(p.files.filter((f:any)=>f.path.endsWith(".mp3")).length,11);
    assert.ok(p.files.filter((f:any)=>f.path.endsWith(".html")).every((f:any)=>f.storagePath.endsWith(".apdoc")));
  }
  const seen=new Set();for(const bank of banks)for(const set of bank.sets){const text=JSON.stringify(set.script??set.paragraphs);assert.ok(!seen.has(text));seen.add(text);}
});
test("AP private delivery authorizes all paid assets before reading or streaming",()=>{
  const server=read("src/lib/ap-exams/server.ts");
  assert.ok(server.indexOf('requirePaperAccess(form, await formalIdentity())')<server.indexOf('env.ASSETS.fetch'));
  assert.ok(server.indexOf('requirePaperAccess(form, await formalIdentity())')<server.indexOf('const bytes = await readFile'));
  assert.ok(server.includes('form !== "a"'));assert.ok(server.includes('"private, no-store"'));assert.ok(server.includes('entry.file.storagePath'));
  const api=read("src/app/api/v1/ap-chinese/2027/[form]/file/[...asset]/route.ts");assert.ok(api.includes("export const HEAD = GET"));
  const middleware=read("src/middleware.ts"),wrangler=read("wrangler.jsonc");assert.ok(middleware.includes('path.startsWith("/formal-media/")'));assert.ok(wrangler.includes('"/formal-media/*"'));
  assert.ok(read("src/lib/ap-exams/catalog.ts").includes('p === ".."'));
});
test("AP is discoverable and commercial copy distinguishes free A from Pro B/C",()=>{
  for(const file of ["src/app/site-navigation.ts","src/app/hsk-test-prep/page.tsx","src/app/pricing/page.tsx","src/app/sitemap.ts"])assert.ok(read(file).includes('/ap-chinese-practice-test'),file);
  const copy=read("src/lib/commercial/plan-presentation.ts");assert.ok(copy.includes('Three complete AP Chinese papers'));assert.ok(copy.includes('Complete AP Chinese 2027 Paper A'));
  const hub=read("src/app/ap-chinese-practice-test/page.tsx");assert.ok(hub.includes('January 2027'));assert.ok(hub.includes('manual review'));assert.ok(hub.includes('this browser'));
  const entry=read("src/app/ap-chinese-practice-test/paper-access.tsx");assert.ok(entry.includes('cache: "no-store"'));assert.ok(entry.includes('Retry access check'));
});
