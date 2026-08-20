import { createHash } from "node:crypto";
export type Grade = "again" | "hard" | "good" | "easy";
export type Dimension = "reading" | "audio" | "context_audio";
export interface Attempt { id:string; idempotencyKey:string; contentId:string; contentVersion:string; dimension:Dimension; answer:string; correctAnswer:string; prompt?:string; userAnswerText?:string; correctAnswerText?:string; correct:boolean; observedAt:string }
export interface SrsCard { id:string; contentId:string; contentVersion:string; dimension:Dimension; dueAt:string; intervalDays:number; ease:number; revision:number; reviewCount:number; algorithmVersion:"hskkit-srs-v1"; sourceAttemptId:string; gradeKeys:string[] }
export interface Mistake { id:string; contentId:string; contentVersion:string; sourceAttemptId:string; status:"open"|"resolved"|"retired"; createdAt:string; resolvedAt?:string }
export interface DailyItem { id:string; kind:"review"|"learn"; contentId:string; status:"pending"|"completed"|"skipped" }
export interface DailySession { id:string; ownerId:string; localDay:string; ruleVersion:string; createdAt:string; items:DailyItem[] }
export interface LearningState { attempts:Attempt[]; cards:SrsCard[]; mistakes:Mistake[]; dailySessions:DailySession[] }
const id=(prefix:string,key:string)=>`${prefix}_${createHash("sha256").update(key).digest("base64url")}`;
const add=(iso:string,days:number,minutes=0)=>new Date(new Date(iso).getTime()+days*86400000+minutes*60000).toISOString();
export function recordAttempt(state:LearningState,input:{idempotencyKey:string;contentId:string;contentVersion:string;dimension:Dimension;answer:string;correctAnswer:string;prompt?:string;userAnswerText?:string;correctAnswerText?:string;observedAt:string}){
 const prior=state.attempts.find(a=>a.idempotencyKey===input.idempotencyKey); if(prior)return {state,attempt:prior};
 const attempt:Attempt={...input,id:id("att",input.idempotencyKey),correct:input.answer===input.correctAnswer};
 const next:LearningState={...state,attempts:[...state.attempts,attempt]}; if(attempt.correct)return {state:next,attempt};
 const card:SrsCard={id:id("card",`${input.contentId}:${input.contentVersion}:${input.dimension}`),contentId:input.contentId,contentVersion:input.contentVersion,dimension:input.dimension,dueAt:input.observedAt,intervalDays:0,ease:2.5,revision:0,reviewCount:0,algorithmVersion:"hskkit-srs-v1",sourceAttemptId:attempt.id,gradeKeys:[]};
 const cards=next.cards.some(c=>c.id===card.id)?next.cards:[...next.cards,card];
 const mistake:Mistake={id:id("mistake",attempt.id),contentId:input.contentId,contentVersion:input.contentVersion,sourceAttemptId:attempt.id,status:"open",createdAt:input.observedAt};
 return {state:{...next,cards,mistakes:[...next.mistakes,mistake]},attempt};
}
export function gradeReview(state:LearningState,input:{cardId:string;grade:Grade;idempotencyKey:string;observedAt:string;clientRevision:number}){
 const old=state.cards.find(c=>c.id===input.cardId); if(!old)throw new Error("CARD_NOT_FOUND");
 if(old.gradeKeys.includes(input.idempotencyKey))return {state,card:old}; if(old.revision!==input.clientRevision)throw new Error("REVISION_CONFLICT");
 const map={again:{d:0,m:10,e:-.2},hard:{d:1,m:0,e:-.1},good:{d:Math.max(2,Math.round(Math.max(1,old.intervalDays)*old.ease)),m:0,e:0},easy:{d:Math.max(4,Math.round(Math.max(1,old.intervalDays)*(old.ease+.3))),m:0,e:.1}}[input.grade];
 const card:SrsCard={...old,dueAt:add(input.observedAt,map.d,map.m),intervalDays:map.d,ease:Math.max(1.3,old.ease+map.e),revision:old.revision+1,reviewCount:old.reviewCount+1,gradeKeys:[...old.gradeKeys,input.idempotencyKey]};
 const mistakes=state.mistakes.map(m=>m.contentId===old.contentId&&m.contentVersion===old.contentVersion&&m.status==="open"&&input.grade!=="again"?{...m,status:"resolved" as const,resolvedAt:input.observedAt}:m);
 const dailySessions=state.dailySessions.map(s=>({...s,items:s.items.map(i=>i.id===`review:${card.id}`?{...i,status:"completed" as const}:i)}));
 return {state:{...state,cards:state.cards.map(c=>c.id===card.id?card:c),mistakes,dailySessions},card};
}
export function retireContent(state:LearningState,contentId:string):LearningState{
 return {...state,cards:state.cards.filter(c=>c.contentId!==contentId),mistakes:state.mistakes.map(m=>m.contentId===contentId&&m.status==="open"?{...m,status:"retired" as const}:m),dailySessions:state.dailySessions.map(s=>({...s,items:s.items.filter(i=>i.contentId!==contentId)}))};
}
export function completeDailyItem(state:LearningState,sessionId:string,itemId:string){
 const session=state.dailySessions.find(s=>s.id===sessionId);if(!session)throw new Error("SESSION_NOT_FOUND");
 if(!session.items.some(i=>i.id===itemId))throw new Error("ITEM_NOT_FOUND");
 const dailySessions=state.dailySessions.map(s=>s.id===sessionId?{...s,items:s.items.map(i=>i.id===itemId?{...i,status:"completed" as const}:i)}:s);
 return {state:{...state,dailySessions},item:dailySessions.find(s=>s.id===sessionId)!.items.find(i=>i.id===itemId)!};
}
export function buildDailySession(state:LearningState,input:{ownerId:string;localDay:string;ruleVersion:string;now:string}){
 const prior=state.dailySessions.find(s=>s.ownerId===input.ownerId&&s.localDay===input.localDay&&s.ruleVersion===input.ruleVersion); if(prior)return {state,session:prior};
 const due=state.cards.filter(c=>c.dueAt<=input.now).slice(0,20).map(c=>({id:`review:${c.id}`,kind:"review" as const,contentId:c.contentId,status:"pending" as const}));
 const items:DailyItem[]=due.length?due:[{id:"learn:word:ni-hao",kind:"learn",contentId:"word:ni-hao",status:"pending"}];
 const session:DailySession={id:id("day",`${input.ownerId}:${input.localDay}:${input.ruleVersion}`),...input,createdAt:input.now,items}; delete (session as any).now;
 return {state:{...state,dailySessions:[...state.dailySessions,session]},session};
}
export function resumeDailySession(state:LearningState,sessionId:string){return state.dailySessions.find(s=>s.id===sessionId)?.items.find(i=>i.status==="pending");}
export const emptyLearningState=():LearningState=>({attempts:[],cards:[],mistakes:[],dailySessions:[]});
