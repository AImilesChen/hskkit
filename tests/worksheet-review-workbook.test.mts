import assert from 'node:assert/strict';
import test from 'node:test';
import {selectPackAssets} from '../src/lib/commercial/catalog.ts';
import {buildWorksheetLevel} from '../src/lib/commercial/worksheet-pack.ts';
import {generateWorksheetReviewWorkbook} from '../src/lib/commercial/companion-workbooks.ts';

const questionIds=Array.from({length:9},(_,index)=>{
  const level=index+1;
  return buildWorksheetLevel(selectPackAssets(level)).modules.flatMap(module=>module.questions.map(question=>({level,id:question.id})));
}).flat();

function entries(bytes:Uint8Array){
  const result=new Map<string,string>();
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  let at=0;
  while(at+30<=bytes.length&&view.getUint32(at,true)===0x04034b50){
    const size=view.getUint32(at+18,true),nameSize=view.getUint16(at+26,true),extraSize=view.getUint16(at+28,true);
    const name=new TextDecoder().decode(bytes.slice(at+30,at+30+nameSize));
    const start=at+30+nameSize+extraSize;
    result.set(name,new TextDecoder().decode(bytes.slice(start,start+size)));
    at=start+size;
  }
  return result;
}

test('optional worksheet log contains only stable question IDs and usable correction/retest columns',()=>{
  const zip=generateWorksheetReviewWorkbook(questionIds);
  const xml=entries(zip);
  assert.match(xml.get('xl/workbook.xml')??'',/Question log/);
  const sheet=xml.get('xl/worksheets/sheet2.xml')??'';
  const guide=xml.get('xl/worksheets/sheet1.xml')??'';
  const styles=xml.get('xl/styles.xml')??'';
  assert.match(guide,/STUDY RECORD/);
  assert.match(guide,/WHERE TO TYPE/);
  assert.match(guide,/EXAMPLE · no data prefilled/);
  assert.match(guide,/mergeCell ref="B21:F21"/);
  assert.match(sheet,/showGridLines="0"/);
  assert.match(sheet,/xSplit="2" ySplit="1"/);
  assert.match(sheet,/<c r="C2" s="15"\/>/);
  assert.match(sheet,/<c r="I271" s="13"\/>/);
  assert.match(sheet,/First attempt result/);
  assert.match(styles,/cellXfs count="18"/);
  assert.match(styles,/borderId="2"/);
  assert.match(styles,/FFFFF8E7/);
  assert.match(sheet,/Error cause/);
  assert.match(sheet,/Correction \/ evidence/);
  assert.match(sheet,/Next review date/);
  assert.match(sheet,/Retest result/);
  assert.match(sheet,/sqref="D2:D271"/);
  assert.match(sheet,/sqref="I2:I271"/);
  for(const {id} of questionIds)assert.ok(sheet.includes(`<t xml:space="preserve">${id}</t>`),id);
  assert.equal((sheet.match(/<row r=/g)??[]).length,271);
});

test('worksheet log rejects incomplete or duplicate question inventory',()=>{
  assert.throws(()=>generateWorksheetReviewWorkbook(questionIds.slice(1)),/INCOMPLETE/);
  assert.throws(()=>generateWorksheetReviewWorkbook([...questionIds.slice(0,-1),questionIds[0]]),/INVALID_WORKSHEET_QUESTION_ID/);
});
