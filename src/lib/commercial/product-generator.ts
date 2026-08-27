import fontkit from "@pdf-lib/fontkit";
import {PDFDocument,rgb,type PDFFont,type PDFPage} from "pdf-lib";
import {selectPackAssets} from "./catalog.ts";
import {generateZipFiles} from "./generator.ts";
import {digitalProduct,generationVersionForProduct,type DigitalProduct,type DigitalProductId} from "./products.ts";
import {assessmentListeningScript,assessmentScenario,type AssessmentForm} from "./mock-assessment-content.ts";
import {generateAssessmentWorkbook} from "./assessment-workbook.ts";
import {buildWorksheetLevel,type WorksheetLevel} from "./worksheet-pack.ts";
import {buildPlannerPack,type PlannerPack} from "./planner-pack.ts";
import {buildTeacherLessonPack} from "./teacher-lesson-pack.ts";
import {generateTeacherLessonDocx,generateTeacherLessonPptx} from "./teacher-office.ts";
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
    :product.id==="mock-exam-pack"?[]
    :product.id==="teacher-lesson-plan-pack"?teacherLessonSources(selections).flatMap(source=>source.words):[];
  const unique=new Map<string,{id:string;version:string;sourceRef:string;licenseRef:string}>();
  for(const asset of selected)unique.set(`${asset.id}:${asset.version}`,{id:asset.id,version:asset.version,sourceRef:asset.sourceRef,licenseRef:asset.licenseRef});
  return [...unique.values()];
}
function manifestFor(product:DigitalProduct,files:string[],selections:Selection[],generationVersion:string):ProductArtifactManifest{
  return {schemaVersion:"hskkit-product-manifest-v1",productId:product.id,generationVersion,standard:"HSK 3.0",standardVersion:"GF0025-2021",officialExam:false,levels:product.levels,advancedBandDisclosure:"HSK 3.0 defines one unified Levels 7–9 advanced ability band; Level 7, 8 and 9 labels in this resource use the same canonical approved advanced source set.",licenseNotice:"Personal, non-transferable study and print use only.",files,sourceIndependent:product.id==="30-day-planner"||product.id==="mock-exam-pack",assets:productAssets(product,selections),...(product.id==="mock-exam-pack"?{audioProvenance:ASSESSMENT_AUDIO_PROVENANCE}:{})};
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
async function makePdf(title:string,subtitle:string,sections:PdfSection[],fontBytes:Uint8Array,pageSize:[number,number]=[595.28,841.89]){
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(new Uint8Array(fontBytes),{subset:false});
  pdf.setTitle(title);pdf.setAuthor("HSKKit");pdf.setSubject("HSK 3.0 unofficial learning resource");pdf.setKeywords(["HSK 3.0","unofficial","HSKKit"]);
  const size:[number,number]=pageSize;let page:PDFPage;let y=0;let pageNumber=0;const [pageWidth,pageHeight]=size;
  const header=title.includes("Practice Assessment")?"HSKKit · Practice Assessment v2 · HSK 3.0 · Unofficial":"HSKKit · HSK 3.0 · Unofficial learning resource";
  const contentWidth=pageWidth-75;
  const fresh=()=>{page=pdf.addPage(size);pageNumber+=1;page.drawRectangle({x:0,y:pageHeight-30,width:pageWidth,height:30,color:rgb(.04,.31,.29)});page.drawText(header,{x:32,y:pageHeight-20,size:9,font,color:rgb(1,1,1)});page.drawText(String(pageNumber),{x:pageWidth-55,y:26,size:8,font,color:rgb(.45,.5,.56)});y=pageHeight-57;};
  fresh();for(const line of wordLines(title,font,20,contentWidth)){page!.drawText(line,{x:36,y,size:20,font,color:rgb(.04,.31,.29)});y-=27;}y-=5;
  for(const line of wordLines(subtitle,font,9.5,contentWidth)){page!.drawText(line,{x:36,y,size:9.5,font,color:rgb(.25,.3,.38)});y-=14;}
  for(const line of wordLines("Advanced-band disclosure: HSK 3.0 defines one unified Levels 7–9 band; Level 7/8/9 labels use the same canonical approved source set.",font,8.5,contentWidth)){page!.drawText(line,{x:36,y,size:8.5,font,color:rgb(.45,.28,.08)});y-=12;}y-=12;
  for(const section of sections){if(section.pageBreakBefore||y<112)fresh();for(const headingLine of wordLines(section.heading,font,14,contentWidth)){if(y<72)fresh();page!.drawText(headingLine,{x:36,y,size:14,font,color:rgb(.04,.31,.29)});y-=18;}y-=4;for(const item of section.body){for(const line of wordLines(item,font,9.5,contentWidth-10)){if(y<58)fresh();page!.drawText(line,{x:44,y,size:9.5,font,color:rgb(.12,.16,.24)});y-=14;}y-=5;}y-=10;}
  return new Uint8Array(await pdf.save({useObjectStreams:false}));
}
function readme(product:DigitalProduct,files:string[],manifest:ProductArtifactManifest){
  const audio=manifest.audioProvenance;
  const quickStart=audio?[
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
    "Licensed for personal, non-transferable study and print use only."
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
  const response=(page:PDFPage,name:string,label:string,x:number,top:number,fieldWidth:number,fieldHeight:number)=>{page.drawText(label,{x,y:top,size:8.2,font,color:muted});const boxY=top-fieldHeight-6;if(form){const field=form.createTextField(name);field.enableMultiline();field.addToPage(page,{x,y:boxY,width:fieldWidth,height:fieldHeight,borderColor:lineColor,borderWidth:.7,textColor:ink,font});field.setFontSize(8);}else{page.drawRectangle({x,y:boxY,width:fieldWidth,height:fieldHeight,borderColor:lineColor,borderWidth:.7});for(let line=boxY+10;line<boxY+fieldHeight;line+=11)page.drawLine({start:{x:x+5,y:line},end:{x:x+fieldWidth-5,y:line},thickness:.35,color:lineColor});}return boxY-16;};

  {
    const page=fresh("Start here · diagnosis, goal and route");
    let y=742;y=drawWrapped(page,plan.positioning,30,y,11,width-60,dark,15)-8;y=drawWrapped(page,plan.workflow.join(" → "),30,y,8.5,width-60,muted,12)-16;
    const fields=[["planner.setup.currentLevel","Current Level"],["planner.setup.targetLevel","Target Level"],["planner.setup.examDateOrGoal","Exam date or study goal"],["planner.setup.dailyMinutes","Daily available time"],["planner.setup.weakAreas","Initial weak areas"],["planner.setup.route","Selected route: 20 / 30 / 45"],["planner.setup.assessment.vocabulary","Assessment · vocabulary score out of 100"],["planner.setup.assessment.listening","Assessment · listening score out of 100"],["planner.setup.assessment.reading","Assessment · reading score out of 100"],["planner.setup.assessment.writing","Assessment · writing score out of 100"]] as const;
    for(let index=0;index<fields.length;index+=2){const left=fields[index],right=fields[index+1];response(page,left[0],left[1],30,y,250,42);response(page,right[0],right[1],315,y,250,42);y-=88;}
  }
  {
    const page=fresh("Assessment result → practice direction");let y=742;y=drawWrapped(page,"Find the lowest skill score, choose its band, and start with the printed assignment. Recheck with fresh material on Days 14 and 28.",30,y,9,width-60,ink,13)-10;
    for(const mapping of plan.assessmentMappings){y=drawWrapped(page,`${mapping.skill.toUpperCase()} · ${mapping.band} · ${mapping.practiceDirection.join(" + ")}`,32,y,9,width-64,dark,11.5);y=drawWrapped(page,`First assignment: ${mapping.firstAssignment}`,42,y,8.5,width-84,muted,11)-6;}
  }
  for(const day of plan.days){
    const page=fresh(`Day ${day.day} · ${day.phase} · ${day.focus}`);let y=742;
    y=drawWrapped(page,`Materials: ${day.materials.join(" · ")}`,30,y,8.2,width-60,muted,11)-8;
    for(const minutes of [20,30,45] as const){page.drawRectangle({x:30,y:y-74,width:width-60,height:70,borderColor:lineColor,borderWidth:.8});y=drawWrapped(page,day.routes[minutes],40,y-17,8,width-80,ink,10)-18;}
    y=drawWrapped(page,`Evidence target: ${day.evidence.join(" · ")}`,30,y,8.2,width-60,dark,11)-12;
    y=response(page,`planner.day${day.day}.completed`,"Completed work / route used",30,y,width-60,22);
    y=response(page,`planner.day${day.day}.evidence`,"Measured evidence (counts, accuracy or completed output)",30,y,width-60,38);
    y=response(page,`planner.day${day.day}.difficult`,"What was difficult and why?",30,y,width-60,38);
    response(page,`planner.day${day.day}.nextReview`,"Next review date / next action",30,y,width-60,28);
    const review=plan.weeklyReviews.find(item=>item.day===day.day);if(review){const reviewPage=fresh(`Day ${day.day} · Weekly evidence review`);let reviewY=742;for(const [index,prompt] of review.prompts.entries()){reviewY=response(reviewPage,`planner.week${day.day}.${["progress","missed","adjustment","nextFocus"][index]}`,prompt,30,reviewY,width-60,105);}}
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

async function makeWorksheetPdf(plans:WorksheetLevel[],fontBytes:Uint8Array,options:WorksheetPdfOptions){
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(new Uint8Array(fontBytes),{subset:false});
  const form=options.mode==="fillable"?pdf.getForm():null;
  const [width,height]=WORKSHEET_PAGE_SIZES[options.pageSize];
  const dark=rgb(.04,.31,.29),ink=rgb(.11,.15,.22),muted=rgb(.38,.43,.5),lineColor=options.lowInk?rgb(.72,.72,.72):rgb(.55,.68,.65);
  pdf.setTitle(`HSK Worksheet Pack · ${options.mode==="answer"?"Answer Key":options.mode==="fillable"?"Fillable Student Workbook":"Student Workbook"} · ${options.pageSize}`);
  pdf.setAuthor("HSKKit");pdf.setSubject("Differentiated HSK 3.0 Level 1–9 multi-skill worksheets");
  let pageNumber=0;
  const drawText=(page:PDFPage,text:string,x:number,y:number,size:number,maxWidth:number,color=ink,lineHeight=size+3)=>{const wrapped=wordLines(text,font,size,maxWidth);for(const row of wrapped){page.drawText(row,{x,y,size,font,color});y-=lineHeight;}return y;};
  for(const plan of plans)for(const worksheetModule of plan.modules){
    const page=pdf.addPage([width,height]);pageNumber+=1;
    if(options.lowInk){page.drawLine({start:{x:30,y:height-32},end:{x:width-30,y:height-32},thickness:1,color:dark});}
    else page.drawRectangle({x:0,y:height-39,width,height:39,color:dark});
    page.drawText(`HSKKit · Level ${plan.level} · ${options.mode==="answer"?"Teacher Answer Key":"Student Worksheet"}`,{x:30,y:height-25,size:9,font,color:options.lowInk?dark:rgb(1,1,1)});
    page.drawText(String(pageNumber),{x:width-48,y:22,size:8,font,color:muted});
    let y=height-65;
    y=drawText(page,worksheetModule.title,30,y,15,width-60,dark,19)-2;
    y=drawText(page,plan.difficultyNote,30,y,8.2,width-60,muted,11)-3;
    y=drawText(page,worksheetModule.instruction,30,y,8.7,width-60,ink,12)-5;
    for(const question of worksheetModule.questions){
      if(options.mode==="answer"){
        y=drawText(page,`${question.id} · Answer: ${question.answer}`,34,y,8,width-68,dark,10)-2;
        y=drawText(page,`Why: ${question.explanation}`,40,y,7.5,width-80,ink,9.5)-2;
        y=drawText(page,question.commonError,40,y,7.5,width-80,muted,9.5)-7;
      }else{
        y=drawText(page,`${question.id} · ${question.prompt}`,34,y,8.2,width-68,ink,10.5)-4;
        const responseHeight=Math.max(18,question.responseLines*10.5);
        if(form){
          const field=form.createTextField(`worksheet.${question.id}`);field.enableMultiline();
          field.addToPage(page,{x:40,y:y-responseHeight+4,width:width-80,height:responseHeight,borderColor:lineColor,borderWidth:.75,textColor:ink,font});field.setFontSize(8);
          y-=responseHeight+8;
        }else{
          for(let row=0;row<question.responseLines;row++){page.drawLine({start:{x:40,y},end:{x:width-40,y},thickness:.55,color:lineColor});y-=10.5;}
          y-=7;
        }
      }
    }
    if(options.mode==="answer")page.drawText("Key rule: score every ID against the matching student item; original output may vary only within the printed criteria.",{x:30,y:35,size:7.5,font,color:muted});
    else{
      page.drawText("Name:",{x:30,y:35,size:7.5,font,color:muted});page.drawLine({start:{x:58,y:34},end:{x:170,y:34},thickness:.6,color:muted});
      page.drawText("Date:",{x:190,y:35,size:7.5,font,color:muted});page.drawLine({start:{x:216,y:34},end:{x:310,y:34},thickness:.6,color:muted});
      page.drawText("Check only after completing all three IDs.",{x:330,y:35,size:7.5,font,color:muted});
    }
  }
  if(form)form.updateFieldAppearances(font);
  return new Uint8Array(await pdf.save({useObjectStreams:false}));
}

function worksheetSampleSections(plans:WorksheetLevel[]):PdfSection[]{
  return plans.flatMap(plan=>{
    const samples=[plan.modules[2].questions[0],plan.modules[6].questions[0],plan.modules[8].questions[0]];
    return samples.map((question,index)=>({heading:`Level ${plan.level} · Completed student sample ${index+1} of 3`,pageBreakBefore:plan.level!==1||index!==0,body:[`${question.id} · Prompt: ${question.prompt}`,`Completed response: ${question.sampleResponse}`,`Self-check: ${question.explanation}`,question.commonError]}));
  });
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
  const product=digitalProduct(productId);if(!product||product.category!=="resource")throw new Error("INVALID_DIFFERENTIATED_PRODUCT");
  const selections=[1,2,3,4,5,6,7,8,9].map(selectPackAssets);
  if(product.id==="30-day-planner"){
    const plan=buildPlannerPack();
    const quickStart=await makePdf("HSK 30-Day Planner · Quick Start",plan.positioning,[{heading:"Core workflow",body:[plan.workflow.join(" → "),"Before Day 1, record current Level, target Level, exam date or study goal, daily time, weak areas and initial Assessment scores.","Choose one route for seven days. The 20, 30 and 45-minute routes change task quantity, input length and required output—not only the timer."]},{heading:"Use evidence to personalize",body:["Find the lowest Assessment skill and band on the mapping page. Start with its named assignment.","Complete one daily page, record measurable evidence, then use Days 7, 14, 21 and 28 to adjust the next week.","If a day is missed, complete the formal Missed-Day Recovery Worksheet. Keep the next calendar date and move only unfinished retrieval/correction work.","On Day 30, repeat the baseline with fresh material and choose the next-stage plan."]}],fontBytes);
    const printable=await makePlannerPdf(plan,fontBytes,false),fillable=await makePlannerPdf(plan,fontBytes,true);
    const files=[{name:"HSKKit-30-Day-Planner-Quick-Start.pdf",data:quickStart},{name:"HSKKit-30-Day-Planner-Printable-A4.pdf",data:printable},{name:"HSKKit-30-Day-Planner-Fillable-A4.pdf",data:fillable}];
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
    const quickStart=await makePdf("HSK Worksheet Pack · Quick Start","Use one differentiated module at a time. Student pages, answer pages and field IDs stay aligned from Level 1 through Level 9.",[
      {heading:"Choose the correct level and mode",body:["Levels 1–2: direct recognition, tone accuracy, short routines and controlled output.","Levels 3–4: paragraph context, reason/result, reconstruction and viewpoint support.","Levels 5–6: extended evidence, cause/effect, comparison and recommendation.","Levels 7–9: multi-paragraph discourse, cross-text synthesis, counterargument and formal reasoning.","Choose A4, US Letter, low-ink or fillable. All four student versions contain the same 270 question IDs."]},
      {heading:"20–35 minute study flow",pageBreakBefore:true,body:["1. Complete one three-item module without the answer key.","2. Use the printed response area; advanced writing tasks may continue on the back of the page.","3. Check the same IDs in the Teacher Answer Key. Read the explanation and common-error note.","4. Revise every missed item once, then record evidence and the next review date in the Progress Checklist."]},
      {heading:"Scoring and open responses",body:["Objective items must match the keyed target, form and evidence link.","Dialogue, writing and speaking responses may vary only when they preserve the keyed meaning and satisfy every printed Level constraint.","Completed Samples demonstrate the checking method; they are not scripts to copy."]},
    ],fontBytes);
    // Fontkit mutates parsing state; generate sequentially so shared font bytes cannot corrupt glyph maps.
    const studentA4=await makeWorksheetPdf(plans,fontBytes,{pageSize:"A4",mode:"student"});
    const studentLetter=await makeWorksheetPdf(plans,fontBytes,{pageSize:"LETTER",mode:"student"});
    const studentLowInk=await makeWorksheetPdf(plans,fontBytes,{pageSize:"A4",mode:"student",lowInk:true});
    const fillable=await makeWorksheetPdf(plans,fontBytes,{pageSize:"A4",mode:"fillable"});
    const answers=await makeWorksheetPdf(plans,fontBytes,{pageSize:"A4",mode:"answer"});
    const completedSamples=await makePdf("HSK Worksheet Pack · Completed Samples","Three worked models per level show how to answer, check the matching ID and revise from evidence.",worksheetSampleSections(plans),fontBytes);
    const checklistSections=plans.map(plan=>({heading:`Level ${plan.level} · Progress Checklist`,pageBreakBefore:true,body:[
      `Difficulty focus: ${plan.difficultyNote}`,
      ...plan.modules.map(module=>`□ ${module.title} · date ______ · correct before review ____ / 3 · correct after revision ____ / 3`),
      "Evidence note: __________________________________________________________________",
      "One recurring form / meaning / context error: ______________________________________",
      "Next review date: __________   Next module or level decision: ________________________",
    ]}));
    const checklist=await makePdf("HSK Worksheet Pack · Progress Checklist","Record performance by module and question ID. Confidence alone does not count as evidence.",checklistSections,fontBytes);
    const files=[
      {name:"HSKKit-Worksheet-Quick-Start.pdf",data:quickStart},
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
  if(product.id==="mock-exam-pack"){
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
    const files=[...studentFiles,...audioFiles,{name:"HSKKit-Practice-Assessment-Audio-Source-License.txt",data:audioNotice},{name:"HSKKit-Practice-Assessment-Answer-Sheets.pdf",data:answerSheets},{name:"HSKKit-Practice-Assessment-Answers-Explanations.pdf",data:answers},{name:"HSKKit-Practice-Assessment-Facilitator-Transcripts.pdf",data:transcripts},{name:"HSKKit-Practice-Assessment-Score-Report.pdf",data:scoreReport},{name:"HSKKit-Practice-Assessment-Score-Tracker.csv",data:encoder.encode(scoreRows.join("\r\n"))}];const manifest=manifestFor(product,files.map(file=>file.name),selections,generationVersion);return {bytes:packageZip(product,files,manifest),format:"zip" as const,manifest};
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
