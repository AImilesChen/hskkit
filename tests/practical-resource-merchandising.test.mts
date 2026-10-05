import assert from "node:assert/strict";
import test from "node:test";
import {access,readFile,stat} from "node:fs/promises";
import {loadAssessmentLevelAudio} from "./assessment-level-audio-fixture.mts";
import {PDFDocument} from "pdf-lib";
import {generateDifferentiatedProductArtifact} from "../src/lib/commercial/product-generator.ts";
import {resourceProductDetails} from "../src/lib/commercial/resource-products.ts";

function zipEntries(zip:Uint8Array){
  const result=new Map<string,Uint8Array>();
  const view=new DataView(zip.buffer,zip.byteOffset,zip.byteLength);
  let offset=0;
  while(offset+30<=zip.length&&view.getUint32(offset,true)===0x04034b50){
    const compressed=view.getUint32(offset+18,true);
    const nameLength=view.getUint16(offset+26,true);
    const extraLength=view.getUint16(offset+28,true);
    const name=new TextDecoder().decode(zip.slice(offset+30,offset+30+nameLength));
    const start=offset+30+nameLength+extraLength;
    result.set(name,zip.slice(start,start+compressed));
    offset=start+compressed;
  }
  return result;
}

const expected={
  "worksheet-pack":["00-START-HERE.pdf","HSKKit-Worksheets-Student-A4.pdf","HSKKit-Worksheets-Student-US-Letter.pdf","HSKKit-Worksheets-Student-A4-Low-Ink.pdf","HSKKit-Worksheets-Student-Fillable.pdf","HSKKit-Worksheets-Answer-Key.pdf","HSKKit-Worksheet-Completed-Samples.pdf","HSKKit-Worksheet-Progress-Checklist.pdf"],
  "assessment-tracker":["HSKKit-Assessment-Tracker-Blank.xlsx","HSKKit-Assessment-Tracker-Example.xlsx","HSKKit-Assessment-Tracker-Raw-Data.csv","HSKKit-Assessment-Log-Template.csv","HSKKit-Weekly-Review.csv","HSKKit-Assessment-Dashboard-Guide.pdf","HSKKit-Printable-Assessment-Record.pdf"],
  "30-day-planner":["HSKKit-30-Day-Planner-Quick-Start.pdf","HSKKit-30-Day-Planner-Printable-A4.pdf","HSKKit-30-Day-Planner-Fillable-A4.pdf","HSKKit-30-Day-Planner-Progress-Tracker.xlsx"],
  "practice-assessment-pack":["00-START-HERE.pdf","HSKKit-Practice-Assessment-A-Student.pdf","HSKKit-Practice-Assessment-B-Student.pdf","HSKKit-Practice-Assessment-C-Student.pdf","HSKKit-Practice-Assessment-A-Listening.mp3","HSKKit-Practice-Assessment-B-Listening.mp3","HSKKit-Practice-Assessment-C-Listening.mp3","HSKKit-Practice-Assessment-Audio-Source-License.txt","HSKKit-Practice-Assessment-Answer-Sheets.pdf","HSKKit-Practice-Assessment-Answers-Explanations.pdf","HSKKit-Practice-Assessment-Facilitator-Transcripts.pdf","HSKKit-Practice-Assessment-Score-Report.pdf","HSKKit-Practice-Assessment-Score-Tracker.xlsx",...(["A","B","C"] as const).flatMap(form=>Array.from({length:9},(_,index)=>`Level-Audio/form-${form}-level-${index+1}.mp3`)),"Level-Audio/timing-index.json"],
  "teacher-lesson-plan-pack":["HSKKit-Teacher-Pack-Quick-Start.pdf","HSKKit-Teacher-Lesson-Plans-A4.pdf","HSKKit-Teacher-Lesson-Plans-US-Letter.pdf","HSKKit-Student-Handouts-A4.pdf","HSKKit-Student-Handouts-US-Letter.pdf","HSKKit-Exit-Tickets-A4.pdf","HSKKit-Exit-Tickets-US-Letter.pdf","HSKKit-Homework-Answers-Rubrics.pdf","HSKKit-Activity-Cards-A4.pdf","HSKKit-Activity-Cards-US-Letter.pdf","HSKKit-Editable-Lesson-Plans.docx","HSKKit-Editable-Classroom-Slides.pptx"]
} as const;

const [font,emoji,audioA,audioB,audioC]=await Promise.all([
  readFile(new URL("../assets/fonts/HskKitSansSubset.ttf",import.meta.url)),
  readFile(new URL("../assets/fonts/HskKitEmoji.ttf",import.meta.url)),
  readFile(new URL("../assets/audio/mock-assessment-v2/form-A.mp3",import.meta.url)),
  readFile(new URL("../assets/audio/mock-assessment-v2/form-B.mp3",import.meta.url)),
  readFile(new URL("../assets/audio/mock-assessment-v2/form-C.mp3",import.meta.url)),
]);
const assessmentAudio={A:new Uint8Array(audioA),B:new Uint8Array(audioB),C:new Uint8Array(audioC)};

test("five practical resources expose complete, reusable merchandising details",async()=>{
  assert.equal(resourceProductDetails.length,5);
  for(const detail of resourceProductDetails){
    assert.ok(detail.amountCents>=499&&detail.amountCents<=1999,detail.id);
    assert.ok(detail.outcomes.length>=3,detail.id);
    assert.ok(detail.inside.length>=4,detail.id);
    assert.ok(detail.howToUse.length>=3,detail.id);
    assert.ok(detail.previewPages.length>=2,detail.id);
    assert.ok(detail.faqs.length>=3,detail.id);
    assert.match(detail.previewImage,/^\/store\/previews\/[a-z0-9-]+\.webp$/);
    await access(new URL(`../public${detail.previewImage}`,import.meta.url));
  }
});

test("each practical resource provides readable real sample pages and an explicit fit check",async()=>{
  for(const detail of resourceProductDetails){
    assert.ok(detail.samplePages.length>=4&&detail.samplePages.length<=7,`${detail.id}: sample count`);
    assert.equal(new Set(detail.samplePages.map(sample=>sample.src)).size,detail.samplePages.length,`${detail.id}: unique samples`);
    for(const sample of detail.samplePages){
      assert.match(sample.src,new RegExp(`^/store/samples/${detail.id}/[a-z0-9-]+\\.webp$`));
      assert.ok(sample.alt.length>=24,`${detail.id}: descriptive sample alt`);
      assert.ok(sample.caption.length>=20,`${detail.id}: decision-useful sample caption`);
      const sampleFile=new URL(`../public${sample.src}`,import.meta.url);
      await access(sampleFile);
      assert.ok((await stat(sampleFile)).size>=30_000,`${detail.id}: sample is a substantive readable image`);
    }
    assert.ok(detail.fit.idealFor.length>=2,`${detail.id}: ideal for`);
    assert.ok(detail.fit.notFor.length>=2,`${detail.id}: not for`);
    assert.ok(detail.fit.facts.length>=4,`${detail.id}: decision facts`);
    const facts=detail.fit.facts.join(" ");
    if(detail.id==="teacher-lesson-plan-pack"){
      assert.match(facts,/single-purchaser classroom licence/i,`${detail.id}: classroom licence`);
      assert.match(facts,/one teaching site/i,`${detail.id}: classroom boundary`);
    }else if(detail.id==="practice-assessment-pack"){
      assert.match(facts,/print answer sheets for students they personally teach/i,`${detail.id}: student printing`);
      assert.match(facts,/without a time limit/i,`${detail.id}: downloaded use`);
    }else if(detail.id==="worksheet-pack"){
      assert.match(facts,/print student worksheet pages for learners they personally teach/i,`${detail.id}: student printing`);
      assert.match(facts,/Downloaded copies do not expire/i,`${detail.id}: downloaded use`);
    }else{
      assert.match(facts,/personal/i,`${detail.id}: personal licence`);
      assert.match(facts,/non-transferable/i,`${detail.id}: non-transferable licence`);
    }
    assert.match(facts,/no audio|audio (?:is )?not included|3 .*MP3|27 level-only|MP3 listening/i,`${detail.id}: audio boundary`);
    assert.match(facts,/14-day/i,`${detail.id}: access period`);
    assert.match(facts,/3 successful downloads/i,`${detail.id}: download limit`);
  }
  const factMatrix=Object.fromEntries(resourceProductDetails.map(detail=>[detail.id,detail.fit.facts.join(" ")]));
  assert.match(factMatrix["worksheet-pack"],/Levels 1–9.*answer/i);
  assert.match(factMatrix["assessment-tracker"],/Levels 1–6.*unified Advanced 7–9.*scoring/i);
  assert.match(factMatrix["30-day-planner"],/current Level.*target Level/i);
  assert.match(factMatrix["practice-assessment-pack"],/Levels 1–9.*27 level-only.*explanations.*rubric.*transcripts/i);
  assert.match(factMatrix["teacher-lesson-plan-pack"],/Levels 1–9.*teacher guidance/i);
});

test("each practical resource ships the promised usable files",async()=>{
  for(const [productId,names] of Object.entries(expected)){
    const artifact=await generateDifferentiatedProductArtifact(productId,new Uint8Array(font),new Uint8Array(emoji),"p0-p1-v2",assessmentAudio,await loadAssessmentLevelAudio());
    assert.equal(artifact.manifest.files.length,names.length,productId);
    assert.deepEqual([...artifact.manifest.files].sort(),[...names].sort(),productId);
    if(artifact.format==="pdf"){
      assert.equal(productId,"30-day-planner");
      const pdf=await PDFDocument.load(artifact.bytes);
      assert.ok(pdf.getPageCount()>=7,"planner must contain structured daily work and reviews");
      continue;
    }
    const files=zipEntries(artifact.bytes);
    for(const name of names)assert.ok(files.has(name),`${productId}: ${name}`);
    for(const [name,bytes] of files){if(name.endsWith(".pdf")){const pdf=await PDFDocument.load(bytes);if(productId==="teacher-lesson-plan-pack"&&name==="HSKKit-Teacher-Pack-Quick-Start.pdf")assert.equal(pdf.getPageCount(),1,`${productId}: ${name}`);else if(productId==="30-day-planner")assert.equal(pdf.getPageCount(),name.endsWith("Quick-Start.pdf")?1:41,`${productId}: ${name}`);else assert.ok(pdf.getPageCount()>=2,`${productId}: ${name}`);}}
    const readme=new TextDecoder().decode(files.get("README.txt"));
    assert.match(readme,/How to use/i,productId);
    if(productId==="teacher-lesson-plan-pack"){
      assert.match(readme,/single-purchaser classroom licence/i,productId);
      assert.match(artifact.manifest.licenseNotice,/one teaching site/i,productId);
    }else if(productId==="practice-assessment-pack"){
      assert.match(readme,/print(?:ing)? answer sheets for students they personally teach/i,productId);
      assert.match(artifact.manifest.licenseNotice,/without a time limit/i,productId);
    }else if(productId==="worksheet-pack"){
      assert.match(readme,/print student worksheet pages for learners they personally teach/i,productId);
      assert.match(artifact.manifest.licenseNotice,/without a time limit/i,productId);
    }else{
      assert.match(readme,/personal, non-transferable/i,productId);
      assert.match(artifact.manifest.licenseNotice,/personal, non-transferable/i,productId);
    }
  }
});

test("sample generator uses the PDF renderer verified for embedded Chinese fonts",async()=>{
  const generator=await readFile(new URL("../scripts/generate-store-samples.py",import.meta.url),"utf8");
  assert.match(generator,/pdftoppm/);
  assert.doesNotMatch(generator,/import fitz/);
  assert.match(generator,/stderr=subprocess\.DEVNULL/);
});

test("Store resource cards lead to one shared detail-page template before checkout",async()=>{
  const [store,detailPage,detailView,checkout]=await Promise.all([
    readFile(new URL("../src/app/store/store-purchase.tsx",import.meta.url),"utf8"),
    readFile(new URL("../src/app/store/[productId]/page.tsx",import.meta.url),"utf8"),
    readFile(new URL("../src/app/store/[productId]/resource-product-detail.tsx",import.meta.url),"utf8"),
    readFile(new URL("../src/app/store/[productId]/resource-product-checkout.tsx",import.meta.url),"utf8"),
  ]);
  assert.match(store,/View details and samples/);
  assert.match(store,/storeProductDetail/);
  assert.match(store,/href=\{`\/store\/\$\{product\.id\}`\}/);
  assert.match(detailPage,/generateStaticParams/);
  assert.match(detailPage,/storeProductDetail/);
  assert.match(detailView,/What’s inside/);
  assert.match(detailView,/How to use it/);
  assert.match(detailView,/Real product preview/);
  assert.match(detailView,/Sample pages you can read/);
  assert.match(detailView,/Is this right for me\?/);
  assert.match(detailView,/ResourceSampleGallery/);
  const gallery=await readFile(new URL("../src/app/store/[productId]/resource-sample-gallery.tsx",import.meta.url),"utf8");
  assert.match(gallery,/<dialog/);
  assert.match(gallery,/aria-modal="true"/);
  assert.match(gallery,/Zoom to 100%/);
  assert.match(gallery,/Zoom to 150%/);
  assert.match(gallery,/Zoom to 200%/);
  assert.match(gallery,/Previous sample/);
  assert.match(gallery,/Next sample/);
  assert.match(gallery,/onTouchStart/);
  assert.match(gallery,/onTouchEnd/);
  assert.match(gallery,/event\.key===\"Escape\"/);
  assert.match(checkout,/Continue to secure checkout/);
  assert.match(detailView,/lg:grid-cols-\[minmax\(0,0\.92fr\)_minmax\(360px,1\.08fr\)\]/);
  assert.doesNotMatch(detailView,/placeholder/i);
});
