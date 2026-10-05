import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {PDFDocument} from "pdf-lib";
import {generateDifferentiatedProductArtifact} from "../src/lib/commercial/product-generator.ts";
import {buildTeacherLessonPack} from "../src/lib/commercial/teacher-lesson-pack.ts";
import {selectPackAssets} from "../src/lib/commercial/catalog.ts";

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
const xml=(entries:Map<string,Uint8Array>,name:string)=>new TextDecoder().decode(entries.get(name));
function pdfPages(data:Uint8Array){const result=spawnSync("pdftotext",["-layout","-","-"],{input:Buffer.from(data),encoding:"utf8"});assert.equal(result.status,0,result.stderr);return result.stdout.split("\f").filter(page=>page.trim());}
const font=await readFile(new URL("../assets/fonts/HskKitSansSubset.ttf",import.meta.url));
const MANIFEST_WORDS:Record<number,string[]>={
  1:["爱","爱好","常常","唱歌","读书","高兴"],2:["安全","办法","帮助","必须","不同","参加"],3:["安排","保证","标准","表达","处理","成果"],
  4:["背景","材料","采访","参与","测试","诚信"],5:["病毒","补偿","成本","成效","产业","冲突"],6:["本质","策略","差异","常规","场景","波动"],
  7:["癌症","艾滋病","安抚","安宁","保障","保质期"],8:["安定","安抚","安稳","安心","包容","保障"],9:["颁布","罢免","百分比","半信半疑","半真半假","报复"],
};
const PRIVATE_ROLE_MARKERS:Record<number,string[]>={
  1:["林娜","王明"],2:["16:30","安全培训"],3:["62分","75分","提高12分"],4:["24人","240元","百分之78"],5:["120台","18,000元","5,000元","12,000元"],
  6:["百分之72","百分之86","百分之8至15","百分之62","百分之31"],7:["百分之28","过期试剂"],8:["百分之22","百分之17","百分之35"],9:["百分之48","百分之71","百分之19","14天"],
};
const emoji=await readFile(new URL("../assets/fonts/HskKitEmoji.ttf",import.meta.url));

const expectedFiles=[
  "HSKKit-Teacher-Pack-Quick-Start.pdf",
  "HSKKit-Teacher-Lesson-Plans-A4.pdf",
  "HSKKit-Teacher-Lesson-Plans-US-Letter.pdf",
  "HSKKit-Student-Handouts-A4.pdf",
  "HSKKit-Student-Handouts-US-Letter.pdf",
  "HSKKit-Exit-Tickets-A4.pdf",
  "HSKKit-Exit-Tickets-US-Letter.pdf",
  "HSKKit-Homework-Answers-Rubrics.pdf",
  "HSKKit-Activity-Cards-A4.pdf",
  "HSKKit-Activity-Cards-US-Letter.pdf",
  "HSKKit-Editable-Lesson-Plans.docx",
  "HSKKit-Editable-Classroom-Slides.pptx",
] as const;

test("Teacher Pack differentiates Level 1–9 and gives 45/60/90 genuinely different activity thickness",()=>{
  const pack=buildTeacherLessonPack();
  assert.equal(pack.levels.length,9);
  assert.deepEqual(pack.levels.map(level=>level.level),[1,2,3,4,5,6,7,8,9]);
  assert.equal(new Set(pack.levels.map(level=>level.communicativeTask)).size,9,"each level needs a distinct classroom task");
  assert.equal(new Set(pack.levels.map(level=>level.outputConstraint)).size,9,"each level needs a distinct output constraint");
  for(const level of pack.levels){
    const plans=[45,60,90].map(minutes=>level.plans[minutes as 45|60|90]);
    assert.deepEqual(plans.map(plan=>plan.stages.reduce((sum,stage)=>sum+stage.minutes,0)),[45,60,90]);
    assert.ok(plans[0].stages.length<plans[1].stages.length&&plans[1].stages.length<plans[2].stages.length,`Level ${level.level}: thickness`);
    assert.ok(plans[1].stages.some(stage=>stage.mode==="pair-work"),`Level ${level.level}: 60-minute pair work`);
    assert.ok(plans[2].stages.some(stage=>stage.mode==="communicative-task"),`Level ${level.level}: 90-minute communicative task`);
    assert.ok(level.teacherModel.length>=2&&level.guidedPractice.length===4&&level.studentHandout.length>=4);
    assert.match(level.guidedPractice[0],/Matching set.*Meaning options/);
    assert.match(level.guidedPractice[1],/Sentence stem/);
    assert.match(level.guidedPractice[2],/Error repair.*[‘']/);
    assert.match(level.guidedPractice[3],/Original output.*Required evidence/);
    assert.ok(level.activityCards.A.facts.length>=3&&level.activityCards.B.facts.length>=3);
    assert.ok(level.exitTicket.questions.length>=3&&level.exitTicket.scoring.length>=3);
    assert.ok(level.homework.questions.length>=3&&level.homework.answers.length===level.homework.questions.length);
    assert.ok(level.homework.rubric.criteria.length>=3);
  }
  assert.match(pack.levels[0].communicativeTask,/two-turn|identity|hobby/i);
  assert.match(pack.levels[8].communicativeTask,/argument|policy|counter|hearing/i);
  const learnerContent=JSON.stringify(pack);
  assert.doesNotMatch(learnerContent,/picture-supported|different problem card|split evidence|Prompt [1-4]/i);
  assert.match(learnerContent,/林娜.*爱唱歌/);assert.match(learnerContent,/120台设备.*18,000元/);assert.match(learnerContent,/百分之48升至百分之71.*半真半假/);
  for(const level of pack.levels){const learnerSheet=[...level.studentHandout,...level.guidedPractice].join(" ");assert.match(learnerSheet,/take only Card A or Card B/i);for(const fact of [...level.activityCards.A.facts,...level.activityCards.B.facts])assert.ok(!learnerSheet.includes(fact),`Level ${level.level}: role-card fact leaked into student materials`);for(const marker of PRIVATE_ROLE_MARKERS[level.level])assert.ok(!learnerSheet.includes(marker),`Level ${level.level}: private marker leaked into student materials: ${marker}`);}
});

test("Teacher Pack ships classroom-ready print files plus real editable DOCX and PPTX",async()=>{
  const artifact=await generateDifferentiatedProductArtifact("teacher-lesson-plan-pack",new Uint8Array(font),new Uint8Array(emoji),"teacher-pack-v2");
  assert.deepEqual([...artifact.manifest.files].sort(),[...expectedFiles].sort());
  const expectedAssetIds:string[]=[];
  for(const [levelText,hanziList] of Object.entries(MANIFEST_WORDS)){
    const selection=selectPackAssets(Number(levelText));
    for(const hanzi of hanziList){const word=selection.words.find(candidate=>candidate.hanzi===hanzi);assert.ok(word,`missing source word Level ${levelText}: ${hanzi}`);expectedAssetIds.push(word.id);}
  }
  assert.deepEqual(artifact.manifest.assets.map(asset=>asset.id).sort(),[...new Set(expectedAssetIds)].sort(),"manifest assets must exactly trace the shipped target words");
  const files=zipEntries(artifact.bytes);
  for(const name of expectedFiles)assert.ok(files.has(name),name);

  for(const name of expectedFiles.filter(name=>name.endsWith(".pdf"))){
    const pdf=await PDFDocument.load(files.get(name)!);
    assert.ok(pdf.getPageCount()>=(name.includes("Quick-Start")?1:9),name);
    const {width,height}=pdf.getPage(0).getSize();
    if(name.includes("US-Letter"))assert.ok(Math.abs(width-612)<1&&Math.abs(height-792)<1,`${name}: US Letter`);
    else assert.ok(Math.abs(width-595.28)<1&&Math.abs(height-841.89)<1,`${name}: A4`);
  }
  for(const name of ["HSKKit-Teacher-Lesson-Plans-A4.pdf","HSKKit-Teacher-Lesson-Plans-US-Letter.pdf"]){
    const pages=pdfPages(files.get(name)!);
    assert.equal(pages.length,54,`${name}: two pages per Level/duration`);
    for(const [index,page] of pages.entries()){
      if(index%2===0)assert.match(page,/minute flow|minute lesson/i);
      else for(const label of ["Preparation","Teacher modeling","Common errors","Exit evidence","Homework + rubric","Differentiation"])assert.ok(page.includes(label),name+" page "+(index+1)+": "+label);
    }
  }
  for(const name of ["HSKKit-Student-Handouts-A4.pdf","HSKKit-Student-Handouts-US-Letter.pdf"]){const studentText=pdfPages(files.get(name)!).join(" ").replace(/\s+/g,"");assert.match(studentText,/takeonlyCardAorCardB/i);assert.doesNotMatch(studentText,/AnswerKey|FeedbackRubric/);for(const level of buildTeacherLessonPack().levels){for(const fact of [...level.activityCards.A.facts,...level.activityCards.B.facts])assert.ok(!studentText.includes(fact.replace(/\s+/g,"")),`${name}: Level ${level.level} private role fact leaked`);for(const marker of PRIVATE_ROLE_MARKERS[level.level])assert.ok(!studentText.includes(marker.replace(/\s+/g,"")),`${name}: Level ${level.level} private marker leaked: ${marker}`);}}

  const docx=zipEntries(files.get("HSKKit-Editable-Lesson-Plans.docx")!);
  assert.ok(docx.has("word/document.xml"));
  const documentXml=xml(docx,"word/document.xml");
  assert.match(documentXml,/Level 1/);assert.match(documentXml,/Level 9/);
  assert.match(documentXml,/爱好/);assert.match(documentXml,/病毒/);assert.match(documentXml,/颁布/);
  assert.doesNotMatch(documentXml,/你好|悖论|阿拉伯语/);
  assert.match(documentXml,/unified advanced-band source set/);
  assert.match(documentXml,/林娜.*爱唱歌/);assert.match(documentXml,/120台设备.*18,000元/);assert.match(documentXml,/百分之48升至百分之71.*半真半假/);
  assert.doesNotMatch(documentXml,/picture-supported|different problem card|split evidence|Prompt [1-4]/i);
  assert.match(documentXml,/45-minute/);assert.match(documentXml,/60-minute/);assert.match(documentXml,/90-minute/);
  assert.match(documentXml,/Exit Ticket/);assert.match(documentXml,/Homework/);assert.match(documentXml,/Answer Key/);assert.match(documentXml,/Feedback Rubric/);
  assert.doesNotMatch(documentXml,/w:fldSimple|w:instrText/,"editable lesson text must not be flattened into fields");

  const pptx=zipEntries(files.get("HSKKit-Editable-Classroom-Slides.pptx")!);
  assert.ok(pptx.has("ppt/presentation.xml"));
  const slideNames=[...pptx.keys()].filter(name=>/^ppt\/slides\/slide\d+\.xml$/.test(name));
  assert.ok(slideNames.length>=73,"cover plus eight projected prompts per level");
  const slideText=slideNames.map(name=>xml(pptx,name)).join(" ");
  assert.match(slideText,/Level 1/);assert.match(slideText,/Level 9/);
  assert.match(slideText,/Pair Work/);assert.match(slideText,/Communicative Task/);assert.match(slideText,/Exit Ticket/);
  assert.doesNotMatch(slideText,/<p:pic>/,"classroom text must remain editable shapes, not flattened screenshots");
});

test("Teacher Pack merchandising discloses every editable and printable deliverable",async()=>{
  const {resourceProductDetail}=await import("../src/lib/commercial/resource-products.ts");
  const detail=resourceProductDetail("teacher-lesson-plan-pack")!;
  const disclosure=[detail.summary,...detail.inside,...detail.formats,...detail.fit.facts].join(" ");
  assert.match(disclosure,/student handout/i);
  assert.match(disclosure,/DOCX.*editable/i);
  assert.match(disclosure,/PPTX.*editable/i);
  assert.match(disclosure,/A4.*US Letter/i);
  assert.match(disclosure,/Exit Ticket.*cut|cut.*Exit Ticket/i);
  assert.match(disclosure,/Homework.*answer.*rubric/i);
  assert.match(disclosure,/45.*60.*90.*different/i);
});
