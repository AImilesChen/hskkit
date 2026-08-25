import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { PackManifest, PackSelection } from "./catalog.ts";

function fitLines(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  let current = "";
  for (const char of text.replaceAll("\n", " \n ")) {
    if (char === "\n") { if (current) lines.push(current.trim()); current = ""; continue; }
    const next = current + char;
    if (current && font.widthOfTextAtSize(next, size) > width) { lines.push(current.trim()); current = char; }
    else current = next;
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

function drawWrapped(page: PDFPage, text: string, font: PDFFont, size: number, x: number, y: number, width: number, lineHeight = size * 1.35) {
  const lines = fitLines(text, font, size, width);
  for (const line of lines) { page.drawText(line, { x, y, size, font, color: rgb(0.12, 0.16, 0.24) }); y -= lineHeight; }
  return y;
}

export async function generatePackPdf(selection: PackSelection, manifest: PackManifest, fontBytes: Uint8Array, emojiFontBytes: Uint8Array) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: false });
  const emojiFont = await pdf.embedFont(emojiFontBytes, { subset: false });
  pdf.setTitle(`HSKKit HSK 3.0 Level ${selection.level} Advanced Study PDF Pack`);
  pdf.setAuthor("HSKKit");
  pdf.setSubject(`Authorized Level ${selection.level} study materials; ${manifest.generationVersion}`);
  pdf.setKeywords(["HSK 3.0", `Level ${selection.level}`, manifest.generationVersion, "CC BY-SA 4.0"]);
  const pageSize: [number, number] = [595.28, 841.89];
  let page = pdf.addPage(pageSize);
  let y = 790;
  const addHeader = () => {
    page.drawRectangle({ x: 0, y: 815, width: 595.28, height: 27, color: rgb(0.06, 0.35, 0.32) });
    page.drawText(`HSKKit - HSK 3.0 Level ${selection.level}`, { x: 36, y: 823, size: 10, font, color: rgb(1, 1, 1) });
  };
  const ensure = (needed: number) => { if (y < needed) { page = pdf.addPage(pageSize); y = 790; addHeader(); } };
  addHeader();
  page.drawText("HSKKit Advanced Study PDF Pack", { x: 40, y, size: 24, font, color: rgb(0.06, 0.35, 0.32) }); y -= 38;
  page.drawText(`HSK 3.0 Level ${selection.level} 学习材料`, { x: 40, y, size: 16, font });
  page.drawText("☺", { x: 278, y, size: 16, font: emojiFont }); y -= 28;
  y = drawWrapped(page, `Generation: ${manifest.generationVersion}  |  ${selection.words.length} authorized words\nAudio excluded because offline redistribution is not authorized.${selection.level>=7?"\nHSK 3.0 Levels 7–9 use one canonical unified advanced-band source set; this PDF is level-labelled, not a distinct official vocabulary list.":""}`, font, 9, 40, y, 515); y -= 15;
  for (const [index, word] of selection.words.entries()) {
    ensure(100);
    page.drawText(`${index + 1}. ${word.hanzi}  ${word.pinyin}`, { x: 40, y, size: 12, font, color: rgb(0.06, 0.35, 0.32) }); y -= 16;
    y = drawWrapped(page, `${word.partOfSpeech ? `[${word.partOfSpeech}] ` : ""}${word.meaning}`, font, 9, 54, y, 495); y -= 5;
  }
  ensure(160); y -= 8;
  page.drawText("练习 / Exercises", { x: 40, y, size: 18, font, color: rgb(0.06, 0.35, 0.32) }); y -= 26;
  for (const exercise of selection.exercises) { ensure(80); y = drawWrapped(page, exercise.prompt, font, 10, 40, y, 515); y -= 22; }
  ensure(160); y -= 8;
  page.drawText("Answer key", { x: 40, y, size: 16, font, color: rgb(0.06, 0.35, 0.32) }); y -= 24;
  for (const exercise of selection.exercises) { ensure(60); y = drawWrapped(page, `${exercise.id}: ${exercise.answer}`, font, 9, 40, y, 515); y -= 5; }
  ensure(180); y -= 10;
  page.drawText("授权与追溯 / License & traceability", { x: 40, y, size: 14, font }); y -= 22;
  y = drawWrapped(page, manifest.licenseNotice, font, 8, 40, y, 515); y -= 8;
  y = drawWrapped(page, `Manifest schema: ${manifest.schemaVersion}; standard: ${manifest.standardVersion}; assets: ${manifest.assets.length}. Full per-asset source, version and license references follow in this PDF.`, font, 8, 40, y, 515); y-=18;
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
