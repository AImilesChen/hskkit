import bank from './bank.json' with { type: 'json' };
import { nameTraits, type NameFeel, type NameTrait } from './editorial.ts';
import {nameThemes,type NameMode,type NameTheme} from './options.ts';
import {allowedNameCombination} from './combination.ts';
import {findMeaning,lookupEnglishName,type MeaningId} from './english-origins.ts';
export { nameTraits, type NameFeel, type NameTrait } from './editorial.ts';

export type NameClip = {text:string;src?:string;sha256?:string;scriptSha256?:string;synthesisText?:string;synthesisScriptSha256?:string;durationSeconds?:number};
export type LearningName = {
  id:string;hanzi:string;surname:string;given:string;pinyin:string;
  feel:Exclude<NameFeel,'any'>;traits:NameTrait[];meaning:string;explanation:string;
  styles:NameTheme[];
  characters:Array<{hanzi:string;pinyin:string;meaning:string;role:string;dictionary?:boolean}>;
  introduction:string;introductionPinyin:string;nameAudio:NameClip;introAudio:NameClip;
};
export type NamePreferences = {feel:NameFeel;traits:NameTrait[];mode?:NameMode;theme?:NameTheme|'any';givenLength?:'any'|'1'|'2';surname?:string;character?:string;position?:'any'|'first'|'second';englishName?:string;rootId?:string;useManualMeaning?:boolean;manualMeaning?:string;meaningId?:MeaningId|'';meaningConfirmed?:boolean};
export const defaultNamePreferences:NamePreferences={feel:'any',traits:[],mode:'meaning',theme:'any',givenLength:'any',surname:'any',character:'',position:'any',englishName:'',rootId:'',manualMeaning:'',meaningId:'',meaningConfirmed:false,useManualMeaning:false};
export const NAME_BANK_VERSION = 'v1';
export const NAME_STORAGE_KEY = 'hskkit.names.v1';
export const MAX_SAVED_NAMES = 12;
const legacyAudio=new Map(bank.legacyAudio.map(item=>[item.id,item]));
export const LEARNING_NAMES:LearningName[]=bank.surnames.flatMap(surname=>bank.givenNames.filter(given=>allowedNameCombination(surname.hanzi,given.given)).map(given=>{
 const id=`${surname.id}-${given.id}`,hanzi=surname.hanzi+given.given,old=legacyAudio.get(id);
 return {id,hanzi,surname:surname.hanzi,given:given.given,pinyin:`${surname.pinyin} ${given.pinyin}`,feel:given.feel as LearningName['feel'],traits:given.traits as NameTrait[],meaning:given.meaning,explanation:given.explanation,styles:given.styles as NameTheme[],
 characters:[...[...surname.hanzi].map((char,i)=>({hanzi:char,pinyin:surname.syllables[i],meaning:surname.kind==='compound'?`Part of the family name ${surname.hanzi}`:'Family name',role:'surname',dictionary:surname.dictionary[i]})),...given.characters.map(char=>({...char,role:'given'}))],
 introduction:`我叫${hanzi}。`,introductionPinyin:`Wǒ jiào ${surname.pinyin} ${given.pinyin}.`,nameAudio:old?.nameAudio??{text:hanzi+'。',src:`/name-audio/${bank.audioRevision}/${id}-nameAudio.mp3`},introAudio:old?.introAudio??{text:`我叫${hanzi}。`,src:`/name-audio/${bank.audioRevision}/${id}-introAudio.mp3`}};
}));
export const NAME_DATA_VERSION=bank.version;
export const supportedNameCharacters=[...new Set(LEARNING_NAMES.flatMap(name=>[...name.given]))].sort();
export const supportedSurnames=[...new Set(LEARNING_NAMES.map(name=>name.surname))];
const byId = new Map(LEARNING_NAMES.map(name=>[name.id,name]));
export const initialNameIds = ['lin-mingyuan','chen-jianing','xu2-yunshu'];
export function learningName(id:string) {return byId.get(id);}

export function preferenceMeaning(preferences:NamePreferences):MeaningId|undefined {
  if(preferences.mode!=='english')return undefined;
  if(preferences.useManualMeaning)return findMeaning(preferences.meaningId??'')?.id;
  return lookupEnglishName(preferences.englishName??'').find(root=>root.id===preferences.rootId)?.inspiration;
}
export function preferenceError(preferences:NamePreferences):string|undefined {
  if(!preferences||!['any','neutral','masculine','feminine'].includes(preferences.feel)||!Array.isArray(preferences.traits)||preferences.traits.length>2||new Set(preferences.traits).size!==preferences.traits.length||!preferences.traits.every(trait=>nameTraits.some(item=>item.id===trait)))return 'Choose up to two different meanings and a valid name association.';
  const p={...defaultNamePreferences,...preferences};
  if(!['meaning','english','character'].includes(p.mode!)||!['any','1','2'].includes(p.givenLength!)||!['any','first','second'].includes(p.position!))return 'Choose a supported naming mode, length and character position.';
  if(p.theme!=='any'&&!nameThemes.some(theme=>theme.id===p.theme))return 'Choose a supported name style.';
  if(p.surname!=='any'&&!supportedSurnames.includes(p.surname!))return 'Choose a surname from the supported list.';
  if(p.mode==='character'){
    const char=(p.character??'').trim();
    if(!/^\p{Script=Han}$/u.test(char))return 'Enter exactly one Chinese character to keep in the given name.';
    if(!supportedNameCharacters.includes(char))return 'This character is not in the name collection yet. Open “Characters you can use” to choose another.';
    if(p.givenLength==='1'&&p.position==='second')return 'A single-character given name has only one position.';
  }
  if(p.mode==='english'){
    if(!p.englishName?.trim()||p.englishName.length>60)return 'Enter your name using up to 60 characters.';
    if(!p.meaningConfirmed)return 'Confirm the meaning you want to carry into your Chinese name.';
    if(p.useManualMeaning&&(!p.manualMeaning?.trim()||p.manualMeaning.length>160))return 'Describe your intended meaning in up to 160 characters.';
    if(!preferenceMeaning(p))return p.useManualMeaning?'Choose an inspiration to match your intended meaning.':'Choose a recorded origin, or enter your own intended meaning.';
  }
  return undefined;
}
export function validPreferences(preferences:NamePreferences):boolean{return !preferenceError(preferences);}
function matchesMeaning(name:LearningName,id:MeaningId){
  if(id==='fortune')return name.traits.includes('fortune');
  const letters:Partial<Record<MeaningId,string>>={brightness:'明朗光晴清照曦',protection:'守佑',stars:'星',flowers:'兰',victory:'胜'};
  if(letters[id])return [...name.given].some(c=>letters[id]!.includes(c));
  const trait:Partial<Record<MeaningId,NameTrait>>={wisdom:'wisdom',peace:'calm',joy:'joy',courage:'strength'};
  return Boolean(trait[id]&&name.traits.includes(trait[id]!));
}
export function matchesName(name:LearningName,preferences:NamePreferences) {
  const p={...defaultNamePreferences,...preferences};
  const char=(p.character??'').trim();
  const meaning=preferenceMeaning(p);
  return (p.feel==='any'||name.feel===p.feel)
    && p.traits.every(trait=>name.traits.includes(trait))
    && (p.theme==='any'||name.styles.includes(p.theme!))
    && (p.givenLength==='any'||[...name.given].length===Number(p.givenLength))
    && (p.surname==='any'||name.surname===p.surname)
    && (p.mode!=='character'||(p.position==='first'?name.given.startsWith(char):p.position==='second'?[...name.given][1]===char:name.given.includes(char)))
    && (p.mode!=='english'||Boolean(meaning&&matchesMeaning(name,meaning)));
}
export function nameMatchReasons(name:LearningName,preferences:NamePreferences):string[]{
  const p={...defaultNamePreferences,...preferences};
  const result:string[]=[];
  if(p.mode==='character')result.push(`Keeps ${p.character?.trim()}${p.position==='first'?' at the start of the given name':p.position==='second'?' as the second given-name character':' in the given name'}.`);
  const meaning=preferenceMeaning(p);if(meaning)result.push(`Inspired by your confirmed meaning: ${findMeaning(meaning)!.label.toLowerCase()}.`);
  if(p.traits.length)result.push(`Meaning: ${p.traits.map(id=>nameTraits.find(trait=>trait.id===id)!.label.toLowerCase()).join(' + ')}.`);
  if(p.surname!=='any')result.push(`Uses your chosen family name ${name.surname}.`);
  if(p.givenLength!=='any')result.push(`${[...name.given].length===1?'One':'Two'}-character given name.`);
  return result;
}
function shuffled<T>(items:T[],random:()=>number):T[] {
  const result=[...items];
  for(let i=result.length-1;i>0;i--){
    const draw=random();
    const j=Math.floor((Number.isFinite(draw)?Math.min(.999999999,Math.max(0,draw)):0)*(i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}
export function generateNames(preferences:NamePreferences,options:{keepIds?:string[];previousIds?:string[];random?:()=>number}={}) {
  const error=preferenceError(preferences);if(error)throw new Error(error);
  const pool=LEARNING_NAMES.filter(name=>matchesName(name,preferences));
  const keep=[...new Set(options.keepIds??[])].map(learningName).filter((name):name is LearningName=>Boolean(name&&matchesName(name,preferences))).slice(0,3);
  const previous=new Set(options.previousIds??[]);
  const ordered=shuffled(pool,options.random??Math.random).sort((a,b)=>Number(previous.has(a.id))-Number(previous.has(b.id)));
  const chosen=[...keep];
  while(chosen.length<3){
    const candidates=ordered.filter(name=>!chosen.some(item=>item.id===name.id));
    // Prefer a different given name, then a different surname; constraints are
    // never relaxed silently. A narrow filter can return fewer distinct names.
    const usedGiven=new Set(chosen.map(name=>name.given));
    const usedSurnames=new Set(chosen.map(name=>name.surname));
    const fresh=candidates.filter(name=>!usedGiven.has(name.given));
    const usedStyles=new Set(chosen.flatMap(name=>name.styles));
    const diverse=(preferences.theme??'any')==='any'?fresh.filter(name=>name.styles.some(style=>!usedStyles.has(style))):fresh;
    const preferred=diverse.length?diverse:fresh;
    const next=preferred.find(name=>!usedSurnames.has(name.surname))??preferred[0];
    if(!next)break;
    chosen.push(next);
  }
  return {items:chosen,matchCount:pool.length,retained:keep.length};
}
export function nameRecoveryChoices(preferences:NamePreferences){
 const candidates:Array<{label:string;patch:Partial<NamePreferences>}>=[];
 if(preferences.givenLength&&preferences.givenLength!=='any')candidates.push({label:'Allow either name length',patch:{givenLength:'any'}});
 if(preferences.feel!=='any')candidates.push({label:'Allow any gender preference',patch:{feel:'any'}});
 if(preferences.theme&&preferences.theme!=='any')candidates.push({label:'Explore all name styles',patch:{theme:'any'}});
 if(preferences.traits.length)candidates.push({label:'Remove extra meaning filters',patch:{traits:[]}});
 if(preferences.mode==='character'&&preferences.position!=='any')candidates.push({label:'Keep this character in either position',patch:{position:'any'}});
 return candidates.filter(choice=>LEARNING_NAMES.some(name=>matchesName(name,{...preferences,...choice.patch}))).slice(0,3);
}
export function parseSavedNames(value:unknown):string[] {
  if(!value||typeof value!=='object')return [];
  const record=value as {version?:unknown;ids?:unknown};
  if(record.version!==NAME_BANK_VERSION||!Array.isArray(record.ids))return [];
  return [...new Set(record.ids.filter((id):id is string=>typeof id==='string'&&byId.has(id)))].slice(0,MAX_SAVED_NAMES);
}
export function nameLearningLinks(name:LearningName) {
  const text=encodeURIComponent(name.hanzi);
  return {strokes:`/tools/chinese-stroke-order?text=${text}#stroke-tool`,worksheet:`/tools/chinese-character-practice-sheet-generator?text=${text}`};
}
export function copyableName(name:LearningName) {
  return `${name.hanzi}\n${name.pinyin}\n${name.meaning}\n${name.introduction}\n${name.introductionPinyin}`;
}
