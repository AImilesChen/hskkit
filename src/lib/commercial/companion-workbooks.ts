import {generateZipFiles} from "./generator.ts";
import type {PlannerPack} from "./planner-pack.ts";

const encoder=new TextEncoder();
const escapeXml=(value:unknown)=>String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;");
const inline=(ref:string,value:unknown,style=0)=>`<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
const numeric=(ref:string,value:number,style=0)=>`<c r="${ref}" s="${style}"><v>${value}</v></c>`;
const formula=(ref:string,value:string,style=0)=>`<c r="${ref}" s="${style}"><f>${escapeXml(value)}</f><v>0</v></c>`;
const row=(index:number,cells:string[])=>`<row r="${index}">${cells.join("")}</row>`;
const sheet=(rows:string[],columns:string,extra="")=>`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>${columns}<sheetData>${rows.join("")}</sheetData>${extra}</worksheet>`;

type WorkbookSheet={name:string;xml:string};
function workbookPackage(title:string,sheets:WorkbookSheet[]){
  const overrides=sheets.map((_,index)=>`<Override PartName="/xl/worksheets/sheet${index+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("");
  const contentTypes=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${overrides}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
  const rootRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;
  const workbook=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((item,index)=>`<sheet name="${escapeXml(item.name)}" sheetId="${index+1}" r:id="rId${index+1}"/>`).join("")}</sheets><calcPr calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>`;
  const workbookRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,index)=>`<Relationship Id="rId${index+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index+1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  let styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="4"><font><sz val="10"/><name val="Arial"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="10"/><name val="Arial"/></font><font><b/><color rgb="FF123A39"/><sz val="12"/><name val="Arial"/></font><font><color rgb="FF334E54"/><sz val="10"/><name val="Arial"/></font></fonts><fills count="6"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F766E"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE9F5F2"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF2F7F7"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF8E7"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD4E4E2"/></left><right style="thin"><color rgb="FFD4E4E2"/></right><top style="thin"><color rgb="FFD4E4E2"/></top><bottom style="thin"><color rgb="FFD4E4E2"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="10"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1" applyAlignment="1"><alignment wrapText="1"/></xf><xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1" indent="1"/></xf><xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1" indent="1"/></xf><xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="14" fontId="3" fillId="5" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1" indent="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
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
    row(1,[inline("A1","Setup field",1),inline("B1","Your value",1)]),
    ...["Current Level","Target Level","Start date","Daily route (20 / 30 / 45 minutes)","Weakest skill","Study goal"].map((label,index)=>row(index+2,[inline(`A${index+2}`,label)])),
  ];
  const setupValidation='<dataValidations count="1"><dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="B5"><formula1>&quot;20,30,45&quot;</formula1></dataValidation></dataValidations>';
  const dailyRows=[row(1,["Day","Date","Phase","Focus","20-minute route","30-minute route","45-minute route","Status","Evidence","Next action"].map((value,index)=>inline(`${String.fromCharCode(65+index)}1`,value,1)))];
  for(const day of plan.days){
    const r=day.day+1;
    dailyRows.push(row(r,[inline(`A${r}`,`Day ${day.day}`),formula(`B${r}`,`IF(Setup!B4=\"\",\"\",Setup!B4+${day.day-1})`,3),inline(`C${r}`,day.phase),inline(`D${r}`,day.focus),inline(`E${r}`,day.routes[20]),inline(`F${r}`,day.routes[30]),inline(`G${r}`,day.routes[45])]));
  }
  const dailyExtra='<autoFilter ref="A1:J31"/><dataValidations count="1"><dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="H2:H31"><formula1>&quot;Not started,Done,Recovered&quot;</formula1></dataValidation></dataValidations>';
  const summaryRows=[
    row(1,[inline("A1","Progress metric",1),inline("B1","Result",1)]),
    row(2,[inline("A2","Planned days"),numeric("B2",30)]),
    row(3,[inline("A3","Completed or recovered days"),formula("B3",`COUNTIF('30-Day Plan'!H2:H31,\"Done\")+COUNTIF('30-Day Plan'!H2:H31,\"Recovered\")`)]),
    row(4,[inline("A4","Completion"),formula("B4","IFERROR(B3/B2,0)",2)]),
    row(6,[inline("A6","Weekly checkpoints",1),inline("B6","Day 7 · Day 14 · Day 21 · Day 28",1)]),
  ];
  return workbookPackage("HSKKit 30-Day Planner Progress Tracker",[
    {name:"Setup",xml:sheet(setupRows,'<cols><col min="1" max="1" width="38" customWidth="1"/><col min="2" max="2" width="44" customWidth="1"/></cols>',setupValidation)},
    {name:"30-Day Plan",xml:sheet(dailyRows,'<cols><col min="1" max="2" width="13" customWidth="1"/><col min="3" max="4" width="24" customWidth="1"/><col min="5" max="7" width="70" customWidth="1"/><col min="8" max="8" width="15" customWidth="1"/><col min="9" max="10" width="30" customWidth="1"/></cols>',dailyExtra)},
    {name:"Progress Summary",xml:sheet(summaryRows,'<cols><col min="1" max="1" width="34" customWidth="1"/><col min="2" max="2" width="38" customWidth="1"/></cols>')},
  ]);
}

export function generatePracticeAssessmentScoreWorkbook(){
  const instructions=[
    row(1,[inline("A1","HSKKit Practice Assessment Score Tracker",1)]),
    row(2,[inline("A2","Enter one row after each Form A, B or C checkpoint. Listening, Reading and Writing each use 0–10; Total and Weakest Skill calculate automatically.")]),
  ];
  const scoreRows=[row(1,["Form","Level","Date","Listening /10","Reading /10","Writing /10","Total /30","Weakest Skill","Recommended Practice","Next Review Date"].map((value,index)=>inline(`${String.fromCharCode(65+index)}1`,value,1)))];
  for(let index=0;index<27;index++){
    const r=index+2;
    scoreRows.push(row(r,[inline(`A${r}`,(["A","B","C"] as const)[Math.floor(index/9)]),numeric(`B${r}`,(index%9)+1),formula(`G${r}`,`IF(COUNT(D${r}:F${r})<3,\"\",SUM(D${r}:F${r}))`),formula(`H${r}`,`IF(COUNT(D${r}:F${r})<3,\"\",IF(D${r}=MIN(D${r}:F${r}),\"Listening\",IF(E${r}=MIN(D${r}:F${r}),\"Reading\",\"Writing\")))`)]));
  }
  const scoreExtra='<autoFilter ref="A1:J28"/><dataValidations count="3"><dataValidation type="whole" operator="between" allowBlank="1" showErrorMessage="1" sqref="D2:D28"><formula1>0</formula1><formula2>10</formula2></dataValidation><dataValidation type="whole" operator="between" allowBlank="1" showErrorMessage="1" sqref="E2:E28"><formula1>0</formula1><formula2>10</formula2></dataValidation><dataValidation type="whole" operator="between" allowBlank="1" showErrorMessage="1" sqref="F2:F28"><formula1>0</formula1><formula2>10</formula2></dataValidation></dataValidations>';
  const summaryRows=[
    row(1,[inline("A1","Form",1),inline("B1","Average Total /30",1),inline("C1","Completed Records",1)]),
    ...["A","B","C"].map((formName,index)=>{const r=index+2;return row(r,[inline(`A${r}`,formName),formula(`B${r}`,`IFERROR(AVERAGEIF('Score Entry'!A2:A28,A${r},'Score Entry'!G2:G28),0)`),formula(`C${r}`,`COUNTIFS('Score Entry'!A2:A28,A${r},'Score Entry'!G2:G28,\">0\")`)]);}),
  ];
  return workbookPackage("HSKKit Practice Assessment Score Tracker",[
    {name:"Instructions",xml:sheet(instructions,'<cols><col min="1" max="1" width="110" customWidth="1"/></cols>')},
    {name:"Score Entry",xml:sheet(scoreRows,'<cols><col min="1" max="3" width="13" customWidth="1"/><col min="4" max="8" width="18" customWidth="1"/><col min="9" max="10" width="30" customWidth="1"/></cols>',scoreExtra)},
    {name:"Progress Summary",xml:sheet(summaryRows,'<cols><col min="1" max="1" width="14" customWidth="1"/><col min="2" max="3" width="22" customWidth="1"/></cols>')},
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
