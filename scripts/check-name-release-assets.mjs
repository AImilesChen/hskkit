/** Offline publication gate. Metadata alone does not make a recording ready. */
import {readFile,stat,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {allowedNameCombination} from '../src/lib/names/combination.ts';
const root=fileURLToPath(new URL('../',import.meta.url));
const readJson=async relative=>JSON.parse(await readFile(path.join(root,relative),'utf8'));
const bank=await readJson('src/lib/names/bank.json');
const manifest=await readJson('public/name-data/v3/audio-manifest.json');
const ids=new Set(manifest.items.map(item=>item.id));
const hash=value=>createHash('sha256').update(value).digest('hex');
if(!manifest.audioBuild?.complete)throw new Error('Audio generation has not completed successfully.');
const surnameIds=new Set(bank.surnames.map(s=>s.id));
const nameIds=new Set(bank.givenNames.map(g=>g.id));
const legacy=new Map(bank.legacyAudio.map(item=>[item.id,item]));
const expected=new Map(bank.surnames.flatMap(s=>bank.givenNames.filter(g=>allowedNameCombination(s.hanzi,g.given)).map(g=>[`${s.id}-${g.id}`,s.hanzi+g.given])));
if(ids.size!==manifest.items.length||ids.size!==expected.size||[...expected.keys()].some(id=>!ids.has(id)))throw new Error('The audio manifest does not match the current surname/given-name collection.');
const jobs=manifest.items.flatMap(item=>['nameAudio','introAudio'].map(key=>({id:item.id,key,clip:item[key]})));
const inventory=[];
let cursor=0;
await Promise.all(Array.from({length:16},async()=>{
 while(cursor<jobs.length){
  const {id,key,clip}=jobs[cursor++];
  const hanzi=expected.get(id);
  if(clip.text!==(key==='nameAudio'?`${hanzi}。`:`我叫${hanzi}。`))throw new Error(`Incorrect name/audio pairing: ${id} ${key}`);
  if(!/^\/name-audio\/v(?:1|3)\/[a-zA-Z0-9-]+\.mp3$/.test(clip.src??''))throw new Error(`Invalid audio path: ${id}`);
  const file=path.join(root,'public',clip.src.slice(1));
  const [bytes,metadata]=await Promise.all([readFile(file),stat(file)]);
  if(hash(bytes)!==clip.sha256||bytes.length<1000||!(clip.durationSeconds>.3&&clip.durationSeconds<15))throw new Error(`Missing or corrupted audio: ${id} ${key}`);
  if(hash(clip.text+'|zh-CN-XiaoxiaoNeural|-10%')!==clip.scriptSha256)throw new Error(`Incorrect display transcript hash: ${id}`);
  if(clip.synthesisText&&hash(clip.synthesisText+'|zh-CN-XiaoxiaoNeural|-10%')!==clip.synthesisScriptSha256)throw new Error(`Unverified pronunciation spelling: ${id}`);
  if(legacy.has(id)&&clip.src!==legacy.get(id)[key].src)throw new Error(`Legacy URL changed: ${id}`);
  inventory.push({key:clip.src.slice(1),bytes:metadata.size,sha256:clip.sha256,contentType:'audio/mpeg',cacheControl:'public,max-age=31536000,immutable'});
 }
}));
inventory.sort((a,b)=>a.key.localeCompare(b.key));
const outputOption=process.argv.indexOf('--output');
const outputFile=outputOption>=0?path.resolve(root,process.argv[outputOption+1]??'tmp/name-release-assets.json'):path.join(root,'tmp/name-expansion-20261106/release-assets.json');
await mkdir(path.dirname(outputFile),{recursive:true});
const summary={version:bank.version,surnames:surnameIds.size,givenNames:nameIds.size,completeNames:ids.size,audioFiles:inventory.length,audioBytes:inventory.reduce((n,item)=>n+item.bytes,0),legacyIdsRetained:legacy.size,review:'Asset integrity and script provenance checked; no full human listening review.'};
await writeFile(outputFile,JSON.stringify({summary,inventory},null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
