import {generateZipFiles} from "./generator.ts";

type TrackerWord={level:number;sourceBand:string;sourceLevel:number;id:string;hanzi:string;pinyin:string;meaning:string};

const LOG_LAST_ROW=501;
const encoder=new TextEncoder();
const blank=(ref:string,style=5)=>`<c r="${ref}" s="${style}"/>`;
const xml=(value:unknown)=>String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;");
const inline=(ref:string,value:unknown,style=0)=>`<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
const numberCell=(ref:string,value:number,style=0)=>`<c r="${ref}" s="${style}"><v>${value}</v></c>`;
const formula=(ref:string,value:string,style=0)=>`<c r="${ref}" s="${style}"><f>${xml(value)}</f><v/></c>`;
const row=(index:number,cells:string[],height?:number)=>`<row r="${index}"${height?` ht="${height}" customHeight="1"`:""}>${cells.join("")}</row>`;
const worksheet=(body:string,extra="")=>`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${body}${extra}</worksheet>`;

function instructionsSheet(){
  const rows=[
    row(1,[inline("A1","HSKKit Assessment Tracker · Start here",1)],32),
    row(2,[inline("A2","Use Blank.xlsx for your records. Example.xlsx contains fictional scores and two dated checks of the same word.",2)],32),
    row(4,[inline("A4","1 · Score three different skills",1)],28),
    row(5,[inline("A5","Recognition: see Hanzi, give its meaning. Recall: see a meaning cue, retrieve the Chinese word without seeing Hanzi. Usage: make a new, accurate sentence.",2)],42),
    row(6,[inline("A6","For each skill: 0 = cannot demonstrate it; 1 = partial or prompted; 2 = independent and accurate. Leave a skill blank when it was not tested.",2)],38),
    row(7,[inline("A7","Mastery is (three scores) / 6 only after all three skills are scored. A real score of 0 is different from a blank.",2)],32),
    row(9,[inline("A9","2 · Choose the record that fits",1)],28),
    row(10,[inline("A10","Vocabulary Tracker is one replaceable current score per source word. Assessment Log has 500 dated rows; add a new row for every retest. They do not sync automatically.",2)],42),
    row(11,[inline("A11","Enter a date, exact Word ID and all three scores in Assessment Log. Only rows marked Ready enter Weekly Review. Set Week Start and Target source level there.",2)],42),
    row(12,[inline("A12","The weekly view preserves history because it reads dated log events, not the editable current snapshot. Record evidence, next action and next review date.",2)],38),
    row(14,[inline("A14","3 · Source and compatibility",1)],28),
    row(15,[inline("A15","HSK Levels 7–9 share one canonical advanced source band. The 5,636 advanced word IDs appear once under source level 7; Dashboard labels that row Advanced 7–9.",2)],42),
    row(16,[inline("A16","The workbook is intended for desktop Excel or LibreOffice. CSV files are optional exports; other spreadsheet app imports have not been verified.",2)],36),
  ];
  const merged=[1,2,4,5,6,7,9,10,11,12,14,15,16].map(i=>`<mergeCell ref="A${i}:H${i}"/>`).join("");
  return worksheet(`<sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews><cols><col min="1" max="1" width="110" customWidth="1"/></cols><sheetData>${rows.join("")}</sheetData><mergeCells count="13">${merged}</mergeCells>`);
}

function dashboardSheet(lastRow:number){
  const rows=[row(1,[inline("A1","HSK level / band",1),inline("B1","Source level",1),inline("C1","Words",1),inline("D1","Fully scored",1),inline("E1","Average mastery",1),inline("F1","Secure ≥ 80%",1)])];
  for(let level=1;level<=7;level++){
    const r=level+1;
    rows.push(row(r,[inline(`A${r}`,level===7?"Advanced 7–9":`Level ${level}`),numberCell(`B${r}`,level),formula(`C${r}`,`COUNTIF('Vocabulary Tracker'!$A$2:$A$${lastRow},B${r})`),formula(`D${r}`,`SUMPRODUCT(--('Vocabulary Tracker'!$A$2:$A$${lastRow}=B${r}),--ISNUMBER('Vocabulary Tracker'!$M$2:$M$${lastRow}))`),formula(`E${r}`,`IF(D${r}=0,\"\",AVERAGEIFS('Vocabulary Tracker'!$M$2:$M$${lastRow},'Vocabulary Tracker'!$A$2:$A$${lastRow},B${r}))`,4),formula(`F${r}`,`IF(D${r}=0,\"\",COUNTIFS('Vocabulary Tracker'!$A$2:$A$${lastRow},B${r},'Vocabulary Tracker'!$M$2:$M$${lastRow},\">=0.8\"))`)]));
  }
  rows.push(row(10,[inline("A10","Advanced 7–9 uses one source band. Empty mastery means no complete three-skill check yet.",2)]));
  return worksheet(`<sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews><cols><col min="1" max="1" width="21" customWidth="1"/><col min="2" max="4" width="16" customWidth="1"/><col min="5" max="6" width="22" customWidth="1"/></cols><sheetData>${rows.join("")}</sheetData><mergeCells count="1"><mergeCell ref="A10:F10"/></mergeCells><conditionalFormatting sqref="E2:E8"><cfRule type="colorScale" priority="1"><colorScale><cfvo type="min"/><cfvo type="percentile" val="50"/><cfvo type="max"/><color rgb="FFF8696B"/><color rgb="FFFFEB84"/><color rgb="FF63BE7B"/></colorScale></cfRule></conditionalFormatting><drawing r:id="rId1"/>`);
}

function trackerSheet(words:TrackerWord[],example:boolean){
  const lastRow=words.length+1;
  const headers=["Level","Source Band","Source Level","Word ID","Hanzi","Pinyin","Meaning","Evidence ID","Recognition 0–2","Recall 0–2","Usage 0–2","Score /6","Mastery %","Last Checked","Next Review","Evidence","Notes"];
  const rows=[row(1,headers.map((value,index)=>inline(`${String.fromCharCode(65+index)}1`,value,1)),26)];
  words.forEach((word,index)=>{
    const r=index+2,sampled=example&&index<27;
    const score=sampled?[index%3,(index+1)%3,(index+2)%3]:[null,null,null];
    const cells=[numberCell(`A${r}`,word.level),inline(`B${r}`,word.sourceBand),numberCell(`C${r}`,word.sourceLevel),inline(`D${r}`,word.id),inline(`E${r}`,word.hanzi),inline(`F${r}`,word.pinyin),inline(`G${r}`,word.meaning),...(sampled?[inline(`H${r}`,"SAMPLE_EVIDENCE")]:[]),...(score[0]===null?[]:[numberCell(`I${r}`,score[0]!),numberCell(`J${r}`,score[1]!),numberCell(`K${r}`,score[2]!)]),formula(`L${r}`,`IF(COUNT(I${r}:K${r})=3,SUM(I${r}:K${r}),\"\")`),formula(`M${r}`,`IF(L${r}=\"\",\"\",L${r}/6)`,4),...(sampled?[numberCell(`N${r}`,46235,3),numberCell(`O${r}`,46242,3),inline(`P${r}`,"Sample only — replace with observed evidence")]:[])];
    rows.push(row(r,cells));
  });
  return worksheet(`<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="8" customWidth="1"/><col min="2" max="4" width="19" customWidth="1"/><col min="5" max="7" width="20" customWidth="1"/><col min="8" max="8" width="18" customWidth="1"/><col min="9" max="13" width="15" customWidth="1"/><col min="14" max="17" width="22" customWidth="1"/></cols><sheetData>${rows.join("")}</sheetData><autoFilter ref="A1:Q${lastRow}"/><conditionalFormatting sqref="M2:M${lastRow}"><cfRule type="cellIs" dxfId="0" priority="1" operator="greaterThanOrEqual"><formula>0.8</formula></cfRule><cfRule type="cellIs" dxfId="1" priority="2" operator="lessThan"><formula>0.5</formula></cfRule></conditionalFormatting><dataValidations count="3"><dataValidation type="whole" operator="between" allowBlank="1" showErrorMessage="1" error="Enter 0, 1 or 2" sqref="I2:I${lastRow}"><formula1>0</formula1><formula2>2</formula2></dataValidation><dataValidation type="whole" operator="between" allowBlank="1" showErrorMessage="1" error="Enter 0, 1 or 2" sqref="J2:J${lastRow}"><formula1>0</formula1><formula2>2</formula2></dataValidation><dataValidation type="whole" operator="between" allowBlank="1" showErrorMessage="1" error="Enter 0, 1 or 2" sqref="K2:K${lastRow}"><formula1>0</formula1><formula2>2</formula2></dataValidation></dataValidations>`);
}

function assessmentLogSheet(words:TrackerWord[],example:boolean){
  const lastRow=words.length+1;
  const headers=["Attempt Date","Word ID","Source Level","Recognition 0–2","Recall 0–2","Usage 0–2","Score /6","Mastery %","Observed Evidence","Next Action","Next Review","Entry Status"];
  const rows=[row(1,headers.map((value,index)=>inline(`${String.fromCharCode(65+index)}1`,value,1)),30)];
  const sampleDate=(day:number)=>Math.floor(Date.UTC(2026,8,day)/86400000)+25569;
  const samples:Record<number,{date:number;id:string;scores:[number,number,number];evidence:string;action:string;next:number}>=example?{
    2:{date:sampleDate(7),id:words[0].id,scores:[2,1,0],evidence:"SAMPLE: recognized without cue; could not form a sentence",action:"Write one checked sentence, then retest",next:sampleDate(14)},
    3:{date:sampleDate(14),id:words[0].id,scores:[2,2,1],evidence:"SAMPLE RETEST: retrieved independently; sentence needs correction",action:"Write a fresh sentence",next:sampleDate(21)},
    4:{date:sampleDate(14),id:words[1].id,scores:[2,2,1],evidence:"SAMPLE: retrieved independently; usage still prompted",action:"Use in a new context",next:sampleDate(21)},
  }:{};
  for(let r=2;r<=LOG_LAST_ROW;r++){
    const sample=samples[r];
    rows.push(row(r,[
      sample?numberCell(`A${r}`,sample.date,6):blank(`A${r}`,6),
      sample?inline(`B${r}`,sample.id,5):blank(`B${r}`),
      formula(`C${r}`,`IF(B${r}=\"\",\"\",IFERROR(INDEX('Vocabulary Tracker'!$A$2:$A$${lastRow},MATCH(B${r},'Vocabulary Tracker'!$D$2:$D$${lastRow},0)),\"\"))`),
      ...(["D","E","F"] as const).map((col,index)=>sample?numberCell(`${col}${r}`,sample.scores[index],5):blank(`${col}${r}`)),
      formula(`G${r}`,`IF(L${r}=\"Ready\",SUM(D${r}:F${r}),\"\")`),
      formula(`H${r}`,`IF(G${r}=\"\",\"\",G${r}/6)`,4),
      sample?inline(`I${r}`,sample.evidence,5):blank(`I${r}`),
      sample?inline(`J${r}`,sample.action,5):blank(`J${r}`),
      sample?numberCell(`K${r}`,sample.next,6):blank(`K${r}`,6),
      formula(`L${r}`,`IF(COUNTA(A${r}:B${r},D${r}:F${r})=0,\"\",IF(NOT(ISNUMBER(A${r})),\"Enter a date\",IF(B${r}=\"\",\"Enter word ID\",IF(C${r}=\"\",\"Word ID not found\",IF(COUNT(D${r}:F${r})<3,\"Score all 3 skills\",IF(OR(MIN(D${r}:F${r})<0,MAX(D${r}:F${r})>2,D${r}<>INT(D${r}),E${r}<>INT(E${r}),F${r}<>INT(F${r})),\"Scores must be 0-2\",\"Ready\"))))))`)
    ]));
  }
  const validations=["D","E","F"].map(col=>`<dataValidation type="whole" operator="between" allowBlank="1" showErrorMessage="1" error="Enter 0, 1 or 2" sqref="${col}2:${col}${LOG_LAST_ROW}"><formula1>0</formula1><formula2>2</formula2></dataValidation>`).join("");
  return worksheet(`<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="17" customWidth="1"/><col min="2" max="2" width="26" customWidth="1"/><col min="3" max="8" width="17" customWidth="1"/><col min="9" max="10" width="41" customWidth="1"/><col min="11" max="11" width="18" customWidth="1"/><col min="12" max="12" width="28" customWidth="1"/></cols><sheetData>${rows.join("")}</sheetData><autoFilter ref="A1:L${LOG_LAST_ROW}"/><dataValidations count="3">${validations}</dataValidations>`);
}

function weeklySheet(example:boolean){
  const headers=["Week Start","Target Source Level","Complete Attempts","Recognition %","Recall %","Usage %","Overall %","Strongest Evidence","Weakest Evidence","Next Action","Next Review Date"];
  const rows=[row(1,headers.map((value,index)=>inline(`${String.fromCharCode(65+index)}1`,value,1)),30)];
  for(let index=0;index<52;index++){
    const r=index+2;
    const sampleDate=example&&index<2?Math.floor(Date.UTC(2026,8,index===0?7:14)/86400000)+25569:null;
    const filter=`'Assessment Log'!$L$2:$L$${LOG_LAST_ROW},\"Ready\",'Assessment Log'!$C$2:$C$${LOG_LAST_ROW},B${r},'Assessment Log'!$A$2:$A$${LOG_LAST_ROW},\">=\"&A${r},'Assessment Log'!$A$2:$A$${LOG_LAST_ROW},\"<\"&(A${r}+7)`;
    rows.push(row(r,[
      sampleDate?numberCell(`A${r}`,sampleDate,6):blank(`A${r}`,6),
      sampleDate?numberCell(`B${r}`,1,5):blank(`B${r}`),
      formula(`C${r}`,`IF(OR(NOT(ISNUMBER(A${r})),B${r}=\"\"),\"\",COUNTIFS(${filter}))`),
      ...(["D","E","F"] as const).map((col,skill)=>formula(`${col}${r}`,`IF(C${r}=\"\",\"\",IF(C${r}=0,\"\",AVERAGEIFS('Assessment Log'!$${["D","E","F"][skill]}$2:$${["D","E","F"][skill]}$${LOG_LAST_ROW},${filter})/2))`,4)),
      formula(`G${r}`,`IF(C${r}=\"\",\"\",IF(C${r}=0,\"\",AVERAGE(D${r}:F${r})))`,4),
      blank(`H${r}`),blank(`I${r}`),blank(`J${r}`),blank(`K${r}`,6)
    ]));
  }
  return worksheet(`<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="17" customWidth="1"/><col min="2" max="3" width="22" customWidth="1"/><col min="4" max="7" width="17" customWidth="1"/><col min="8" max="10" width="30" customWidth="1"/><col min="11" max="11" width="20" customWidth="1"/></cols><sheetData>${rows.join("")}</sheetData><autoFilter ref="A1:K53"/><dataValidations count="1"><dataValidation type="whole" operator="between" allowBlank="1" showErrorMessage="1" error="Enter source level 1-7; 7 is the unified Advanced 7-9 band" sqref="B2:B53"><formula1>1</formula1><formula2>7</formula2></dataValidation></dataValidations>`);
}

function printSummarySheet(){
  const rows=[row(1,[inline("A1","HSK Assessment Summary",1)],32),row(2,[inline("A2","Learner / group: ______________________________"),inline("E2","Date: __________________")],28),row(4,[inline("A4","Level / band",1),inline("B4","Words",1),inline("C4","Fully scored",1),inline("D4","Average mastery",1),inline("E4","Next evidence / action",1)])];
  for(let level=1;level<=7;level++){
    const r=level+4,dashboardRow=level+1;
    rows.push(row(r,[inline(`A${r}`,level===7?"Advanced 7–9":`Level ${level}`),formula(`B${r}`,`Dashboard!C${dashboardRow}`),formula(`C${r}`,`Dashboard!D${dashboardRow}`),formula(`D${r}`,`Dashboard!E${dashboardRow}`,4),inline(`E${r}`,"________________________________________")],38));
  }
  rows.push(row(13,[inline("A13","Observed strengths:",1)],28),row(14,[inline("A14","________________________________________________________________________________________")],34),row(16,[inline("A16","Priority review evidence:",1)],28),row(17,[inline("A17","________________________________________________________________________________________")],34),row(19,[inline("A19","Next review date and action:",1)],28),row(20,[inline("A20","________________________________________________________________________________________")],34));
  return worksheet(`<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews><cols><col min="1" max="1" width="22" customWidth="1"/><col min="2" max="4" width="20" customWidth="1"/><col min="5" max="5" width="42" customWidth="1"/></cols><sheetData>${rows.join("")}</sheetData><mergeCells count="7"><mergeCell ref="A1:E1"/><mergeCell ref="A13:E13"/><mergeCell ref="A14:E14"/><mergeCell ref="A16:E16"/><mergeCell ref="A17:E17"/><mergeCell ref="A19:E19"/><mergeCell ref="A20:E20"/></mergeCells><printOptions horizontalCentered="1"/><pageMargins left="0.35" right="0.35" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="1"/>`);
}

const contentTypes=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${[1,2,3,4,5,6].map(index=>`<Override PartName="/xl/worksheets/sheet${index}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/><Override PartName="/xl/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/><Override PartName="/xl/charts/chart2.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
const rootRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;
const workbook=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets><sheet name="Instructions" sheetId="1" r:id="rId1"/><sheet name="Dashboard" sheetId="2" r:id="rId2"/><sheet name="Vocabulary Tracker" sheetId="3" r:id="rId3"/><sheet name="Assessment Log" sheetId="4" r:id="rId4"/><sheet name="Weekly Review" sheetId="5" r:id="rId5"/><sheet name="Print Summary" sheetId="6" r:id="rId6"/></sheets><calcPr calcId="191029" calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>`;
const workbookRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${[1,2,3,4,5,6].map(index=>`<Relationship Id="rId${index}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index}.xml"/>`).join("")}<Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="10"/><name val="Arial"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Arial"/></font><font><color rgb="FF374151"/><sz val="10"/><name val="Arial"/></font></fonts><fills count="6"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F766E"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD1FAE5"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="7"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="0" fillId="5" borderId="0" xfId="0" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="14" fontId="0" fillId="5" borderId="0" xfId="0" applyFill="1" applyNumberFormat="1"/></cellXfs><dxfs count="2"><dxf><fill><patternFill patternType="solid"><fgColor rgb="FFD1FAE5"/></patternFill></fill></dxf><dxf><fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/></patternFill></fill></dxf></dxfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
const drawing=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><xdr:twoCellAnchor><xdr:from><xdr:col>6</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>13</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>15</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="Mastery by level"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId1"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor><xdr:twoCellAnchor><xdr:from><xdr:col>6</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>16</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>13</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>30</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="3" name="Scored words by level"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId2"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>`;
const drawingRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart2.xml"/></Relationships>`;
const sheet2Rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>`;
function chart(title:string,valueRange:string,percent=false){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US"/><a:t>${xml(title)}</a:t></a:r></a:p></c:rich></c:tx></c:title><c:plotArea><c:layout/><c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/><c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:v>HSKKit</c:v></c:tx><c:cat><c:strRef><c:f>Dashboard!$A$2:$A$8</c:f></c:strRef></c:cat><c:val><c:numRef><c:f>${valueRange}</c:f></c:numRef></c:val></c:ser><c:axId val="48650112"/><c:axId val="48672768"/></c:barChart><c:catAx><c:axId val="48650112"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:tickLblPos val="nextTo"/><c:crossAx val="48672768"/><c:crosses val="autoZero"/></c:catAx><c:valAx><c:axId val="48672768"/><c:scaling><c:orientation val="minMax"/>${percent?'<c:max val="1"/>':""}</c:scaling><c:delete val="0"/><c:axPos val="l"/><c:numFmt formatCode="${percent?"0%":"0"}" sourceLinked="0"/><c:tickLblPos val="nextTo"/><c:crossAx val="48650112"/><c:crosses val="autoZero"/></c:valAx></c:plotArea><c:plotVisOnly val="1"/></c:chart></c:chartSpace>`;}

export function generateAssessmentWorkbook(words:TrackerWord[],example=false){
  const lastRow=words.length+1;
  const files:Array<{name:string;data:Uint8Array}>=[
    {name:"[Content_Types].xml",data:encoder.encode(contentTypes)},
    {name:"_rels/.rels",data:encoder.encode(rootRels)},
    {name:"docProps/core.xml",data:encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>HSKKit Assessment Tracker ${example?"Example":"Blank"}</dc:title><dc:creator>HSKKit</dc:creator></cp:coreProperties>`)},
    {name:"docProps/app.xml",data:encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>HSKKit</Application></Properties>`)},
    {name:"xl/workbook.xml",data:encoder.encode(workbook)},
    {name:"xl/_rels/workbook.xml.rels",data:encoder.encode(workbookRels)},
    {name:"xl/styles.xml",data:encoder.encode(styles)},
    {name:"xl/worksheets/sheet1.xml",data:encoder.encode(instructionsSheet())},
    {name:"xl/worksheets/sheet2.xml",data:encoder.encode(dashboardSheet(lastRow))},
    {name:"xl/worksheets/_rels/sheet2.xml.rels",data:encoder.encode(sheet2Rels)},
    {name:"xl/worksheets/sheet3.xml",data:encoder.encode(trackerSheet(words,example))},
    {name:"xl/worksheets/sheet4.xml",data:encoder.encode(assessmentLogSheet(words,example))},
    {name:"xl/worksheets/sheet5.xml",data:encoder.encode(weeklySheet(example))},
    {name:"xl/worksheets/sheet6.xml",data:encoder.encode(printSummarySheet())},
    {name:"xl/drawings/drawing1.xml",data:encoder.encode(drawing)},
    {name:"xl/drawings/_rels/drawing1.xml.rels",data:encoder.encode(drawingRels)},
    {name:"xl/charts/chart1.xml",data:encoder.encode(chart("Average mastery by HSK band","Dashboard!$E$2:$E$8",true))},
    {name:"xl/charts/chart2.xml",data:encoder.encode(chart("Fully scored words by HSK band","Dashboard!$D$2:$D$8"))},
  ];
  return generateZipFiles(files);
}
