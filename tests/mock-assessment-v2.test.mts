import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import * as generator from "../src/lib/commercial/product-generator.ts";
import {assessmentScenario} from "../src/lib/commercial/mock-assessment-content.ts";

function zipEntries(zip:Uint8Array){const result=new Map<string,Uint8Array>();const view=new DataView(zip.buffer,zip.byteOffset,zip.byteLength);let offset=0;while(offset+30<=zip.length&&view.getUint32(offset,true)===0x04034b50){const size=view.getUint32(offset+18,true),nameLength=view.getUint16(offset+26,true),extraLength=view.getUint16(offset+28,true);const name=new TextDecoder().decode(zip.slice(offset+30,offset+30+nameLength));const start=offset+30+nameLength+extraLength;result.set(name,zip.slice(start,start+size));offset=start+size;}return result;}

type Blueprint={
  level:number;
  band:string;
  suggestedMinutes:number;
  listening:string[];
  reading:string[];
  writing:string[];
  rubricDimensions:string[];
  recommendations:Record<string,string[]>;
};

const expectedBands=new Map([
  [1,"foundation"],[2,"foundation"],
  [3,"developing"],[4,"developing"],
  [5,"independent"],[6,"independent"],
  [7,"advanced"],[8,"advanced"],[9,"advanced"],
]);

test("mock assessment v2 exposes a differentiated Level 1-9 blueprint",()=>{
  const blueprint=(generator as unknown as {mockAssessmentBlueprint?:(level:number)=>Blueprint}).mockAssessmentBlueprint;
  assert.equal(typeof blueprint,"function","mockAssessmentBlueprint must be implemented");
  const all=Array.from({length:9},(_,index)=>blueprint!(index+1));
  for(const spec of all){
    assert.equal(spec.band,expectedBands.get(spec.level));
    assert.ok(spec.suggestedMinutes>=35);
    assert.ok(spec.listening.length>=2,`Level ${spec.level} listening task mix`);
    assert.ok(spec.reading.length>=3,`Level ${spec.level} reading task mix`);
    assert.ok(spec.writing.length>=2,`Level ${spec.level} writing task mix`);
    assert.ok(spec.rubricDimensions.length>=3,`Level ${spec.level} rubric`);
    for(const skill of ["listening","reading","writing"])assert.ok(spec.recommendations[skill]?.length>=1,`Level ${spec.level} ${skill} recommendations`);
  }
  assert.notDeepEqual(all[0].listening,all[2].listening);
  assert.notDeepEqual(all[2].reading,all[4].reading);
  assert.notDeepEqual(all[4].writing,all[6].writing);
  assert.equal(new Set(all.map(spec=>[...spec.listening,...spec.reading,...spec.writing].join("|"))).size,9,"every Level must expose a distinct task mix");
});

test("mock assessment v2 blueprint includes authentic task families requested by the product contract",()=>{
  const blueprint=(generator as unknown as {mockAssessmentBlueprint?:(level:number)=>Blueprint}).mockAssessmentBlueprint;
  assert.equal(typeof blueprint,"function");
  const text=Array.from({length:9},(_,index)=>blueprint!(index+1)).flatMap(spec=>[...spec.listening,...spec.reading,...spec.writing]).join(" ");
  for(const task of ["dialogue","cloze","sentence-order","information-match","short-passage","inference","sentence-insertion","summary","synthesis","argument"])assert.match(text,new RegExp(task),task);
});

test("mock assessment v2 rejects unsupported levels",()=>{
  const blueprint=(generator as unknown as {mockAssessmentBlueprint?:(level:number)=>Blueprint}).mockAssessmentBlueprint;
  assert.equal(typeof blueprint,"function");
  assert.throws(()=>blueprint!(0),/INVALID_ASSESSMENT_LEVEL/);
  assert.throws(()=>blueprint!(10),/INVALID_ASSESSMENT_LEVEL/);
});

test("all 27 Level/Form scenarios use distinct, level-authentic task designs and balanced answer positions",()=>{
  const scenarios=Array.from({length:9},(_,level)=>Array.from({length:3},(_,variant)=>assessmentScenario(level+1,variant))).flat();
  assert.equal(new Set(scenarios.map(item=>item.transcript)).size,27);
  assert.equal(new Set(scenarios.map(item=>item.readingText)).size,27);
  assert.equal(new Set(scenarios.map(item=>item.sourceB)).size,27);
  assert.equal(new Set(Array.from({length:9},(_,index)=>assessmentScenario(index+1,0).listeningGenre)).size,9);
  assert.equal(new Set(Array.from({length:9},(_,index)=>assessmentScenario(index+1,0).readingTaskFamilies.join("|"))).size,9);
  assert.match(assessmentScenario(1,0).transcript,/短句一/u);
  assert.match(assessmentScenario(2,0).transcript,/女：[\s\S]*男：/u);
  assert.match(assessmentScenario(4,0).transcript,/第一段对话[\s\S]*第二段对话/u);
  assert.match(assessmentScenario(8,0).transcript,/发言人一[\s\S]*发言人二/u);
  assert.match(assessmentScenario(9,0).transcript,/主张方[\s\S]*质疑方[\s\S]*回应方/u);
  assert.doesNotMatch(assessmentScenario(1,0).readingTaskFamilies.join(" "),/synthesis|counterargument|rhetorical/u);
  assert.match(assessmentScenario(9,0).readingTaskFamilies.join(" "),/counterargument[\s\S]*critical synthesis/u);
  for(const item of scenarios){
    assert.equal(item.listening.length,5);
    assert.equal(item.reading.length,10);
    assert.doesNotMatch(item.transcript,/任务要求抓住什么|补充材料首先明确/u);
    const allItems=[...item.listening,...item.reading];
    assert.ok(new Set(allItems.map(question=>question.answer)).size>=2,"one scenario must not use a single repeated answer letter");
    for(const question of allItems){
      for(const [index,option] of question.options.entries())assert.match(question.distractorAnalysis,new RegExp(`${["A","B","C"][index]}“${option.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}”`));
    }
  }
  for(const form of [0,1,2]){
    const answers=Array.from({length:9},(_,level)=>assessmentScenario(level+1,form)).flatMap(item=>[...item.listening,...item.reading].map(question=>question.answer));
    const counts={A:answers.filter(answer=>answer==="A").length,B:answers.filter(answer=>answer==="B").length,C:answers.filter(answer=>answer==="C").length};
    assert.ok(Math.max(...Object.values(counts))-Math.min(...Object.values(counts))<=2,JSON.stringify(counts));
  }
});

test("mock assessment v2 packages form audio, answer sheets, explanations, score report and learner feedback",async()=>{
  const [font,emoji,audioA,audioB,audioC]=await Promise.all([
    readFile(new URL("../assets/fonts/HskKitSansSubset.ttf",import.meta.url)),
    readFile(new URL("../assets/fonts/HskKitEmoji.ttf",import.meta.url)),
    readFile(new URL("../assets/audio/mock-assessment-v2/form-A.mp3",import.meta.url)),
    readFile(new URL("../assets/audio/mock-assessment-v2/form-B.mp3",import.meta.url)),
    readFile(new URL("../assets/audio/mock-assessment-v2/form-C.mp3",import.meta.url)),
  ]);
  const create=generator.generateDifferentiatedProductArtifact as unknown as (productId:string,font:Uint8Array,emoji:Uint8Array,version:string,audio:Record<"A"|"B"|"C",Uint8Array>)=>Promise<{bytes:Uint8Array;manifest:{files:string[]}}>;
  const artifact=await create("practice-assessment-pack",new Uint8Array(font),new Uint8Array(emoji),"mock-v2-test",{A:audioA,B:audioB,C:audioC});
  const files=zipEntries(artifact.bytes);
  for(const name of [
    "HSKKit-Practice-Assessment-A-Listening.mp3",
    "HSKKit-Practice-Assessment-B-Listening.mp3",
    "HSKKit-Practice-Assessment-C-Listening.mp3",
    "HSKKit-Practice-Assessment-Audio-Source-License.txt",
    "HSKKit-Practice-Assessment-Answer-Sheets.pdf",
    "HSKKit-Practice-Assessment-Answers-Explanations.pdf",
    "HSKKit-Practice-Assessment-Score-Report.pdf",
    "HSKKit-Practice-Assessment-Facilitator-Transcripts.pdf",
  ])assert.ok(files.has(name),name);
  assert.match(new TextDecoder().decode(files.get("HSKKit-Practice-Assessment-Audio-Source-License.txt")!),/Piper[\s\S]*MIT[\s\S]*CC0-1\.0/);
  for(const form of ["A","B","C"] as const){const mp3=files.get(`HSKKit-Practice-Assessment-${form}-Listening.mp3`)!;assert.ok(mp3.byteLength>500_000);assert.ok(mp3[0]===0x49&&mp3[1]===0x44&&mp3[2]===0x33||mp3[0]===0xff&&(mp3[1]&0xe0)===0xe0);}
  assert.deepEqual([...artifact.manifest.files].sort(),[...files.keys()].filter(name=>name!=="manifest.json"&&name!=="README.txt").sort());
});

test("mock assessment v2 source MP3 files are real non-placeholder audio assets",async()=>{
  for(const form of ["A","B","C"] as const){
    const audio=await readFile(new URL(`../assets/audio/mock-assessment-v2/form-${form}.mp3`,import.meta.url));
    assert.ok(audio.byteLength>500_000,`${form} MP3 is too small to be the full listening assessment`);
    assert.ok(audio[0]===0x49&&audio[1]===0x44&&audio[2]===0x33||audio[0]===0xff&&(audio[1]&0xe0)===0xe0);
  }
});

test("mock assessment v2 source transcripts remain synchronized with packaged MP3 content",async()=>{
  const listeningScript=(generator as unknown as {mockAssessmentListeningScript?:(form:"A"|"B"|"C")=>string}).mockAssessmentListeningScript;
  assert.equal(typeof listeningScript,"function");
  for(const form of ["A","B","C"] as const){
    const source=await readFile(new URL(`../assets/audio/mock-assessment-v2/form-${form}.txt`,import.meta.url),"utf8");
    assert.equal(source,listeningScript!(form));
  }
});

test("mock assessment v2 fails closed when real listening audio is absent",async()=>{
  const [font,emoji]=await Promise.all([
    readFile(new URL("../assets/fonts/HskKitSansSubset.ttf",import.meta.url)),
    readFile(new URL("../assets/fonts/HskKitEmoji.ttf",import.meta.url)),
  ]);
  await assert.rejects(()=>generator.generateDifferentiatedProductArtifact("practice-assessment-pack",new Uint8Array(font),new Uint8Array(emoji),"mock-v2-test"),/ASSESSMENT_AUDIO_REQUIRED/);
});
