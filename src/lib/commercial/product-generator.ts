import fontkit from "@pdf-lib/fontkit";
import {PDFDocument,rgb,type PDFFont,type PDFPage} from "pdf-lib";
import {selectPackAssets} from "./catalog.ts";
import {generateZipFiles} from "./generator.ts";
import {digitalProduct,type DigitalProduct,type DigitalProductId} from "./products.ts";

const encoder=new TextEncoder();
export type ProductArtifactManifest={schemaVersion:string;productId:string;generationVersion:string;standard:"HSK 3.0";standardVersion:"GF0025-2021";officialExam:false;levels:number[];advancedBandDisclosure:string;licenseNotice:string;files:string[];sourceIndependent:boolean;assets:Array<{id:string;version:string;sourceRef:string;licenseRef:string}>};
type Selection=ReturnType<typeof selectPackAssets>;
type PdfSection={heading:string;body:string[]};

function mockWords(selection:Selection,variant=0){
  const seenHanzi=new Set<string>(),seenMeaning=new Set<string>();
  const start=variant*40,candidates=[...selection.words.slice(start),...selection.words.slice(0,start)];
  return candidates.filter(word=>{const hanzi=word.hanzi.trim(),meaning=word.meaning.trim().toLowerCase();if(seenHanzi.has(hanzi)||seenMeaning.has(meaning))return false;seenHanzi.add(hanzi);seenMeaning.add(meaning);return true;}).slice(0,20);
}
function sourceWords(selection:Selection,wordCount:number,exerciseCount:number){
  const ids=new Set(selection.words.slice(0,wordCount).map(word=>word.id));
  for(const exercise of selection.exercises.slice(0,exerciseCount))ids.add(exercise.sourceAssetId);
  return selection.words.filter(word=>ids.has(word.id));
}
function productAssets(product:DigitalProduct,selections:Selection[]){
  const selected=product.id==="assessment-tracker"?selections.flatMap(selection=>selection.words)
    :product.id==="worksheet-pack"?selections.flatMap(selection=>sourceWords(selection,12,6))
    :product.id==="mock-exam-pack"?selections.flatMap(selection=>[0,1,2].flatMap(variant=>mockWords(selection,variant)))
    :product.id==="teacher-lesson-plan-pack"?selections.flatMap(selection=>sourceWords(selection,6,3)):[];
  const unique=new Map<string,{id:string;version:string;sourceRef:string;licenseRef:string}>();
  for(const asset of selected)unique.set(`${asset.id}:${asset.version}`,{id:asset.id,version:asset.version,sourceRef:asset.sourceRef,licenseRef:asset.licenseRef});
  return [...unique.values()];
}
function manifestFor(product:DigitalProduct,files:string[],selections:Selection[],generationVersion:string):ProductArtifactManifest{
  return {schemaVersion:"hskkit-product-manifest-v1",productId:product.id,generationVersion,standard:"HSK 3.0",standardVersion:"GF0025-2021",officialExam:false,levels:product.levels,advancedBandDisclosure:"HSK 3.0 defines one unified Levels 7–9 advanced ability band; Level 7, 8 and 9 labels in this resource use the same canonical approved advanced source set.",licenseNotice:"Personal, non-transferable study and print use only.",files,sourceIndependent:product.id==="30-day-planner",assets:productAssets(product,selections)};
}

function lines(text:string,font:PDFFont,size:number,width:number){
  const output:string[]=[];let current="";
  for(const char of text){if(char==="\n"){output.push(current);current="";continue;}const next=current+char;if(current&&font.widthOfTextAtSize(next,size)>width){output.push(current);current=char;}else current=next;}
  if(current)output.push(current);return output;
}
async function makePdf(title:string,subtitle:string,sections:PdfSection[],fontBytes:Uint8Array){
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(fontBytes,{subset:false});
  pdf.setTitle(title);pdf.setAuthor("HSKKit");pdf.setSubject("HSK 3.0 unofficial learning resource");pdf.setKeywords(["HSK 3.0","unofficial","HSKKit"]);
  const size:[number,number]=[595.28,841.89];let page:PDFPage;let y=0;let pageNumber=0;
  const fresh=()=>{page=pdf.addPage(size);pageNumber+=1;page.drawRectangle({x:0,y:812,width:595.28,height:30,color:rgb(.04,.31,.29)});page.drawText("HSKKit · HSK 3.0 · Unofficial learning resource",{x:32,y:822,size:9,font,color:rgb(1,1,1)});page.drawText(String(pageNumber),{x:540,y:26,size:8,font,color:rgb(.45,.5,.56)});y=785;};
  fresh();page!.drawText(title,{x:36,y,size:22,font,color:rgb(.04,.31,.29)});y-=32;
  for(const line of lines(subtitle,font,9,520)){page!.drawText(line,{x:36,y,size:9,font,color:rgb(.25,.3,.38)});y-=13;}
  for(const line of lines("Advanced-band disclosure: HSK 3.0 defines one unified Levels 7–9 band; Level 7/8/9 labels use the same canonical approved source set.",font,8,520)){page!.drawText(line,{x:36,y,size:8,font,color:rgb(.45,.28,.08)});y-=12;}y-=12;
  for(const section of sections){if(y<112)fresh();page!.drawText(section.heading,{x:36,y,size:14,font,color:rgb(.04,.31,.29)});y-=22;for(const item of section.body){for(const line of lines(item,font,9,510)){if(y<58)fresh();page!.drawText(line,{x:44,y,size:9,font,color:rgb(.12,.16,.24)});y-=13;}y-=5;}y-=10;}
  return new Uint8Array(await pdf.save({useObjectStreams:false}));
}
function readme(product:DigitalProduct,files:string[]){return encoder.encode([`${product.name} · HSKKit`,``,`How to use`,`1. Read the Quick Start or guide file before opening the working files.`,`2. Choose one HSK level and one evidence-based goal.`,`3. Complete work before checking answers or rubrics.`,`4. Record the next review action after each session.`,``,`Included files`,...files.map(name=>`- ${name}`),``,`Important`,`This is an unofficial HSK 3.0 learning resource, not an official examination product.`,`Audio is not included. Levels 7–9 use one unified canonical advanced source set.`,`Licensed for personal, non-transferable study and print use only.`].join("\n"));}
function packageZip(product:DigitalProduct,files:Array<{name:string;data:Uint8Array}>,manifest:ProductArtifactManifest){return generateZipFiles([...files,{name:"manifest.json",data:encoder.encode(JSON.stringify(manifest,null,2))},{name:"README.txt",data:readme(product,files.map(file=>file.name))}]);}

function worksheetSections(selection:Selection):PdfSection[]{
  const words=selection.words.slice(0,12),exercises=selection.exercises.slice(0,6);
  return [
    {heading:`Level ${selection.level} · Recognize and retrieve`,body:words.slice(0,6).map((word,index)=>`${index+1}. ${word.hanzi} (${word.pinyin}) · cover the meaning, retrieve it, then write: ____________________`)},
    {heading:`Level ${selection.level} · Meaning to use`,body:words.slice(6,12).map((word,index)=>`${index+1}. ${word.hanzi} (${word.pinyin}) · English meaning: __________ · one accurate sentence: ______________________________`)},
    {heading:`Level ${selection.level} · Guided practice`,body:exercises.map((exercise,index)=>`${index+1}. ${exercise.prompt}  Response: ______________________________________________`)},
    {heading:`Level ${selection.level} · Checkpoint`,body:["Without looking back, write four target words and their meanings.","Read two target words aloud, then use each in a complete sentence.","Circle one result: secure / needs one review / needs guided help. Next review date: __________"]}
  ];
}
function worksheetAnswerSections(selection:Selection):PdfSection[]{
  const words=selection.words.slice(0,12),exercises=selection.exercises.slice(0,6);
  return [{heading:`Level ${selection.level} · Vocabulary key`,body:words.map(word=>`${word.hanzi} (${word.pinyin}): ${word.meaning}`)},{heading:`Level ${selection.level} · Guided-practice key`,body:exercises.map((exercise,index)=>`${index+1}. ${exercise.answer}`)},{heading:`Level ${selection.level} · Open-response review`,body:["Original sentences vary. Accept only a complete response that uses the target word with the listed meaning.","If meaning is accurate but the sentence has a minor language error, revise and repeat once before marking secure."]}];
}

function rotatedWords(selection:Selection,variant:number){return mockWords(selection,variant);}
function choice(word:{meaning:string},words:Array<{meaning:string}>,index:number,variant:number){const correct=(index+variant)%3;const distractors=[words[(index+6)%words.length].meaning,words[(index+11)%words.length].meaning];const options=correct===0?[word.meaning,...distractors]:correct===1?[distractors[0],word.meaning,distractors[1]]:[...distractors,word.meaning];return {correct,options};}
function assessmentStudentSections(selection:Selection,variant:number):PdfSection[]{
  const words=rotatedWords(selection,variant),label=["A","B","C"][variant],minutes=selection.level<=2?35:selection.level<=4?50:selection.level<=6?65:80;
  return [
    {heading:`Form ${label} · Level ${selection.level} · Instructions`,body:[`Suggested time: ${minutes} minutes. Total: 30 diagnostic points.`,`Listening simulation: 5 items / 10 points. Reading: 10 items / 10 points. Writing: 5 items / 10 points.`,`Have a facilitator read the separate script twice. This is level-aligned practice, not an official HSK exam.`]},
    {heading:`Form ${label} · Level ${selection.level} · Listening simulation`,body:words.slice(0,5).map((word,index)=>{const item=choice(word,words,index,variant);return `${index+1}. Choose the meaning of the word you hear: A. ${item.options[0]}  B. ${item.options[1]}  C. ${item.options[2]}`;})},
    {heading:`Form ${label} · Level ${selection.level} · Reading`,body:words.slice(5,15).map((word,index)=>`${index+1}. Match ${word.hanzi} (${word.pinyin}) to its English meaning: ______________________________`)},
    {heading:`Form ${label} · Level ${selection.level} · Writing`,body:words.slice(15,20).map((word,index)=>`${index+1}. Write the English meaning of ${word.hanzi} (${word.pinyin}), then use it in one accurate sentence.`)}
  ];
}
function assessmentAnswerSections(selection:Selection,variant:number):PdfSection[]{
  const words=rotatedWords(selection,variant),label=["A","B","C"][variant];
  return [
    {heading:`Form ${label} · Level ${selection.level} · Listening answers`,body:words.slice(0,5).map((word,index)=>`${index+1}. ${["A","B","C"][choice(word,words,index,variant).correct]} · ${word.hanzi}: ${word.meaning}`)},
    {heading:`Form ${label} · Level ${selection.level} · Reading answers`,body:words.slice(5,15).map((word,index)=>`${index+1}. ${word.hanzi}: ${word.meaning}`)},
    {heading:`Form ${label} · Level ${selection.level} · Writing rubric`,body:["2 points: accurate meaning and a complete sentence using the target word accurately.","1 point: recognizable meaning with one minor language or usage error.","0 points: incorrect meaning, missing target word, or no response.","Diagnostic action: review the lowest-scoring skill before taking the next form."]}
  ];
}

function lessonSections(selection:Selection,duration:number):PdfSection[]{
  const words=selection.words.slice(0,6),exercises=selection.exercises.slice(0,3);const independent=duration===45?8:duration===60?12:20;
  return [
    {heading:`Level ${selection.level} · ${duration}-minute lesson · Outcome`,body:[`Learners will recognize, retrieve and accurately use: ${words.map(word=>word.hanzi).join("、")}.`,`Evidence: at least four accurate meaning recalls and two complete original uses before the exit ticket.`,`Materials: this plan, a board or shared page, and six learner response slips.`]},
    {heading:"Teacher model and guided noticing",body:words.map(word=>`${word.hanzi} (${word.pinyin}) · ${word.meaning} · teacher gives one contextual example; learners identify the meaning cue.`)},
    {heading:"Guided practice",body:exercises.map((exercise,index)=>`${index+1}. Prompt: ${exercise.prompt} · check: ${exercise.answer}`)},
    {heading:"Independent check and differentiation",body:[`Independent check: ${independent} minutes. Learners retrieve four meanings and produce two sentences without the model.`,`Scaffold: show pinyin plus a choice of two meanings; remove the choice on the second attempt.`,`Extension: connect two target words in one coherent response and explain the context.`,`Accessibility: allow oral response before writing; record whether support was required.`]},
    {heading:"Exit evidence and follow-up",body:["Exit ticket: one meaning from memory, one accurate sentence, and one confidence rating with evidence.","If fewer than four meanings are secure, assign retrieval review. If meanings are secure but use is weak, assign sentence revision.","Next lesson: begin with the two least-secure items before adding new vocabulary."]}
  ];
}

export async function generateDifferentiatedProductArtifact(productId:DigitalProductId|string,fontBytes:Uint8Array,_emojiFontBytes:Uint8Array,generationVersion="p0-p1-v2"){
  const product=digitalProduct(productId);if(!product||product.category!=="resource")throw new Error("INVALID_DIFFERENTIATED_PRODUCT");
  const selections=[1,2,3,4,5,6,7,8,9].map(selectPackAssets);
  if(product.id==="30-day-planner"){
    const sections:PdfSection[]=[{heading:"Set the target and baseline",body:["Target HSK level: ____   Start date: ____   End date: ____","Choose one route: 20 minutes / 30 minutes / 45 minutes. Keep the same route for seven days before increasing it.","Baseline evidence: words retrieved ____ / 20 · reading items accurate ____ / 10 · sentences accurate ____ / 5","Priority gap: recognition / recall / listening / reading / writing. One measurable Day 30 goal: ____________________"]}];
    for(let day=1;day<=30;day++){
      const phase=day<=7?"Build":day<=14?"Retrieve":day<=21?"Use":day<=28?"Integrate":"Check";
      const task=day%4===1?"Select 8 target words. Read each in context, cover the meaning, and retrieve it twice.":day%4===2?"Review yesterday’s 8 words, then write or say four complete sentences using four different targets.":day%4===3?"Complete one listening-or-reading input block. Record five words you recognized and two you missed.":"Run a closed-book retrieval check on 12 recent words. Rework only the missed items.";
      sections.push({heading:`Day ${day} · ${phase}`,body:[`Core task: ${task}`,"20 min: core task once + 3-minute retrieval check.","30 min: core task + one short reading/listening block + retrieval check.","45 min: core task + input block + six-sentence or two-minute speaking output + retrieval check.","Evidence: words secure ____ · skill items accurate ____ · output completed yes / no · next review: __________"]});
      if([7,14,21,28].includes(day))sections.push({heading:`Day ${day} · Weekly evidence review`,body:["Best evidence of progress: ______________________________________________","Missed or weak work: _________________________________________________","Recovery rule: keep tomorrow’s date; move only unfinished retrieval work; reduce intensity for two days if needed.","One change for the next seven days: _____________________________________"]});
    }
    sections.push({heading:"Day 30 · Final checkpoint and next cycle",body:["Repeat the baseline measures with a fresh sample: words ____ / 20 · reading ____ / 10 · sentences ____ / 5.","Compare evidence, not confidence alone. Strongest gain: __________  Remaining gap: __________","Choose: consolidate this level for 14 days / continue another 30-day cycle / move to the next level after a separate readiness check."]});
    const files=["HSKKit-30-Day-Planner.pdf"],manifest=manifestFor(product,files,selections,generationVersion);const bytes=await makePdf(product.name,"A task-based plan with 20, 30 and 45-minute routes, spaced retrieval, weekly evidence reviews and a missed-day recovery rule.",sections,fontBytes);return {bytes,format:"pdf" as const,manifest};
  }
  if(product.id==="assessment-tracker"){
    const rows=["level,source_band,source_level,word_id,hanzi,pinyin,meaning,recognition_0_2,recall_0_2,usage_0_2,last_checked,next_review,evidence,notes"];
    for(const selection of selections)for(const word of selection.words)rows.push([selection.level,selection.level>=7?"unified-levels-7-9":"level-specific",selection.level>=7?7:selection.level,word.id,word.hanzi,word.pinyin,word.meaning,"","","","","","",""].map(value=>`"${String(value).replaceAll('"','""')}"`).join(","));
    const weekly=["week_start,target_level,words_sampled,recognition_percent,recall_percent,usage_percent,strongest_evidence,weakest_evidence,next_action,next_review_date",...Array.from({length:12},()=>",,,,,,,,,")];
    const guide=await makePdf("HSK Assessment Tracker · Dashboard Guide","A spreadsheet-neutral scoring and review guide. Use the included UTF-8 CSV files in Excel, Numbers, LibreOffice or Google Sheets.",selections.map(selection=>({heading:`Level ${selection.level} · Evidence rules`,body:["Recognition 0: not recognized · 1: recognized with cue · 2: recognized independently.","Recall 0: no meaning retrieved · 1: partial/slow meaning · 2: accurate meaning without cue.","Usage 0: no accurate use · 1: meaning clear with a minor error · 2: complete accurate use.","Dashboard method: filter this level, average each score column, identify the lowest average, and set next_review from observed evidence."]})),fontBytes);
    const printableSections=selections.flatMap(selection=>[
      {
        heading:`Level ${selection.level} · Checkpoint`,
        body:[
          "Date: ____   Learner/group: ____   Words sampled: ____",
          "Recognition total: ____ / ____   Recall total: ____ / ____   Usage total: ____ / ____",
          "Three secure items: ____________________  Three review items: ____________________",
          "Observed evidence: __________________________________________________________",
          "Next action and date: ________________________________________________________",
        ],
      },
      {
        heading:`Level ${selection.level} · Weekly follow-through`,
        body:[
          "Week start: ____   Planned review: ____   Completed: ____",
          "What changed in recognition / recall / usage: _________________________________",
          "Keep / change / remove this review action: ____________________________________",
        ],
      },
    ]);
    const printable=await makePdf("HSK Assessment Tracker · Printable Record","Use one checkpoint page per level. Sample words across the level and record evidence before choosing the next action.",printableSections,fontBytes);
    const files=[{name:"HSKKit-Assessment-Tracker.csv",data:encoder.encode(rows.join("\r\n"))},{name:"HSKKit-Weekly-Review.csv",data:encoder.encode(weekly.join("\r\n"))},{name:"HSKKit-Assessment-Dashboard-Guide.pdf",data:guide},{name:"HSKKit-Printable-Assessment-Record.pdf",data:printable}];
    const manifest=manifestFor(product,files.map(file=>file.name),selections,generationVersion);return {bytes:packageZip(product,files,manifest),format:"zip" as const,manifest};
  }
  if(product.id==="worksheet-pack"){
    const quickStart=await makePdf("HSK Worksheet Pack · Quick Start","A focused 20–35 minute workflow for using the student workbook, answer key and progress checklist without passive copying.",selections.map(selection=>({heading:`Level ${selection.level} · One-session flow`,body:["1. Retrieval (5 min): cover meanings and retrieve six target words.","2. Guided work (10–20 min): complete one recognition block and the linked practice items.","3. Output (5 min): produce two complete sentences without copying a model.","4. Check (5 min): use the separate key, revise errors once, and set a next-review date."]})),fontBytes);
    const student=await makePdf("HSK Worksheet Pack · Student Workbook","Print or annotate digitally. Complete retrieval and guided practice before opening the separate answer key.",selections.flatMap(worksheetSections),fontBytes);
    const answers=await makePdf("HSK Worksheet Pack · Answer Key","Objective answers and model guidance are separated from the student workbook. Original sentence responses may vary.",selections.flatMap(worksheetAnswerSections),fontBytes);
    const checklistSections=selections.flatMap(selection=>[
      {
        heading:`Level ${selection.level} · Practice record`,
        body:[
          "Session date ____ · recognition block complete yes / no · guided practice complete yes / no",
          "Objective items correct ____ / ____ · revised errors ____ · original sentences accurate ____ / 2",
          "Evidence rating: secure / review once / guided help needed · next review date: ____",
        ],
      },
      {
        heading:`Level ${selection.level} · Exit check`,
        body:[
          "I can retrieve at least 4 of 6 sampled meanings without cues: yes / not yet.",
          "I can use two sampled words accurately in complete responses: yes / not yet.",
          "The next block I will complete: ______________________________________________",
        ],
      },
    ]);
    const checklist=await makePdf("HSK Worksheet Pack · Progress Checklist","Mark secure only when you can retrieve meaning and use without looking. A confidence rating alone is not evidence.",checklistSections,fontBytes);
    const files=[{name:"HSKKit-Worksheet-Quick-Start.pdf",data:quickStart},{name:"HSKKit-Worksheets-Student.pdf",data:student},{name:"HSKKit-Worksheets-Answer-Key.pdf",data:answers},{name:"HSKKit-Worksheet-Progress-Checklist.pdf",data:checklist}];const manifest=manifestFor(product,files.map(file=>file.name),selections,generationVersion);return {bytes:packageZip(product,files,manifest),format:"zip" as const,manifest};
  }
  if(product.id==="mock-exam-pack"){
    const studentFiles:Array<{name:string;data:Uint8Array}>=[];
    for(let variant=0;variant<3;variant++)studentFiles.push({name:`HSKKit-Practice-Assessment-${["A","B","C"][variant]}-Student.pdf`,data:await makePdf(`HSK Level-Aligned Practice Assessment · Form ${["A","B","C"][variant]}`,"Original diagnostic practice for Levels 1–9. This is not an official HSK examination and does not claim an official exam blueprint or score.",selections.flatMap(selection=>assessmentStudentSections(selection,variant)),fontBytes)});
    const answers=await makePdf("HSK Level-Aligned Practice Assessment · Answers and Rubrics","Use after a form is complete. Scores identify a review priority; they are not official HSK scores.",selections.flatMap(selection=>[0,1,2].flatMap(variant=>assessmentAnswerSections(selection,variant))),fontBytes);
    const scripts=await makePdf("HSK Level-Aligned Practice Assessment · Facilitator Scripts","Keep separate from student forms. Read each target twice at a natural pace with no additional definition or cue.",selections.flatMap(selection=>[0,1,2].map(variant=>({heading:`Form ${["A","B","C"][variant]} · Level ${selection.level}`,body:rotatedWords(selection,variant).slice(0,5).map((word,index)=>`${index+1}. Read twice: ${word.hanzi} (${word.pinyin}).`)}))),fontBytes);
    const scoreRows=["form,level,date,listening_0_10,reading_0_10,writing_0_10,total_0_30,weakest_skill,next_review_action",...(["A","B","C"] as const).flatMap(form=>selections.map(selection=>`${form},${selection.level},,,,,,,`))];
    const files=[...studentFiles,{name:"HSKKit-Practice-Assessment-Answers-Rubrics.pdf",data:answers},{name:"HSKKit-Practice-Assessment-Facilitator-Scripts.pdf",data:scripts},{name:"HSKKit-Practice-Assessment-Score-Tracker.csv",data:encoder.encode(scoreRows.join("\r\n"))}];const manifest=manifestFor(product,files.map(file=>file.name),selections,generationVersion);return {bytes:packageZip(product,files,manifest),format:"zip" as const,manifest};
  }
  const quickStart=await makePdf("HSK Teacher Lesson Plan Pack · Quick Start","Choose one target level, one duration and one evidence goal. These are sequenced teaching plans, not blank timing templates.",selections.flatMap(selection=>[{heading:`Level ${selection.level} · Preparation`,body:[`Preview the six target words in the selected plan and prepare one contextual example for each.`,`Choose the 45, 60 or 90-minute sequence from learner readiness—not from the amount of content you hope to cover.`,`Print one exit ticket per learner and decide what evidence will trigger retrieval homework versus sentence-use homework.`]},{heading:`Level ${selection.level} · After class`,body:["Record which words needed cues, which were retrieved, and which were used accurately.","Assign the included homework path from observed evidence, then begin the next lesson with the two least-secure items."]}]),fontBytes);
  const lessonFiles:Array<{name:string;data:Uint8Array}>=[];
  for(const duration of [45,60,90])lessonFiles.push({name:`HSKKit-Lesson-Plans-${duration}-Minutes.pdf`,data:await makePdf(`HSK Teacher Lesson Plans · ${duration} minutes`,`Ready-to-adapt Level 1–9 sequences with target vocabulary, teacher modelling, guided practice, independent checks and evidence-based follow-up.`,selections.flatMap(selection=>lessonSections(selection,duration)),fontBytes)});
  const exits=await makePdf("HSK Teacher Lesson Plan Pack · Exit Tickets and Homework","Use one exit ticket after a lesson. Choose homework from observed need rather than assigning every task.",selections.flatMap(selection=>[{heading:`Level ${selection.level} · Exit ticket`,body:["Write or say the meaning of two target words without a cue.","Use one target word in a complete, contextually accurate response.","Circle the evidence: independent / one cue / not yet. Teacher next action: __________"]},{heading:`Level ${selection.level} · Homework paths`,body:["Retrieval path: review six target words, then record two closed-book attempts.","Usage path: revise two lesson sentences and add one new contextual response.","Input path: find or receive a short passage using two targets; underline the context cue for each."]}]),fontBytes);
  const files=[{name:"HSKKit-Teacher-Quick-Start.pdf",data:quickStart},...lessonFiles,{name:"HSKKit-Exit-Tickets-and-Homework.pdf",data:exits}];const manifest=manifestFor(product,files.map(file=>file.name),selections,generationVersion);return {bytes:packageZip(product,files,manifest),format:"zip" as const,manifest};
}
