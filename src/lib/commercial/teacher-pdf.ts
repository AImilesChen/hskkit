import fontkit from "@pdf-lib/fontkit";
import {PDFDocument,rgb,type PDFFont,type PDFPage} from "pdf-lib";
import type {TeacherLessonPack,TeacherLessonLevel} from "./teacher-lesson-pack.ts";

export const TEACHER_PAGE_SIZES={A4:[595.28,841.89] as [number,number],LETTER:[612,792] as [number,number]};
const DARK=rgb(.04,.31,.29),INK=rgb(.11,.15,.22),MUTED=rgb(.34,.40,.46),LINE=rgb(.72,.80,.79);

function wrap(value:string,font:PDFFont,size:number,width:number){
  const lines:string[]=[];
  let current="";
  for(const char of value){
    if(char==="\n"){lines.push(current);current="";continue;}
    const next=current+char;
    if(current&&font.widthOfTextAtSize(next,size)>width){
      const wordBreak=current.lastIndexOf(" ");
      if(wordBreak>0){
        lines.push(current.slice(0,wordBreak));
        current=current.slice(wordBreak+1)+char;
      }else{
        lines.push(current);
        current=char;
      }
    }
    else current=next;
  }
  if(current)lines.push(current);
  return lines;
}
async function base(title:string,fontBytes:Uint8Array){
  const pdf=await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font=await pdf.embedFont(new Uint8Array(fontBytes),{subset:false});
  pdf.setTitle(title);
  pdf.setAuthor("HSKKit");
  pdf.setSubject("Unofficial HSK 3.0 classroom teaching resource");
  return {pdf,font};
}
function text(page:PDFPage,font:PDFFont,value:string,x:number,y:number,size:number,width:number,color=INK,lineHeight=size+3){
  for(const row of wrap(value,font,size,width)){page.drawText(row,{x,y,size,font,color});y-=lineHeight;}
  return y;
}
function header(page:PDFPage,font:PDFFont,width:number,height:number,label:string,pageNo:number){
  page.drawRectangle({x:0,y:height-36,width,height:36,color:DARK});
  page.drawText(label,{x:28,y:height-23,size:9,font,color:rgb(1,1,1)});
  page.drawText(String(pageNo),{x:width-42,y:20,size:8,font,color:MUTED});
}
function section(page:PDFPage,font:PDFFont,title:string,body:string,y:number,width:number){
  const contentWidth=width-76;
  const lines=wrap(body,font,10,contentWidth);
  const height=Math.max(56,30+lines.length*13.5);
  page.drawRectangle({x:28,y:y-height,width:width-56,height,borderColor:LINE,borderWidth:.7,color:rgb(.985,.992,.99)});
  page.drawText(title,{x:38,y:y-18,size:11,font,color:DARK});
  text(page,font,body,38,y-36,10,contentWidth,INK,13.5);
  return y-height-11;
}
function stageCard(page:PDFPage,font:PDFFont,level:TeacherLessonLevel,stage:TeacherLessonLevel["plans"][45]["stages"][number],y:number,width:number){
  const body="Teacher: "+stage.teacherAction+"\nStudents: "+stage.studentAction+"\nEvidence: "+stage.evidence;
  const lines=wrap(body,font,9.5,width-76);
  const height=Math.max(60,30+lines.length*12.5);
  page.drawRectangle({x:28,y:y-height,width:width-56,height,borderColor:LINE,borderWidth:.7,color:stage.mode==="communicative-task"?rgb(.94,.97,1):stage.mode==="pair-work"?rgb(.94,.99,.96):rgb(1,1,1)});
  page.drawText(String(stage.minutes)+" min · "+stage.title,{x:38,y:y-17,size:10.5,font,color:DARK});
  text(page,font,body,38,y-32,9.5,width-76,INK,12.5);
  if(level.level<1)throw new Error("INVALID_TEACHER_LEVEL");
  return y-height-7;
}

export async function makeTeacherQuickStartPdf(pack:TeacherLessonPack,fontBytes:Uint8Array){
  const {pdf,font}=await base("HSK Teacher Lesson Plan Pack · Quick Start",fontBytes);
  const page=pdf.addPage(TEACHER_PAGE_SIZES.A4),[width,height]=TEACHER_PAGE_SIZES.A4;
  header(page,font,width,height,"HSKKit · Teacher Lesson Plan Pack v4 · Quick Start",1);
  let y=height-72;
  y=text(page,font,pack.title,30,y,18,width-60,DARK,23)-8;
  y=text(page,font,"Nine level modules; each module has 45, 60 and 90-minute variants. These are three ways to teach one module, not 27 unrelated lessons.",30,y,10,width-60,INK,14)-8;
  y=text(page,font,pack.sourceNotice,30,y,8.5,width-60,rgb(.45,.28,.08),12)-15;
  const groups=[
    ["1 · Choose",["Pick one level and one duration. In Teacher Lesson Plans, the classroom flow is followed by a separate preparation and feedback page.","Use the PPTX level sequence: retrieval, matching, sentence repair, partner exchange, communication and exit check. Skip extension slides for a shorter class."]],
    ["2 · Prepare",["Print one Student Handout and assigned Homework page per learner. Print and cut an Exit Ticket for each learner; Activity Cards A/B go to different partners.","Keep the Answer Key and Feedback Rubric with the teacher. Editable DOCX plans can be adapted to local names and context."]],
    ["3 · Teach and check",["Use the lesson flow to model, practise and collect independent evidence. The slide prompts are for projection; full instructions and answers stay in the PDFs.","Score the Exit Ticket 0–3, assign retrieval, usage repair or extension Homework, and start the next lesson from the weakest evidence."]],
    ["File map",["Teacher Plans: 27 flows, each with 2 pages, in A4 and US Letter. Student Handouts: one page per level in both sizes.","Exit Tickets: four cuttable copies per page in both sizes. Activity Cards: A/B per level in both sizes. Homework, answer key and rubric: 18 A4 pages.","Editable Lesson Plans.docx: teacher text. Editable Classroom Slides.pptx: student-facing prompts. No audio is included."]],
  ] as const;
  for(const [title,items] of groups){
    y=text(page,font,title,30,y,12,width-60,DARK,16)-3;
    for(const item of items)y=text(page,font,"- "+item,38,y,9.5,width-76,INK,13)-5;
    y-=8;
  }
  if(y<40)throw new Error("TEACHER_QUICK_START_OVERFLOW");
  return new Uint8Array(await pdf.save({useObjectStreams:false}));
}

export async function makeTeacherPlanPdf(pack:TeacherLessonPack,fontBytes:Uint8Array,pageSize:[number,number]){
  const {pdf,font}=await base("HSK Teacher Lesson Plans · Levels 1–9 · 45/60/90",fontBytes);
  const [width,height]=pageSize;
  let pageNo=0;
  for(const level of pack.levels){
    for(const minutes of [45,60,90] as const){
      const flow=pdf.addPage(pageSize);
      header(flow,font,width,height,"HSKKit · Level "+level.level+" · "+minutes+"-minute flow · 1/2",++pageNo);
      let y=height-67;
      y=text(flow,font,"Level "+level.level+" · "+minutes+"-minute lesson",28,y,16,width-56,DARK,20)-4;
      y=text(flow,font,"Objective: "+level.objective,28,y,9.5,width-56,INK,13)-2;
      y=text(flow,font,"Words: "+level.targetVocabulary.map(word=>word.hanzi+" ("+word.pinyin+")").join(" · "),28,y,9,width-56,INK,12)-2;
      y=text(flow,font,"Pattern: "+level.grammarPattern+" · Focus: "+level.teachingFocus,28,y,9,width-56,rgb(.45,.28,.08),12)-9;
      for(const stage of level.plans[minutes].stages)y=stageCard(flow,font,level,stage,y,width);
      if(y<42)throw new Error("TEACHER_FLOW_OVERFLOW:Level "+level.level+":"+minutes);
      if(y>120){
        y-=9;
        y=text(flow,font,"Teacher notes · observed strengths, errors and next action",28,y,10.5,width-56,DARK,14)-9;
        while(y>65){
          flow.drawLine({start:{x:30,y},end:{x:width-30,y},thickness:.45,color:LINE});
          y-=24;
        }
      }
      const guidance=pdf.addPage(pageSize);
      header(guidance,font,width,height,"HSKKit · Level "+level.level+" · "+minutes+"-minute guidance · 2/2",++pageNo);
      let g=height-67;
      g=text(guidance,font,"Preparation, answers and next steps",28,g,16,width-56,DARK,21)-13;
      const cards=[
        ["Preparation",level.preparation.join(" ")],
        ["Teacher modeling",level.teacherModel.join(" ")],
        ["Common errors",level.commonErrors.join(" · ")],
        ["Exit evidence",level.exitTicket.questions.join(" ")],
        ["Homework + rubric",level.homework.questions[0]+" Criteria: "+level.homework.rubric.criteria.join("; ")+"."],
        ["Differentiation","Support: "+level.differentiation.support.join(" ")+" Extension: "+level.differentiation.extension.join(" ")],
      ];
      for(const [title,body] of cards)g=section(guidance,font,title,body,g,width);
      if(g<40)throw new Error("TEACHER_GUIDANCE_OVERFLOW:Level "+level.level+":"+minutes);
    }
  }
  return new Uint8Array(await pdf.save({useObjectStreams:false}));
}

export async function makeStudentHandoutPdf(pack:TeacherLessonPack,fontBytes:Uint8Array,pageSize:[number,number]){
  const {pdf,font}=await base("HSK Teacher Pack · Student Handouts",fontBytes);
  const [width,height]=pageSize;
  let pageNo=0;
  for(const level of pack.levels){
    const page=pdf.addPage(pageSize);
    header(page,font,width,height,"HSKKit · Level "+level.level+" · Student Handout",++pageNo);
    let y=height-65;
    y=text(page,font,"Level "+level.level+" · Student Handout",28,y,16,width-56,DARK,20)-8;
    for(const item of level.studentHandout)y=text(page,font,item,30,y,9.5,width-60,INK,13)-5;
    y=text(page,font,"Guided Practice",28,y-4,12,width-56,DARK,16)-3;
    for(const [index,item] of level.guidedPractice.entries()){
      y=text(page,font,String(index+1)+". "+item,30,y,9.2,width-60,INK,12.5)-5;
      page.drawLine({start:{x:36,y},end:{x:width-36,y},thickness:.45,color:LINE});
      y-=15;
    }
    y=text(page,font,"Pair Work",28,y,12,width-56,DARK,16)-3;
    y=text(page,font,level.pairWork,30,y,9.2,width-60,INK,12.5)-8;
    y=text(page,font,"Independent Practice",28,y,12,width-56,DARK,16)-3;
    y=text(page,font,level.independentPractice,30,y,9.2,width-60,INK,12.5)-9;
    if(y<50)throw new Error("STUDENT_HANDOUT_OVERFLOW:Level "+level.level);
    while(y>54){page.drawLine({start:{x:36,y},end:{x:width-36,y},thickness:.45,color:LINE});y-=19;}
  }
  return new Uint8Array(await pdf.save({useObjectStreams:false}));
}

export async function makeHomeworkPdf(pack:TeacherLessonPack,fontBytes:Uint8Array){
  const {pdf,font}=await base("HSK Teacher Pack · Homework, Answers and Rubrics",fontBytes);
  const [width,height]=TEACHER_PAGE_SIZES.A4;
  let pageNo=0;
  for(const level of pack.levels){
    for(const mode of ["student","key"] as const){
      const page=pdf.addPage(TEACHER_PAGE_SIZES.A4);
      const title=mode==="student"?"Homework":"Answer Key and Feedback Rubric";
      header(page,font,width,height,"HSKKit · Level "+level.level+" · "+title,++pageNo);
      let y=height-66;
      y=text(page,font,"Level "+level.level+" · "+title,28,y,16,width-56,DARK,20)-9;
      if(mode==="student"){
        y=text(page,font,"Required output: "+level.outputConstraint,28,y,9.5,width-56,rgb(.45,.28,.08),13)-10;
        for(const item of level.homework.questions){
          y=text(page,font,item,30,y,10,width-60,INK,14)-8;
          const count=level.level<=2?5:level.level<=6?7:10;
          for(let i=0;i<count;i++){page.drawLine({start:{x:36,y},end:{x:width-36,y},thickness:.45,color:LINE});y-=16;}
          y-=8;
        }
      }else{
        for(const answer of level.homework.answers)y=text(page,font,answer,30,y,9.5,width-60,INK,13)-10;
        y=text(page,font,"Worked response and scoring note",28,y-4,12,width-56,DARK,16)-4;
        y=text(page,font,level.homework.workedExample,30,y,9.5,width-60,INK,13)-13;
        y=text(page,font,"Scoring criteria",28,y,12,width-56,DARK,16)-4;
        for(const criterion of level.homework.rubric.criteria)y=text(page,font,"- "+criterion,34,y,9.5,width-68,INK,13)-5;
        y=text(page,font,"Feedback bands",28,y-3,12,width-56,DARK,16)-4;
        for(const band of level.homework.rubric.bands)y=text(page,font,"- "+band,34,y,9.5,width-68,INK,13)-5;
      }
      if(y<42)throw new Error("TEACHER_HOMEWORK_OVERFLOW:Level "+level.level+":"+mode);
    }
  }
  return new Uint8Array(await pdf.save({useObjectStreams:false}));
}

export async function makeTeacherCutPdf(pack:TeacherLessonPack,fontBytes:Uint8Array,pageSize:[number,number],mode:"exit"|"activity"){
  const {pdf,font}=await base(mode==="exit"?"HSK Teacher Pack · Cuttable Exit Tickets":"HSK Teacher Pack · Activity Cards",fontBytes);
  const [width,height]=pageSize,cut=rgb(.55,.6,.64);
  for(const level of pack.levels){
    const page=pdf.addPage(pageSize);
    page.drawText("HSKKit · Level "+level.level+" · "+(mode==="exit"?"Cuttable Exit Tickets · four copies":"Pair Activity Cards · A / B"),{x:28,y:height-24,size:9,font,color:DARK});
    if(mode==="exit"){
      const margin=24,gap=10,cardWidth=(width-margin*2-gap)/2,cardHeight=(height-64-gap)/2;
      page.drawLine({start:{x:width/2,y:24},end:{x:width/2,y:height-34},thickness:.6,color:cut,dashArray:[4,4]});
      page.drawLine({start:{x:24,y:height/2-5},end:{x:width-24,y:height/2-5},thickness:.6,color:cut,dashArray:[4,4]});
      for(let copy=0;copy<4;copy++){
        const col=copy%2,row=Math.floor(copy/2),x=margin+col*(cardWidth+gap),top=height-44-row*(cardHeight+gap);
        page.drawRectangle({x,y:top-cardHeight,width:cardWidth,height:cardHeight,borderColor:cut,borderWidth:.7});
        let y=top-23;
        y=text(page,font,"Level "+level.level+" · Exit Ticket",x+12,y,12,cardWidth-24,DARK,15)-7;
        for(const question of level.exitTicket.questions)y=text(page,font,question,x+12,y,9,cardWidth-24,INK,12)-8;
        y=text(page,font,"Name: __________  Score: 0 / 1 / 2 / 3",x+12,y,8.8,cardWidth-24,MUTED,12)-5;
        y=text(page,font,"Next: retrieval / repair / extension",x+12,y,8.8,cardWidth-24,MUTED,12)-12;
        while(y>top-cardHeight+25){page.drawLine({start:{x:x+12,y},end:{x:x+cardWidth-12,y},thickness:.45,color:LINE});y-=22;}
      }
    }else{
      const margin=28,gap=14,cardHeight=(height-70-gap)/2;
      page.drawLine({start:{x:24,y:height/2-6},end:{x:width-24,y:height/2-6},thickness:.6,color:cut,dashArray:[4,4]});
      const cards=(["A","B"] as const).map(role=>{
        const activity=level.activityCards[role];
        return {label:"Card "+role+" · "+activity.title,body:[...activity.facts.map(item=>"FACT · "+item),...activity.instructions.map(item=>"DO · "+item),"Target words: "+(role==="A"?level.targetVocabulary.slice(0,3):level.targetVocabulary.slice(3)).map(word=>word.hanzi).join("、"),"Required evidence: "+level.outputConstraint]};
      });
      cards.forEach((card,index)=>{
        const top=height-42-index*(cardHeight+gap);
        page.drawRectangle({x:margin,y:top-cardHeight,width:width-margin*2,height:cardHeight,borderColor:cut,borderWidth:.8});
        let y=top-22;
        y=text(page,font,"Level "+level.level+" · "+card.label,margin+14,y,12,width-margin*2-28,DARK,15)-10;
        for(const item of card.body)y=text(page,font,item,margin+14,y,9,width-margin*2-28,INK,12)-7;
        page.drawText("Evidence notes:",{x:margin+14,y:y-4,size:9,font,color:MUTED});
        page.drawLine({start:{x:margin+92,y:y-2},end:{x:width-margin-14,y:y-2},thickness:.6,color:MUTED});
      });
    }
  }
  return new Uint8Array(await pdf.save({useObjectStreams:false}));
}
