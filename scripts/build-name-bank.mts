import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {givenNames,nameCharacterMeanings} from '../src/lib/names/editorial.ts';
import {expandedNames,expandedCharacterMeanings} from '../src/lib/names/expanded-editorial.ts';
import {collectionNames,collectionCharacterMeanings} from '../src/lib/names/collection-editorial.ts';
import {surnameCollection} from '../src/lib/names/surnames.ts';
import {allowedNameCombination} from '../src/lib/names/combination.ts';
import {meaningNames,meaningCharacterMeanings,meaningTraitsFor} from '../src/lib/names/meaning-editorial.ts';

const target=new URL('../src/lib/names/bank.json',import.meta.url);
const audioTarget=new URL('../public/name-data/v3/audio-manifest.json',import.meta.url);
type Clip={text:string;synthesisText?:string;src?:string;sha256?:string;scriptSha256?:string;durationSeconds?:number};
type AudioItem={id:string;nameAudio:Clip;introAudio:Clip};
const previous=JSON.parse(await readFile(target,'utf8'));
let priorAudio:{items:AudioItem[];audioBuild?:unknown}={items:previous.items??[]};
try{priorAudio=JSON.parse(await readFile(audioTarget,'utf8'));}catch{/* First v3 build. */}
const oldAudio=new Map(priorAudio.items.map(item=>[item.id,item]));
const legacy=previous.legacyAudio??(previous.items??[]).map((item:AudioItem)=>({id:item.id,nameAudio:item.nameAudio,introAudio:item.introAudio}));
const counts=JSON.parse(await readFile(new URL('../src/lib/strokes/supported.json',import.meta.url),'utf8'));
const index=JSON.parse(await readFile(new URL('../src/lib/dictionary/character-index.json',import.meta.url),'utf8'));
const indexed=new Set(index.characters.map((c:{hanzi:string})=>c.hanzi));
const poeticIds=new Set(['wenqing','yuxin','chenguang','xiaoqing','yawen','xinran','shihan','ruoning','yuqing','qingyang','xingchen','tianyu','mengyun','shuya','yunshu','yuqing-rain','xinyue','sining','yichen']);
const glossary={...nameCharacterMeanings,...expandedCharacterMeanings,...collectionCharacterMeanings,...meaningCharacterMeanings};
const selections=[...givenNames,...expandedNames,...collectionNames,...meaningNames].map(given=>({
 id:given.id,given:given.given,pinyin:given.pinyin,syllables:given.syllables,feel:given.feel,traits:meaningTraitsFor(given),meaning:given.meaning,
 explanation:given.explanation.replace(/for a fictional character/g,'with a free, adventurous feel').replace(/for an original adventure character/g,'with a sense of possibility').replace(/for an original fictional character/g,'with a spacious, imaginative feel').replace(/gives a fictional character/g,'gives the name').replace(/gives an original character/g,'gives the name').replace(/intended for a fictional martial-arts character/g,'with a martial-arts atmosphere').replace(/places a character within a journey/g,'suggests a journey').replace(/through a martial-arts story world/g,'through an open landscape').replace(/in an adventure story/g,'through changing seasons'),
 styles:given.styles??['modern',...(poeticIds.has(given.id)?['poetic']:[])],
 characters:[...given.given].map((hanzi,i)=>{
  if(!glossary[hanzi]||!given.syllables[i]||!counts[hanzi])throw new Error(`Missing name-use meaning, pronunciation or stroke data: ${hanzi}`);
  return {hanzi,pinyin:given.syllables[i],meaning:glossary[hanzi],dictionary:indexed.has(hanzi)};
 }),
}));
if(new Set(selections.map(g=>g.given)).size!==selections.length)throw new Error('Duplicate given-name selection');
if(new Set(surnameCollection.map(s=>s.id)).size!==surnameCollection.length)throw new Error('Duplicate surname identifier');
for(const surname of surnameCollection)for(const char of surname.hanzi)if(!counts[char])throw new Error(`Missing surname stroke coverage: ${surname.hanzi} ${char}`);
const audioItems:AudioItem[]=surnameCollection.flatMap(surname=>selections.filter(given=>allowedNameCombination(surname.hanzi,given.given)).map(given=>{
 const id=`${surname.id}-${given.id}`,hanzi=surname.hanzi+given.given,prior=oldAudio.get(id);
 // Force selected polyphonic readings with explicit homophones. This is an
 // offline pronunciation aid, recorded separately from the displayed transcript.
 const aliases:Record<string,string>={zeng:'增',ren:'人',shen:'审',jia:'甲',ning:'佞',zhangsun:'掌孙',yuchi:'玉迟',linghu:'灵狐',xiao:'笑'};
 const spoken=(aliases[surname.id]??surname.hanzi)+(given.given==='行舟'?'形舟':given.given);
 const clip=(text:string,key:'nameAudio'|'introAudio'):Clip=>{
  const value=prior?.[key]?.text===text?{...prior[key]}:{text,src:`/name-audio/v3/${id}-${key}.mp3`};
  if(spoken!==hanzi)value.synthesisText=key==='nameAudio'?spoken+'。':`我叫${spoken}。`;
  return value;
 };
 return {id,nameAudio:clip(hanzi+'。','nameAudio'),introAudio:clip(`我叫${hanzi}。`,'introAudio')};
}));
const ids=new Set(audioItems.map(item=>item.id));
if(legacy.some((item:AudioItem)=>!ids.has(item.id)))throw new Error('An old saved name would be lost');
await mkdir(new URL('../public/name-data/v3/',import.meta.url),{recursive:true});
await writeFile(target,JSON.stringify({version:'v3',audioRevision:'v3',surnames:surnameCollection.map(s=>({...s,dictionary:[...s.hanzi].map(c=>indexed.has(c))})),givenNames:selections,legacyAudio:legacy},null,2)+'\n');
const audioReady=audioItems.every(item=>[item.nameAudio,item.introAudio].every(clip=>clip.sha256&&clip.scriptSha256&&(!clip.synthesisText||'synthesisScriptSha256' in clip)));
await writeFile(audioTarget,JSON.stringify({version:'v3',items:audioItems,...(priorAudio.audioBuild?{audioBuild:{...priorAudio.audioBuild as object,complete:audioReady}}:{})},null,2)+'\n');
console.log(`Built ${selections.length} given names, ${surnameCollection.length} surnames and ${audioItems.length} valid complete-name combinations. Audio manifest remains outside the client bundle.`);
