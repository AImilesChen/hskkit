import fontkit from "@pdf-lib/fontkit";
import {PDFDocument,rgb,type PDFFont,type PDFPage} from "pdf-lib";
import {selectPackAssets} from "./catalog.ts";
import {generateZipFiles} from "./generator.ts";
import {digitalProduct,type DigitalProduct,type DigitalProductId} from "./products.ts";

const encoder=new TextEncoder();
export type ProductArtifactManifest={schemaVersion:string;productId:string;generationVersion:string;standard:"HSK 3.0";standardVersion:"GF0025-2021";officialExam:false;levels:number[];advancedBandDisclosure:string;licenseNotice:string;files:string[];sourceIndependent:boolean;assets:Array<{id:string;version:string;sourceRef:string;licenseRef:string}>};
function mockWords(selection:ReturnType<typeof selectPackAssets>){const seenHanzi=new Set<string>(),seenMeaning=new Set<string>();return selection.words.filter(word=>{const hanzi=word.hanzi.trim(),meaning=word.meaning.trim().toLowerCase();if(seenHanzi.has(hanzi)||seenMeaning.has(meaning))return false;seenHanzi.add(hanzi);seenMeaning.add(meaning);return true;}).slice(0,20);}
function sourceWords(selection:ReturnType<typeof selectPackAssets>,wordCount:number,exerciseCount:number){const ids=new Set(selection.words.slice(0,wordCount).map(word=>word.id));for(const exercise of selection.exercises.slice(0,exerciseCount))ids.add(exercise.sourceAssetId);return selection.words.filter(word=>ids.has(word.id));}
function productAssets(product:DigitalProduct,selections:ReturnType<typeof selectPackAssets>[]){
  const selected=product.id==="assessment-tracker"?selections.flatMap(selection=>selection.words):product.id==="worksheet-pack"?selections.flatMap(selection=>sourceWords(selection,12,6)):product.id==="mock-exam-pack"?selections.flatMap(mockWords):product.id==="teacher-lesson-plan-pack"?selections.flatMap(selection=>sourceWords(selection,1,1)):[];
  const unique=new Map<string,{id:string;version:string;sourceRef:string;licenseRef:string}>();for(const asset of selected)unique.set(`${asset.id}:${asset.version}`,{id:asset.id,version:asset.version,sourceRef:asset.sourceRef,licenseRef:asset.licenseRef});return [...unique.values()];
}
function manifestFor(product:DigitalProduct,files:string[],selections:ReturnType<typeof selectPackAssets>[],generationVersion:string):ProductArtifactManifest{return {schemaVersion:"hskkit-product-manifest-v1",productId:product.id,generationVersion,standard:"HSK 3.0",standardVersion:"GF0025-2021",officialExam:false,levels:product.levels,advancedBandDisclosure:"HSK 3.0 defines one unified Levels 7–9 advanced ability band; Level 7, 8 and 9 labels in this resource use the same canonical approved advanced source set.",licenseNotice:"Personal, non-transferable study and print use only.",files,sourceIndependent:product.id==="30-day-planner",assets:productAssets(product,selections)};}

function lines(text:string,font:PDFFont,size:number,width:number){const output:string[]=[];let current="";for(const char of text){if(char==="\n"){output.push(current);current="";continue;}const next=current+char;if(current&&font.widthOfTextAtSize(next,size)>width){output.push(current);current=char;}else current=next;}if(current)output.push(current);return output;}
async function makePdf(title:string,subtitle:string,sections:Array<{heading:string;body:string[]}>,fontBytes:Uint8Array){
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(fontBytes,{subset:false});
  pdf.setTitle(title);pdf.setAuthor("HSKKit");pdf.setSubject("HSK 3.0 unofficial learning resource");pdf.setKeywords(["HSK 3.0","unofficial","HSKKit"]);
  const size:[number,number]=[595.28,841.89];let page:PDFPage;let y=0;
  const fresh=()=>{page=pdf.addPage(size);page.drawRectangle({x:0,y:812,width:595.28,height:30,color:rgb(.06,.35,.32)});page.drawText("HSKKit · HSK 3.0 · Unofficial learning resource",{x:32,y:822,size:9,font,color:rgb(1,1,1)});y=785;};
  fresh();page!.drawText(title,{x:36,y,size:22,font,color:rgb(.06,.35,.32)});y-=32;for(const line of lines(subtitle,font,9,520)){page!.drawText(line,{x:36,y,size:9,font,color:rgb(.25,.3,.38)});y-=13;}for(const line of lines("Advanced-band disclosure: HSK 3.0 defines one unified Levels 7–9 band; Level 7/8/9 labels use the same canonical approved source set.",font,8,520)){page!.drawText(line,{x:36,y,size:8,font,color:rgb(.45,.28,.08)});y-=12;}y-=12;
  for(const section of sections){if(y<100)fresh();page!.drawText(section.heading,{x:36,y,size:14,font,color:rgb(.06,.35,.32)});y-=22;for(const item of section.body){for(const line of lines(item,font,9,510)){if(y<55)fresh();page!.drawText(line,{x:44,y,size:9,font,color:rgb(.12,.16,.24)});y-=13;}y-=5;}y-=10;}
  return new Uint8Array(await pdf.save({useObjectStreams:false}));
}
const zip=(files:Array<{name:string;data:Uint8Array}>,manifest:ProductArtifactManifest)=>generateZipFiles([...files,{name:"manifest.json",data:encoder.encode(JSON.stringify(manifest,null,2))},{name:"README.txt",data:encoder.encode("HSKKit HSK 3.0 unofficial learning resource. Personal, non-transferable study and print use only. Audio is not included.\n")}]);

export async function generateDifferentiatedProductArtifact(productId:DigitalProductId|string,fontBytes:Uint8Array,_emojiFontBytes:Uint8Array,generationVersion="p0-p1-v1"){
  const product=digitalProduct(productId);if(!product||product.category!=="resource")throw new Error("INVALID_DIFFERENTIATED_PRODUCT");
  const selections=[1,2,3,4,5,6,7,8,9].map(selectPackAssets);
  if(product.id==="30-day-planner"){
    const body=Array.from({length:30},(_,i)=>`Day ${i+1}: Level goal ____ · vocabulary reviewed ____ · listening/reading/writing task ____ · minutes ____ · reflection ____________________`);
    const manifest=manifestFor(product,["HSKKit-30-Day-Planner.pdf"],selections,generationVersion);const bytes=await makePdf(product.name,"A printable 30-day plan. Set one realistic target and review progress every seven days.",[{heading:"Goal and baseline",body:["Target HSK level: ____   Start date: ____   Daily minutes: ____","Baseline strengths: ____________________   Priority gaps: ____________________"]},{heading:"Daily practice log",body},{heading:"Weekly review",body:["Days 7 / 14 / 21 / 30: evidence of progress, missed work, next adjustment and one concrete goal."]}],fontBytes);return {bytes,format:"pdf" as const,manifest};
  }
  if(product.id==="assessment-tracker"){
    const rows=["level,source_band,source_level,word_id,hanzi,pinyin,meaning,recognition_0_2,recall_0_2,usage_0_2,last_checked,next_review,notes"];
    for(const selection of selections)for(const word of selection.words)rows.push([selection.level,selection.level>=7?"unified-levels-7-9":"level-specific",selection.level>=7?7:selection.level,word.id,word.hanzi,word.pinyin,word.meaning,"","","","","",""].map(value=>`"${String(value).replaceAll('"','""')}"`).join(","));
    const pdf=await makePdf("HSK Assessment Tracker","Use the CSV in spreadsheet software. Score recognition, recall and usage from 0–2; record evidence, not impressions.",selections.map(selection=>({heading:`Level ${selection.level} checkpoint`,body:["Date: ____   Learner/group: ____   Words sampled: ____","Recognition: ____ / ____   Recall: ____ / ____   Usage: ____ / ____","Evidence and next teaching action: __________________________________________"]})),fontBytes);
    const files=[{name:"HSKKit-Assessment-Tracker.csv",data:encoder.encode(rows.join("\r\n"))},{name:"HSKKit-Printable-Assessment-Record.pdf",data:pdf}];const manifest=manifestFor(product,files.map(f=>f.name),selections,generationVersion);return {bytes:zip(files,manifest),format:"zip" as const,manifest};
  }
  if(product.id==="worksheet-pack"){
    const student=await makePdf("HSK Worksheet Pack · Student","Printable practice using authorized HSKKit vocabulary. Write on a separate page when more space is needed.",selections.map(selection=>({heading:`Level ${selection.level}`,body:[...selection.words.slice(0,12).map((word,index)=>`${index+1}. ${word.hanzi} (${word.pinyin}) — write the meaning and one original sentence: ____________________`),...selection.exercises.slice(0,6).map(exercise=>`${exercise.id}. ${exercise.prompt}`)]})),fontBytes);
    const answers=await makePdf("HSK Worksheet Pack · Answer key","Model answers support review; original-sentence responses may vary.",selections.map(selection=>({heading:`Level ${selection.level}`,body:[...selection.words.slice(0,12).map(word=>`${word.hanzi} (${word.pinyin}): ${word.meaning}`),...selection.exercises.slice(0,6).map(exercise=>`${exercise.id}: ${exercise.answer}`)]})),fontBytes);
    const files=[{name:"HSKKit-Worksheets-Student.pdf",data:student},{name:"HSKKit-Worksheets-Answer-Key.pdf",data:answers}];const manifest=manifestFor(product,files.map(f=>f.name),selections,generationVersion);return {bytes:zip(files,manifest),format:"zip" as const,manifest};
  }
  if(product.id==="mock-exam-pack"){
    const studentSections=selections.flatMap(selection=>{const words=mockWords(selection);const minutes=selection.level<=2?35:selection.level<=4?50:selection.level<=6?65:80;return [
      {heading:`Level ${selection.level} · blueprint (${minutes} minutes)`,body:["Listening simulation: 5 items / 10 points · Reading: 10 items / 10 points · Writing: 5 items / 10 points · Total: 30 points.","For listening, a facilitator reads each numbered script twice. Do not open the facilitator script while taking the paper."]},
      {heading:`Level ${selection.level} · Listening simulation`,body:words.slice(0,5).map((word,index)=>{const distractors=[words[(index+1)%words.length].meaning,words[(index+2)%words.length].meaning];const correct=index%3;const options=correct===0?[word.meaning,...distractors]:correct===1?[distractors[0],word.meaning,distractors[1]]:[...distractors,word.meaning];return `${index+1}. Choose the meaning of the word you hear: A. ${options[0]}  B. ${options[1]}  C. ${options[2]}`;})},
      {heading:`Level ${selection.level} · Reading`,body:words.slice(5,15).map((word,index)=>`${index+1}. Match ${word.hanzi} (${word.pinyin}) to its meaning: ____________________`)},
      {heading:`Level ${selection.level} · Writing`,body:words.slice(15,20).map((word,index)=>`${index+1}. Write the English meaning of ${word.hanzi} (${word.pinyin}), then use the word in one accurate sentence.`)},
    ];});
    const answerSections=selections.flatMap(selection=>{const words=mockWords(selection);return [
      {heading:`Level ${selection.level} · Listening answers`,body:words.slice(0,5).map((word,index)=>`${index+1}. ${["A","B","C"][index%3]} — ${word.hanzi}: ${word.meaning}`)},
      {heading:`Level ${selection.level} · Reading answers`,body:words.slice(5,15).map((word,index)=>`${index+1}. ${word.meaning}`)},
      {heading:`Level ${selection.level} · Writing rubric`,body:["Award 2 points: target word is semantically accurate and sentence is complete; 1 point: meaning is recognizable with a minor language error; 0 points: incorrect meaning, missing target word, or no response."]},
    ];});
    const scriptSections=selections.map(selection=>({heading:`Level ${selection.level} · Listening script`,body:mockWords(selection).slice(0,5).map((word,index)=>`${index+1}. Read twice at a natural pace: ${word.hanzi} (${word.pinyin}).`)}));
    const student=await makePdf("HSK Mock Exam Pack · Student paper","Unofficial diagnostic practice, not an official HSK examination. Each level has a timed blueprint and listening simulation, reading and writing sections.",studentSections,fontBytes);
    const answers=await makePdf("HSK Mock Exam Pack · Answers and rubric","Use the objective answer key and the stated writing rubric. Scores are diagnostic and are not official HSK scores.",answerSections,fontBytes);
    const script=await makePdf("HSK Mock Exam Pack · Facilitator script","Keep this file separate from the student paper. Read each listening item twice at a natural pace.",scriptSections,fontBytes);
    const files=[{name:"HSKKit-Mock-Exam-Student.pdf",data:student},{name:"HSKKit-Mock-Exam-Facilitator-Script.pdf",data:script},{name:"HSKKit-Mock-Exam-Answers-Rubric.pdf",data:answers}];const manifest=manifestFor(product,files.map(f=>f.name),selections,generationVersion);return {bytes:zip(files,manifest),format:"zip" as const,manifest};
  }
  const durations=[45,60,90];const files:Array<{name:string;data:Uint8Array}>=[];
  for(const duration of durations){const pdf=await makePdf(`HSK Teacher Lesson Plan · ${duration} minutes`,`Reusable HSK 3.0 template. Adapt pace and support to learner evidence.`,selections.map(selection=>({heading:`Level ${selection.level}`,body:[`Objective: learners recognize, recall and use selected Level ${selection.level} vocabulary.`,`Warm-up ____ min · input/model ____ min · guided practice ____ min · independent check ____ min · exit ticket ____ min.`,`Differentiation: pinyin/scaffold __________ · extension __________ · accessibility/support __________`,`Homework and next assessment evidence: __________________________________________`]})),fontBytes);files.push({name:`HSKKit-Lesson-Plan-${duration}-Minutes.pdf`,data:pdf});}
  const manifest=manifestFor(product,files.map(f=>f.name),selections,generationVersion);return {bytes:zip(files,manifest),format:"zip" as const,manifest};
}
