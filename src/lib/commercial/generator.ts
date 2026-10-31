import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { PackManifest, PackSelection } from "./catalog.ts";

export function fitLines(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  const fits = (value: string) => font.widthOfTextAtSize(value, size) <= width;
  const pushLongToken = (token: string) => {
    let chunk = "";
    for (const char of token) {
      if (chunk && !fits(chunk + char)) { lines.push(chunk); chunk = char; }
      else chunk += char;
    }
    return chunk;
  };
  for (const paragraph of text.split("\n")) {
    let current = "";
    for (const token of paragraph.match(/\S+|\s+/g) ?? []) {
      if (/^\s+$/.test(token)) {
        if (current && !current.endsWith(" ")) current += " ";
        continue;
      }
      const next = current + token;
      if (fits(next)) { current = next; continue; }
      if (current.trim()) lines.push(current.trim());
      current = fits(token) ? token : pushLongToken(token);
    }
    if (current.trim()) lines.push(current.trim());
  }
  return lines;
}

function drawWrapped(page: PDFPage, text: string, font: PDFFont, size: number, x: number, y: number, width: number, lineHeight = size * 1.35) {
  const lines = fitLines(text, font, size, width);
  for (const line of lines) { page.drawText(line, { x, y, size, font, color: rgb(0.12, 0.16, 0.24) }); y -= lineHeight; }
  return y;
}

export function learnerGloss(value:string){
  return value.replace(/\bsth\b/gi,"something").replace(/\bsb\b/gi,"someone").replace(/\bCL:\s*/g,"measure word: ").replace(/\(Tw\)/g,"(Taiwan)");
}

export const HSK30_MIT_NOTICE=`MIT License\nCopyright (c) 2023 Ivan Krasilnikov\nCopyright (c) 2021 Shawky\nCopyright (c) 2021 Pleco Inc.\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;

export async function generatePackPdf(selection: PackSelection, manifest: PackManifest, fontBytes: Uint8Array, _emojiFontBytes: Uint8Array,options?:{label?:string;entryNumberOffset?:number;totalAdvancedCount?:number}) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: false });
  const levelLabel=options?.label??(selection.level>=7?"Advanced 7–9":`Level ${selection.level}`);
  const isVolume=options?.totalAdvancedCount!==undefined;
  const is2025ExamLevel=manifest.standardVersion==="HSK-EXAM-2025";
  pdf.setTitle(`HSKKit HSK 3.0 ${levelLabel}${isVolume?" Vocabulary":" Complete Vocabulary"}`);
  pdf.setAuthor("HSKKit");
  pdf.setSubject(`HSK 3.0 ${levelLabel} vocabulary reference; ${manifest.generationVersion}`);
  pdf.setKeywords(["HSK 3.0",levelLabel,"complete vocabulary",manifest.generationVersion,"CC BY-SA 4.0"]);
  const pageSize: [number, number] = [595.28, 841.89];
  const cover=pdf.addPage(pageSize);
  let page = cover;
  let y = 790;
  const headerLabel=isVolume?`HSKKit - HSK 3.0 Advanced 7–9 · Reading Volume`:`HSKKit - HSK 3.0 ${levelLabel} Vocabulary`;
  const addHeader = (target:PDFPage) => {
    target.drawRectangle({ x: 0, y: 815, width: 595.28, height: 27, color: rgb(0.06, 0.35, 0.32) });
    target.drawText(headerLabel, { x: 36, y: 823, size: 10, font, color: rgb(1, 1, 1) });
  };
  const ensure = (needed: number) => { if (y < needed) { page = pdf.addPage(pageSize); y = 790; addHeader(page); } };
  addHeader(cover);
  y=drawWrapped(cover,isVolume?levelLabel:`${levelLabel} Complete Vocabulary`,font,24,40,y,515,30)-12;
  cover.drawText("汉字 · Pinyin · English · Source ID", { x: 40, y, size: 13, font }); y -= 32;
  const entryStatement=isVolume?`This reading volume repeats ${selection.words.length} of ${options.totalAdvancedCount} entries from the complete Advanced 7–9 index; numbering is continuous across the three volumes.`:`${selection.words.length} entries in this complete ${selection.level>=7?"unified Advanced 7–9 band":`Level ${selection.level}`} reference.`;
  y=drawWrapped(cover,`${entryStatement}\nGeneration: ${manifest.generationVersion}. Standard scope: ${manifest.standardVersion}. Audio is not included.`,font,10,40,y,515,15)-22;
  const compactOpening=is2025ExamLevel&&selection.level<=3&&!isVolume;
  const findingTip=compactOpening?"Use PDF search to find an exact Hanzi, pinyin, English gloss or source ID.":"Find a pinyin initial below, then use page numbers or PDF search for an exact Hanzi, pinyin, English gloss or source ID.";
  y=drawWrapped(cover,`How to use this reference: ${findingTip} Dictionary-style glosses can include several senses; they are not graded lesson translations. A part-of-speech label appears only when the source assigns one.${is2025ExamLevel?"":" A vertical bar separates alternative headwords and matching pronunciations."}`,font,10,40,y,515,15)-16;
  if(selection.level>=7)y=drawWrapped(cover,"Advanced 7–9 is one unified vocabulary band. The reading volumes are HSKKit usability divisions, not official separate Level 7, 8 and 9 lists.",font,10,40,y,515,15)-16;
  let indexTop=0;
  if(compactOpening){
    cover.drawText("Vocabulary entries / 词汇",{x:40,y,size:16,font,color:rgb(0.06,0.35,0.32)});
    y-=32;
  }else{
    cover.drawText("Find words by pinyin initial",{x:40,y,size:16,font,color:rgb(0.06,0.35,0.32)});
    indexTop=y-30;
    page=pdf.addPage(pageSize);y=790;addHeader(page);
  }
  const initialPages=new Map<string,number>();
  const pageRanges=new Map<number,{first:number;last:number}>();
  for (const [index, word] of selection.words.entries()) {
    const number=(options?.entryNumberOffset??0)+index+1;
    const heading=`${number}. ${word.hanzi}  ${word.pinyin}`;
    const pos=word.partOfSpeech&&word.partOfSpeech!=="unspecified"?`[${word.partOfSpeech}] `:"";
    const meaning=`${pos}${learnerGloss(word.meaning)}`;
    const entryHeight=fitLines(heading,font,13,515).length*18+fitLines(meaning,font,10.5,495).length*15+40;
    ensure(entryHeight+52);
    const currentPage=pdf.getPageCount();
    const initial=(word.pinyin.normalize("NFD").replace(/\p{M}/gu,"").match(/[a-z]/i)?.[0]??"#").toUpperCase();
    if(!initialPages.has(initial))initialPages.set(initial,currentPage);
    const range=pageRanges.get(currentPage);if(range)range.last=number;else pageRanges.set(currentPage,{first:number,last:number});
    y=drawWrapped(page,heading,font,13,40,y,515,18)-2;
    y=drawWrapped(page,meaning,font,10.5,54,y,495,15)-5;
    y=drawWrapped(page,`Source ID: ${word.id}`,font,8.5,54,y,495,11.5)-12;
  }
  if(selection.exercises.length){
    page=pdf.addPage(pageSize);y=790;addHeader(page);
    page.drawText("Self-check / 自测", { x: 40, y, size: 18, font, color: rgb(0.06, 0.35, 0.32) }); y -= 28;
    y=drawWrapped(page,"Twenty words are sampled across this entire list. Write each meaning and pronunciation before checking the key. This short self-check does not test every entry.",font,10,40,y,515,15)-18;
    for (const exercise of selection.exercises) { ensure(80); y = drawWrapped(page, exercise.prompt, font, 10, 40, y, 515); y -= 22; }
    ensure(160); y -= 8;
    page.drawText("Answer key", { x: 40, y, size: 16, font, color: rgb(0.06, 0.35, 0.32) }); y -= 24;
    for (const exercise of selection.exercises) { ensure(60); y = drawWrapped(page, `${exercise.id}: ${learnerGloss(exercise.answer)}`, font, 9, 40, y, 515); y -= 5; }
  }
  page=pdf.addPage(pageSize);y=790;addHeader(page);
  page.drawText("Sources, rights and traceability", { x: 40, y, size: 16, font, color: rgb(0.06,0.35,0.32) }); y -= 28;
  y=drawWrapped(page,manifest.licenseNotice,font,9,40,y,515,13)-16;
  y=drawWrapped(page,is2025ExamLevel
    ?`${selection.level>=7?"Unified Advanced 7–9 band":"Level "+selection.level} placement: 2025 HSK exam syllabus (https://www.chinesetest.cn/HSK). HSKKit edited the pinyin, parts of speech and learner glosses for this publication. Adapted English definitions retain CC BY-SA 4.0 rights (https://creativecommons.org/licenses/by-sa/4.0/). Every entry retains its source ID; the versioned delivery manifest records per-entry references.`
    :"Level membership: PRC Ministry of Education, GF0025-2021 (https://www.moe.gov.cn/). Pinyin, variants and available POS: ivankra/hsk30 commit 4ff9e391 (MIT; https://github.com/ivankra/hsk30). English definitions: CC-CEDICT snapshot e0d756cb (CC BY-SA 4.0; https://www.mdbg.net/chinese/dictionary?page=cc-cedict and https://creativecommons.org/licenses/by-sa/4.0/). HSKKit adapts the source data for this publication. Every entry retains its source ID; the versioned delivery manifest records the full per-entry references.",font,9,40,y,515,13)-16;
  const sourceGroups=new Map<string,number>();for(const asset of manifest.assets){const key=`${asset.sourceRef} · ${asset.licenseRef}`;sourceGroups.set(key,(sourceGroups.get(key)??0)+1);}
  for(const [source,count] of sourceGroups){ensure(80);y=drawWrapped(page,`${count} entries: ${source}`,font,8,40,y,515,11)-8;}
  const editorial=selection.words.filter(word=>word.sourceRef.includes("hskkit-editorial"));
  if(editorial.length){ensure(100);y=drawWrapped(page,`HSKKit original compositional glosses: ${editorial.map(word=>word.id).join(", ")}`,font,8,40,y,515,11)-16;}
  if(!is2025ExamLevel){
    ensure(130);page.drawText("MIT source notice",{x:40,y,size:12,font,color:rgb(0.06,0.35,0.32)});y-=20;
    for(const paragraph of HSK30_MIT_NOTICE.split("\n")){ensure(65);y=drawWrapped(page,paragraph,font,8,40,y,515,11)-2;}
  }
  if(!compactOpening){
    const initials=[...initialPages.entries()].sort(([a],[b])=>a.localeCompare(b));
    for(const [index,[letter,pageNumber]] of initials.entries()){
      const column=index>=Math.ceil(initials.length/2)?1:0;
      const row=column?index-Math.ceil(initials.length/2):index;
      cover.drawText(`${letter}  ·  page ${pageNumber}`,{x:40+column*265,y:indexTop-row*23,size:11,font,color:rgb(0.12,0.16,0.24)});
    }
  }
  const totalPages=pdf.getPageCount();
  for(const [index,target] of pdf.getPages().entries()){
    target.drawLine({start:{x:40,y:43},end:{x:555,y:43},thickness:0.5,color:rgb(0.82,0.86,0.87)});
    const range=pageRanges.get(index+1);
    if(range)target.drawText(`Entries ${range.first}–${range.last}`,{x:40,y:27,size:8,font,color:rgb(0.35,0.4,0.43)});
    const footer=`Page ${index+1} of ${totalPages}`;
    target.drawText(footer,{x:555-font.widthOfTextAtSize(footer,8),y:27,size:8,font,color:rgb(0.35,0.4,0.43)});
  }
  return new Uint8Array(await pdf.save({ useObjectStreams: false }));
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; }
  return table;
})();
function crc32(data: Uint8Array) { let c = 0xffffffff; for (const byte of data) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function u16(value: number) { return [value & 255, (value >>> 8) & 255]; }
function u32(value: number) { return [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]; }

export function generateZipFiles(files:Array<{name:string;data:Uint8Array}>) {
  const encoder = new TextEncoder();
  const local: Uint8Array[] = [], central: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name); const crc = crc32(file.data); const size = file.data.length;
    const header = Uint8Array.from([80,75,3,4,20,0,0,0,0,0,0,0,0,0,...u32(crc),...u32(size),...u32(size),...u16(name.length),0,0]);
    local.push(header,name,file.data);
    central.push(Uint8Array.from([80,75,1,2,20,0,20,0,0,0,0,0,0,0,0,0,...u32(crc),...u32(size),...u32(size),...u16(name.length),0,0,0,0,0,0,0,0,0,0,0,0,...u32(offset),...name]));
    offset += header.length + name.length + size;
  }
  const centralSize=central.reduce((sum,chunk)=>sum+chunk.length,0);
  const end = Uint8Array.from([80,75,5,6,0,0,0,0,...u16(files.length),...u16(files.length),...u32(centralSize),...u32(offset),0,0]);
  const chunks=[...local,...central,end]; const total=chunks.reduce((sum,chunk)=>sum+chunk.length,0); const output=new Uint8Array(total);
  let cursor=0; for(const chunk of chunks){output.set(chunk,cursor);cursor+=chunk.length;} return output;
}

export function generateOfflineZip(pdf:Uint8Array,manifest:PackManifest){
  const encoder=new TextEncoder();
  return generateZipFiles([
    {name:"HSKKit-Advanced-Study-Pack.pdf",data:pdf},
    {name:"manifest.json",data:encoder.encode(JSON.stringify(manifest,null,2))},
    {name:"README.txt",data:encoder.encode("HSKKit offline study pack. The purchaser may print any number of copies for personal study or learners they teach, without charge; printed copies and digital files may not be sold or resold. Audio is excluded because offline redistribution is not authorized.\n")},
  ]);
}
