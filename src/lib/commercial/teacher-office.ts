import {generateZipFiles} from "./generator.ts";
import type {TeacherLessonPack,TeacherLessonLevel} from "./teacher-lesson-pack.ts";
import PptxGenJS from "pptxgenjs";

const encoder=new TextEncoder();
const xml=(value:unknown)=>String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;");
const file=(name:string,data:string)=>({name,data:encoder.encode(data)});

const docParagraph=(text:string,style="Normal")=>`<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r><w:t xml:space="preserve">${xml(text)}</w:t></w:r></w:p>`;
const docBullet=(text:string)=>`<w:p><w:pPr><w:pStyle w:val="Bullet"/></w:pPr><w:r><w:t xml:space="preserve">${xml(text)}</w:t></w:r></w:p>`;
const docPageBreak=()=>`<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;

function lessonDocument(level:TeacherLessonLevel){
  const paragraphs=[docParagraph(`Level ${level.level} · ${level.difficulty}`,"Heading1"),docParagraph(`Teaching objective: ${level.objective}`),docParagraph(`Target vocabulary: ${level.targetVocabulary.map(word=>`${word.hanzi} (${word.pinyin}) — ${word.meaning}`).join("; ")}`),docParagraph(`Grammar / sentence pattern: ${level.grammarPattern}`),docParagraph(`Teaching focus: ${level.teachingFocus}`),docParagraph("Teaching priorities and common errors","Heading2"),...level.commonErrors.map(docBullet),docParagraph("Pre-class preparation","Heading2"),...level.preparation.map(docBullet),docParagraph("Teacher Modeling","Heading2"),...level.teacherModel.map(docBullet),docParagraph("Guided Practice","Heading2"),...level.guidedPractice.map(docBullet),docParagraph(`Pair Work: ${level.pairWork}`,"Heading2"),docParagraph(`Communicative Task: ${level.communicativeTask}`,"Heading2"),docParagraph(`Independent Practice: ${level.independentPractice}`,"Heading2")];
  for(const minutes of [45,60,90] as const){paragraphs.push(docParagraph(`${minutes}-minute classroom flow`,"Heading2"));for(const stage of level.plans[minutes].stages)paragraphs.push(docBullet(`${stage.minutes} min · ${stage.title} · Teacher: ${stage.teacherAction} · Students: ${stage.studentAction} · Evidence: ${stage.evidence}`));}
  paragraphs.push(docParagraph("Activity Cards A/B · supplied learner information","Heading2"));
  for(const [role,card] of Object.entries(level.activityCards))paragraphs.push(docParagraph(`Card ${role} · ${card.title}`,"Heading2"),...card.facts.map(item=>docBullet(`Fact · ${item}`)),...card.instructions.map(item=>docBullet(`Instruction · ${item}`)));
  paragraphs.push(docParagraph("Student Handout","Heading2"),...level.studentHandout.map(docBullet),docParagraph("Exit Ticket","Heading2"),...level.exitTicket.questions.map(docBullet),...level.exitTicket.scoring.map(docBullet),docParagraph("Homework","Heading2"),...level.homework.questions.map(docBullet),docParagraph("Answer Key","Heading2"),...level.homework.answers.map(docBullet),docParagraph("Feedback Rubric","Heading2"),...level.homework.rubric.criteria.map(docBullet),...level.homework.rubric.bands.map(docBullet),docParagraph("Differentiation","Heading2"),...level.differentiation.support.map(item=>docBullet(`Support · ${item}`)),...level.differentiation.extension.map(item=>docBullet(`Extension · ${item}`)));
  return paragraphs.join("");
}

export function generateTeacherLessonDocx(pack:TeacherLessonPack){
  const contentTypes=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
  const rootRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;
  const documentRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:eastAsia="Microsoft YaHei" w:hAnsi="Aptos"/><w:sz w:val="21"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:spacing w:after="100" w:line="276" w:lineRule="auto"/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="120" w:after="240"/></w:pPr><w:rPr><w:b/><w:color w:val="0F766E"/><w:sz w:val="38"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr><w:b/><w:color w:val="0F766E"/><w:sz w:val="30"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="180" w:after="80"/></w:pPr><w:rPr><w:b/><w:color w:val="1F2937"/><w:sz w:val="24"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Bullet"><w:name w:val="Bullet"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="420" w:hanging="240"/><w:tabs><w:tab w:val="num" w:pos="420"/></w:tabs></w:pPr></w:style></w:styles>`;
  const body=[docParagraph(pack.title,"Title"),docParagraph("Editable master · Levels 1–9 · 45 / 60 / 90 minutes"),docParagraph(pack.sourceNotice),docParagraph("All lesson text is ordinary editable Word content. Duplicate a Level section, replace context if needed, and keep the printed evidence criteria."),...pack.levels.flatMap((level,index)=>[index?docPageBreak():"",lessonDocument(level)])].join("");
  const document=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708"/></w:sectPr></w:body></w:document>`;
  return generateZipFiles([file("[Content_Types].xml",contentTypes),file("_rels/.rels",rootRels),file("docProps/core.xml",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${xml(pack.title)}</dc:title><dc:creator>HSKKit</dc:creator><dc:description>Editable classroom lesson plans</dc:description></cp:coreProperties>`),file("docProps/app.xml",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>HSKKit</Application></Properties>`),file("word/document.xml",document),file("word/_rels/document.xml.rels",documentRels),file("word/styles.xml",styles)]);
}

export async function generateTeacherLessonPptx(pack:TeacherLessonPack){
  const pptx=new PptxGenJS();
  pptx.layout="LAYOUT_WIDE";
  pptx.author="HSKKit";
  pptx.subject="Editable HSK 3.0 classroom slides for Levels 1–9";
  pptx.title=pack.title;
  pptx.company="HSKKit";
  pptx.theme={headFontFace:"Aptos Display",bodyFontFace:"Aptos"};
  const shape=pptx.ShapeType;
  const cover=pptx.addSlide();
  cover.background={color:"064E3B"};
  cover.addText("HSK 3.0",{x:.65,y:.55,w:2.1,h:.48,fontFace:"Aptos",fontSize:20,bold:true,color:"A7F3D0",margin:0});
  cover.addText("Classroom-Ready Teacher Lesson Plan Pack",{x:.65,y:1.25,w:11.8,h:1.25,fontFace:"Aptos Display",fontSize:36,bold:true,color:"FFFFFF",margin:0,breakLine:false});
  cover.addText("Levels 1–9 · 45 / 60 / 90 minutes",{x:.68,y:2.75,w:7.5,h:.5,fontSize:20,color:"D1FAE5",margin:0});
  cover.addShape(shape.roundRect,{x:.65,y:4.25,w:3.55,h:1.45,rectRadius:.08,fill:{color:"ECFDF5"},line:{color:"6EE7B7"}});
  cover.addText("TEACHER-READY\nObjectives · minute flow · evidence",{x:.9,y:4.55,w:3.05,h:.8,fontSize:16,bold:true,color:"065F46",margin:0,breakLine:false});
  cover.addShape(shape.roundRect,{x:4.55,y:4.25,w:3.55,h:1.45,fill:{color:"FEF3C7"},line:{color:"FCD34D"}});
  cover.addText("STUDENT-READY\nHandouts · cards · homework",{x:4.8,y:4.55,w:3.05,h:.8,fontSize:16,bold:true,color:"92400E",margin:0});
  cover.addShape(shape.roundRect,{x:8.45,y:4.25,w:3.55,h:1.45,fill:{color:"EFF6FF"},line:{color:"93C5FD"}});
  cover.addText("EDITABLE\nOrdinary text boxes and shapes",{x:8.7,y:4.55,w:3.05,h:.8,fontSize:16,bold:true,color:"1E40AF",margin:0});

  for(const level of pack.levels){
    for(const minutes of [45,60,90] as const){
      const plan=level.plans[minutes];
      const slide=pptx.addSlide();
      slide.background={color:"F8FAFC"};
      slide.addShape(shape.rect,{x:0,y:0,w:13.333,h:.72,fill:{color:"064E3B"},line:{color:"064E3B"}});
      slide.addText(`Level ${level.level} · ${minutes}-minute lesson`,{x:.48,y:.14,w:8.4,h:.38,fontSize:24,bold:true,color:"FFFFFF",margin:0});
      slide.addText(level.difficulty,{x:9.15,y:.19,w:3.65,h:.3,fontSize:11,bold:true,color:"A7F3D0",align:"right",margin:0,fit:"shrink"});
      slide.addText(`Objective: ${level.objective}`,{x:.5,y:.9,w:8.15,h:.6,fontSize:12.5,color:"1F2937",bold:true,margin:.05,fit:"shrink"});
      slide.addShape(shape.roundRect,{x:9,y:.9,w:3.82,h:.6,fill:{color:"ECFDF5"},line:{color:"A7F3D0"}});
      slide.addText(`Target words: ${level.targetVocabulary.map(word=>word.hanzi).join(" · ")}`,{x:9.2,y:1.07,w:3.42,h:.22,fontSize:10.5,bold:true,color:"065F46",align:"center",margin:0,fit:"shrink"});
      slide.addText(`Pattern: ${level.grammarPattern}`,{x:.5,y:1.5,w:12.3,h:.36,fontSize:11,color:"92400E",margin:0,fit:"shrink"});
      plan.stages.forEach((stage,index)=>{
        const column=index%2,row=Math.floor(index/2),x=.5+column*6.38,y=2.02+row*1.08;
        const fill=stage.mode==="communicative-task"?"E0F2FE":stage.mode==="pair-work"?"ECFDF5":"FFFFFF";
        slide.addShape(shape.roundRect,{x,y,w:5.95,h:.91,fill:{color:fill},line:{color:stage.mode==="communicative-task"?"38BDF8":"94A3B8",width:.8}});
        slide.addText(`${stage.minutes} min · ${stage.title}`,{x:x+.15,y:y+.1,w:5.55,h:.22,fontSize:11,bold:true,color:"065F46",margin:0,fit:"shrink"});
        slide.addText(`${stage.studentAction}\nEvidence: ${stage.evidence}`,{x:x+.15,y:y+.37,w:5.55,h:.42,fontSize:8.5,color:"334155",margin:0,breakLine:false,fit:"shrink"});
      });
      slide.addShape(shape.rect,{x:.5,y:6.55,w:12.32,h:.53,fill:{color:"FFF7ED"},line:{color:"FDBA74"}});
      slide.addText(`Exit Ticket: ${level.exitTicket.questions[0]}`,{x:.68,y:6.71,w:11.95,h:.2,fontSize:10,bold:true,color:"9A3412",margin:0,fit:"shrink"});
      slide.addText(`HSKKit Teacher Pack · Editable classroom slide · Level ${level.level}/${minutes}`,{x:.5,y:7.18,w:12.3,h:.16,fontSize:7.5,color:"64748B",margin:0,align:"right"});
    }
  }
  const output=await pptx.write({outputType:"uint8array",compression:true});
  if(output instanceof Uint8Array)return output;
  if(output instanceof ArrayBuffer)return new Uint8Array(output);
  throw new Error("PPTX_GENERATION_FAILED");
}
