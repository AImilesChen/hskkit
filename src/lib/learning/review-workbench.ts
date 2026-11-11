import type { ReviewEntryIntent, ReviewQueueCard } from './review-session';

export function reviewSourceLabel(intent: ReviewEntryIntent) {
  return intent.kind === 'today' ? 'Today’s review' : intent.kind === 'mistake' ? 'Mistake correction' : intent.kind === 'word' ? 'Single-word review' : 'Independent review';
}

export function reviewWorkbenchPrompt(card: { prompt: string; dimension: string; answerMode: string; legacyReview: boolean }) {
  if (card.legacyReview || card.answerMode === 'self_recall') return { label:'Memory recall', icon:'review' as const, tip:'Recall the answer first, then reveal it and rate your memory.' };
  if (card.dimension !== 'reading') return { label:card.dimension === 'context_audio' ? 'Sentence listening' : 'Word listening',icon:'headphones' as const,tip:'Listen to the complete recording, then answer from what you heard.' };
  if (/pinyin|拼音/i.test(card.prompt)) return { label:'Pinyin recognition',icon:'book' as const,tip:'Recall the pronunciation and pay attention to the tone marks.' };
  if (card.answerMode === 'text') return { label:'Written recall',icon:'pencil' as const,tip:'Read the prompt carefully and write your answer from memory.' };
  return { label:'Reading and meaning',icon:'reading' as const,tip:'Read the prompt and compare the meanings before choosing.' };
}

export function reviewSessionPreview<T extends ReviewQueueCard>(cards: readonly T[], cap: number) {
  const selected=cards.slice(0,Math.max(0,Math.floor(cap)));
  return {cards:selected,total:selected.length,reading:selected.filter(card=>card.dimension==='reading').length,listening:selected.filter(card=>card.dimension!=='reading').length,mistakes:selected.filter(card=>card.isMistake).length};
}

export function availableTodayReview<T extends {id:string;kind:string;status:string;deferred?:boolean;estimatedMinutes?:number;reviewCardId?:string}>(session:{id:string;items:readonly T[];reviewCardIds?:string[]}, cards:readonly {id:string}[]) {
  const current=session.items.find(item=>!item.deferred&&item.kind!=='summary'&&(item.estimatedMinutes??1)>0&&item.status==='pending');
  if(current?.kind!=='review')return null;
  const completed=new Set(session.items.filter(item=>item.kind==='review'&&item.status==='completed').map(item=>item.reviewCardId));
  const pending=(session.reviewCardIds??[]).filter(id=>!completed.has(id));
  const known=new Set(cards.map(card=>card.id));
  if(!pending.length||pending.some(id=>!known.has(id)))return null;
  return {item:current,pendingIds:pending,total:(session.reviewCardIds??[]).length,completed:completed.size};
}

export type IndependentReviewSnapshot = {
  version:1; binding:string; token:string; updatedAt:number; ids:string[]; completed:number;
  revisions:Record<string,number>; level:'current'|'all'|number; size:5|10|20; difficult:boolean;
};
export function restoreIndependentReview(raw:string|null,binding:string,cards:readonly {id:string;revision:number}[],now=Date.now()):IndependentReviewSnapshot|null {
  if(!raw)return null;
  try{
    const value=JSON.parse(raw) as IndependentReviewSnapshot;
    if(value.version!==1||value.binding!==binding||!value.token||typeof value.token!=='string'||value.token.length>80||!Number.isFinite(value.updatedAt)||value.updatedAt>now+60000||now-value.updatedAt>86400000)return null;
    if(!Array.isArray(value.ids)||!value.ids.length||value.ids.length>20||new Set(value.ids).size!==value.ids.length||value.ids.some(id=>typeof id!=='string'||id.length>160))return null;
    if(!Number.isInteger(value.completed)||value.completed<0||value.completed>value.ids.length||![5,10,20].includes(value.size)||typeof value.difficult!=='boolean')return null;
    if(value.level!=='current'&&value.level!=='all'&&(!Number.isInteger(value.level)||value.level<1||value.level>9))return null;
    const known=new Map(cards.map(card=>[card.id,card.revision]));
    if(!value.revisions||value.ids.some(id=>known.get(id)!==value.revisions[id]||!Number.isInteger(value.revisions[id])))return null;
    return value;
  }catch{return null;}
}

export function reviewEntryContextKey(search: string) {
  const params = new URLSearchParams(search);
  return JSON.stringify(['source', 'dailySessionId', 'dailyItemId', 'contentId', 'cardId'].map(key => params.get(key)));
}
