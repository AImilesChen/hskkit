import fs from 'node:fs';
import { convert, type NumberMode } from '../src/lib/numbers/conversion.ts';

const seeds: Record<NumberMode,string[]> = {
 numbers: '0 1 2 4 7 10 11 12 14 17 20 21 28 35 40 50 70 99 101 105 110 128 150 200 250 305 350 1001 1010 1200 2025 10001 10010 12000 25000 100000 120000 1000000 12.05 -12.5'.split(' '),
 prices: '0.05 0.10 0.50 1.00 1.50 2.00 2.50 3.50 4.00 5.00 5.50 6.80 7.50 8.00 8.50 9.90 10.00 10.50 12.00 12.50 14.00 15.00 17.50 18.00 20.00 21.50 25.50 28.00 30.00 35.50 40.00 48.50 50.00 68.00 70.00 88.80 99.00 100.00 108.05 200.00'.split(' '),
 dates: '2024-02-29 2025-01-01 2025-02-02 2025-03-08 2025-04-15 2025-05-01 2025-06-10 2025-07-20 2025-08-18 2025-09-30 2025-10-01 2025-11-11 2025-12-25 2026-01-05 2026-02-14 2026-03-15 2026-04-06 2026-05-20 2026-06-01 2026-07-08 2026-08-16 2026-09-09 2026-10-10 2026-11-05 2026-12-31 2027-01-12 2027-02-28 2027-03-21 2027-04-30 2027-05-25 2027-06-18 2027-07-07 2027-08-08 2027-09-15 2027-10-20 2027-11-23 2027-12-24 2028-02-29 2028-06-05 2030-10-01'.split(' '),
 times: '00:00 00:30 01:05 02:00 02:05 03:15 04:30 05:45 06:00 06:15 06:30 07:00 07:05 07:30 08:00 08:15 08:30 08:45 09:00 09:20 09:50 10:00 10:10 10:30 11:15 11:45 12:00 12:30 13:00 13:15 14:00 14:30 15:20 16:45 17:30 18:00 19:15 20:30 21:45 23:59'.split(' '),
};
const path='src/lib/numbers/bank.json';
const old=fs.existsSync(path) ? JSON.parse(fs.readFileSync(path,'utf8')) : {items:[]};
const items=Object.entries(seeds).flatMap(([mode,values])=>values.map((value,i)=>{
 const result=convert(mode as NumberMode,value);
 const id=`${mode}-${String(i+1).padStart(2,'0')}`;
 const existing=old.items.find((q:{id:string;hanzi:string})=>q.id===id&&q.hanzi===result.hanzi);
 return {id,...result,audioSrc:existing?.audioSrc??'',audioSha256:existing?.audioSha256??'',durationSeconds:existing?.durationSeconds??0,...(existing?.audioScriptSha256?{audioScriptSha256:existing.audioScriptSha256}:{})};
}));
for(const mode of Object.keys(seeds)) if(items.filter(q=>q.mode===mode).length!==40)throw Error(`Expected 40 items for ${mode}`);
fs.mkdirSync('src/lib/numbers',{recursive:true});
fs.writeFileSync(path,JSON.stringify({version:'number-practice-v1',voice:'Microsoft zh-CN-XiaoxiaoNeural, synthesized complete utterances',audioPolicy:'Fixed whole-utterance MP3 recordings. No runtime synthesis service or spliced word clips. Pinyin shows dictionary tones; connected-speech tone changes may be audible.',items,...(old.audioBuild&&items.every(q=>q.audioScriptSha256)?{audioBuild:old.audioBuild}:{})},null,2)+'\n');
console.log(`Prepared ${items.length} complete utterance scripts. Existing audio retained only when the script matches.`);
