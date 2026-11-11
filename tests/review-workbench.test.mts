import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewEntryContextKey, availableTodayReview, reviewSessionPreview, reviewWorkbenchPrompt, restoreIndependentReview } from '../src/lib/learning/review-workbench.ts';

const cards = [
 {id:'a',revision:1,isMistake:false,dimension:'reading' as const,dueAt:'2026-01-01'},
 {id:'b',revision:3,isMistake:true,dimension:'audio' as const,dueAt:'2026-01-01'},
 {id:'c',revision:2,isMistake:true,dimension:'reading' as const,dueAt:'2026-01-01'},
];
test('review preview describes exactly the frozen capped round without mutating the queue',()=>{
 const preview=reviewSessionPreview(cards,2);
 assert.deepEqual(preview,{cards:cards.slice(0,2),total:2,reading:1,listening:1,mistakes:1});
 assert.deepEqual(cards.map(c=>c.id),['a','b','c']);
 assert.equal(reviewSessionPreview(cards,20).total,3);
 assert.equal(reviewSessionPreview(cards,0).total,0);
});
test('review hints distinguish tones, meaning, listening and legacy recall',()=>{
 const card={prompt:'Which pinyin matches 安静?',dimension:'reading',answerMode:'choice',legacyReview:false};
 assert.match(reviewWorkbenchPrompt(card).tip,/tone marks/);
 assert.equal(reviewWorkbenchPrompt({...card,prompt:'Choose the meaning'}).label,'Reading and meaning');
 assert.equal(reviewWorkbenchPrompt({...card,dimension:'context_audio'}).label,'Sentence listening');
 assert.equal(reviewWorkbenchPrompt({...card,legacyReview:true}).label,'Memory recall');
});
const session={id:'day',reviewCardIds:['a','b'],items:[
 {id:'zero',kind:'learn',status:'pending',estimatedMinutes:0},
 {id:'ra',kind:'review',status:'completed',reviewCardId:'a'},
 {id:'rb',kind:'review',status:'pending',reviewCardId:'b'},
 {id:'later',kind:'learn',status:'pending'},
]};
test('Today shortcut uses only the actual current saved review step and known pending cards',()=>{
 assert.deepEqual(availableTodayReview(session,cards),{item:session.items[2],pendingIds:['b'],total:2,completed:1});
 assert.equal(availableTodayReview({...session,items:[session.items[3],...session.items]},cards),null);
 assert.equal(availableTodayReview(session,cards.filter(c=>c.id!=='b')),null);
 assert.equal(availableTodayReview({...session,items:session.items.map(i=>({...i,status:'completed'}))},cards),null);
});
const now=Date.parse('2026-11-11T12:00:00Z');
const snapshot={version:1,binding:'guest-binding',token:'local-round',updatedAt:now,ids:['a','b'],completed:1,revisions:{a:1,b:3},level:2,size:5,difficult:false};
const restore=(value:unknown,binding='guest-binding',available=cards)=>restoreIndependentReview(JSON.stringify(value),binding,available,now);
test('independent review restores its exact cursor, order and settings with matching server revisions',()=>{
 assert.deepEqual(restore(snapshot),snapshot);
 assert.equal(restore({...snapshot,completed:2})?.completed,2);
});
test('independent review rejects expired, cross-account, changed, missing or malformed snapshots',()=>{
 assert.equal(restore(snapshot,'another-account'),null);
 assert.equal(restore(snapshot,'guest-binding',cards.map(c=>({...c,revision:c.revision+1}))),null);
 assert.equal(restore(snapshot,'guest-binding',cards.slice(0,1)),null);
 for(const change of [{updatedAt:now-86400001},{updatedAt:now+60001},{ids:['a','a']},{completed:3},{completed:-1},{size:25},{level:10},{revisions:{}},{ids:[]}])assert.equal(restore({...snapshot,...change}),null);
 assert.equal(restoreIndependentReview('{','guest-binding',cards,now),null);
});

test('same-page source switches reset the entry while scope and local round changes keep it',()=>{
 assert.equal(reviewEntryContextKey('?level=2'),reviewEntryContextKey('?level=3&round=local'));
 assert.notEqual(reviewEntryContextKey(''),reviewEntryContextKey('?source=today&dailySessionId=day&dailyItemId=item'));
 assert.notEqual(reviewEntryContextKey('?source=today&dailySessionId=day&dailyItemId=a'),reviewEntryContextKey('?source=today&dailySessionId=day&dailyItemId=b'));
 assert.notEqual(reviewEntryContextKey('?source=mistakes&cardId=a'),reviewEntryContextKey('?source=mistakes&cardId=b'));
});
