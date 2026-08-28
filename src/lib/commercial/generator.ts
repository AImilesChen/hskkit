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

export async function generatePackPdf(selection: PackSelection, manifest: PackManifest, fontBytes: Uint8Array, emojiFontBytes: Uint8Array,options?:{label?:string}) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: false });
  const emojiFont = await pdf.embedFont(emojiFontBytes, { subset: false });
  const levelLabel=options?.label??(selection.level===7?"Advanced 7–9":`Level ${selection.level}`);
  pdf.setTitle(`HSKKit HSK 3.0 ${levelLabel} Complete Vocabulary`);
  pdf.setAuthor("HSKKit");
  pdf.setSubject(`Complete canonical HSK 3.0 ${levelLabel} vocabulary; ${manifest.generationVersion}`);
  pdf.setKeywords(["HSK 3.0",levelLabel,"complete vocabulary",manifest.generationVersion,"CC BY-SA 4.0"]);
  const pageSize: [number, number] = [595.28, 841.89];
  let page = pdf.addPage(pageSize);
  let y = 790;
  const addHeader = () => {
    page.drawRectangle({ x: 0, y: 815, width: 595.28, height: 27, color: rgb(0.06, 0.35, 0.32) });
    page.drawText(`HSKKit - HSK 3.0 ${levelLabel} Complete Vocabulary`, { x: 36, y: 823, size: 10, font, color: rgb(1, 1, 1) });
  };
  const ensure = (needed: number) => { if (y < needed) { page = pdf.addPage(pageSize); y = 790; addHeader(); } };
  addHeader();
  page.drawText(`${levelLabel} Complete Vocabulary`, { x: 40, y, size: 24, font, color: rgb(0.06, 0.35, 0.32) }); y -= 38;
  page.drawText("汉字 · Pinyin · English · POS · Source ID", { x: 40, y, size: 13, font });
  page.drawText("☺", { x: 347, y, size: 14, font: emojiFont }); y -= 26;
  y = drawWrapped(page, `Generation: ${manifest.generationVersion}  |  Complete entry count: ${selection.words.length}\nCanonical release: ${manifest.standardVersion}. Audio is excluded because offline redistribution is not authorized.${selection.level===7?"\nHSK 3.0 defines one unified Advanced 7–9 vocabulary band. This is the complete official band, not three separate official level lists.":""}`, font, 9, 40, y, 515); y -= 15;
  for (const [index, word] of selection.words.entries()) {
    ensure(112);
    page.drawText(`${index + 1}. ${word.hanzi}  ${word.pinyin}`, { x: 40, y, size: 12, font, color: rgb(0.06, 0.35, 0.32) }); y -= 16;
    y = drawWrapped(page, `${word.partOfSpeech ? `[${word.partOfSpeech}] ` : ""}${word.meaning}`, font, 9, 54, y, 495); y -= 5;
    y = drawWrapped(page, `Source ID: ${word.id}`, font, 7, 54, y, 495); y -= 8;
  }
  ensure(160); y -= 8;
  page.drawText("练习 / Exercises", { x: 40, y, size: 18, font, color: rgb(0.06, 0.35, 0.32) }); y -= 26;
  for (const exercise of selection.exercises) { ensure(80); y = drawWrapped(page, exercise.prompt, font, 10, 40, y, 515); y -= 22; }
  ensure(160); y -= 8;
  page.drawText("Answer key", { x: 40, y, size: 16, font, color: rgb(0.06, 0.35, 0.32) }); y -= 24;
  for (const exercise of selection.exercises) { ensure(60); y = drawWrapped(page, `${exercise.id}: ${exercise.answer}`, font, 9, 40, y, 515); y -= 5; }
  page=pdf.addPage(pageSize);y=790;addHeader();
  page.drawText("授权与追溯 / License and traceability", { x: 40, y, size: 14, font }); y -= 22;
  y = drawWrapped(page, manifest.licenseNotice, font, 8, 40, y, 515); y -= 8;
  y = drawWrapped(page, `Manifest schema: ${manifest.schemaVersion}; standard: ${manifest.standardVersion}; assets: ${manifest.assets.length}. Full per-asset source, version and license references follow in this PDF.`, font, 8, 40, y, 515);y-=18;
  ensure(100);page.drawText("Per-asset manifest",{x:40,y,size:12,font,color:rgb(0.06,0.35,0.32)});y-=18;
  for(const asset of manifest.assets){ensure(62);y=drawWrapped(page,`${asset.id} | ${asset.version} | source: ${asset.sourceRef} | license: ${asset.licenseRef}`,font,7,40,y,515);y-=4;}
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
    {name:"README.txt",data:encoder.encode("HSKKit offline study pack. Personal, non-transferable study and print use only. Audio is excluded because offline redistribution is not authorized.\n")},
  ]);
}
