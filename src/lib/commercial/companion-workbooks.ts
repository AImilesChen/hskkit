import {generateZipFiles} from "./generator.ts";
import type {PlannerPack} from "./planner-pack.ts";

const encoder=new TextEncoder();
const escapeXml=(value:unknown)=>String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;");
const inline=(ref:string,value:unknown,style=0)=>`<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
const numeric=(ref:string,value:number,style=0)=>`<c r="${ref}" s="${style}"><v>${value}</v></c>`;
const formula=(ref:string,value:string,style=0)=>`<c r="${ref}" s="${style}"><f>${escapeXml(value)}</f><v>0</v></c>`;
const row=(index:number,cells:string[],height?:number)=>`<row r="${index}"${height?` ht="${height}" customHeight="1"`:""}>${cells.join("")}</row>`;
const sheet=(rows:string[],columns:string,extra="")=>`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>${columns}<sheetData>${rows.join("")}</sheetData>${extra}</worksheet>`;

type WorkbookSheet={name:string;xml:string};
function workbookPackage(title:string,sheets:WorkbookSheet[]){
  const overrides=sheets.map((_,index)=>`<Override PartName="/xl/worksheets/sheet${index+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("");
  const contentTypes=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${overrides}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
  const rootRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;
  const workbook=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((item,index)=>`<sheet name="${escapeXml(item.name)}" sheetId="${index+1}" r:id="rId${index+1}"/>`).join("")}</sheets><calcPr calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>`;
  const workbookRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,index)=>`<Relationship Id="rId${index+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index+1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  let styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="4"><font><sz val="10"/><name val="Arial"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="10"/><name val="Arial"/></font><font><b/><color rgb="FF123A39"/><sz val="12"/><name val="Arial"/></font><font><color rgb="FF334E54"/><sz val="10"/><name val="Arial"/></font></fonts><fills count="6"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F766E"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE9F5F2"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF2F7F7"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF8E7"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD4E4E2"/></left><right style="thin"><color rgb="FFD4E4E2"/></right><top style="thin"><color rgb="FFD4E4E2"/></top><bottom style="thin"><color rgb="FFD4E4E2"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="10"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1" applyAlignment="1"><alignment wrapText="1"/></xf><xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1" indent="1"/></xf><xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1" indent="1"/></xf><xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="14" fontId="3" fillId="5" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1" indent="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  if(title==="HSKKit 30-Day Planner Progress Tracker"){
    // Planner-specific hierarchy; leave other workbook products untouched.
    styles=styles.replace('<fonts count="4">','<fonts count="8">').replace('</fonts>','<font><b/><color rgb="FFFFFFFF"/><sz val="12"/><name val="Arial"/></font><font><b/><color rgb="FF123A39"/><sz val="16"/><name val="Arial"/></font><font><b/><color rgb="FF123A39"/><sz val="18"/><name val="Arial"/></font><font><color rgb="FF263F45"/><sz val="11"/><name val="Arial"/></font></fonts>')
      .replace('<cellXfs count="10">','<cellXfs count="14">').replace('</cellXfs>',[
        '<xf numFmtId="0" fontId="4" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1" applyAlignment="1"><alignment vertical="center" wrapText="1" indent="1"/></xf>',
        '<xf numFmtId="0" fontId="5" fillId="3" borderId="0" xfId="0" applyFill="1" applyFont="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>',
        '<xf numFmtId="0" fontId="6" fillId="3" borderId="1" xfId="0" applyFill="1" applyFont="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>',
        '<xf numFmtId="0" fontId="7" fillId="3" borderId="1" xfId="0" applyFill="1" applyFont="1" applyAlignment="1"><alignment vertical="center" wrapText="1" indent="1"/></xf>',
      ].join('')+'</cellXfs>');
  }
  if(title==="HSKKit Practice Assessment Score Tracker"){
    styles=styles.replace('<fonts count="4">','<fonts count="6">').replace('</fonts>','<font><b/><color rgb="FFFFFFFF"/><sz val="12"/><name val="Arial"/></font><font><color rgb="FF263F45"/><sz val="11"/><name val="Arial"/></font></fonts>')
      .replace('<cellXfs count="10">','<cellXfs count="14">').replace('</cellXfs>',[
        '<xf numFmtId="0" fontId="4" fillId="2" borderId="1" xfId="0" applyFill="1" applyFont="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>',
        '<xf numFmtId="0" fontId="5" fillId="5" borderId="1" xfId="0" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>',
        '<xf numFmtId="14" fontId="5" fillId="5" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="center"/></xf>',
        '<xf numFmtId="0" fontId="5" fillId="3" borderId="1" xfId="0" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>',
      ].join('')+'</cellXfs>');
  }
  if(title==="HSKKit Worksheet Review Log"){
    const xf=(fill:number,border:number,align:string,numFmt=0,font=4)=>`<xf numFmtId="${numFmt}" fontId="${font}" fillId="${fill}" borderId="${border}" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"${numFmt?' applyNumberFormat="1"':''}><alignment vertical="center" horizontal="${align}"${align==='left'?' indent="1" wrapText="1"':''}/></xf>`;
    styles=styles.replace('<fonts count="4">','<fonts count="6">').replace('</fonts>','<font><color rgb="FF263F45"/><sz val="11"/><name val="Arial"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Arial"/></font></fonts>')
      .replace('<fills count="6">','<fills count="8">').replace('</fills>','<fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF7FAFA"/></patternFill></fill></fills>')
      .replace('<borders count="2">','<borders count="3">').replace('</borders>','<border><left style="medium"><color rgb="FF95B8B3"/></left><right style="thin"><color rgb="FFD4E4E2"/></right><top style="thin"><color rgb="FFD4E4E2"/></top><bottom style="thin"><color rgb="FFD4E4E2"/></bottom><diagonal/></border></borders>')
      .replace('<cellXfs count="10">','<cellXfs count="18">').replace('</cellXfs>',[
        xf(3,1,'center'),xf(3,1,'left'),xf(6,1,'center',14),xf(5,1,'center'),xf(7,1,'left'),xf(6,2,'center',14),xf(7,2,'left'),xf(2,1,'left',0,5),
      ].join('')+'</cellXfs>');
  }
  const files=[
    {name:"[Content_Types].xml",data:encoder.encode(contentTypes)},
    {name:"_rels/.rels",data:encoder.encode(rootRels)},
    {name:"docProps/core.xml",data:encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${escapeXml(title)}</dc:title><dc:creator>HSKKit</dc:creator></cp:coreProperties>`)},
    {name:"xl/workbook.xml",data:encoder.encode(workbook)},
    {name:"xl/_rels/workbook.xml.rels",data:encoder.encode(workbookRels)},
    {name:"xl/styles.xml",data:encoder.encode(styles)},
    ...sheets.map((item,index)=>({name:`xl/worksheets/sheet${index+1}.xml`,data:encoder.encode(item.xml)})),
  ];
  return generateZipFiles(files);
}

export function generatePlannerProgressWorkbook(plan:PlannerPack){
  const setupRows=[
    row(1,[inline("A1","30-DAY PLANNER · START HERE",11),inline("B1","Your inputs / instructions",10)],38),
    ...["Current Level","Target Level","Start date","Daily route (20 / 30 / 45 minutes)","Weakest measured skill","Study goal"].map((label,index)=>row(index+2,[inline(`A${index+2}`,label,5),inline(`B${index+2}`,"",index===2?3:13)],38)),
    row(9,[inline("A9","01 · PREPARE",5),inline("B9","Bring your own level-matched word list, keyed reading questions, transcript-backed audio and writing model/teacher feedback. These exercises are not included.",13)],62),
    row(10,[inline("A10","02 · BASELINE",5),inline("B10","Before choosing your weakest skill, measure vocabulary /20, reading /10, writing /5 and listening /10. Listening may need a separate session outside Day 1's timer. Score correct / total x 100; unmeasured is NOT zero.",13)],82),
    row(11,[inline("A11","03 · DAILY WORK",5),inline("B11","Use the PDF for tasks and corrections. On the 30-Day Plan tab choose only one time route. Enter Done or Recovered, one short evidence result and the next action in the light cells H–J.",13)],70),
    row(12,[inline("A12","04 · REVIEW",5),inline("B12","Use the PDF checkpoints on Days 7, 14, 21 and 28. Use fresh material for retests. This XLSX counts completed/recovered days; it neither contains questions nor scores practice automatically.",13)],70),
    row(14,[inline("A14","ILLUSTRATION ONLY",5),inline("B14","Day 1, route 30: 16/20 words, 8/10 reading, 4/5 writing; a separate listening check 3/10. In the plan enter Done, evidence V16/20 R8/10 W4/5, next action Day 2. No example data is stored in your plan.",13)],82),
  ];
  const setupValidation='<dataValidations count="1"><dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="B5"><formula1>&quot;20,30,45&quot;</formula1></dataValidation></dataValidations>';
  const dailyRows=[row(1,["Day","Date","Phase","Focus","20-minute route","30-minute route","45-minute route","Status","Evidence","Next action"].map((value,index)=>inline(`${String.fromCharCode(65+index)}1`,value,10)),38)];
  for(const day of plan.days){
    const r=day.day+1;
    dailyRows.push(row(r,[inline(`A${r}`,`Day ${day.day}`,5),formula(`B${r}`,`IF(Setup!B4=\"\",\"\",Setup!B4+${day.day-1})`,3),inline(`C${r}`,day.phase,13),inline(`D${r}`,day.focus,13),inline(`E${r}`,day.routes[20],13),inline(`F${r}`,day.routes[30],13),inline(`G${r}`,day.routes[45],13),inline(`H${r}`,"",13),inline(`I${r}`,"",13),inline(`J${r}`,"",13)],76));
  }
  const dailyExtra='<autoFilter ref="A1:J31"/><dataValidations count="1"><dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="H2:H31"><formula1>&quot;Not started,Done,Recovered&quot;</formula1></dataValidation></dataValidations>';
  const count=(state:string,first=2,last=31)=>`COUNTIF('30-Day Plan'!H${first}:H${last},\"${state}\")`;
  const summaryRows=[
    row(1,[inline("A1","PROGRESS · 30 DAYS",11),inline("B1","Result",10),inline("C1","Progress",10),inline("D1","What this means",10)],38),
    row(2,[inline("A2","Planned days",5),numeric("B2",30,12),inline("D2","A completed or recovered day counts once.",13)],44),
    row(3,[inline("A3","Done",5),formula("B3",count("Done"),12)],44),
    row(4,[inline("A4","Recovered",5),formula("B4",count("Recovered"),12)],44),
    row(5,[inline("A5","Completed or recovered",5),formula("B5","B3+B4",12),formula("C5",'IFERROR(B5/B2,0)',2)],48),
    row(6,[inline("A6","Not yet completed",5),formula("B6","B2-B5",12),inline("D6","Blank and Not started statuses remain unfinished.",13)],44),
    row(8,[inline("A8","WEEKLY VIEW",10),inline("B8","Days",10),inline("C8","Complete",10),inline("D8","Rate",10)],38),
    ...[["Week 1",1,7],["Week 2",8,14],["Week 3",15,21],["Week 4",22,28],["Finish",29,30]].map(([label,first,last],index)=>{
      const r=9+index,from=Number(first)+1,to=Number(last)+1;
      return row(r,[inline(`A${r}`,label,5),inline(`B${r}`,`Day ${first}–${last}`,13),formula(`C${r}`,`${count("Done",from,to)}+${count("Recovered",from,to)}`,12),formula(`D${r}`,`IFERROR(C${r}/${Number(last)-Number(first)+1},0)`,2)],42);
    }),
    row(15,[inline("A15","NEXT CHECKPOINT",10),inline("B15","Use the PDF",10)],36),
    row(16,[inline("A16","Review on Days 7, 14, 21, 28",5),inline("B16","Recheck with fresh material; record errors and your next action in the PDF. These counts do not grade practice or measure proficiency.",13)],76),
  ];
  const summaryExtra='<conditionalFormatting sqref="C5"><cfRule type="dataBar" priority="1"><dataBar><cfvo type="num" val="0"/><cfvo type="num" val="1"/><color rgb="FF0F766E"/></dataBar></cfRule></conditionalFormatting>';
  const summaryPrint=(xml:string)=>xml.replace("<sheetViews>",'<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews>').replace("</worksheet>",'<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="1"/></worksheet>');
  return workbookPackage("HSKKit 30-Day Planner Progress Tracker",[
    {name:"Setup",xml:sheet(setupRows,'<cols><col min="1" max="1" width="38" customWidth="1"/><col min="2" max="2" width="70" customWidth="1"/></cols>',setupValidation)},
    {name:"30-Day Plan",xml:sheet(dailyRows,'<cols><col min="1" max="2" width="13" customWidth="1"/><col min="3" max="4" width="24" customWidth="1"/><col min="5" max="7" width="58" customWidth="1"/><col min="8" max="8" width="15" customWidth="1"/><col min="9" max="10" width="30" customWidth="1"/></cols>',dailyExtra)},
    {name:"Progress Summary",xml:summaryPrint(sheet(summaryRows,'<cols><col min="1" max="1" width="34" customWidth="1"/><col min="2" max="2" width="25" customWidth="1"/><col min="3" max="3" width="18" customWidth="1"/><col min="4" max="4" width="48" customWidth="1"/></cols>',summaryExtra))},
  ]);
}

const assessmentDrills:[string,string,string][]=[
  ["Replay short utterances; mark person, time and place.","Redo direct-detail and matching items; underline supporting words.","Write one short sentence about Source A, then one about Source B. Level 1 writing is an extra learning diagnostic, not an official exam section."],
  ["Rebuild the two-step dialogue sequence before choosing.","Redo event-order and information matching; explain each link.","Revise the short report so both events connect in order."],
  ["Summarize the notice; check the changed arrangement against audio.","Redo time/condition and two-source links; underline exact support.","Expand a 40–70-character response with a clear reason and result."],
  ["Map both parts of the changed plan and verify the shared conclusion.","Compare sources; identify the condition that changes the proposal.","Add an explicit transition between evidence and conclusion."],
  ["Note speaker stance and the evidence that supports it.","Redo claim/evidence items and justify each answer from sources.","Rewrite 100–150 characters with viewpoint and one source detail."],
  ["Draw the cause-to-effect chain before checking options.","Redo cross-source causality; reject reversed-cause options.","Make claim, evidence and consequence explicit in the report."],
  ["Identify register, stance and discourse structure.","Annotate passage structure and each paragraph's role.","Rewrite the weakest task with precise register and two sources."],
  ["Separate each speaker's claim; note agreement and conflict.","Use a two-column source/evidence matrix for synthesis.","Revise 180–300 characters using both sources and their disagreement."],
  ["Separate claim, counterclaim, evidence and qualification.","Rank evidence strength in counterargument items.","Write claim, two-source evidence, counterpoint and justified conclusion."],
];

export function generatePracticeAssessmentScoreWorkbook(){
  // Buyer records are on the first sheet; worked example never enters Progress.
  const example=[
    row(1,[inline("A1","EXAMPLE ONLY · NOT YOUR RECORDS",10),inline("B1","Enter your own results on Attempts. These illustration scores never enter Progress.",11)],44),
    ...[
      ["1 · SCORE", "After scoring Level 3 Form A with the Answers and Score Report: Listening 2/10, Reading 6/10, Writing 7/10. Enter date, level, form and three scores on ONE new Attempts row. Total = 15/30; weakest = Listening."],
      ["2 · EVIDENCE", "Record the real missed question ID/task and the specific missed cue from the transcript in columns I–J. The lowest score is only a starting point; check the actual answer evidence."],
      ["3 · PRACTISE", "For a missed changed arrangement: replay the segment, write the original and revised plan, verify against the transcript, then retry with answers hidden. Enter a next review date and follow-up status."],
      ["4 · RETEST", "Independently complete Level 3 Form B and append a NEW row: Listening 4, Reading 6, Writing 7 = 17/30. Previous same level = 15; Change = +2. Compare each skill with the earlier row; do not overwrite Form A."],
      ["NOT AN EXAM", "These numbers are invented illustrations, not learner data or official exam results. Different forms are not equated; a score change describes practice records, not proven proficiency gain."],
      ["ZERO / MISSING", "Listening 0, Reading 0, Writing 0 with date, level and form is a completed 0/30 attempt. Missing identity or any score leaves Total blank and excludes the row from Progress."],
      ["HOW TO USE", "Attempts is the only input sheet. Enter chronological rows (200 prepared rows); do not sort them, since Previous uses earlier physical rows. Progress counts completed rows. Drill Guide supplies optional practice prompts; Score Report has scoring rules."],
      ["SCOPE", "This unofficial workbook does not grade responses or set reminders. Levels 7–9 are practice distinctions within the unified advanced band."],
    ].map(([label,text],i)=>row(i+2,[inline(`A${i+2}`,label,5),inline(`B${i+2}`,text,11)],80)),
  ];
  const cols=["1 Date","2 Level","3 Form","4 Listen /10","5 Read /10","6 Write /10","Total /30","Weakest skill","7 Missed item / task","8 Error evidence / why","Suggested drill","9 Next review","Previous same level /30","Change /30","10 Follow-up","Scored flag"];
  const attempts=[row(1,cols.map((label,i)=>inline(`${String.fromCharCode(65+i)}1`,label,10)),42)];
  for(let r=2;r<=201;r++){
    const weakest=`IF(D${r}=MIN(D${r}:F${r}),"Listening",IF(E${r}=MIN(D${r}:F${r}),"Reading","Writing"))`;
    const cells:string[]=[];
    for(const col of 'ABCDEFGHIJKLMNOP'){
      const ref=`${col}${r}`;
      if(col==='G')cells.push(formula(ref,`IF(OR(A${r}="",B${r}="",C${r}="",COUNT(D${r}:F${r})<>3),"",SUM(D${r}:F${r}))`,6));
      else if(col==='H')cells.push(formula(ref,`IF(G${r}="","",${weakest})`,4));
      else if(col==='K')cells.push(formula(ref,`IF(H${r}="","",INDEX('Drill Guide'!$B$5:$D$13,B${r},IF(H${r}="Listening",1,IF(H${r}="Reading",2,3))))`,4));
      else if(col==='M')cells.push(formula(ref,r===2?'IF(G2="","","")':`IF(G${r}="","",IFERROR(LOOKUP(2,1/(($B$2:B${r-1}=B${r})*(ISNUMBER($G$2:G${r-1}))),$G$2:G${r-1}),""))`,6));
      else if(col==='N')cells.push(formula(ref,`IF(OR(G${r}="",M${r}=""),"",G${r}-M${r})`,6));
      else if(col==='P')cells.push(formula(ref,`IF(ISNUMBER(G${r}),1,0)`,6));
      else cells.push(inline(ref,"",col==='A'||col==='L'?12:11));
    }
    attempts.push(row(r,cells,39));
  }
  const validation=(type:string,range:string,first:string,second?:string)=>`<dataValidation type="${type}"${second?' operator="between"':''} allowBlank="1" showErrorMessage="1" errorTitle="Check this entry" error="Use the indicated range or list." sqref="${range}"><formula1>${escapeXml(first)}</formula1>${second?`<formula2>${second}</formula2>`:''}</dataValidation>`;
  const attemptExtra='<autoFilter ref="A1:O201"/><dataValidations count="6">'+[
    validation('whole','B2:B201','1','9'),validation('list','C2:C201','"A,B,C"'),
    ...['D','E','F'].map(c=>validation('whole',`${c}2:${c}201`,'0','10')),
    validation('list','O2:O201','"Needs practice,Practised,Retested"'),
  ].join('')+'</dataValidations>';
  const source="'Attempts'!";
  const progress=[row(1,["Level","Completed attempts","Form A","Form B","Form C","Avg Listen /10","Avg Read /10","Avg Write /10","Avg Total /30","Next step"].map((v,i)=>inline(`${String.fromCharCode(65+i)}1`,v,10)),44)];
  for(let level=1;level<=9;level++){
    const r=level+1,base=`${source}$B$2:$B$201,A${r},${source}$P$2:$P$201,1`,count=`COUNTIFS(${base})`;
    const cells=[numeric(`A${r}`,level,5),formula(`B${r}`,count,6)];
    for(const [i,formName] of ['A','B','C'].entries())cells.push(formula(`${'CDE'[i]}${r}`,`COUNTIFS(${base},${source}$C$2:$C$201,"${formName}")`,6));
    for(const [i,col] of ['D','E','F','G'].entries())cells.push(formula(`${'FGHI'[i]}${r}`,`IF(B${r}=0,"",ROUND(SUMIFS(${source}$${col}$2:$${col}$201,${source}$B$2:$B$201,A${r},${source}$P$2:$P$201,1)/B${r},1))`,6));
    cells.push(inline(`J${r}`,"Filter Attempts to this level; review weakest task and retest.",11));
    progress.push(row(r,cells,46));
  }
  progress.push(row(12,[inline('A12','Do not compare averages between levels; same-level attempts are the only repeat measure.',5)],60));
  const guide=[row(1,[inline('A1','DRILL GUIDE · SCORE REPORT COMPANION',10)],42),row(2,[inline('A2','Suggested practice is a starting point, not an automatic diagnosis. See Score Report for full level-specific directions.',11)],52),row(4,['Level','Listening','Reading','Writing'].map((v,i)=>inline(`${'ABCD'[i]}4`,v,10)),38),...assessmentDrills.map((items,i)=>row(i+5,[numeric(`A${i+5}`,i+1,5),...items.map((text,j)=>inline(`${'BCD'[j]}${i+5}`,text,11))],82))];
  const widths=(values:number[])=>`<cols>${values.map((width,i)=>`<col min="${i+1}" max="${i+1}" width="${width}" customWidth="1"/>`).join('')}</cols>`;
  const print=(xml:string,wide=false)=>xml.replace('<sheetViews>','<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews>').replace('</worksheet>',`<pageSetup paperSize="9" orientation="${wide?'landscape':'portrait'}" fitToWidth="1" fitToHeight="${wide?0:1}"/></worksheet>`);
  return workbookPackage("HSKKit Practice Assessment Score Tracker",[
    {name:"Attempts",xml:print(sheet(attempts,widths([16,10,10,18,18,18,16,18,31,42,53,20,25,17,22]).replace('</cols>','<col min="16" max="16" width="12" hidden="1"/></cols>'),attemptExtra).replace('<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>','<pane xSplit="3" ySplit="1" topLeftCell="D2" activePane="bottomRight" state="frozen"/>'),true)},
    {name:"Progress",xml:print(sheet(progress,widths([13,21,14,14,14,21,20,21,22,62])),true)},
    {name:"Worked Example",xml:print(sheet(example,widths([27,110])))},
    {name:"Drill Guide",xml:print(sheet(guide,widths([13,55,55,65]),'<mergeCells count="2"><mergeCell ref="A1:D1"/><mergeCell ref="A2:D2"/></mergeCells>'),true)},
  ]);
}

/** Optional worksheet companion: records attempts and corrections; the PDF remains the practice. */
export function generateWorksheetReviewWorkbook(questionIds:ReadonlyArray<{level:number;id:string}>){
  const ids=new Set<string>();
  for(const item of questionIds){
    if(!Number.isInteger(item.level)||item.level<1||item.level>9||!/^L[1-9]-[a-z-]+-[1-3]$/.test(item.id)||ids.has(item.id))throw new Error("INVALID_WORKSHEET_QUESTION_ID");
    ids.add(item.id);
  }
  if(questionIds.length!==270)throw new Error("INCOMPLETE_WORKSHEET_QUESTIONS");
  // The printable PDF is the teaching material; this companion records one independent attempt and later retest per printed ID.
  const guideLines:[number,string,string,number,number][]=[
    [3,"PURPOSE","Track attempts, corrections and next-day retests for the 270 printed questions (HSK Levels 1–9). The PDF contains the exercises; this optional file does not add questions.",5,42],
    [5,"01 · PRACTISE","Open the Student PDF. Answer a printed question without looking at the Answer Key.",4,36],
    [6,"02 · CHECK","Match its printed Question ID in the Answer Key. In Question log, find the same ID and enter the attempt date and First attempt result.",4,42],
    [7,"03 · CORRECT","If incorrect or partial, write the error cause and the evidence or rule that fixes it. Do not just copy the answer.",4,42],
    [8,"04 · RETEST","Set a next review date (ideally the next day). On that day, retry without the key; enter the retest date and result.",4,42],
    [10,"WHERE TO TYPE","On the Question log tab: Level and Question ID are prefilled. Light cells C–I are yours to fill; the sand-tinted cells are result dropdowns. One row = one printed question. Filter by Level or Question ID.",5,48],
    [12,"Attempt date","The date of your first independent answer. Use your spreadsheet date format.",9,30],
    [13,"First attempt","Choose Correct, Partial or Incorrect from the dropdown.",9,30],
    [14,"Error cause","Describe the misunderstanding, e.g. confused a time word with a frequency word. Leave blank if correct.",9,35],
    [15,"Correction / evidence","Write why the right answer works: quote a clue from the PDF or the rule you missed.",9,35],
    [16,"Next review date","Schedule a later independent attempt; do not treat checking the key as a retest.",9,30],
    [17,"Retest date / result","After the later attempt, enter the date and choose Correct, Partial or Incorrect.",9,32],
    [19,"EXAMPLE · no data prefilled","Printed ID L1-meaning-match-1 → first attempt Incorrect → cause: mixed up the situation clue → correction: identify who is speaking → next day retest Correct. This is an illustration; enter your own evidence in Question log.",5,58],
    [21,"START HERE","Click the Question log tab below. Find your printed ID, then fill the light entry cells on that row.",5,38],
  ];
  const guide=[
    `<row r="1" ht="38" customHeight="1">${inline("A1","HSKKit  |  STUDY RECORD",1)}</row>`,
    `<row r="2" ht="31" customHeight="1">${inline("A2","Optional question-by-question review tracker · printable PDF remains the practice",5)}</row>`,
    ...guideLines.map(([r,label,description,style,height])=>`<row r="${r}" ht="${height}" customHeight="1">${inline(`A${r}`,label,style)}${inline(`B${r}`,description,style===5?4:style)}</row>`),
  ];
  const headers=["Level","Question ID","Attempt date","First attempt result","Error cause","Correction / evidence","Next review date","Retest date","Retest result"];
  const entries=[`<row r="1" ht="46" customHeight="1">${headers.map((label,index)=>inline(`${String.fromCharCode(65+index)}1`,label,17)).join("")}</row>`];
  questionIds.forEach(({level,id},index)=>{
    const r=index+2;
    const blank=(col:string,style:number)=>`<c r="${col}${r}" s="${style}"/>`;
    entries.push(`<row r="${r}" ht="31" customHeight="1">${numeric(`A${r}`,level,10)}${inline(`B${r}`,id,11)}${blank('C',15)}${blank('D',13)}${blank('E',16)}${blank('F',14)}${blank('G',15)}${blank('H',12)}${blank('I',13)}</row>`);
  });
  const guideExtra='<mergeCells count="16"><mergeCell ref="A1:F1"/><mergeCell ref="A2:F2"/>'+guideLines.map(([r])=>`<mergeCell ref="B${r}:F${r}"/>`).join("")+'</mergeCells><printOptions horizontalCentered="1"/><pageMargins left="0.35" right="0.35" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="1"/>';
  const validations='<autoFilter ref="A1:I271"/><dataValidations count="2"><dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="D2:D271"><formula1>&quot;Correct,Incorrect,Partial&quot;</formula1></dataValidation><dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="I2:I271"><formula1>&quot;Correct,Incorrect,Partial&quot;</formula1></dataValidation></dataValidations><pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/>';
  return workbookPackage("HSKKit Worksheet Review Log",[
    {name:"How to use",xml:sheet(guide,'<cols><col min="1" max="1" width="27" customWidth="1"/><col min="2" max="6" width="19" customWidth="1"/></cols>',guideExtra).replace('<sheetViews>','<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews>').replace('<sheetView workbookViewId="0">','<sheetView workbookViewId="0" showGridLines="0">')},
    {name:"Question log",xml:sheet(entries,'<cols><col min="1" max="1" width="8" customWidth="1"/><col min="2" max="2" width="28" customWidth="1"/><col min="3" max="3" width="18" customWidth="1"/><col min="4" max="4" width="23" customWidth="1"/><col min="5" max="5" width="34" customWidth="1"/><col min="6" max="6" width="42" customWidth="1"/><col min="7" max="7" width="21" customWidth="1"/><col min="8" max="8" width="18" customWidth="1"/><col min="9" max="9" width="18" customWidth="1"/></cols>',validations).replace('<sheetViews>','<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews>').replace('<sheetView workbookViewId="0">','<sheetView workbookViewId="0" showGridLines="0">').replace('<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>','<pane xSplit="2" ySplit="1" topLeftCell="C2" activePane="bottomRight" state="frozen"/>')},
  ]);
}
