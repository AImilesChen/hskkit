import bank from './bank.json' with { type: 'json' };
import { NUMBER_MODES, normalizeAnswer, type NumberMode, type NumberResult } from './conversion.ts';
export type NumberQuestion = NumberResult & {id:string;audioSrc:string;audioSha256:string;durationSeconds:number};
export const NUMBER_BANK_VERSION = bank.version;
export const NUMBER_QUESTIONS = bank.items as NumberQuestion[];
export const numberQuestion = (id:string) => NUMBER_QUESTIONS.find(q=>q.id===id);
export type NumberRound = { id:string; version:string; mode:NumberMode; startedAt:string; order:string[]; answers:string[]; retryOf?:string };
export const isNumberComplete = (round:NumberRound) => round.answers.length === round.order.length;
export function shuffled<T>(values:T[],random= Math.random):T[] {
  const result=[...values];
  for(let i=result.length-1;i>0;i--){const j=Math.max(0,Math.min(i,Math.floor(random()*(i+1))));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
export function createNumberRound(mode:NumberMode, random=Math.random):NumberRound {
  const pool=NUMBER_QUESTIONS.filter(q=>q.mode===mode&&q.audioSrc&&q.audioSha256);
  if(pool.length<10)throw Error('The recordings for this scene are not ready.');
  return {id:crypto.randomUUID(),version:NUMBER_BANK_VERSION,mode,startedAt:new Date().toISOString(),order:shuffled(pool,random).slice(0,10).map(q=>q.id),answers:[]};
}
export function checkNumberAnswer(round:NumberRound,itemId:string,input:string,listened:boolean):NumberRound {
  if(!listened)throw Error('Play the full recording before checking an answer.');
  if(isNumberComplete(round)||round.order[round.answers.length]!==itemId)throw Error('This question is not current or was already checked.');
  const answer=normalizeAnswer(round.mode,input);
  if(answer===undefined)throw Error(round.mode==='dates'?'Use a real date in YYYY-MM-DD format.':round.mode==='times'?'Use a 24-hour time, for example 14:30.':'Enter a number in digits; check the decimal places and commas.');
  return {...round,answers:[...round.answers,answer]};
}
export function numberAnswerCorrect(round:NumberRound,index:number) {
  const q=numberQuestion(round.order[index]);
  return Boolean(q&&round.answers[index]!==undefined&&normalizeAnswer(round.mode,q.value)===round.answers[index]);
}
export function numberRoundReport(round:NumberRound) {
  const correct=round.answers.filter((_,i)=>numberAnswerCorrect(round,i)).length;
  return {correct,total:round.answers.length,percent:round.answers.length?Math.round(correct*100/round.answers.length):0,misses:round.order.filter((_,i)=>i<round.answers.length&&!numberAnswerCorrect(round,i))};
}
export function retryNumberMistakes(round:NumberRound):NumberRound|undefined {
  if(!isNumberComplete(round))return;
  const order=numberRoundReport(round).misses;
  if(!order.length)return;
  return {...round,id:crypto.randomUUID(),startedAt:new Date().toISOString(),order,answers:[],retryOf:round.id};
}
/** Browser storage is untrusted: reconstruct from the current bank and recompute scores. */
export function parseNumberHistory(raw:unknown):NumberRound[] {
  if(!Array.isArray(raw))return [];
  const seen=new Set<string>();
  return raw.slice(0,20).flatMap(value=>{
    if(!value||typeof value!=='object')return [];
    const s=value as NumberRound;
    if(typeof s.id!=='string'||!/^[a-zA-Z0-9_-]{8,80}$/.test(s.id)||seen.has(s.id)||s.version!==NUMBER_BANK_VERSION||!NUMBER_MODES.includes(s.mode))return [];
    if(typeof s.startedAt!=='string'||!Number.isFinite(Date.parse(s.startedAt))||Date.parse(s.startedAt)>Date.now()+86400000)return [];
    if(!Array.isArray(s.order)||!s.order.length||s.order.length>10||new Set(s.order).size!==s.order.length||s.order.some(id=>numberQuestion(id)?.mode!==s.mode))return [];
    if(s.retryOf!==undefined&&(typeof s.retryOf!=='string'||!/^[a-zA-Z0-9_-]{8,80}$/.test(s.retryOf)||s.retryOf===s.id))return [];
    if(!s.retryOf&&s.order.length!==10)return [];
    if(!Array.isArray(s.answers)||s.answers.length>s.order.length||s.answers.some(a=>typeof a!=='string'||a.length>32||normalizeAnswer(s.mode,a)!==a))return [];
    seen.add(s.id);
    return [{id:s.id,version:s.version,mode:s.mode,startedAt:s.startedAt,order:[...s.order],answers:[...s.answers],...(s.retryOf?{retryOf:s.retryOf}:{})}];
  });
}
