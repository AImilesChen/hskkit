import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import {PDFDocument} from "pdf-lib";
import {selectPackAssets} from "../src/lib/commercial/catalog.ts";
import {generateDifferentiatedProductArtifact,worksheetPromptSegments} from "../src/lib/commercial/product-generator.ts";
import {buildWorksheetLevel,WORKSHEET_MODULES} from "../src/lib/commercial/worksheet-pack.ts";
import {resourceProductDetail} from "../src/lib/commercial/resource-products.ts";

function zipEntries(zip:Uint8Array){
  const result=new Map<string,Uint8Array>();
  const view=new DataView(zip.buffer,zip.byteOffset,zip.byteLength);
  let offset=0;
  while(offset+30<=zip.length&&view.getUint32(offset,true)===0x04034b50){
    const compressed=view.getUint32(offset+18,true),nameLength=view.getUint16(offset+26,true),extraLength=view.getUint16(offset+28,true);
    const name=new TextDecoder().decode(zip.slice(offset+30,offset+30+nameLength));
    const start=offset+30+nameLength+extraLength;
    result.set(name,zip.slice(start,start+compressed));
    offset=start+compressed;
  }
  return result;
}

const expectedFiles=[
  "HSKKit-Worksheets-Student-A4.pdf",
  "HSKKit-Worksheets-Student-US-Letter.pdf",
  "HSKKit-Worksheets-Student-A4-Low-Ink.pdf",
  "HSKKit-Worksheets-Student-Fillable.pdf",
  "HSKKit-Worksheets-Answer-Key.pdf",
  "HSKKit-Worksheet-Completed-Samples.pdf",
  "HSKKit-Worksheet-Progress-Checklist.pdf",
];
const font=await readFile(new URL("../assets/fonts/HskKitSansSubset.ttf",import.meta.url));
const emoji=await readFile(new URL("../assets/fonts/HskKitEmoji.ttf",import.meta.url));

test("reading sources, options and final evidence instruction stay separate",()=>{
  const l8=buildWorksheetLevel(selectPackAssets(8)).modules.find(module=>module.kind==="reading-comprehension")!.questions[0];
  const parts=worksheetPromptSegments(l8.prompt);
  assert.ok(parts.some(part=>part.kind==="source"&&part.text.startsWith("材料甲")));
  assert.ok(parts.some(part=>part.kind==="source"&&part.text.startsWith("材料乙")));
  assert.ok(parts.some(part=>part.kind==="instruction"&&part.text.startsWith("若要决定")));
  assert.ok(parts.every(part=>part.kind!=="source"||!part.text.includes("若要决定")));
  for(const option of ["A.","B.","C."])assert.ok(parts.some(part=>part.kind==="option"&&part.text.startsWith(option)),option);
  assert.ok(parts.some(part=>part.kind==="instruction"&&/排除另两项/.test(part.text)));
  assert.ok(parts.every(part=>part.text.trim().length>0));
  const l4=buildWorksheetLevel(selectPackAssets(4)).modules.find(module=>module.kind==="context-cloze")!.questions[0];
  const short=worksheetPromptSegments(l4.prompt);
  assert.ok(short.some(part=>part.kind==="option"&&part.text==="C. 恢复"));
  assert.ok(short.some(part=>part.kind==="instruction"&&/哪两处信息/.test(part.text)));
  const second=buildWorksheetLevel(selectPackAssets(4)).modules.find(module=>module.kind==="context-cloze")!.questions[1];
  const secondParts=worksheetPromptSegments(second.prompt);
  assert.equal(secondParts.find(part=>part.kind==="option"&&part.text.startsWith("C."))?.text,"C. 仍然");
  assert.ok(secondParts.some(part=>part.kind==="instruction"&&part.text.startsWith("选词并说明")));
  const fourWay=buildWorksheetLevel(selectPackAssets(6)).modules.find(module=>module.kind==="sentence-order")!.questions[0];
  assert.ok(worksheetPromptSegments(fourWay.prompt).some(part=>part.kind==="option"&&part.text.startsWith("D.")));
});

test("worksheet font uses TrueType outlines for consistent Poppler and MuPDF rendering",()=>{
  const tableDirectory=font.subarray(0,512).toString("latin1");
  assert.match(tableDirectory,/glyf/,"the embedded font must expose a TrueType glyf table");
  assert.doesNotMatch(tableDirectory,/CFF /,"CFF outlines are declared as CIDFontType2 by pdf-lib and render incorrectly in MuPDF");
  assert.doesNotMatch(tableDirectory,/GSUB/,"the subset must exclude the shaping table that produced cross-renderer corruption");
});

test("Level 1-9 worksheet plans expose ten required task families plus a real review test",()=>{
  const signatures=new Set<string>();
  const workload:number[]=[];
  for(let level=1;level<=9;level++){
    const plan=buildWorksheetLevel(selectPackAssets(level));
    assert.deepEqual(plan.modules.map(worksheetModule=>worksheetModule.kind),WORKSHEET_MODULES,`Level ${level} module contract`);
    assert.ok(plan.modules.every(worksheetModule=>worksheetModule.questions.length===3),`Level ${level} exact questions per module`);
    assert.ok(plan.modules.at(-1)?.kind==="review-test",`Level ${level} review test`);
    const questionIds=plan.modules.flatMap(worksheetModule=>worksheetModule.questions.map(question=>question.id));
    assert.equal(questionIds.length,30,`Level ${level} exact question count`);
    assert.equal(new Set(questionIds).size,questionIds.length,`Level ${level} unique question IDs`);
    for(const worksheetModule of plan.modules)for(const question of worksheetModule.questions){
      assert.ok(question.answer.trim().length>0,`${question.id} answer`);
      assert.ok(question.explanation.trim().length>=12,`${question.id} explanation`);
      assert.ok(question.commonError.trim().length>=8,`${question.id} common error`);
      assert.ok(question.sampleResponse.trim().length>=2,`${question.id} completed sample`);
      assert.doesNotMatch(question.sampleResponse,/^Model criteria:/i,`${question.id} must contain completed work, not a rubric`);
      assert.ok(question.responseLines>=1,`${question.id} writing space`);
    }
    assert.match(plan.difficultyNote,new RegExp(`Level ${level}`));
    signatures.add(plan.signature);
    workload.push(plan.modules.flatMap(worksheetModule=>worksheetModule.questions).reduce((sum,question)=>sum+question.prompt.length+question.responseLines*20,0));
    assert.ok(new Set(plan.modules.map(worksheetModule=>worksheetModule.questions[0].commonError)).size>=8,`Level ${level} task-aligned common errors`);
    if(level>=7){
      for(const kind of ["reading-comprehension","information-match"] as const){
        const module=plan.modules.find(item=>item.kind===kind);
        assert.ok(module,`Level ${level} includes ${kind}`);
        for(const question of module.questions){
          assert.ok(question.prompt.length>=220,`${question.id} includes enough independently readable source material`);
          assert.match(question.prompt,/材料甲|资料甲|文本A|第一段|资料A/,`${question.id} first source`);
          assert.match(question.prompt,/材料乙|资料乙|文本B|第二段|资料B/,`${question.id} second source`);
          assert.ok(question.explanation.length>=70,`${question.id} explains evidence and distractors`);
        }
      }
    }
  }
  assert.equal(signatures.size,9,"every level has a distinct task/difficulty signature");
  assert.ok(workload[3]>workload[0],"Level 4 workload exceeds Level 1");
  assert.ok(workload[6]>workload[3],"Level 7 workload exceeds Level 4");
  assert.ok(workload[8]>workload[6],"Level 9 workload exceeds Level 7");
});

test("student questions and answer key are aligned one-to-one",()=>{
  for(let level=1;level<=9;level++){
    const plan=buildWorksheetLevel(selectPackAssets(level));
    const studentIds=plan.modules.flatMap(worksheetModule=>worksheetModule.questions.map(question=>question.id));
    const keyedIds=plan.modules.flatMap(worksheetModule=>worksheetModule.questions.filter(question=>question.answer&&question.explanation).map(question=>question.id));
    assert.deepEqual(keyedIds,studentIds,`Level ${level}`);
  }
});

test("worksheet ZIP ships distinct printable, low-ink, fillable, sample and answer deliverables",async()=>{
  const artifact=await generateDifferentiatedProductArtifact("worksheet-pack",new Uint8Array(font),new Uint8Array(emoji),"worksheet-v2");
  assert.equal(artifact.format,"zip");
  assert.deepEqual([...artifact.manifest.files].sort(),[...expectedFiles].sort());
  const files=zipEntries(artifact.bytes);
  assert.deepEqual([...files.keys()].filter(name=>name.endsWith(".pdf")).sort(),expectedFiles.filter(name=>name.endsWith(".pdf")).sort(),"ZIP contains exactly the seven promised PDFs");
  for(const name of expectedFiles)assert.ok(files.has(name),name);
  assert.ok(!files.has("HSKKit-Worksheet-Quick-Start.pdf"),"single-page Quick Start is consolidated into README");
  const readme=new TextDecoder().decode(files.get("README.txt"));
  assert.match(readme,/open A4, US Letter, low-ink or fillable/);
  assert.match(readme,/different day/);
  assert.match(readme,/Progress Checklist/);
  assert.doesNotMatch(readme,/XLSX|Review-Log\.xlsx/);
  assert.ok(!files.has("HSKKit-Worksheet-Optional-Review-Log.xlsx"));
  assert.doesNotMatch(readme,/Read the Quick Start or guide file/);
  const a4=await PDFDocument.load(files.get("HSKKit-Worksheets-Student-A4.pdf")!);
  const letter=await PDFDocument.load(files.get("HSKKit-Worksheets-Student-US-Letter.pdf")!);
  const lowInk=await PDFDocument.load(files.get("HSKKit-Worksheets-Student-A4-Low-Ink.pdf")!);
  const fillable=await PDFDocument.load(files.get("HSKKit-Worksheets-Student-Fillable.pdf")!);
  const answers=await PDFDocument.load(files.get("HSKKit-Worksheets-Answer-Key.pdf")!);
  const samples=await PDFDocument.load(files.get("HSKKit-Worksheet-Completed-Samples.pdf")!);
  const checklist=await PDFDocument.load(files.get("HSKKit-Worksheet-Progress-Checklist.pdf")!);
  assert.ok(a4.getPageCount()>0&&letter.getPageCount()>0&&answers.getPageCount()>0);
  assert.equal(lowInk.getPageCount(),a4.getPageCount(),"low-ink and A4 cover identical tasks");
  assert.ok(fillable.getPageCount()>0&&samples.getPageCount()>0&&checklist.getPageCount()>0);
  const assertDimensions=(pdf:PDFDocument,width:number,height:number,label:string)=>pdf.getPages().forEach((page,index)=>{assert.ok(Math.abs(page.getWidth()-width)<1,`${label} page ${index+1} width`);assert.ok(Math.abs(page.getHeight()-height)<1,`${label} page ${index+1} height`);});
  for(const [pdf,label] of [[a4,"A4 student"],[lowInk,"A4 low-ink"],[fillable,"A4 fillable"],[answers,"A4 answer"],[samples,"A4 samples"],[checklist,"A4 checklist"]] as const)assertDimensions(pdf,595.28,841.89,label);
  assertDimensions(letter,612,792,"US Letter student");
  const expectedFieldNames=[] as string[];
  for(let level=1;level<=9;level++)for(const worksheetModule of buildWorksheetLevel(selectPackAssets(level)).modules)for(const question of worksheetModule.questions)expectedFieldNames.push(`worksheet.${question.id}`);
  const actualFieldNames=fillable.getForm().getFields().map(field=>field.getName());
  assert.equal(actualFieldNames.length,270,"fillable workbook contains one real response field per question ID");
  assert.deepEqual([...actualFieldNames].sort(),[...expectedFieldNames].sort(),"fillable field names map exactly to all worksheet question IDs");
  assert.ok(samples.getPageCount()>=9,"Completed Samples retain generous type and independent explanations");
});

test("worksheet product page promises and exposes real student and answer samples",()=>{
  const detail=resourceProductDetail("worksheet-pack");
  assert.ok(detail);
  assert.match(detail.summary,/multi-skill/i);
  assert.match(detail.formats.join(" "),/A4/i);
  assert.match(detail.formats.join(" "),/US Letter/i);
  assert.match(detail.formats.join(" "),/fillable/i);
  assert.match(detail.formats.join(" "),/low-ink/i);
  assert.ok(detail.samplePages.some(sample=>/student/i.test(sample.label)&&/student/i.test(sample.alt)));
  assert.ok(detail.samplePages.some(sample=>/answer/i.test(sample.label)&&/answer/i.test(sample.alt)));
});
