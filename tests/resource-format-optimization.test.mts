import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import {generateDifferentiatedProductArtifact} from "../src/lib/commercial/product-generator.ts";
import {resourceProductDetail} from "../src/lib/commercial/resource-products.ts";
import {generationVersionForProduct} from "../src/lib/commercial/products.ts";

function zipEntries(zip:Uint8Array){
  const result=new Map<string,Uint8Array>();
  const view=new DataView(zip.buffer,zip.byteOffset,zip.byteLength);
  let offset=0;
  while(offset+30<=zip.length&&view.getUint32(offset,true)===0x04034b50){
    const size=view.getUint32(offset+18,true),nameLength=view.getUint16(offset+26,true),extraLength=view.getUint16(offset+28,true);
    const name=new TextDecoder().decode(zip.slice(offset+30,offset+30+nameLength));
    const start=offset+30+nameLength+extraLength;
    result.set(name,zip.slice(start,start+size));
    offset=start+size;
  }
  return result;
}
const text=(value:Uint8Array|undefined)=>new TextDecoder().decode(value);
const [font,emoji,audioA,audioB,audioC]=await Promise.all([
  readFile(new URL("../assets/fonts/HskKitSansSubset.ttf",import.meta.url)),
  readFile(new URL("../assets/fonts/HskKitEmoji.ttf",import.meta.url)),
  readFile(new URL("../assets/audio/mock-assessment-v2/form-A.mp3",import.meta.url)),
  readFile(new URL("../assets/audio/mock-assessment-v2/form-B.mp3",import.meta.url)),
  readFile(new URL("../assets/audio/mock-assessment-v2/form-C.mp3",import.meta.url)),
]);

test("resource cards disclose the actual delivery file types",async()=>{
  assert.deepEqual(resourceProductDetail("worksheet-pack")?.fileTypes,["PDF"]);
  assert.deepEqual(resourceProductDetail("assessment-tracker")?.fileTypes,["XLSX","CSV","PDF"]);
  assert.deepEqual(resourceProductDetail("30-day-planner")?.fileTypes,["PDF","XLSX"]);
  assert.deepEqual(resourceProductDetail("practice-assessment-pack")?.fileTypes,["PDF","MP3","CSV","XLSX"]);
  const source=await readFile(new URL("../src/app/store/store-purchase.tsx",import.meta.url),"utf8");
  assert.match(source,/detail\.fileTypes\.map/);
  assert.doesNotMatch(source,/>Digital<\/span>/);
});

test("Assessment Tracker merchandising lists its two Excel workbooks and complete file counts",()=>{
  const detail=resourceProductDetail("assessment-tracker");
  assert.ok(detail);
  assert.match(detail.inside.join(" "),/Blank and Example XLSX/i);
  assert.match(detail.formats.join(" "),/2 editable XLSX workbooks/i);
  assert.match(detail.formats.join(" "),/3 UTF-8 CSV files/i);
  assert.match(detail.formats.join(" "),/2 searchable PDFs/i);
});

test("30-Day Planner ships an editable Excel progress companion",async()=>{
  assert.equal(generationVersionForProduct("30-day-planner"),"planner-progress-xlsx-v4");
  const artifact=await generateDifferentiatedProductArtifact("30-day-planner",new Uint8Array(font),new Uint8Array(emoji),"format-optimization-test");
  const files=zipEntries(artifact.bytes);
  const name="HSKKit-30-Day-Planner-Progress-Tracker.xlsx";
  assert.ok(files.has(name));
  const workbook=zipEntries(files.get(name)!);
  assert.match(text(workbook.get("xl/workbook.xml")),/Setup/);
  assert.match(text(workbook.get("xl/workbook.xml")),/30-Day Plan/);
  assert.match(text(workbook.get("xl/workbook.xml")),/Progress Summary/);
  assert.match(text(workbook.get("xl/worksheets/sheet2.xml")),/Day 30/);
  assert.match(text(workbook.get("xl/worksheets/sheet2.xml")),/<dataValidations/);
  assert.match(text(workbook.get("xl/worksheets/sheet3.xml")),/COUNTIF/);
});

test("Practice Assessment Pack ships an Excel score workbook with automatic totals and weakest-skill result",async()=>{
  assert.equal(generationVersionForProduct("practice-assessment-pack"),"practice-score-xlsx-v2");
  const artifact=await generateDifferentiatedProductArtifact("practice-assessment-pack",new Uint8Array(font),new Uint8Array(emoji),"format-optimization-test",{A:new Uint8Array(audioA),B:new Uint8Array(audioB),C:new Uint8Array(audioC)});
  const files=zipEntries(artifact.bytes);
  const name="HSKKit-Practice-Assessment-Score-Tracker.xlsx";
  assert.ok(files.has(name));
  const workbook=zipEntries(files.get(name)!);
  assert.match(text(workbook.get("xl/workbook.xml")),/Score Entry/);
  assert.match(text(workbook.get("xl/workbook.xml")),/Progress Summary/);
  const scores=text(workbook.get("xl/worksheets/sheet2.xml"));
  assert.match(scores,/SUM\(D2:F2\)/);
  assert.match(scores,/MIN\(D2:F2\)/);
  assert.match(scores,/<dataValidations/);
});
