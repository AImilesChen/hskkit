import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import {PDFDocument} from "pdf-lib";
import {generateDifferentiatedProductArtifact} from "../src/lib/commercial/product-generator.ts";

function zipEntries(zip:Uint8Array){
  const result=new Map<string,Uint8Array>();
  const view=new DataView(zip.buffer,zip.byteOffset,zip.byteLength);
  let offset=0;
  while(offset+30<=zip.length&&view.getUint32(offset,true)===0x04034b50){
    const size=view.getUint32(offset+18,true),nameLength=view.getUint16(offset+26,true),extraLength=view.getUint16(offset+28,true);
    const name=new TextDecoder().decode(zip.slice(offset+30,offset+30+nameLength));
    const start=offset+30+nameLength+extraLength;
    result.set(name,zip.slice(start,start+size));offset=start+size;
  }
  return result;
}
const text=(bytes:Uint8Array|undefined)=>new TextDecoder().decode(bytes);

test("Assessment Tracker v2 ships separate blank and example Excel dashboards",async()=>{
  const [font,emoji]=await Promise.all([
    readFile(new URL("../assets/fonts/HskKitSansSubset.ttf",import.meta.url)),
    readFile(new URL("../assets/fonts/HskKitEmoji.ttf",import.meta.url)),
  ]);
  const artifact=await generateDifferentiatedProductArtifact("assessment-tracker",new Uint8Array(font),new Uint8Array(emoji),"assessment-tracker-v2");
  const files=zipEntries(artifact.bytes);
  const required=[
    "HSKKit-Assessment-Tracker-Blank.xlsx",
    "HSKKit-Assessment-Tracker-Example.xlsx",
    "HSKKit-Assessment-Tracker-Raw-Data.csv",
    "HSKKit-Weekly-Review.csv",
    "HSKKit-Assessment-Dashboard-Guide.pdf",
    "HSKKit-Printable-Assessment-Record.pdf",
  ];
  for(const name of required)assert.ok(files.has(name),name);
  assert.notDeepEqual(files.get(required[0]),files.get(required[1]));

  for(const workbookName of required.slice(0,2)){
    const workbook=zipEntries(files.get(workbookName)!);
    assert.ok(workbook.has("xl/charts/chart1.xml"),`${workbookName} chart1`);
    assert.ok(workbook.has("xl/charts/chart2.xml"),`${workbookName} chart2`);
    assert.match(text(workbook.get("xl/workbook.xml")),/Dashboard/);
    assert.match(text(workbook.get("xl/workbook.xml")),/Vocabulary Tracker/);
    assert.match(text(workbook.get("xl/workbook.xml")),/Weekly Review/);
    assert.match(text(workbook.get("xl/workbook.xml")),/Print Summary/);
    assert.match(text(workbook.get("xl/workbook.xml")),/calcMode="auto"/);
    const dashboard=text(workbook.get("xl/worksheets/sheet2.xml"));
    assert.match(dashboard,/COUNTIF/);
    assert.match(dashboard,/AVERAGEIF/);
    assert.match(dashboard,/COUNTIFS/);
    assert.match(dashboard,/SUMPRODUCT/);
    assert.match(dashboard,/I\$2:\$I\$1081&amp;lt;&amp;gt;|I\$2:\$I\$1081&lt;&gt;/);
    assert.doesNotMatch(dashboard,/LET\(|LAMBDA\(|_xlfn\./);
    const tracker=text(workbook.get("xl/worksheets/sheet3.xml"));
    assert.match(tracker,/<autoFilter ref=/);
    assert.match(tracker,/<conditionalFormatting/);
    assert.match(tracker,/SUM\(I2:K2\)/);
    assert.match(tracker,/COUNT\(I2:K2\)=0/);
    assert.match(tracker,/IFERROR\(L2\/6/);
    assert.match(tracker,/dataValidations count="3"/);
    const weekly=text(workbook.get("xl/worksheets/sheet4.xml"));
    assert.match(weekly,/AVERAGEIFS/);
    assert.match(weekly,/\$N\$2:\$N\$1081/);
    assert.match(weekly,/A2\+7/);
    const summary=text(workbook.get("xl/worksheets/sheet5.xml"));
    assert.match(summary,/pageSetup[^>]*orientation="landscape"/);
    assert.match(summary,/pageMargins/);
  }

  const blank=zipEntries(files.get(required[0])!);
  const example=zipEntries(files.get(required[1])!);
  assert.doesNotMatch(text(blank.get("xl/worksheets/sheet3.xml")),/SAMPLE_EVIDENCE/);
  assert.match(text(example.get("xl/worksheets/sheet3.xml")),/SAMPLE_EVIDENCE/);
});

test("Assessment Tracker v2 maps Level 1-9 and calculates percentages without manual work",async()=>{
  const [font,emoji]=await Promise.all([
    readFile(new URL("../assets/fonts/HskKitSansSubset.ttf",import.meta.url)),
    readFile(new URL("../assets/fonts/HskKitEmoji.ttf",import.meta.url)),
  ]);
  const artifact=await generateDifferentiatedProductArtifact("assessment-tracker",new Uint8Array(font),new Uint8Array(emoji),"assessment-tracker-v2");
  const files=zipEntries(artifact.bytes);
  const csv=text(files.get("HSKKit-Assessment-Tracker-Raw-Data.csv"));
  const rows=csv.trim().split(/\r?\n/);
  assert.equal(rows.length,1081);
  for(let level=1;level<=9;level++)assert.equal(rows.filter(row=>row.startsWith(`"${level}",`)).length,120,`Level ${level}`);
  assert.match(csv,/"7","unified-levels-7-9","7"/);
  assert.match(csv,/"8","unified-levels-7-9","7"/);
  assert.match(csv,/"9","unified-levels-7-9","7"/);

  const printable=await PDFDocument.load(files.get("HSKKit-Printable-Assessment-Record.pdf")!);
  assert.ok(printable.getPageCount()>=10,"printable record must provide spacious level pages and summary space");
});
