import PptxGenJS from "pptxgenjs";
import type {TeacherLessonPack,TeacherLessonLevel} from "./teacher-lesson-pack.ts";

// These are projected learner prompts. Detailed timings and answer guidance live in
// the PDF/DOCX teacher plans, where they can be read without shrinking slide text.
export async function generateTeacherLessonPptx(pack:TeacherLessonPack){
  const pptx=new PptxGenJS();
  pptx.layout="LAYOUT_WIDE";
  pptx.author="HSKKit";
  pptx.company="HSKKit";
  pptx.title=pack.title;
  pptx.subject="Editable student-facing HSK 3.0 classroom prompts for Levels 1–9";
  pptx.theme={headFontFace:"Aptos Display",bodyFontFace:"Aptos"};
  const shape=pptx.ShapeType;
  const dark="064E3B",ink="172033",soft="F4FAF8",accent="0F766E";

  function base(level:number,title:string,step:string){
    const slide=pptx.addSlide();
    slide.background={color:"FFFFFF"};
    slide.addShape(shape.rect,{x:0,y:0,w:13.333,h:.82,fill:{color:dark},line:{color:dark}});
    slide.addText("LEVEL "+level+"  /  "+title,{x:.58,y:.20,w:11.9,h:.43,fontSize:25,bold:true,color:"FFFFFF",margin:0});
    slide.addText(step,{x:.62,y:7.07,w:11.95,h:.26,fontSize:11,color:"667085",margin:0,align:"right"});
    return slide;
  }
  function prompt(level:number,title:string,step:string,lead:string,body:string,tag:string){
    const slide=base(level,title,step);
    slide.addText(lead,{x:.68,y:1.22,w:11.95,h:.58,fontSize:24,bold:true,color:dark,margin:0});
    slide.addShape(shape.roundRect,{x:.62,y:2.08,w:12.08,h:3.54,rectRadius:.08,fill:{color:soft},line:{color:"B7DBD4",width:1.1}});
    slide.addText(body,{x:1.02,y:2.48,w:11.25,h:2.65,fontSize:21,color:ink,margin:0,breakLine:false,fit:"resize"});
    slide.addText(tag,{x:.72,y:5.95,w:11.9,h:.72,fontSize:17,color:accent,margin:0});
    return slide;
  }
  function extractGuided(line:string,label:string){
    return line.startsWith(label)?line.slice(label.length):line;
  }
  function slideLevel(level:TeacherLessonLevel){
    const words=level.targetVocabulary.map(word=>word.hanzi);
    const intro=base(level.level,"Your goal","1 / 8 · All durations");
    intro.addText(level.objective,{x:.68,y:1.38,w:11.9,h:1.12,fontSize:28,bold:true,color:dark,margin:0,breakLine:false,fit:"resize"});
    intro.addText("Target words",{x:.68,y:3.12,w:11.9,h:.48,fontSize:20,bold:true,color:accent,margin:0});
    intro.addText(words.join("     "),{x:.68,y:3.78,w:11.9,h:1.14,fontSize:29,bold:true,color:ink,margin:0,breakLine:false,fit:"resize"});
    intro.addText("Pattern: "+level.grammarPattern,{x:.68,y:5.45,w:11.9,h:.8,fontSize:20,color:ink,margin:0,fit:"resize"});

    prompt(level.level,"Recall","2 / 8 · All durations","Before looking at the handout","Choose two target words. Say their meanings, then use one in a complete response.","Think first · check with a partner after the first attempt.");

    const matching=base(level.level,"Match meaning","3 / 8 · All durations");
    matching.addText("Match A–C to 1–3. Explain one choice.",{x:.68,y:1.18,w:11.9,h:.55,fontSize:23,bold:true,color:dark,margin:0});
    const options=level.targetVocabulary.slice(0,3).map(word=>word.meaning).reverse();
    for(let i=0;i<3;i++){
      const y=2.00+i*1.33;
      matching.addShape(shape.roundRect,{x:.68,y,w:4.2,h:1.10,fill:{color:"ECFDF5"},line:{color:"99D5C8"}});
      matching.addText("ABC"[i]+".  "+words[i],{x:1.00,y:y+.25,w:3.6,h:.55,fontSize:25,bold:true,color:dark,margin:0});
      matching.addShape(shape.roundRect,{x:5.28,y,w:7.30,h:1.10,fill:{color:"F5F8FC"},line:{color:"CDD9E8"}});
      matching.addText(String(i+1)+".  "+options[i],{x:5.64,y:y+.20,w:6.57,h:.68,fontSize:20,color:ink,margin:0,fit:"resize"});
    }
    matching.addText("Write the three letter–number pairs on your handout.",{x:.72,y:6.27,w:11.7,h:.40,fontSize:17,color:accent,margin:0});

    const stem=extractGuided(level.guidedPractice[1],"Sentence stem — ").split(" Complete it")[0];
    prompt(level.level,"Complete a sentence","4 / 8 · All durations","Use the target pattern",stem,"Add two target words, then check meaning and word order.");

    const error=extractGuided(level.guidedPractice[2],"Error repair — ").split(" Rewrite the")[0];
    prompt(level.level,"Repair an error","5 / 8 · All durations","What would you change?",error,"Rewrite the full response and explain the correction.");

    prompt(level.level,"Pair Work","6 / 8 · Add for 60 / 90 minutes","Exchange information","Take only Card A or Card B. Ask your partner questions. Do not show the printed facts.","Record what your partner said before checking together.");

    prompt(level.level,"Communicative Task","7 / 8 · Add for 90 minutes","Apply what you learned",level.communicativeTask,"Use the printed Activity Cards and the Level "+level.level+" output requirement.");

    prompt(level.level,"Independent check","8 / 8 · All durations","Now work alone","Use your Student Handout to produce a new response. Then complete the printed Exit Ticket without peer help.","Check meaning, pattern and evidence. Your teacher will assign the next practice path.");
  }

  const cover=pptx.addSlide();
  cover.background={color:dark};
  cover.addText("HSKKit · HSK 3.0",{x:.65,y:.64,w:11.9,h:.55,fontSize:21,color:"A7F3D0",margin:0});
  cover.addText("Teacher Lesson Plan Pack",{x:.65,y:1.52,w:11.9,h:1.05,fontSize:38,bold:true,color:"FFFFFF",margin:0});
  cover.addText("Editable student-facing classroom prompts · Levels 1–9",{x:.68,y:2.92,w:11.9,h:.62,fontSize:22,color:"D1FAE5",margin:0});
  cover.addText("45 minutes: slides 1–5, 8\n60 minutes: slides 1–6, 8\n90 minutes: slides 1–8",{x:.72,y:4.05,w:11.85,h:1.75,fontSize:22,color:"FFFFFF",margin:0,breakLine:false});
  cover.addText("Teacher timing, answer guidance and print masters are in the PDF/DOCX files.",{x:.72,y:6.60,w:11.85,h:.36,fontSize:15,color:"A7F3D0",margin:0});
  for(const level of pack.levels)slideLevel(level);
  const output=await pptx.write({outputType:"uint8array",compression:true});
  if(output instanceof Uint8Array)return output;
  if(output instanceof ArrayBuffer)return new Uint8Array(output);
  throw new Error("PPTX_GENERATION_FAILED");
}
