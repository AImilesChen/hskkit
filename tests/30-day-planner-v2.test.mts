import assert from "node:assert/strict";
import test from "node:test";
import {access,readFile} from "node:fs/promises";
import {DatabaseSync} from "node:sqlite";
import {PDFDocument} from "pdf-lib";
import {buildPlannerPack,plannerFieldNames} from "../src/lib/commercial/planner-pack.ts";
import {generateDifferentiatedProductArtifact} from "../src/lib/commercial/product-generator.ts";
import {currentProductDelivery,digitalProduct,generationVersionForProduct} from "../src/lib/commercial/products.ts";
import {resourceProductDetail} from "../src/lib/commercial/resource-products.ts";

function zipEntries(zip:Uint8Array){
  const result=new Map<string,Uint8Array>();
  const view=new DataView(zip.buffer,zip.byteOffset,zip.byteLength);let offset=0;
  while(offset+30<=zip.length&&view.getUint32(offset,true)===0x04034b50){
    const compressed=view.getUint32(offset+18,true),nameLength=view.getUint16(offset+26,true),extraLength=view.getUint16(offset+28,true);
    const name=new TextDecoder().decode(zip.slice(offset+30,offset+30+nameLength));const start=offset+30+nameLength+extraLength;
    result.set(name,zip.slice(start,start+compressed));offset=start+compressed;
  }
  return result;
}

const expectedFiles=[
  "HSKKit-30-Day-Planner-Quick-Start.pdf",
  "HSKKit-30-Day-Planner-Printable-A4.pdf",
  "HSKKit-30-Day-Planner-Fillable-A4.pdf",
];

const [font,emoji]=await Promise.all([
  readFile(new URL("../assets/fonts/HskKitSansSubset.ttf",import.meta.url)),
  readFile(new URL("../assets/fonts/HskKitEmoji.ttf",import.meta.url)),
]);

test("planner model provides thirty executable days and genuinely different routes",()=>{
  const plan=buildPlannerPack();
  assert.equal(plan.days.length,30);
  assert.deepEqual(plan.days.map(day=>day.day),Array.from({length:30},(_,index)=>index+1));
  assert.deepEqual(plan.weeklyReviews.map(review=>review.day),[7,14,21,28]);
  assert.equal(new Set(plan.weeklyReviews.map(review=>review.prompts.join(" | "))).size,4,"weekly reviews change with the learning phase");
  for(const review of plan.weeklyReviews){
    const prompts=review.prompts.join(" ");
    assert.match(prompts,/score|accuracy|metric|target|evidence/i,`Day ${review.day}: requires quantified evidence`);
    assert.match(prompts,/error.*count/i,`Day ${review.day}: requires a repeated-error count`);
    assert.match(prompts,/action|priority|route/i,`Day ${review.day}: requires a concrete next decision`);
  }
  assert.doesNotMatch(plan.weeklyReviews.find(review=>review.day===28)!.prompts.join(" "),/next seven days/i);
  assert.match(plan.weeklyReviews.find(review=>review.day===28)!.prompts.join(" "),/48-hour|Post-Day-30/i);
  for(const day of plan.days){
    assert.ok(day.materials.length>=1,`Day ${day.day} materials`);
    assert.ok(day.evidence.length>=1,`Day ${day.day} evidence`);
    assert.match(day.routes[20],/\b20 min\b/);
    assert.match(day.routes[30],/\b30 min\b/);
    assert.match(day.routes[45],/\b45 min\b/);
    assert.notEqual(day.routes[20],day.routes[30],`Day ${day.day}: 20 and 30 routes differ`);
    assert.notEqual(day.routes[30],day.routes[45],`Day ${day.day}: 30 and 45 routes differ`);
    assert.match(day.routes[20],/\b\d+\b/,`Day ${day.day}: 20-minute route has measurable work`);
    assert.match(day.routes[30],/\b\d+\b/,`Day ${day.day}: 30-minute route has measurable work`);
    assert.match(day.routes[45],/\b\d+\b/,`Day ${day.day}: 45-minute route has measurable work`);
  }
  assert.match(plan.positioning,/HSK 30-Day Personalized Study System/);
  assert.deepEqual(plan.workflow,["Initial diagnosis","Choose goal","Daily training","Weekly review","Final assessment","Next-stage plan"]);
});

test("assessment-day routes match the materials and only compare with checkpoints that already exist",()=>{
  const days=new Map(buildPlannerPack().days.map(day=>[day.day,day]));
  assert.match(days.get(1)!.routes[45],/Assessment mapping/i);
  assert.doesNotMatch(Object.values(days.get(1)!.routes).join(" "),/previous checkpoint|compare.*Day 1/i);
  assert.match(days.get(7)!.routes[30],/12 review words.*short input.*three output prompts/i);
  assert.match(days.get(14)!.routes[30],/fresh vocabulary, input and output/i);
  assert.match(days.get(21)!.routes[30],/three speaking or writing prompts.*three-point rubric/i);
  assert.doesNotMatch(Object.values(days.get(21)!.routes).join(" "),/vocabulary|reading/i);
  assert.match(days.get(28)!.routes[30],/four-skill mini-check/i);
  assert.match(days.get(30)!.routes[45],/compare them with Day 1.*Consolidate, Repeat 30 days or Readiness check/i);
});

test("assessment bands map to concrete practice directions and recovery is a formal worksheet",()=>{
  const plan=buildPlannerPack();
  const skills=new Set(plan.assessmentMappings.map(mapping=>mapping.skill));
  assert.deepEqual([...skills].sort(),["listening","reading","vocabulary","writing"]);
  for(const skill of skills){
    const mappings=plan.assessmentMappings.filter(mapping=>mapping.skill===skill);
    assert.deepEqual(mappings.map(mapping=>mapping.band),["below-50","50-74","75-plus"]);
    for(const mapping of mappings){assert.ok(mapping.practiceDirection.length>=2);assert.ok(mapping.firstAssignment.includes("Day"));}
  }
  assert.equal(plan.recoveryWorksheet.title,"Missed-Day Recovery Worksheet");
  assert.ok(plan.recoveryWorksheet.prompts.length>=6);
  assert.match(plan.recoveryWorksheet.rule,/keep the next calendar date/i);
  assert.match(plan.recoveryWorksheet.rule,/move only unfinished/i);
});

test("planner delivery contains real printable and AcroForm-fillable editions",async()=>{
  assert.equal(digitalProduct("30-day-planner")?.format,"zip");
  const artifact=await generateDifferentiatedProductArtifact("30-day-planner",new Uint8Array(font),new Uint8Array(emoji),"planner-v2-test");
  assert.equal(artifact.format,"zip");
  assert.deepEqual([...artifact.manifest.files].sort(),[...expectedFiles].sort());
  const files=zipEntries(artifact.bytes);
  assert.deepEqual([...files.keys()].filter(name=>name.endsWith(".pdf")).sort(),[...expectedFiles].sort());
  const printable=await PDFDocument.load(files.get(expectedFiles[1])!);
  const fillable=await PDFDocument.load(files.get(expectedFiles[2])!);
  const quickStart=await PDFDocument.load(files.get(expectedFiles[0])!);
  assert.equal(printable.getPageCount(),38);
  assert.equal(fillable.getPageCount(),38);
  assert.equal(quickStart.getPageCount(),1);
  for(const [pdf,label] of [[printable,"printable"],[fillable,"fillable"],[quickStart,"quick-start"]] as const)for(const [index,page] of pdf.getPages().entries()){
    assert.ok(Math.abs(page.getWidth()-595.28)<1,`${label} page ${index+1} A4 width`);
    assert.ok(Math.abs(page.getHeight()-841.89)<1,`${label} page ${index+1} A4 height`);
  }
  const form=fillable.getForm();
  const actualFields=form.getFields().map(field=>field.getName()).sort();
  assert.deepEqual(actualFields,[...plannerFieldNames()].sort());
  assert.ok(actualFields.length>=150,"fillable edition has substantial real response fields");
  form.getTextField("planner.setup.currentLevel").setText("HSK 3");
  form.getTextField("planner.day1.evidence").setText("16/20 retrieval; 8/10 reading");
  form.getTextField("planner.recovery.returnDate").setText("2026-09-07 · Day 12 listening");
  const roundTrip=await PDFDocument.load(await fillable.save());
  assert.equal(roundTrip.getForm().getTextField("planner.setup.currentLevel").getText(),"HSK 3");
  assert.match(roundTrip.getForm().getTextField("planner.day1.evidence").getText()??"",/16\/20/);
  assert.match(roundTrip.getForm().getTextField("planner.recovery.returnDate").getText()??"",/Day 12/);
  assert.equal(printable.getForm().getFields().length,0,"print edition is line-based, not an accidental form copy");
});

test("Store copy and real previews describe the personalized planner system",async()=>{
  const detail=resourceProductDetail("30-day-planner");assert.ok(detail);
  assert.match(detail.summary,/Personalized Study System/);
  assert.match(detail.inside.join(" "),/Missed-Day Recovery Worksheet/);
  assert.match(detail.formats.join(" "),/fillable/i);
  assert.match(detail.outcomes.join(" "),/Assessment/i);
  assert.equal(detail.samplePages.length,6);
  for(const sample of detail.samplePages)await access(new URL(`../public${sample.src}`,import.meta.url));
});

test("planner uses an immutable v3 artifact while existing purchase rights migrate from PDF to ZIP",async()=>{
  assert.equal(generationVersionForProduct("30-day-planner"),"p0-p1-v3");
  assert.equal(generationVersionForProduct("worksheet-pack"),"p0-p1-v2");
  assert.equal(currentProductDelivery("30-day-planner","product",null)?.format,"zip","legacy entitlement rows resolve through the current catalog during forward deployment");
  const routeSource=await readFile(new URL("../src/app/api/v1/commercial/exports/route.ts",import.meta.url),"utf8");
  assert.match(routeSource,/generationVersion:generationVersionForProduct\(productId\)/);
  assert.match(routeSource,/currentProductDelivery\(productId,deliveryKey,entitlement.level\)/);
  const generatorSource=await readFile(new URL("../scripts/generate-commercial-artifacts.mts",import.meta.url),"utf8");
  assert.ok(generatorSource.indexOf("for(const product of DIGITAL_PRODUCTS)")<generatorSource.indexOf("const generationVersion=requestedGenerationVersion||generationVersionForProduct(product.id)"),"unfiltered generation resolves an immutable version inside the product loop");
  const db=new DatabaseSync(":memory:");
  db.exec("CREATE TABLE digital_product_entitlements(id TEXT PRIMARY KEY,product_id TEXT,delivery_key TEXT,artifact_type TEXT,format TEXT,status TEXT,version INTEGER,updated_at TEXT)");
  db.exec("CREATE TABLE commercial_export_jobs(id TEXT PRIMARY KEY,product_id TEXT,delivery_key TEXT,format TEXT,state TEXT,error_code TEXT,lease_owner TEXT,lease_expires_at TEXT,updated_at TEXT)");
  db.prepare("INSERT INTO digital_product_entitlements VALUES(?,?,?,?,?,?,?,?)").run("active-planner","30-day-planner","product","planner","pdf","active",1,"old");
  db.prepare("INSERT INTO digital_product_entitlements VALUES(?,?,?,?,?,?,?,?)").run("old-planner","30-day-planner","product","planner","pdf","expired",1,"old");
  db.prepare("INSERT INTO digital_product_entitlements VALUES(?,?,?,?,?,?,?,?)").run("other","worksheet-pack","product","worksheet","zip","active",1,"old");
  db.prepare("INSERT INTO commercial_export_jobs VALUES(?,?,?,?,?,?,?,?,?)").run("queued","30-day-planner","product","pdf","queued",null,"worker","future","old");
  db.prepare("INSERT INTO commercial_export_jobs VALUES(?,?,?,?,?,?,?,?,?)").run("ready","30-day-planner","product","pdf","ready",null,null,null,"old");
  db.exec(await readFile(new URL("../migrations/0021_planner_zip_entitlements.sql",import.meta.url),"utf8"));
  const active=db.prepare("SELECT format,version FROM digital_product_entitlements WHERE id='active-planner'").get() as {format:string;version:number};
  const expired=db.prepare("SELECT format,version FROM digital_product_entitlements WHERE id='old-planner'").get() as {format:string;version:number};
  const other=db.prepare("SELECT format,version FROM digital_product_entitlements WHERE id='other'").get() as {format:string;version:number};
  assert.equal(`${active.format}:${active.version}`,"zip:2");
  assert.equal(`${expired.format}:${expired.version}`,"pdf:1");
  assert.equal(`${other.format}:${other.version}`,"zip:1");
  const queued=db.prepare("SELECT state,error_code,lease_owner,lease_expires_at FROM commercial_export_jobs WHERE id='queued'").get() as {state:string;error_code:string;lease_owner:null;lease_expires_at:null};
  assert.equal(`${queued.state}:${queued.error_code}:${queued.lease_owner}:${queued.lease_expires_at}`,"cancelled:PLANNER_DELIVERY_UPGRADED:null:null");
  assert.equal((db.prepare("SELECT state FROM commercial_export_jobs WHERE id='ready'").get() as {state:string}).state,"ready");
  db.prepare("UPDATE commercial_export_jobs SET format='zip',state='queued',error_code=NULL,lease_owner='v3-worker',lease_expires_at='future' WHERE id='queued'").run();
  db.prepare("INSERT INTO commercial_export_jobs VALUES(?,?,?,?,?,?,?,?,?)").run("ready-v3","30-day-planner","product","zip","ready",null,null,null,"v3");
  db.exec(await readFile(new URL("../scripts/rollback-planner-v3.sql",import.meta.url),"utf8"));
  assert.equal((db.prepare("SELECT format FROM digital_product_entitlements WHERE id='active-planner'").get() as {format:string}).format,"pdf");
  const rolledBack=db.prepare("SELECT state,error_code,lease_owner,lease_expires_at FROM commercial_export_jobs WHERE id='queued'").get() as {state:string;error_code:string;lease_owner:null;lease_expires_at:null};
  assert.equal(`${rolledBack.state}:${rolledBack.error_code}:${rolledBack.lease_owner}:${rolledBack.lease_expires_at}`,"cancelled:PLANNER_V3_ROLLED_BACK:null:null");
  assert.equal((db.prepare("SELECT state FROM commercial_export_jobs WHERE id='ready-v3'").get() as {state:string}).state,"ready");
  const runbook=await readFile(new URL("../docs/commercial/planner-v3-release-runbook.md",import.meta.url),"utf8");
  assert.match(runbook,/Before changing application code, run `scripts\/rollback-planner-v3.sql`/);
});
