import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import {loadAssessmentLevelAudio} from "./assessment-level-audio-fixture.mts";
import {PDFDocument} from "pdf-lib";
import {generateDifferentiatedProductArtifact} from "../src/lib/commercial/product-generator.ts";
import {buildPackManifest,manifestStillAuthorized,selectPackAssets} from "../src/lib/commercial/catalog.ts";
import {generatePackPdf} from "../src/lib/commercial/generator.ts";

function zipEntries(zip:Uint8Array){const result=new Map<string,Uint8Array>();const view=new DataView(zip.buffer,zip.byteOffset,zip.byteLength);let offset=0;while(offset+30<=zip.length&&view.getUint32(offset,true)===0x04034b50){const compressed=view.getUint32(offset+18,true),nameLength=view.getUint16(offset+26,true),extraLength=view.getUint16(offset+28,true);const name=new TextDecoder().decode(zip.slice(offset+30,offset+30+nameLength));const start=offset+30+nameLength+extraLength;result.set(name,zip.slice(start,start+compressed));offset=start+compressed;}return result;}

const products=["worksheet-pack","assessment-tracker","30-day-planner","practice-assessment-pack","teacher-lesson-plan-pack"] as const;
const expectedAssetCounts:Record<(typeof products)[number],number>={"worksheet-pack":371,"assessment-tracker":11092,"30-day-planner":0,"practice-assessment-pack":0,"teacher-lesson-plan-pack":52};
const [assessmentAudioA,assessmentAudioB,assessmentAudioC]=await Promise.all([
 readFile(new URL("../assets/audio/mock-assessment-v2/form-A.mp3",import.meta.url)),
 readFile(new URL("../assets/audio/mock-assessment-v2/form-B.mp3",import.meta.url)),
 readFile(new URL("../assets/audio/mock-assessment-v2/form-C.mp3",import.meta.url)),
]);
const assessmentAudio={A:new Uint8Array(assessmentAudioA),B:new Uint8Array(assessmentAudioB),C:new Uint8Array(assessmentAudioC)};
test("P1 artifacts contain parseable non-placeholder PDFs, CSV data, manifests and stable filenames",async()=>{
 const [font,emoji]=await Promise.all([readFile(new URL("../assets/fonts/HskKitSansSubset.ttf",import.meta.url)),readFile(new URL("../assets/fonts/HskKitEmoji.ttf",import.meta.url))]);
 for(const productId of products){const artifact=await generateDifferentiatedProductArtifact(productId,new Uint8Array(font),new Uint8Array(emoji),"p0-p1-v2",assessmentAudio,await loadAssessmentLevelAudio());assert.ok(artifact.bytes.byteLength>5_000,productId);assert.equal(artifact.manifest.productId,productId);assert.equal(artifact.manifest.generationVersion,"p0-p1-v2");assert.equal(artifact.manifest.officialExam,false);assert.equal(artifact.manifest.standardVersion,"GF0025-2021");assert.match(artifact.manifest.advancedBandDisclosure,/unified Levels 7–9/);assert.equal(artifact.manifest.assets.length,expectedAssetCounts[productId]);
  if(artifact.format==="pdf"){const pdf=await PDFDocument.load(artifact.bytes);assert.ok(pdf.getPageCount()>=2);assert.match(pdf.getTitle()??"",/HSK/);continue;}
  const files=zipEntries(artifact.bytes);assert.ok(files.has("manifest.json"),productId);const manifest=JSON.parse(new TextDecoder().decode(files.get("manifest.json")));assert.equal(manifest.productId,productId);assert.equal(manifest.officialExam,false);assert.equal(manifest.standard,"HSK 3.0");assert.equal(manifest.standardVersion,"GF0025-2021");assert.match(manifest.advancedBandDisclosure,/unified Levels 7–9/);assert.equal(manifest.assets.length,expectedAssetCounts[productId]);
  const pdfs=[...files.entries()].filter(([name])=>name.endsWith(".pdf"));assert.ok(pdfs.length>=1,productId);for(const [name,bytes] of pdfs){assert.ok(bytes.byteLength>2_000,name);const pdf=await PDFDocument.load(bytes);assert.ok(pdf.getPageCount()>=1,name);assert.match(pdf.getTitle()??"",/HSK/,name);}
  if(productId==="assessment-tracker"){const csv=files.get("HSKKit-Assessment-Tracker.csv");assert.ok(csv);const text=new TextDecoder().decode(csv);assert.match(text,/level,source_band,source_level,word_id,hanzi,pinyin,meaning/);assert.match(text,/unified-levels-7-9/);assert.ok(text.split("\n").length>=1_081);}
  if(productId==="practice-assessment-pack")assert.deepEqual([...files.keys()].filter(name=>name.endsWith(".pdf")).sort(),["00-START-HERE.pdf","HSKKit-Practice-Assessment-A-Student.pdf","HSKKit-Practice-Assessment-Answer-Sheets.pdf","HSKKit-Practice-Assessment-Answers-Explanations.pdf","HSKKit-Practice-Assessment-B-Student.pdf","HSKKit-Practice-Assessment-C-Student.pdf","HSKKit-Practice-Assessment-Facilitator-Transcripts.pdf","HSKKit-Practice-Assessment-Score-Report.pdf"]);
  if(productId==="teacher-lesson-plan-pack")assert.deepEqual([...files.keys()].filter(name=>name.endsWith(".pdf")).sort(),["HSKKit-Activity-Cards-A4.pdf","HSKKit-Activity-Cards-US-Letter.pdf","HSKKit-Exit-Tickets-A4.pdf","HSKKit-Exit-Tickets-US-Letter.pdf","HSKKit-Homework-Answers-Rubrics.pdf","HSKKit-Student-Handouts-A4.pdf","HSKKit-Student-Handouts-US-Letter.pdf","HSKKit-Teacher-Lesson-Plans-A4.pdf","HSKKit-Teacher-Lesson-Plans-US-Letter.pdf","HSKKit-Teacher-Pack-Quick-Start.pdf"]);
 }
});

test("every paid P1 artifact manifest remains authorized for download",async()=>{
 const [font,emoji]=await Promise.all([readFile(new URL("../assets/fonts/HskKitSansSubset.ttf",import.meta.url)),readFile(new URL("../assets/fonts/HskKitEmoji.ttf",import.meta.url))]);
 for(const productId of products){const artifact=await generateDifferentiatedProductArtifact(productId,new Uint8Array(font),new Uint8Array(emoji),"p0-p1-v2",assessmentAudio,await loadAssessmentLevelAudio());assert.equal(manifestStillAuthorized(JSON.stringify(artifact.manifest)),true,productId);}
 assert.equal(manifestStillAuthorized(JSON.stringify({schemaVersion:"hskkit-product-manifest-v1",productId:"unknown-product",sourceIndependent:true,assets:[]})),false);
 assert.equal(manifestStillAuthorized(JSON.stringify({schemaVersion:"hskkit-product-manifest-v1",productId:"practice-assessment-pack",sourceIndependent:false,assets:[]})),false);
});

test("P0 Level 8/9 PDFs are parseable, self-traceable and transparently share the unified advanced source",async()=>{
 const [font,emoji,generatorSource]=await Promise.all([readFile(new URL("../assets/fonts/HskKitSansSubset.ttf",import.meta.url)),readFile(new URL("../assets/fonts/HskKitEmoji.ttf",import.meta.url)),readFile(new URL("../src/lib/commercial/generator.ts",import.meta.url),"utf8")]);
 const seven=selectPackAssets(7);assert.match(generatorSource,/Per-asset manifest/);assert.match(generatorSource,/Full per-asset source, version and license references follow in this PDF/);
 for(const level of [8,9]){const selection=selectPackAssets(level);assert.deepEqual(selection.words.map(word=>word.id),seven.words.map(word=>word.id));const manifest=buildPackManifest(selection,"p0-p1-quality");assert.equal(manifest.standardVersion,"GF0025-2021");const bytes=await generatePackPdf(selection,manifest,new Uint8Array(font),new Uint8Array(emoji));assert.ok(bytes.byteLength>10_000);const pdf=await PDFDocument.load(bytes);assert.ok(pdf.getPageCount()>5);assert.match(pdf.getTitle()??"",new RegExp(`Level ${level}`));}
});
