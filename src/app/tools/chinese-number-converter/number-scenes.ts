import type { NumberMode } from '@/lib/numbers/conversion';
export const scenes: {id:NumberMode; title:string; chinese:string; description:string; initial:string; examples:string[]; label:string; hint:string; answerHint:string}[] = [
 {id:'numbers',title:'Numbers',chinese:'一二三',description:'Whole numbers & decimals',initial:'128',examples:['128','10001','12.05'],label:'Number to convert',hint:'Up to ±999,999,999 · 4 decimal places',answerHint:'Use digits, e.g. 1,025.5.'},
 {id:'prices',title:'Prices',chinese:'元 / 块',description:'Everyday RMB prices',initial:'25.50',examples:['3.50','25.50','108.05'],label:'Price in RMB (yuan)',hint:'RMB · Up to 2 decimal places',answerHint:'Answer in yuan, e.g. 25.50.'},
 {id:'dates',title:'Dates',chinese:'年月日',description:'Year, month & day',initial:'2026-11-05',examples:['2026-11-05','2024-02-29','2027-01-12'],label:'Date to read in Chinese',hint:'1900–2100 · Gregorian dates',answerHint:'Use YYYY-MM-DD, e.g. 2026-11-05.'},
 {id:'times',title:'Times',chinese:'几点？',description:'Hours & minutes',initial:'14:30',examples:['02:05','14:30','18:00'],label:'Time on a 24-hour clock',hint:'24-hour clock · 00:00–23:59',answerHint:'Use 24-hour time, e.g. 14:30.'},
];
export function exampleHref(mode:NumberMode,value:string) { return `/tools/chinese-number-converter?mode=${mode}&value=${encodeURIComponent(value)}#number-tool`; }
