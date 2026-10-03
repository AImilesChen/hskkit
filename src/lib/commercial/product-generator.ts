import fontkit from "@pdf-lib/fontkit";
import {PDFDocument,rgb,type PDFFont,type PDFPage} from "pdf-lib";
import {selectPackAssets} from "./catalog.ts";
import {generateZipFiles} from "./generator.ts";
import {digitalProduct,generationVersionForProduct,productLicenseNotice,type DigitalProduct,type DigitalProductId} from "./products.ts";
import {assessmentListeningScript,assessmentScenario,type AssessmentForm} from "./mock-assessment-content.ts";
import {generateAssessmentWorkbook} from "./assessment-workbook.ts";
import {buildWorksheetLevel,type WorksheetLevel} from "./worksheet-pack.ts";
import {buildPlannerPack,type PlannerPack} from "./planner-pack.ts";
import {buildTeacherLessonPack} from "./teacher-lesson-pack.ts";
import {generateTeacherLessonDocx,generateTeacherLessonPptx} from "./teacher-office.ts";
import {generatePlannerProgressWorkbook,generatePracticeAssessmentScoreWorkbook} from "./companion-workbooks.ts";
import {makeHomeworkPdf,makeStudentHandoutPdf,makeTeacherCutPdf,makeTeacherPlanPdf,makeTeacherQuickStartPdf,TEACHER_PAGE_SIZES} from "./teacher-pdf.ts";

const encoder=new TextEncoder();
export type ProductArtifactManifest={schemaVersion:string;productId:string;generationVersion:string;standard:"HSK 3.0";standardVersion:"GF0025-2021";officialExam:false;levels:number[];advancedBandDisclosure:string;licenseNotice:string;files:string[];sourceIndependent:boolean;assets:Array<{id:string;version:string;sourceRef:string;licenseRef:string}>;audioProvenance?:{provider:string;voices:Record<AssessmentForm,string>;generatedOn:string;responsePauseSeconds:number;redistributionStatus:string;sha256:Record<AssessmentForm,string>}};
const ASSESSMENT_AUDIO_SHA256:Record<AssessmentForm,string>={A:"07f5273876f407f538dd713989b93336a2a863b3bdb5b75252254b432b2bac17",B:"677b74b33bb9bf94cb535336e4fa8789fbabea900dff130a4de384c8cab1be59",C:"3f6982318c9640cef1deece19a5d13b129eafd5b63c55b40636cfd6d51bc006b"};
const ASSESSMENT_AUDIO_PROVENANCE={provider:"Piper open-source neural text-to-speech",voices:{A:"zh_CN-chaowen-medium",B:"zh_CN-chaowen-medium",C:"zh_CN-chaowen-medium"} as Record<AssessmentForm,string>,generatedOn:"2026-08-26",responsePauseSeconds:5,redistributionStatus:"Piper voice model repository: MIT; Chaowen training dataset: CC0-1.0; synthetic output generated for HSKKit with attribution and source notice included.",sha256:ASSESSMENT_AUDIO_SHA256};
async function sha256Hex(bytes:Uint8Array){const copy=new Uint8Array(bytes.byteLength);copy.set(bytes);const digest=await crypto.subtle.digest("SHA-256",copy.buffer);return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,"0")).join("");}
async function validateAssessmentAudio(audio:Partial<Record<AssessmentForm,Uint8Array>>|undefined){for(const form of ["A","B","C"] as const){const data=audio?.[form];if(!data||data.byteLength<5_000_000)throw new Error(`ASSESSMENT_AUDIO_REQUIRED_${form}`);if(await sha256Hex(data)!==ASSESSMENT_AUDIO_SHA256[form])throw new Error(`ASSESSMENT_AUDIO_UNVERIFIED_${form}`);}}
type PdfSection={heading:string;body:string[];pageBreakBefore?:boolean};
type Selection=ReturnType<typeof selectPackAssets>;
const TEACHER_LESSON_WORDS:Record<number,string[]>={
  1:["爱","爱好","常常","唱歌","读书","高兴"],2:["安全","办法","帮助","必须","不同","参加"],3:["安排","保证","标准","表达","处理","成果"],
  4:["背景","材料","采访","参与","测试","诚信"],5:["病毒","补偿","成本","成效","产业","冲突"],6:["本质","策略","差异","常规","场景","波动"],
  7:["癌症","艾滋病","安抚","安宁","保障","保质期"],8:["安定","安抚","安稳","安心","包容","保障"],9:["颁布","罢免","百分比","半信半疑","半真半假","报复"],
};
function teacherLessonSources(selections:Selection[]){return selections.map(selection=>{
  const words=TEACHER_LESSON_WORDS[selection.level].map(hanzi=>{
    const word=selection.words.find(candidate=>candidate.hanzi===hanzi);
    if(!word)throw new Error(`TEACHER_LESSON_WORD_MISSING:Level ${selection.level}:${hanzi}`);
    return word;
  });
  return {level:selection.level,words};
});}

export type MockAssessmentBlueprint={
  level:number;
  band:"foundation"|"developing"|"independent"|"advanced";
  suggestedMinutes:number;
  listening:string[];
  reading:string[];
  writing:string[];
  rubricDimensions:string[];
  recommendations:Record<"listening"|"reading"|"writing",readonly string[]>;
};

export function mockAssessmentBlueprint(level:number):MockAssessmentBlueprint{
  if(!Number.isInteger(level)||level<1||level>9)throw new Error("INVALID_ASSESSMENT_LEVEL");
  const levelRecommendations:Record<number,MockAssessmentBlueprint["recommendations"]>={
    1:{listening:["Replay short utterances and mark the stated person, time and place."],reading:["Redo direct-detail and simple matching items with the supporting words underlined."],writing:["Rewrite one 20–40-character response with one complete sentence and the required word."]},
    2:{listening:["Rebuild the two-step dialogue sequence before choosing an answer."],reading:["Redo event-order and information-matching items; explain each link aloud."],writing:["Revise the short report so both events are connected in the correct order."]},
    3:{listening:["Summarize the short passage in one sentence before answering inference items."],reading:["Redo context-cloze items and cite the sentence that fixes each blank."],writing:["Expand one response to 50–80 characters with a clear reason and result."]},
    4:{listening:["Map the changed plan across both dialogue parts, then answer reconstruction items."],reading:["Redo paragraph sequence and matching with transition words circled."],writing:["Revise cohesion by adding an explicit transition between evidence and conclusion."]},
    5:{listening:["Note the speaker stance and the evidence that supports it in the extended passage."],reading:["Redo sentence-insertion items and justify the chosen position from surrounding cohesion."],writing:["Rewrite 100–150 characters with a stated viewpoint and one cited source detail."]},
    6:{listening:["Draw the cause-to-effect chain from the multi-turn dialogue before checking options."],reading:["Redo cause-effect and cross-source items; reject options with reversed causality."],writing:["Revise the report so claim, evidence and consequence are explicit."]},
    7:{listening:["Identify register, stance and discourse structure in the extended passage."],reading:["Annotate passage structure and explain how each paragraph advances the claim."],writing:["Rewrite the weakest advanced task with precise register and two source references."]},
    8:{listening:["Track each speaker claim separately, then write the shared and conflicting points."],reading:["Redo multi-source synthesis using a two-column source-evidence matrix."],writing:["Revise 180–300 characters to integrate both sources without erasing disagreement."]},
    9:{listening:["Separate claim, counterclaim, evidence and qualification in the argument."],reading:["Redo counterargument items and rank evidence strength before selecting a conclusion."],writing:["Rewrite the argument with a defensible claim, two-source evidence, counterpoint and justified conclusion."]}
  };
  const shared={recommendations:levelRecommendations[level]};
  const byLevel:Record<number,Omit<MockAssessmentBlueprint,"level"|"recommendations">>={
    1:{band:"foundation",suggestedMinutes:35,listening:["short-utterance meaning","short-dialogue detail"],reading:["sentence-meaning","information-match","short-passage detail"],writing:["basic sentence-order","controlled sentence writing"],rubricDimensions:["task completion","word order","target vocabulary accuracy"]},
    2:{band:"foundation",suggestedMinutes:40,listening:["short-dialogue detail","everyday information-match"],reading:["context cloze","sentence-order","short-passage sequence"],writing:["sentence expansion","two-sentence message"],rubricDimensions:["task completion","sentence control","target vocabulary accuracy"]},
    3:{band:"developing",suggestedMinutes:50,listening:["short-dialogue intent","short-passage information-match"],reading:["context cloze","sentence-order","short-passage comprehension"],writing:["guided paragraph","dialogue completion"],rubricDimensions:["task completion","grammar and cohesion","target vocabulary accuracy"]},
    4:{band:"developing",suggestedMinutes:55,listening:["multi-turn dialogue purpose","short-passage inference"],reading:["paragraph cloze","information-match","short-passage main-idea"],writing:["narrative sequence","reason-and-result paragraph"],rubricDimensions:["content coverage","grammar and cohesion","vocabulary control"]},
    5:{band:"independent",suggestedMinutes:65,listening:["extended-dialogue detail","short-passage inference"],reading:["paragraph cloze","sentence-insertion","short-passage inference","information-match"],writing:["structured summary","evidence-based response"],rubricDimensions:["content coverage","organization and cohesion","language control","target vocabulary accuracy"]},
    6:{band:"independent",suggestedMinutes:70,listening:["extended-dialogue stance","extended-passage inference"],reading:["discourse cloze","sentence-insertion","author-purpose","cross-text information-match"],writing:["comparative summary","structured recommendation"],rubricDimensions:["evidence selection","organization and cohesion","precision and range","task fulfilment"]},
    7:{band:"advanced",suggestedMinutes:75,listening:["extended-discourse inference","multi-speaker synthesis"],reading:["multi-source information-match","paragraph-order","extended-passage inference","argument structure"],writing:["source synthesis","structured summary","argument response"],rubricDimensions:["content and evidence","organization and cohesion","precision and range","register and task fulfilment"]},
    8:{band:"advanced",suggestedMinutes:80,listening:["lecture-structure analysis","implicit-stance inference"],reading:["multi-source synthesis","paragraph-order","claim-evidence match","counterargument analysis"],writing:["comparative synthesis","evidence-led proposal","counterargument response"],rubricDimensions:["source integration","argument structure","precision and range","register and task fulfilment"]},
    9:{band:"advanced",suggestedMinutes:85,listening:["extended-lecture synthesis","assumption-and-implication inference"],reading:["cross-source information-match","rhetorical-structure analysis","evidence evaluation","argument synthesis"],writing:["critical source synthesis","structured summary","independent argument"],rubricDimensions:["critical evidence use","conceptual organization","precision and nuance","register and task fulfilment"]},
  };
  return {level,...byLevel[level],...shared};
}

function sourceWords(selection:Selection,wordCount:number,exerciseCount:number){
  const ids=new Set(selection.words.slice(0,wordCount).map(word=>word.id));
  for(const exercise of selection.exercises.slice(0,exerciseCount))ids.add(exercise.sourceAssetId);
  return selection.words.filter(word=>ids.has(word.id));
}
function productAssets(product:DigitalProduct,selections:Selection[]){
  const selected=product.id==="assessment-tracker"?selections.flatMap(selection=>selection.words)
    :product.id==="worksheet-pack"?selections.flatMap(selection=>sourceWords(selection,53,0))
    :product.id==="practice-assessment-pack"?[]
    :product.id==="teacher-lesson-plan-pack"?teacherLessonSources(selections).flatMap(source=>source.words):[];
  const unique=new Map<string,{id:string;version:string;sourceRef:string;licenseRef:string}>();
  for(const asset of selected)unique.set(`${asset.id}:${asset.version}`,{id:asset.id,version:asset.version,sourceRef:asset.sourceRef,licenseRef:asset.licenseRef});
  return [...unique.values()];
}
function manifestFor(product:DigitalProduct,files:string[],selections:Selection[],generationVersion:string):ProductArtifactManifest{
  return {schemaVersion:"hskkit-product-manifest-v1",productId:product.id,generationVersion,standard:"HSK 3.0",standardVersion:"GF0025-2021",officialExam:false,levels:product.levels,advancedBandDisclosure:"HSK 3.0 defines one unified Levels 7–9 advanced ability band; Level 7, 8 and 9 labels in this resource use the same canonical approved advanced source set.",licenseNotice:productLicenseNotice(product.id),files,sourceIndependent:product.id==="30-day-planner"||product.id==="practice-assessment-pack",assets:productAssets(product,selections),...(product.id==="practice-assessment-pack"?{audioProvenance:ASSESSMENT_AUDIO_PROVENANCE}:{})};
}

function lines(text:string,font:PDFFont,size:number,width:number){
  const output:string[]=[];let current="";
  for(const char of text){if(char==="\n"){output.push(current);current="";continue;}const next=current+char;if(current&&font.widthOfTextAtSize(next,size)>width){output.push(current);current=char;}else current=next;}
  if(current)output.push(current);return output;
}
function wordLines(text:string,font:PDFFont,size:number,width:number){
  const words=text.trim().split(/\s+/),output:string[]=[];let current="";
  for(const word of words){const next=current?`${current} ${word}`:word;if(font.widthOfTextAtSize(next,size)<=width){current=next;continue;}if(current)output.push(current);if(font.widthOfTextAtSize(word,size)<=width)current=word;else{const fragments=lines(word,font,size,width);output.push(...fragments.slice(0,-1));current=fragments.at(-1)??"";}}
  if(current)output.push(current);return output;
}
async function makePdf(title:string,subtitle:string,sections:PdfSection[],fontBytes:Uint8Array,pageSize:[number,number]=[595.28,841.89],compact=false){
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(new Uint8Array(fontBytes),{subset:false});
  pdf.setTitle(title);pdf.setAuthor("HSKKit");pdf.setSubject("HSK 3.0 unofficial learning resource");pdf.setKeywords(["HSK 3.0","unofficial","HSKKit"]);
  const size:[number,number]=pageSize;let page:PDFPage;let y=0;let pageNumber=0;const [pageWidth,pageHeight]=size;
  const header=title.includes("Practice Assessment")?"HSKKit · Practice Assessment v2 · HSK 3.0 · Unofficial":"HSKKit · HSK 3.0 · Unofficial learning resource";
  const plannerQuickStart=title==="HSK 30-Day Planner · Quick Start";
  const contentWidth=pageWidth-75;
  const fresh=()=>{page=pdf.addPage(size);pageNumber+=1;page.drawRectangle({x:0,y:pageHeight-30,width:pageWidth,height:30,color:rgb(.04,.31,.29)});page.drawText(header,{x:32,y:pageHeight-20,size:9,font,color:rgb(1,1,1)});page.drawText(String(pageNumber),{x:pageWidth-55,y:26,size:8,font,color:rgb(.45,.5,.56)});y=pageHeight-57;};
  fresh();for(const line of wordLines(title,font,20,contentWidth)){page!.drawText(line,{x:36,y,size:20,font,color:rgb(.04,.31,.29)});y-=27;}y-=5;
  for(const line of wordLines(subtitle,font,plannerQuickStart?11:9.5,contentWidth)){page!.drawText(line,{x:36,y,size:plannerQuickStart?11:9.5,font,color:rgb(.25,.3,.38)});y-=plannerQuickStart?16:14;}
  for(const line of wordLines("Advanced-band disclosure: HSK 3.0 defines one unified Levels 7–9 band; Level 7/8/9 labels use the same canonical approved source set.",font,plannerQuickStart?9.5:8.5,contentWidth)){page!.drawText(line,{x:36,y,size:plannerQuickStart?9.5:8.5,font,color:rgb(.45,.28,.08)});y-=plannerQuickStart?14:12;}y-=plannerQuickStart?20:12;
  if(compact){
    for(const section of sections){
      const headingRows=wordLines(section.heading,font,13,contentWidth);
      const rows=section.body.map(item=>wordLines(item,font,10.5,contentWidth-10));
      const sectionHeight=headingRows.length*18+9+rows.reduce((total,lines)=>total+lines.length*15+7,0)+12;
      const firstBodyHeight=(rows[0]?.length??0)*15;
      if(y-sectionHeight<58&&sectionHeight<pageHeight-95||y-headingRows.length*18-firstBodyHeight<58)fresh();
      for(const line of headingRows){page!.drawText(line,{x:36,y,size:13,font,color:rgb(.04,.31,.29)});y-=18;}
      y-=9;
      for(const item of rows){for(const line of item){if(y<62)fresh();page!.drawText(line,{x:44,y,size:10.5,font,color:rgb(.12,.16,.24)});y-=15;}y-=7;}
      y-=12;
    }
  }else for(const section of sections){
    const headingSize=plannerQuickStart?16:14,bodySize=plannerQuickStart?11.5:9.5;
    if(section.pageBreakBefore||y<112)fresh();
    for(const headingLine of wordLines(section.heading,font,headingSize,contentWidth)){if(y<72)fresh();page!.drawText(headingLine,{x:36,y,size:headingSize,font,color:rgb(.04,.31,.29)});y-=plannerQuickStart?23:18;}
    y-=plannerQuickStart?7:4;
    for(const item of section.body){for(const line of wordLines(item,font,bodySize,contentWidth-10)){if(y<58)fresh();page!.drawText(line,{x:44,y,size:bodySize,font,color:rgb(.12,.16,.24)});y-=plannerQuickStart?18:14;}y-=plannerQuickStart?11:5;}
    y-=plannerQuickStart?22:10;
  }
  return new Uint8Array(await pdf.save({useObjectStreams:false}));
}
function readme(product:DigitalProduct,files:string[],manifest:ProductArtifactManifest){
  const audio=manifest.audioProvenance;
  const quickStart=product.id==="30-day-planner"?[
    "1. Read Prepare materials before Day 1. This is a study planner, not a self-contained course: bring your own level-appropriate word list, keyed reading questions, keyed audio with transcript, and writing model or feedback source.",
    "2. On the setup page, measure first-attempt vocabulary /20, reading /10, writing /5 and listening /10. Listening can take a separate setup session outside the Day 1 timer. Convert each measured fraction to a score out of 100; mark absent skills NOT MEASURED, not zero.",
    "3. Use the lowest measured skill on the two-page Assessment mapping to select its first assignment. Choose the 20, 30 or 45-minute route and do only that route; record results and corrections in the PDF.",
    "4. Recheck with fresh material on Days 14 and 28; use the Day 21 scoring anchors and four weekly reviews. On Day 28 compare only measured, comparable skills; do listening separately and mark missing checks NOT MEASURED. The optional XLSX tracks status and a short evidence note, not extra practice or automatic grading."
  ]:product.id==="worksheet-pack"?[
    "1. Choose one HSK level, then open A4, US Letter, low-ink or fillable Student Workbook. These versions contain the same question IDs; print only the module you need.",
    "2. Read the worked example or situation, then answer all three IDs in one module without opening the Answer Key. Keep the printed response area for your own writing.",
    "3. Check matching IDs in the Answer Key. Read Why and Common mistake; correct each missed item using the supplied evidence. Completed Samples demonstrate how to check, not text to copy.",
    "4. On a different day, retry missed items without the key. Mark the printable Progress Checklist and jot down the error clue and next review action; no spreadsheet entry is required.",
    "Levels 1–2: recognition and short routines; 3–4: context and reconstruction; 5–6: extended evidence; 7–9: cross-text reasoning and formal response."
  ]:audio?[
    "1. Print one Level section from one Form A/B/C Student PDF and the matching Answer Sheet section.",
    "2. Play the matching MP3 once without pausing; each numbered prompt already includes a 5-second response gap.",
    "3. Complete Listening, Reading and Writing before opening Answers and Explanations.",
    "4. Record /30 in the Score Report or CSV, identify the weakest skill and complete the linked practice before the next form."
  ]:[
    "1. Read the Quick Start or guide file before opening the working files.",
    "2. Choose one HSK level and one evidence-based goal.",
    "3. Complete work before checking answers or rubrics.",
    "4. Record the next review action after each session."
  ];
  const lines=[
    `${product.name} · HSKKit`,"","How to use",...quickStart,
    "","Included files",...files.map(name=>`- ${name}`),"","Important",
    "This is an unofficial HSK 3.0 learning resource, not an official examination product.",
    audio?`Three Mandarin MP3 listening tracks are included for Forms A, B and C. Playback is once at natural pace with ${audio.responsePauseSeconds}-second response pauses; exact transcripts are included.`:"Audio is not included.",
    audio?`Audio provenance: ${audio.provider}; voices ${Object.entries(audio.voices).map(([form,voice])=>`${form}=${voice}`).join(", ")}; generated ${audio.generatedOn}.`:"",
    audio?`Audio integrity: each MP3 is pinned by SHA-256 in manifest.json. ${audio.redistributionStatus}`:"",
    "Levels 7–9 use one unified canonical advanced source set.",
    product.id==="teacher-lesson-plan-pack"?`Licensed under this product contract: ${productLicenseNotice(product.id)}`:"Licensed for personal, non-transferable study and print use only."
  ];
  return encoder.encode(lines.filter(Boolean).join("\n"));
}
function packageZip(product:DigitalProduct,files:Array<{name:string;data:Uint8Array}>,manifest:ProductArtifactManifest){return generateZipFiles([...files,{name:"manifest.json",data:encoder.encode(JSON.stringify(manifest,null,2))},{name:"README.txt",data:readme(product,files.map(file=>file.name),manifest)}]);}

async function makePlannerPdf(plan:PlannerPack,fontBytes:Uint8Array,fillable:boolean){
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(new Uint8Array(fontBytes),{subset:false});const form=fillable?pdf.getForm():null;
  const width=595.28,height=841.89,dark=rgb(.04,.31,.29),ink=rgb(.11,.15,.22),muted=rgb(.38,.43,.5),lineColor=rgb(.55,.68,.65);let pageNumber=0;
  pdf.setTitle(`HSK 30-Day Planner · ${fillable?"Fillable":"Printable"} A4`);pdf.setAuthor("HSKKit");pdf.setSubject("HSK 30-Day Personalized Study System");
  const fresh=(title:string)=>{const page=pdf.addPage([width,height]);pageNumber+=1;page.drawRectangle({x:0,y:height-39,width,height:39,color:dark});page.drawText("HSKKit · HSK 30-Day Personalized Study System",{x:30,y:height-25,size:9,font,color:rgb(1,1,1)});page.drawText(String(pageNumber),{x:width-48,y:22,size:8,font,color:muted});page.drawText(title,{x:30,y:height-68,size:16,font,color:dark});return page;};
  const drawWrapped=(page:PDFPage,text:string,x:number,y:number,size:number,maxWidth:number,color=ink,lineHeight=size+3)=>{for(const row of wordLines(text,font,size,maxWidth)){page.drawText(row,{x,y,size,font,color});y-=lineHeight;}return y;};
  const response=(page:PDFPage,name:string,label:string,x:number,top:number,fieldWidth:number,fieldHeight:number)=>{page.drawText(label,{x,y:top,size:9.5,font,color:ink});const boxY=top-fieldHeight-8;if(form){const field=form.createTextField(name);field.enableMultiline();field.addToPage(page,{x,y:boxY,width:fieldWidth,height:fieldHeight,borderColor:lineColor,borderWidth:.7,textColor:ink,font});field.setFontSize(10);}else{page.drawRectangle({x,y:boxY,width:fieldWidth,height:fieldHeight,borderColor:lineColor,borderWidth:.7});for(let line=boxY+13;line<boxY+fieldHeight;line+=15)page.drawLine({start:{x:x+5,y:line},end:{x:x+fieldWidth-5,y:line},thickness:.35,color:lineColor});}return boxY-17;};

  {
    const page=fresh("Start here · diagnosis, goal and route");
    let y=742;y=drawWrapped(page,plan.positioning,30,y,11,width-60,dark,15)-8;y=drawWrapped(page,plan.workflow.join(" → "),30,y,8.5,width-60,muted,12)-16;
    const fields=[["planner.setup.currentLevel","Current Level"],["planner.setup.targetLevel","Target Level"],["planner.setup.examDateOrGoal","Exam date or study goal"],["planner.setup.dailyMinutes","Daily available time"],["planner.setup.weakAreas","Initial weak areas"],["planner.setup.route","Selected route: 20 / 30 / 45"],["planner.setup.assessment.vocabulary","Assessment · vocabulary score out of 100"],["planner.setup.assessment.listening","Assessment · listening score out of 100"],["planner.setup.assessment.reading","Assessment · reading score out of 100"],["planner.setup.assessment.writing","Assessment · writing score out of 100"]] as const;
    for(let index=0;index<fields.length;index+=2){const left=fields[index],right=fields[index+1];response(page,left[0],left[1],30,y,250,42);response(page,right[0],right[1],315,y,250,42);y-=88;}
    drawWrapped(page,"Score rule: first-attempt correct / total x 100. Use NOT MEASURED if no keyed source is available; never enter 0 for a missing check. The listening check may require a separate setup session outside Day 1's timer.",30,y+14,10,width-60,ink,15);
  }
  for(const [title,sections] of [["Prepare materials · before you begin",plan.sourcingGuide],["Worked example · Day 1 to first action",plan.workedExample]] as const){
    const page=fresh(title);let y=738;
    for(const section of sections){
      y=drawWrapped(page,section.heading,30,y,12,width-60,dark,18)-5;
      y=drawWrapped(page,section.body,30,y,10.5,width-60,ink,15)-18;
      if(y<48)throw new Error(`PLANNER_GUIDE_OVERFLOW_${title}`);
    }
  }
  for(let group=0;group<2;group++){
    const page=fresh(`Assessment → practice · ${group===0?"vocabulary & listening":"reading & writing"}`);let y=738;
    y=drawWrapped(page,"Use scores out of 100, not raw counts. Find the lowest MEASURED skill and its band. Start with its assignment; recheck using fresh, keyed material on Days 14 and 28.",30,y,11.5,width-60,ink,18)-21;
    const mappings=plan.assessmentMappings.slice(group*6,group*6+6);
    for(const [index,mapping] of mappings.entries()){
      if(index%3===0){
        page.drawRectangle({x:30,y:y-26,width:width-60,height:32,color:rgb(.9,.96,.95)});
        page.drawText(mapping.skill.toUpperCase(),{x:39,y:y-17,size:13.5,font,color:dark});y-=43;
      }
      y=drawWrapped(page,`${mapping.band} · ${mapping.practiceDirection.join(" + ")}`,39,y,12,width-78,dark,18)-5;
      y=drawWrapped(page,`First assignment: ${mapping.firstAssignment}`,48,y,11.5,width-96,ink,18)-22;
    }
    if(y<46)throw new Error(`PLANNER_MAPPING_OVERFLOW_${group}`);
  }
  for(const day of plan.days){
    const page=fresh(`Day ${day.day} · ${day.phase} · ${day.focus}`);let y=742;
    y=drawWrapped(page,`Materials (bring your own): ${day.materials.join(" · ")}`,30,y,10,width-60,ink,14)-10;
    for(const minutes of [20,30,45] as const){
      const route=`${minutes} MIN · ${day.routes[minutes].replace(/^\d+ min · /,"")}`;
      const rows=wordLines(route,font,10,width-84);
      const boxHeight=Math.max(53,rows.length*14+23);
      page.drawRectangle({x:30,y:y-boxHeight,width:width-60,height:boxHeight-4,borderColor:lineColor,borderWidth:.8});
      y=drawWrapped(page,route,42,y-20,10,width-84,ink,14)-13;
    }
    y=drawWrapped(page,`Evidence target: ${day.evidence.join(" · ")}`,30,y,10,width-60,dark,14)-15;
    y=response(page,`planner.day${day.day}.completed`,"Completed work / route used",30,y,width-60,44);
    y=response(page,`planner.day${day.day}.evidence`,"Measured evidence (counts, accuracy or completed output)",30,y,width-60,80);
    y=response(page,`planner.day${day.day}.difficult`,"What was difficult and why?",30,y,width-60,80);
    y=response(page,`planner.day${day.day}.nextReview`,"Next review date / next action",30,y,width-60,54);
    if(y<38)throw new Error(`PLANNER_DAY_OVERFLOW_${day.day}`);
    const review=plan.weeklyReviews.find(item=>item.day===day.day);if(review){
      const reviewPage=fresh(`Day ${day.day} · Weekly evidence review`);let reviewY=742;
      if(day.day===21){
        reviewY=drawWrapped(reviewPage,"Day 21 scoring anchors · score each response 0–2 in each area; total /6 only if all three are measured. Use a model or teacher to verify accuracy; otherwise mark it NOT MEASURED, not zero.",30,reviewY,10.5,width-60,dark,15)-8;
        for(const item of plan.productionRubric)reviewY=drawWrapped(reviewPage,`${item.dimension}: ${item.anchors}`,36,reviewY,10,width-72,ink,14)-4;
        reviewY-=6;
      }
      for(const [index,prompt] of review.prompts.entries())reviewY=response(reviewPage,`planner.week${day.day}.${["progress","missed","adjustment","nextFocus"][index]}`,prompt,30,reviewY,width-60,day.day===21?96:105);
      if(reviewY<38)throw new Error(`PLANNER_REVIEW_OVERFLOW_${day.day}`);
    }
  }
  {
    const page=fresh(plan.recoveryWorksheet.title);let y=742;y=drawWrapped(page,plan.recoveryWorksheet.rule,30,y,9,width-60,dark,13)-18;const fields=["missedDay","reason","unfinished","moveForward","reducedRoute","returnDate"];
    for(const [index,prompt] of plan.recoveryWorksheet.prompts.entries())y=response(page,`planner.recovery.${fields[index]}`,prompt,30,y,width-60,index===2||index===3?66:42);
  }
  {
    const page=fresh(plan.finalReview.title);let y=742;y=drawWrapped(page,"Repeat Day 1 with fresh material. Compare measured evidence—not confidence alone—then select one next-stage action.",30,y,9,width-60,dark,13)-16;const fields=["comparison","strongestGain","remainingGap","nextDecision","nextStartDate","firstAssignments"];
    for(const [index,prompt] of plan.finalReview.prompts.entries())y=response(page,`planner.final.${fields[index]}`,prompt,30,y,width-60,index<3?70:46);
  }
  if(form)form.updateFieldAppearances(font);
  return new Uint8Array(await pdf.save({useObjectStreams:false}));
}

type WorksheetPdfMode="student"|"answer"|"fillable";
type WorksheetPdfOptions={pageSize:"A4"|"LETTER";mode:WorksheetPdfMode;lowInk?:boolean};
const WORKSHEET_PAGE_SIZES={A4:[595.28,841.89],LETTER:[612,792]} as const;

type WorksheetPromptSegment={kind:"intro"|"source"|"option"|"instruction";text:string};
export function worksheetPromptSegments(prompt:string):WorksheetPromptSegment[]{
  const markers=/(?:材料[甲乙丙丁]|资料[ABC甲乙丙丁]|文本[AB])[｜:：]|(?<![A-Za-z])[ABCD]\.\s/g;
  const points=[...prompt.matchAll(markers)].map(match=>({index:match.index!,label:match[0]}));
  const segments:WorksheetPromptSegment[]=[];
  const append=(text:string,kind:WorksheetPromptSegment["kind"])=>{if(text.trim())segments.push({kind,text:text.trim()});};
  let from=0,kind:WorksheetPromptSegment["kind"]="intro";
  for(const point of points){
    if(point.index<from)continue;
    append(prompt.slice(from,point.index),kind);
    from=point.index;kind=/^[ABCD]\./.test(point.label)?"option":"source";
  }
  append(prompt.slice(from),kind);
  return segments.flatMap((segment,index)=>{
    const followedByOptions=segment.kind==="source"&&segments[index+1]?.kind==="option";
    if(segment.kind!=="option"&&!followedByOptions)return [segment];
    const match=followedByOptions?/。\s*(?=(?:若要|哪项|请判断|请比较))/.exec(segment.text)
      :segment.kind==="option"&&/^[CD]\./.test(segment.text)
        ?/(?:。|\.)\s*(?=(?:Write|Which|Copy|Choose|Give|Explain|State|Cite|说出|引用|选词|说明|用时间线|请引用|选一项|根据哪|请分别|请说明|写出|指出))/i.exec(segment.text)
        :null;
    if(!match)return [segment];
    const pos=match.index;
    return [{kind:segment.kind,text:segment.text.slice(0,pos).trim()},{kind:"instruction" as const,text:segment.text.slice(pos+match[0].length).trim()}];
  });
}

async function makeWorksheetPdf(plans:WorksheetLevel[],fontBytes:Uint8Array,options:WorksheetPdfOptions){
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(new Uint8Array(fontBytes),{subset:false});
  const form=options.mode==="fillable"?pdf.getForm():null;
  const [width,height]=WORKSHEET_PAGE_SIZES[options.pageSize];
  const dark=rgb(.04,.31,.29),ink=rgb(.11,.15,.22),muted=rgb(.38,.43,.5),lineColor=options.lowInk?rgb(.72,.72,.72):rgb(.55,.68,.65);
  pdf.setTitle(`HSK Worksheet Pack · ${options.mode==="answer"?"Answer Key":options.mode==="fillable"?"Fillable Student Workbook":"Student Workbook"} · ${options.pageSize}`);
  pdf.setAuthor("HSKKit");pdf.setSubject("Differentiated HSK 3.0 Level 1–9 multi-skill worksheets");
  let pageNumber=0;
  // The answer key flows across level boundaries. Student pages retain level boundaries
  // so a printed level can still be separated and assigned on its own.
  let answerPage:PDFPage|undefined,answerY=0;
  const answerSize=13,answerLeading=19;
  const drawText=(page:PDFPage,text:string,x:number,y:number,size:number,maxWidth:number,color=ink,lineHeight=size+3)=>{const wrapped=wordLines(text,font,size,maxWidth);for(const row of wrapped){page.drawText(row,{x,y,size,font,color});y-=lineHeight;}return y;};
  const promptParts=(prompt:string)=>worksheetPromptSegments(prompt);
  const promptHeight=(question:(typeof plans)[number]["modules"][number]["questions"][number])=>{
    const segments=promptParts(question.prompt);
    return 17+segments.reduce((sum,segment)=>{
      if(segment.kind==="source"){
        const label=/^(?:材料[甲乙丙丁]|资料[ABC甲乙丙丁]|文本[AB])[｜:：]/.exec(segment.text)?.[0]??"";
        return sum+16+wordLines(segment.text.slice(label.length),font,12,width-112).length*18+5;
      }
      const text=segment.kind==="instruction"?`作答要求 · ${segment.text}`:segment.text;
      return sum+wordLines(text,font,segment.kind==="instruction"?11.5:12,width-112).length*18+(segment.kind==="option"?3:6);
    },0)+5;
  };
  const drawPrompt=(page:PDFPage,question:(typeof plans)[number]["modules"][number]["questions"][number],y:number)=>{
    page.drawText(question.id,{x:48,y,size:11,font,color:dark});y-=17;
    for(const segment of promptParts(question.prompt)){
      if(segment.kind==="source"){
        const label=/^(?:材料[甲乙丙丁]|资料[ABC甲乙丙丁]|文本[AB])[｜:：]/.exec(segment.text)?.[0]??"";
        page.drawText(label.replace(/[｜:：]$/,""),{x:48,y,size:11.5,font,color:dark});y-=16;
        y=drawText(page,segment.text.slice(label.length),54,y,12,width-112,ink,18)-5;
      }else if(segment.kind==="instruction"){
        y=drawText(page,`作答要求 · ${segment.text}`,48,y,11.5,width-112,dark,18)-6;
      }else{
        y=drawText(page,segment.text,segment.kind==="option"?54:48,y,12,width-112,ink,18)-(segment.kind==="option"?3:6);
      }
    }
    return y-5;
  };
  for(const plan of plans){
    let currentPage:PDFPage|undefined=options.mode==="answer"?answerPage:undefined;
    let currentY=options.mode==="answer"?answerY:0;
    for(const worksheetModule of plan.modules){
    const startPage=(continued=false)=>{
      const next=pdf.addPage([width,height]);pageNumber+=1;
      if(options.lowInk){next.drawLine({start:{x:30,y:height-32},end:{x:width-30,y:height-32},thickness:1,color:dark});}
      else next.drawRectangle({x:0,y:height-39,width,height:39,color:dark});
      next.drawText(options.mode==="answer"?"HSKKit · Teacher Answer Key · Levels 1–9":`HSKKit · Level ${plan.level} · Student Worksheet`,{x:30,y:height-25,size:10,font,color:options.lowInk?dark:rgb(1,1,1)});
      next.drawText(String(pageNumber),{x:width-48,y:22,size:8,font,color:muted});
      let cursor=height-65;
      const moduleHeading=options.mode==="answer"?`Level ${plan.level} · ${worksheetModule.title}`:worksheetModule.title;
      cursor=drawText(next,moduleHeading+(continued?" · Continued":""),36,cursor,16,width-72,dark,22)-6;
      if(!continued){cursor=drawText(next,plan.difficultyNote,36,cursor,11,width-72,muted,16)-5;
        cursor=drawText(next,worksheetModule.instruction,36,cursor,12,width-72,ink,18)-17;}
      if(options.mode==="answer")next.drawText("Score each ID against its student item; accept original answers meeting the printed criteria.",{x:30,y:35,size:9,font,color:muted});
      else{
        next.drawText("Name:",{x:30,y:35,size:9,font,color:muted});next.drawLine({start:{x:58,y:34},end:{x:170,y:34},thickness:.6,color:muted});
        next.drawText("Date:",{x:190,y:35,size:9,font,color:muted});next.drawLine({start:{x:216,y:34},end:{x:310,y:34},thickness:.6,color:muted});
        next.drawText("Check only after completing all three IDs.",{x:330,y:35,size:9,font,color:muted});
      }
      return {next,cursor};
    };
    const required=(question:(typeof worksheetModule.questions)[number])=>options.mode==="answer"
      ?wordLines(`${question.id} · ${question.answer}`,font,answerSize,width-96).length*answerLeading+8+wordLines(`Why · ${question.explanation}`,font,answerSize,width-96).length*answerLeading+8+wordLines(`Common mistake · ${question.commonError}`,font,answerSize,width-96).length*answerLeading+21
      :promptHeight(question)+(form?Math.max(38,question.responseLines*19)+14:usesHanziGrid(question)?89:question.responseLines*19+14);
    function usesHanziGrid(question:(typeof worksheetModule.questions)[number]){
      return plan.level<=2&&worksheetModule.kind==="hanzi-tone"&&
        /(?:copy|write|fill).*?(?:茶|character|hanzi|two-hanzi|汉字|“__洗手)/i.test(question.prompt);
    }
    const moduleHeading=options.mode==="answer"?`Level ${plan.level} · ${worksheetModule.title}`:worksheetModule.title;
    const headingNeed=wordLines(moduleHeading,font,16,width-72).length*22+6+wordLines(plan.difficultyNote,font,11,width-72).length*16+5+wordLines(worksheetModule.instruction,font,12,width-72).length*18+17;
    // A long response may continue on another page; the module heading must stay with
    // its first prompt and at least one writing line, not with the entire response.
    const firstQuestion=worksheetModule.questions[0];
    const firstNeed=options.mode==="answer"?required(firstQuestion):promptHeight(firstQuestion)+38;
    let page:PDFPage;let y:number;
    if(!currentPage||currentY-14-headingNeed-firstNeed<58){({next:page,cursor:y}=startPage());}
    else{
      page=currentPage;y=currentY-14;
      y=drawText(page,moduleHeading,36,y,16,width-72,dark,22)-6;
      y=drawText(page,plan.difficultyNote,36,y,11,width-72,muted,16)-5;
      y=drawText(page,worksheetModule.instruction,36,y,12,width-72,ink,18)-17;
    }
    for(const [questionIndex,question] of worksheetModule.questions.entries()){
      const needed=required(question);
      const promptNeed=promptHeight(question);
      const minimumNeed=options.mode==="answer"?needed:promptNeed+38;
      // Keep a short fillable task and its field together. Only genuinely long
      // tasks may place the response field alone on a continuation page.
      if(form&&y-needed<58&&needed<=height-155){({next:page,cursor:y}=startPage(true));}
      else if(y-needed<58&&y-minimumNeed<58){({next:page,cursor:y}=startPage(true));}
      if(options.mode!=="answer"&&y-promptNeed<58)throw new Error(`WORKSHEET_PROMPT_TOO_LONG:${question.id}`);
      if(options.mode==="answer"&&y-needed<58)throw new Error(`WORKSHEET_ANSWER_TOO_LONG:${question.id}`);
      if(options.mode==="answer"){
        y=drawText(page,`${question.id} · ${question.answer}`,48,y,answerSize,width-96,dark,answerLeading)-8;
        y=drawText(page,`Why · ${question.explanation}`,48,y,answerSize,width-96,ink,answerLeading)-8;
        y=drawText(page,`Common mistake · ${question.commonError}`,48,y,answerSize,width-96,muted,answerLeading)-21;
      }else{
        y=drawPrompt(page,question,y);
        let responseHeight=Math.max(38,question.responseLines*19);
        if(form){
          if(y-responseHeight<58){
            ({next:page,cursor:y}=startPage(true));
            page.drawText(`${question.id} · response continued`,{x:48,y,size:11,font,color:dark});y-=24;
            if(question.responseLines>=5)responseHeight=Math.max(responseHeight,y-82);
          }
          const field=form.createTextField(`worksheet.${question.id}`);field.enableMultiline();
          field.addToPage(page,{x:48,y:y-responseHeight+4,width:width-96,height:responseHeight,borderColor:lineColor,borderWidth:.75,textColor:ink,font});field.setFontSize(12);
          y-=responseHeight+14;
        }else if(usesHanziGrid(question)){
          page.drawText("在田字格内写汉字；拼音或补全句子写在下方横线上。",{x:48,y,size:9.5,font,color:muted});y-=17;
          const cellSize=40,cellCount=4,gap=5;
          for(let cell=0;cell<cellCount;cell++){
            const x=40+cell*(cellSize+gap),bottom=y-cellSize;
            page.drawRectangle({x,y:bottom,width:cellSize,height:cellSize,borderColor:lineColor,borderWidth:.65});
            page.drawLine({start:{x:x+cellSize/2,y:bottom},end:{x:x+cellSize/2,y},thickness:.3,color:lineColor,dashArray:[2,2]});
            page.drawLine({start:{x,y:bottom+cellSize/2},end:{x:x+cellSize,y:bottom+cellSize/2},thickness:.3,color:lineColor,dashArray:[2,2]});
          }
          y-=cellSize+10;
          page.drawLine({start:{x:48,y},end:{x:width-48,y},thickness:.55,color:lineColor});
          y-=22;
        }else{
          const evidenceLabels=plan.level>=7&&worksheetModule.kind==="reading-comprehension"
            ?["选择","甲证据","乙证据","排除理由","综合判断"]:[];
          const next=worksheetModule.questions[questionIndex+1];
          const baseRemaining=y-question.responseLines*19-14;
          const nextFits=next&&baseRemaining-required(next)>=58;
          const expandable=worksheetModule.kind==="writing-speaking"||(plan.level>=7&&worksheetModule.kind==="reading-comprehension");
          const target=worksheetModule.kind==="writing-speaking"
            ?plan.level>=7?12:plan.level>=5?5:2:7;
          const extra=expandable&&!nextFits?Math.min(target,Math.max(0,Math.floor((baseRemaining-84)/19))):0;
          // A genuine continuation page should remain useful for handwriting
          // all the way down to the safe print margin; don't create another
          // page just to satisfy a fixed number of extra ruled lines.
          let continued=false;
          for(let row=0;row<question.responseLines+extra;row++){
            if(y<77){({next:page,cursor:y}=startPage(true));page.drawText(`${question.id} · response continued`,{x:48,y,size:11,font,color:dark});y-=24;continued=true;}
            const label=evidenceLabels[row];
            if(label)page.drawText(label,{x:48,y:y+3,size:9,font,color:muted});
            page.drawLine({start:{x:label?122:48,y},end:{x:width-48,y},thickness:.55,color:lineColor});y-=19;
          }
          if(continued&&plan.level>=7&&question.responseLines>=5){
            while(y>=96){page.drawLine({start:{x:48,y},end:{x:width-48,y},thickness:.55,color:lineColor});y-=19;}
          }
          y-=14;
        }
      }
    }
    currentPage=page;currentY=y;
    }
    if(options.mode==="answer"){answerPage=currentPage;answerY=currentY;}
  }
  if(form)form.updateFieldAppearances(font);
  return new Uint8Array(await pdf.save({useObjectStreams:false}));
}

async function makeWorksheetSamplesPdf(plans:WorksheetLevel[],fontBytes:Uint8Array){
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(new Uint8Array(fontBytes),{subset:false});
  const [width,height]=WORKSHEET_PAGE_SIZES.A4,ink=rgb(.11,.15,.22),dark=rgb(.04,.31,.29),muted=rgb(.38,.43,.5),rule=rgb(.76,.83,.81);
  pdf.setTitle("HSK Worksheet Pack · Completed Samples");pdf.setAuthor("HSKKit");
  let page:PDFPage|undefined,y=0,pageNumber=0;
  const fresh=()=>{page=pdf.addPage([width,height]);pageNumber++;
    page.drawLine({start:{x:36,y:height-38},end:{x:width-36,y:height-38},thickness:1.2,color:dark});
    page.drawText("HSKKit  /  COMPLETED SAMPLES",{x:36,y:height-27,size:9,font,color:dark});
    page.drawText(String(pageNumber),{x:width-48,y:25,size:9,font,color:muted});y=height-66;};
  const sampleRows=(text:string,prompt=false)=>{
    const paragraphs=prompt?worksheetPromptSegments(text).map(part=>part.kind==="instruction"?`作答要求 · ${part.text}`:part.text)
      :text.split(/\n|(?=[ABC]\. )/).filter(Boolean);
    return paragraphs.flatMap(part=>wordLines(part.trim(),font,13,width-112).map((row,index)=>({row,paragraphStart:index===0})));
  };
  const block=(label:string,text:string,accent=false,prompt=false)=>{
    const rows=sampleRows(text,prompt),need=21+rows.length*19+rows.filter(row=>row.paragraphStart).length*6+12;
    if(!page||y-need<52)fresh();
    page!.drawText(label,{x:48,y,size:12,font,color:accent?dark:muted});y-=21;
    for(const {row,paragraphStart} of rows){if(paragraphStart)y-=6;
      if(y<58){fresh();page!.drawText(`${label} · continued`,{x:48,y,size:12,font,color:muted});y-=22;}
      page!.drawText(row,{x:48,y,size:13,font,color:accent?dark:ink});y-=19;}
    y-=12;
  };
  for(const plan of plans)for(const [index,question] of [plan.modules[2].questions[0],plan.modules[6].questions[0],plan.modules[8].questions[0]].entries()){
    const blocks=[question.prompt,question.sampleResponse,question.explanation,question.commonError];
    const estimate=58+blocks.reduce((sum,text,blockIndex)=>{const rows=sampleRows(text,blockIndex===0);return sum+33+rows.length*19+rows.filter(row=>row.paragraphStart).length*6;},0);
    // Keep a complete short example together; a long example can start in the
    // remaining space after the previous one's self-check instead of leaving a sparse page.
    if(!page||(estimate<height-130?y-estimate<52:y<220))fresh();
    page!.drawText(`LEVEL ${plan.level}   /   EXAMPLE ${index+1}`,{x:48,y,size:15,font,color:dark});y-=24;
    page!.drawLine({start:{x:48,y},end:{x:width-48,y},thickness:.8,color:rule});y-=12;
    block("TASK · Read and attempt before checking",question.prompt,false,true);
    block("COMPLETED RESPONSE",question.sampleResponse,true);
    const pairedNeed=[question.explanation,question.commonError].reduce((sum,text)=>{
      const rows=sampleRows(text);return sum+33+rows.length*19+rows.filter(row=>row.paragraphStart).length*6;
    },0);
    if(y-pairedNeed<52&&pairedNeed<height-120)fresh();
    block("SELF-CHECK · Evidence and reasoning",question.explanation);
    block("COMMON MISTAKE · What to revise",question.commonError);
    y-=8;
  }
  return new Uint8Array(await pdf.save({useObjectStreams:false}));
}

async function makeWorksheetChecklistPdf(plans:WorksheetLevel[],fontBytes:Uint8Array){
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
  const font=await pdf.embedFont(new Uint8Array(fontBytes),{subset:false});
  const [width,height]=WORKSHEET_PAGE_SIZES.A4;
  const dark=rgb(.04,.31,.29),ink=rgb(.11,.15,.22),muted=rgb(.38,.43,.5),rule=rgb(.65,.72,.71);
  pdf.setTitle("HSK Worksheet Pack · Progress Checklist");pdf.setAuthor("HSKKit");
  let pageNo=0;
  for(const plan of plans){
    for(let start=0;start<plan.modules.length;start+=5){
      const page=pdf.addPage([width,height]);pageNo++;
      page.drawLine({start:{x:36,y:height-38},end:{x:width-36,y:height-38},thickness:1.2,color:dark});
      page.drawText(`HSKKit / LEVEL ${plan.level} / PROGRESS ${start/5+1}`,{x:36,y:height-27,size:9,font,color:dark});
      page.drawText(String(pageNo),{x:width-48,y:25,size:9,font,color:muted});
      let y=height-70;
      page.drawText(`Level ${plan.level} · 逐题学习记录`,{x:36,y,size:17,font,color:dark});y-=27;
      for(const row of wordLines("初 = 首次独立答对   改 = 对照答案纠错   复 = 隔天独立复测答对；未完成留空。",font,11,width-72)){
        page.drawText(row,{x:36,y,size:11,font,color:ink});y-=17;
      }
      y-=12;
      for(const module of plan.modules.slice(start,start+5)){
        const heading=`${module.title} · 日期 __________  首答 ____ / 3  纠错后 ____ / 3`;
        for(const row of wordLines(heading,font,11,width-84)){
          page.drawText(row,{x:42,y,size:11,font,color:dark});y-=16;
        }
        const ids=module.questions.map((q,index)=>`${index+1} 初□ 改□ 复□`).join("     ");
        page.drawText(ids,{x:48,y,size:11,font,color:ink});y-=24;
        page.drawText("错因 / 证据：",{x:48,y,size:10.5,font,color:muted});
        page.drawLine({start:{x:133,y:y-2},end:{x:width-48,y:y-2},thickness:.65,color:rule});y-=23;
        page.drawLine({start:{x:48,y:y-2},end:{x:width-48,y:y-2},thickness:.65,color:rule});y-=20;
        page.drawLine({start:{x:42,y:y-4},end:{x:width-42,y:y-4},thickness:.4,color:rule});y-=17;
      }
      if(y<82)throw new Error(`WORKSHEET_CHECKLIST_OVERFLOW:${plan.level}:${start}`);
      page.drawText("复测日期：____________    下个单元 / 级别决定：________________________________",{x:42,y,size:10.5,font,color:muted});
    }
  }
  return new Uint8Array(await pdf.save({useObjectStreams:false}));
}

const formLabel=(variant:number)=>(["A","B","C"] as const)[variant];
export function mockAssessmentListeningScript(form:AssessmentForm){return assessmentListeningScript(form);}
const formatObjective=(number:number,item:{prompt:string;options:readonly string[]})=>`${number}. ${item.prompt}  A. ${item.options[0]}  B. ${item.options[1]}  C. ${item.options[2]}`;
type ReadingAssessmentItem={prompt:string;answer:string;explanation:string;distractorAnalysis:string};

function assessmentReadingItems(selection:Selection,variant:number):ReadingAssessmentItem[]{
  return assessmentScenario(selection.level,variant).reading.map(item=>({
    prompt:formatObjective(0,item).replace(/^0\. /,""),
    answer:item.answer,
    explanation:item.explanation,
    distractorAnalysis:item.distractorAnalysis
  }));
}
function writingTasks(selection:Selection){
  const spec=mockAssessmentBlueprint(selection.level),range=selection.level<=2?"20–40 Chinese characters":selection.level<=4?"50–80 Chinese characters":selection.level<=6?"100–150 Chinese characters":"180–300 Chinese characters";
  const tasks=[`Task 1 · ${spec.writing[0]}. Write ${range} for a classmate. State the main point of Source A and cite one accurate detail.`,`Task 2 · ${spec.writing[1]}. Write ${range} for a study report. Compare Source A with Source B, explain whether Source B supports, extends or challenges Source A, and cite evidence from both.`];
  if(selection.level>=7)tasks.push(`Task 3 · ${spec.writing[2]}. Write ${range} for an informed public reader. State a claim, cite both sources, address their disagreement or trade-off and reach a justified conclusion.`);
  return tasks;
}
function writingScoring(selection:Selection){return selection.level<=6?["Writing /10: Task 1 /5 + Task 2 /5.","Each task: completion and source evidence /2 · organization /1 · language control /1 · factual accuracy to the supplied sources /1."]: ["Writing /10: Task 1 /3 + Task 2 /3 + Task 3 /4.","Tasks 1–2: evidence /1 · organization /1 · language control /1. Task 3: claim /1 · two-source evidence /1 · counterpoint or trade-off /1 · language/register /1."];}
function assessmentStudentSections(selection:Selection,variant:number):PdfSection[]{
  const label=formLabel(variant),spec=mockAssessmentBlueprint(selection.level),scenario=assessmentScenario(selection.level,variant),reading=assessmentReadingItems(selection,variant);
  return [
    {heading:`Form ${label} · Level ${selection.level} · Candidate details`,pageBreakBefore:true,body:["Name: ____________________   Date: ____________________   Level: ______",`Suggested total time: ${spec.suggestedMinutes} minutes. Listening: play the matching ${label}-form MP3 once; each question includes a five-second response pause.`,`Task mix · Listening: ${spec.listening.join(", ")} · Reading: ${spec.reading.join(", ")} · Writing: ${spec.writing.join(", ")}.`,`Scoring: Listening 5 items × 2 points = /10 · Reading 10 items × 1 point = /10 · Writing = /10 using the level rubric. Total = /30.`,`This is unofficial level-aligned practice, not an official HSK exam or official score.`]},
    {heading:`Form ${label} · Level ${selection.level} · Listening`,body:[...scenario.listening.map((item,index)=>formatObjective(index+1,item)),"Record all five answers on the separate printable answer sheet."]},
    {heading:`Form ${label} · Level ${selection.level} · Reading · Source A`,pageBreakBefore:true,body:[scenario.readingText]},
    {heading:`Form ${label} · Level ${selection.level} · Reading · Source B`,body:[scenario.sourceB,...reading.map((item,index)=>`${index+1}. ${item.prompt}`),"Each reading item is worth 1 point. Record all ten answers on the separate answer sheet."]},
    {heading:`Form ${label} · Level ${selection.level} · Writing`,pageBreakBefore:true,body:["Write each response in its numbered area on the separate printable answer sheet.",...writingTasks(selection),...writingScoring(selection),"Attach extra blank paper only if the answer-sheet space is insufficient."]}
  ];
}
function assessmentAnswerSections(selection:Selection,variant:number):PdfSection[]{
  const label=formLabel(variant),spec=mockAssessmentBlueprint(selection.level),scenario=assessmentScenario(selection.level,variant),reading=assessmentReadingItems(selection,variant);
  return [
    {heading:`Form ${label} · Level ${selection.level} · Listening explanations`,body:scenario.listening.flatMap((item,index)=>[`${index+1}. ${item.answer} · ${item.explanation}`,`Distractors: ${item.distractorAnalysis}`])},
    {heading:`Form ${label} · Level ${selection.level} · Reading explanations`,body:reading.flatMap((item,index)=>[`${index+1}. ${item.answer} · ${item.explanation}`,`Distractors / error analysis: ${item.distractorAnalysis}`])},
    {heading:`Form ${label} · Level ${selection.level} · Writing rubric and conversion`,body:[`Apply only the ${spec.band} band. This diagnostic result is not an official HSK score.`,...writingScoring(selection),`Dimensions: ${spec.rubricDimensions.join(" · ")}.`,`0 on a criterion: missing, off-task or unsupported. 1: partial/uneven evidence. Full criterion points: complete, accurate and supported at the stated Level ${selection.level} constraint.`,`Record the criterion points for every task, add them exactly as shown, and transfer the writing total /10 to the score report.`]}
  ];
}
function assessmentAnswerSheetSections(selection:Selection,variant:number):PdfSection[]{
  const label=formLabel(variant),writingCount=selection.level>=7?3:2,linesPerTask=selection.level>=7?8:selection.level>=5?6:4;
  const writingBody=Array.from({length:writingCount},(_,task)=>[`Task ${task+1} response (${task===0?"evidence and completion":task===1?"connection and language":"claim, evidence and counterpoint"})`,...Array.from({length:linesPerTask},()=>"________________________________________________________________________")]).flat();
  return [
    {heading:`Form ${label} · Level ${selection.level} · Listening answers · 2 points each`,body:["Name: ____________________   Date: ____________________",...Array.from({length:5},(_,index)=>`${index+1}.  A  /  B  /  C`)]},
    {heading:`Form ${label} · Level ${selection.level} · Reading answers · 1 point each`,body:Array.from({length:10},(_,index)=>`${index+1}.  A  /  B  /  C${index===6?"   (sentence/order item)":index===7?"   (information-match item)":""}`)},
    {heading:`Form ${label} · Level ${selection.level} · Writing responses · /10`,body:writingBody}
  ];
}
function assessmentReportSections(selection:Selection):PdfSection[]{const spec=mockAssessmentBlueprint(selection.level);return [{heading:`Level ${selection.level} · Score report`,body:["Learner: ____________________   Form: ____   Date: ____________________","Listening ____ / 10   Reading ____ / 10   Writing ____ / 10   Total ____ / 30",`Conversion: listening correct × 2; reading correct × 1; writing follows the printed Level ${selection.level} task allocation.`,`Rubric band: ${spec.band}. Suggested time: ${spec.suggestedMinutes} minutes. This is an unofficial diagnostic result, not an official HSK score.`,`Strongest evidence: ____________________   Weakest skill: listening / reading / writing`,`Weakest task family: detail / sequence / cloze / matching / insertion / inference / synthesis / counterargument`]},{heading:`Level ${selection.level} · Weakness → recommended practice`,body:[`Listening pathway: ${spec.recommendations.listening.join(" ")}`,`Reading pathway: ${spec.recommendations.reading.join(" ")}`,`Writing pathway: ${spec.recommendations.writing.join(" ")}`,"Select only the pathway matching the weakest skill and task family, complete it twice, then use the next form as a fresh check."]}];}

export async function generateDifferentiatedProductArtifact(productId:DigitalProductId|string,fontBytes:Uint8Array,_emojiFontBytes:Uint8Array,generationVersion=generationVersionForProduct(productId),assessmentAudio?:Partial<Record<AssessmentForm,Uint8Array>>){
  const product=digitalProduct(productId);if(!product||!(product.category==="resource"||product.category==="teacher"))throw new Error("INVALID_DIFFERENTIATED_PRODUCT");
  // Vocabulary truth has six discrete levels plus one canonical Advanced 7–9 band.
  // Level-driven teaching resources still expose honest Level 8/9 views backed by
  // that same band; corpus exports include the canonical band only once.
  const selections=(product.id==="assessment-tracker"||product.id==="30-day-planner"
    ?[1,2,3,4,5,6,7]
    :[1,2,3,4,5,6,7,8,9]).map(selectPackAssets);
  if(product.id==="30-day-planner"){
    const plan=buildPlannerPack();
    const quickStart=await makePdf("HSK 30-Day Planner · Quick Start",plan.positioning,[{heading:"Before you start: bring your own practice materials",body:["This is a guided plan, not a course or question bank. It does not include word lists, graded questions or answers, audio/transcripts, or writing feedback.","Prepare level-matched vocabulary, keyed reading items, transcript-backed listening questions, and writing prompts with a model or teacher check. Read the two preparation/example pages of the main PDF before Day 1."]},{heading:"Score fairly, then choose a route",body:["Day 1 covers vocabulary and reading; the 30/45-minute routes add writing. Measure listening separately before comparing four skills—it is outside Day 1's timer.","Convert first-attempt correct / total to a score out of 100. Mark absent checks NOT MEASURED, never zero. Pick the lowest measured skill on the two-page mapping and reserve its first assignment.","Complete only your chosen 20/30/45-minute route. Record evidence in the PDF. The optional XLSX summarizes statuses; it does not supply practice or grade work."]},{heading:"Review and recover",body:["Review on Days 7, 14, 21, and 28 with fresh input. Move only unfinished work when you miss a day; keep completed work. On Day 30 compare against a fresh sample using the same scoring method."]}],fontBytes);
    const printable=await makePlannerPdf(plan,fontBytes,false),fillable=await makePlannerPdf(plan,fontBytes,true);
    const files=[{name:"HSKKit-30-Day-Planner-Quick-Start.pdf",data:quickStart},{name:"HSKKit-30-Day-Planner-Printable-A4.pdf",data:printable},{name:"HSKKit-30-Day-Planner-Fillable-A4.pdf",data:fillable},{name:"HSKKit-30-Day-Planner-Progress-Tracker.xlsx",data:generatePlannerProgressWorkbook(plan)}];
    const manifest=manifestFor(product,files.map(file=>file.name),selections,generationVersion);return {bytes:packageZip(product,files,manifest),format:"zip" as const,manifest};
  }
  if(product.id==="assessment-tracker"){
    const rows=["level,source_band,source_level,word_id,hanzi,pinyin,meaning,recognition_0_2,recall_0_2,usage_0_2,last_checked,next_review,evidence,notes"];
    for(const selection of selections)for(const word of selection.words)rows.push([selection.level,selection.level>=7?"unified-levels-7-9":"level-specific",selection.level>=7?7:selection.level,word.id,word.hanzi,word.pinyin,word.meaning,"","","","","","",""].map(value=>`"${String(value).replaceAll('"','""')}"`).join(","));
    const weekly=["week_start,target_level,words_sampled,recognition_percent,recall_percent,usage_percent,strongest_evidence,weakest_evidence,next_action,next_review_date",...Array.from({length:12},()=>",,,,,,,,,")];
    const guide=await makePdf("HSK Assessment Tracker · Dashboard Guide","A spreadsheet-neutral scoring and review guide. Use the included UTF-8 CSV files in Excel, Numbers, LibreOffice or Google Sheets.",selections.map(selection=>({heading:`Level ${selection.level} · Evidence rules`,body:["Recognition 0: not recognized · 1: recognized with cue · 2: recognized independently.","Recall 0: no meaning retrieved · 1: partial/slow meaning · 2: accurate meaning without cue.","Usage 0: no accurate use · 1: meaning clear with a minor error · 2: complete accurate use.","Dashboard method: filter this level, average each score column, identify the lowest average, and set next_review from observed evidence."]})),fontBytes);
    const printableSections=selections.flatMap(selection=>[
      {
        heading:`Level ${selection.level} · Checkpoint`,
        pageBreakBefore:true,
        body:[
          "Date: ____   Learner/group: ____   Words sampled: ____",
          "Recognition total: ____ / ____   Recall total: ____ / ____   Usage total: ____ / ____",
          "Three secure items: ____________________  Three review items: ____________________",
          "Observed evidence: __________________________________________________________",
          "___________________________________________________________________________",
          "___________________________________________________________________________",
          "Next action and date: ________________________________________________________",
          "___________________________________________________________________________",
        ],
      },
      {
        heading:`Level ${selection.level} · Weekly follow-through`,
        body:[
          "Week start: ____   Planned review: ____   Completed: ____",
          "What changed in recognition / recall / usage: _________________________________",
          "___________________________________________________________________________",
          "Keep / change / remove this review action: ____________________________________",
          "___________________________________________________________________________",
        ],
      },
    ]);
    const printable=await makePdf("HSK Assessment Tracker · Printable Record","Use one checkpoint page per level. Sample words across the level and record evidence before choosing the next action.",printableSections,fontBytes);
    const workbookWords=selections.flatMap(selection=>selection.words.map(word=>({level:selection.level,sourceBand:selection.level>=7?"unified-levels-7-9":"level-specific",sourceLevel:selection.level>=7?7:selection.level,id:word.id,hanzi:word.hanzi,pinyin:word.pinyin,meaning:word.meaning})));
    const rawData=encoder.encode(rows.join("\r\n"));
    const files=[
      {name:"HSKKit-Assessment-Tracker-Blank.xlsx",data:generateAssessmentWorkbook(workbookWords,false)},
      {name:"HSKKit-Assessment-Tracker-Example.xlsx",data:generateAssessmentWorkbook(workbookWords,true)},
      {name:"HSKKit-Assessment-Tracker-Raw-Data.csv",data:rawData},
      {name:"HSKKit-Assessment-Tracker.csv",data:rawData},
      {name:"HSKKit-Weekly-Review.csv",data:encoder.encode(weekly.join("\r\n"))},
      {name:"HSKKit-Assessment-Dashboard-Guide.pdf",data:guide},
      {name:"HSKKit-Printable-Assessment-Record.pdf",data:printable},
    ];
    const manifest=manifestFor(product,files.map(file=>file.name),selections,generationVersion);return {bytes:packageZip(product,files,manifest),format:"zip" as const,manifest};
  }
  if(product.id==="worksheet-pack"){
    const plans=selections.map(buildWorksheetLevel);
    // Fontkit mutates parsing state; generate sequentially so shared font bytes cannot corrupt glyph maps.
    const studentA4=await makeWorksheetPdf(plans,fontBytes,{pageSize:"A4",mode:"student"});
    const studentLetter=await makeWorksheetPdf(plans,fontBytes,{pageSize:"LETTER",mode:"student"});
    const studentLowInk=await makeWorksheetPdf(plans,fontBytes,{pageSize:"A4",mode:"student",lowInk:true});
    const fillable=await makeWorksheetPdf(plans,fontBytes,{pageSize:"A4",mode:"fillable"});
    const answers=await makeWorksheetPdf(plans,fontBytes,{pageSize:"A4",mode:"answer"});
    const completedSamples=await makeWorksheetSamplesPdf(plans,fontBytes);
    const checklist=await makeWorksheetChecklistPdf(plans,fontBytes);
    const files=[
      {name:"HSKKit-Worksheets-Student-A4.pdf",data:studentA4},
      {name:"HSKKit-Worksheets-Student-US-Letter.pdf",data:studentLetter},
      {name:"HSKKit-Worksheets-Student-A4-Low-Ink.pdf",data:studentLowInk},
      {name:"HSKKit-Worksheets-Student-Fillable.pdf",data:fillable},
      {name:"HSKKit-Worksheets-Answer-Key.pdf",data:answers},
      {name:"HSKKit-Worksheet-Completed-Samples.pdf",data:completedSamples},
      {name:"HSKKit-Worksheet-Progress-Checklist.pdf",data:checklist},
    ];
    const manifest=manifestFor(product,files.map(file=>file.name),selections,generationVersion);return {bytes:packageZip(product,files,manifest),format:"zip" as const,manifest};
  }
  if(product.id==="practice-assessment-pack"){
    const forms=(["A","B","C"] as const);
    await validateAssessmentAudio(assessmentAudio);
    const studentFiles:Array<{name:string;data:Uint8Array}>=[];
    for(let variant=0;variant<3;variant++)studentFiles.push({name:`HSKKit-Practice-Assessment-${formLabel(variant)}-Student.pdf`,data:await makePdf(`HSK Level-Aligned Practice Assessment v2 · Form ${formLabel(variant)}`,"Original Level 1–9 diagnostic practice with differentiated listening, reading and writing tasks. This is not an official HSK examination and does not claim an official blueprint or score.",selections.flatMap(selection=>assessmentStudentSections(selection,variant)),fontBytes)});
    const answerSheets=await makePdf("HSK Level-Aligned Practice Assessment v2 · Answer Sheets","Print one Level section for each learner. Objective responses and writing space stay separate from the student paper.",selections.flatMap(selection=>[0,1,2].flatMap(variant=>assessmentAnswerSheetSections(selection,variant))),fontBytes);
    const answers=await makePdf("HSK Level-Aligned Practice Assessment v2 · Answers and Explanations","Every objective answer includes evidence and distractor analysis. Apply only the rubric band named for that level. Scores are unofficial diagnostics.",selections.flatMap(selection=>[0,1,2].flatMap(variant=>assessmentAnswerSections(selection,variant))),fontBytes);
    const transcripts=await makePdf("HSK Level-Aligned Practice Assessment v2 · Facilitator Transcripts","Exact spoken transcript for each matching MP3. Playback: once at natural pace, with five seconds of silence after every numbered question. Synthetic voice provenance is recorded in README and manifest.",forms.map(form=>({heading:`Form ${form} · exact MP3 transcript`,body:mockAssessmentListeningScript(form).split("\n")})),fontBytes);
    const scoreReport=await makePdf("HSK Level-Aligned Practice Assessment v2 · Score Report","Record evidence by skill, identify the weakest result and complete the linked practice before attempting the next form.",selections.flatMap(assessmentReportSections),fontBytes);
    const scoreRows=["form,level,date,listening_0_10,reading_0_10,writing_0_10,total_0_30,weakest_skill,recommended_practice,next_review_date",...forms.flatMap(form=>selections.map(selection=>`${form},${selection.level},,,,,,,,`))];
    const audioFiles=forms.map(form=>({name:`HSKKit-Practice-Assessment-${form}-Listening.mp3`,data:assessmentAudio![form]!}));
    const audioNotice=encoder.encode(["HSKKit Practice Assessment Pack v2 · Audio Source and License Notice","","Synthetic voice engine: Piper","Voice model: zh_CN-chaowen-medium (Chaowen)","Voice repository: https://huggingface.co/rhasspy/piper-voices/tree/main/zh/zh_CN/chaowen/medium","Repository license: MIT (see repository license metadata)","Model card: https://huggingface.co/rhasspy/piper-voices/blob/main/zh/zh_CN/chaowen/medium/MODEL_CARD","Training dataset: Chinese Standard Mandarin Speech Corpus","Dataset source: https://www.data-baker.com/open_source.html","Dataset license in model card: CC0-1.0","Generated by HSKKit on 2026-08-26. Synthetic voice; no natural person is represented or imitated.","Each numbered question is followed by five seconds of encoded response silence.","File identity is pinned by SHA-256 in manifest.json."].join("\r\n"));
    const files=[...studentFiles,...audioFiles,{name:"HSKKit-Practice-Assessment-Audio-Source-License.txt",data:audioNotice},{name:"HSKKit-Practice-Assessment-Answer-Sheets.pdf",data:answerSheets},{name:"HSKKit-Practice-Assessment-Answers-Explanations.pdf",data:answers},{name:"HSKKit-Practice-Assessment-Facilitator-Transcripts.pdf",data:transcripts},{name:"HSKKit-Practice-Assessment-Score-Report.pdf",data:scoreReport},{name:"HSKKit-Practice-Assessment-Score-Tracker.csv",data:encoder.encode(scoreRows.join("\r\n"))},{name:"HSKKit-Practice-Assessment-Score-Tracker.xlsx",data:generatePracticeAssessmentScoreWorkbook()}];const manifest=manifestFor(product,files.map(file=>file.name),selections,generationVersion);return {bytes:packageZip(product,files,manifest),format:"zip" as const,manifest};
  }
  // Every printed lesson word is the exact authorized catalog object represented by this artifact manifest.
  const pack=buildTeacherLessonPack(teacherLessonSources(selections));
  // Fontkit mutates font parsing state; create the PDF files sequentially.
  const quickStart=await makeTeacherQuickStartPdf(pack,fontBytes);
  const teacherA4=await makeTeacherPlanPdf(pack,fontBytes,TEACHER_PAGE_SIZES.A4);
  const teacherLetter=await makeTeacherPlanPdf(pack,fontBytes,TEACHER_PAGE_SIZES.LETTER);
  const studentA4=await makeStudentHandoutPdf(pack,fontBytes,TEACHER_PAGE_SIZES.A4);
  const studentLetter=await makeStudentHandoutPdf(pack,fontBytes,TEACHER_PAGE_SIZES.LETTER);
  const exitA4=await makeTeacherCutPdf(pack,fontBytes,TEACHER_PAGE_SIZES.A4,"exit");
  const exitLetter=await makeTeacherCutPdf(pack,fontBytes,TEACHER_PAGE_SIZES.LETTER,"exit");
  const homework=await makeHomeworkPdf(pack,fontBytes);
  const cardsA4=await makeTeacherCutPdf(pack,fontBytes,TEACHER_PAGE_SIZES.A4,"activity");
  const cardsLetter=await makeTeacherCutPdf(pack,fontBytes,TEACHER_PAGE_SIZES.LETTER,"activity");
  const editableSlides=await generateTeacherLessonPptx(pack);
  const files=[
    {name:"HSKKit-Teacher-Pack-Quick-Start.pdf",data:quickStart},
    {name:"HSKKit-Teacher-Lesson-Plans-A4.pdf",data:teacherA4},
    {name:"HSKKit-Teacher-Lesson-Plans-US-Letter.pdf",data:teacherLetter},
    {name:"HSKKit-Student-Handouts-A4.pdf",data:studentA4},
    {name:"HSKKit-Student-Handouts-US-Letter.pdf",data:studentLetter},
    {name:"HSKKit-Exit-Tickets-A4.pdf",data:exitA4},
    {name:"HSKKit-Exit-Tickets-US-Letter.pdf",data:exitLetter},
    {name:"HSKKit-Homework-Answers-Rubrics.pdf",data:homework},
    {name:"HSKKit-Activity-Cards-A4.pdf",data:cardsA4},
    {name:"HSKKit-Activity-Cards-US-Letter.pdf",data:cardsLetter},
    {name:"HSKKit-Editable-Lesson-Plans.docx",data:generateTeacherLessonDocx(pack)},
    {name:"HSKKit-Editable-Classroom-Slides.pptx",data:editableSlides},
  ];
  const manifest=manifestFor(product,files.map(file=>file.name),selections,generationVersion);return {bytes:packageZip(product,files,manifest),format:"zip" as const,manifest};
}
