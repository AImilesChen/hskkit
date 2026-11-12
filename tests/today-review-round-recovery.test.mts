import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDailySession, emptyLearningState, gradeReview, undoLastReview } from '../src/lib/learning/domain.ts';
import { selectTodayContent } from '../src/lib/learning/today-content.ts';
import { activeTodayReviewCardId, bindTodayReviewRound, completedTodayReviewCards } from '../src/lib/learning/review-session.ts';

test('Today grades survive a word-plan refresh, three answers advance, and replay and undo remain accurate',()=>{
  const now='2026-11-12T08:00:00.000Z', state=emptyLearningState();
  for(let i=0;i<4;i++){
    state.attempts.push({id:`a${i}`,idempotencyKey:`a${i}`,contentId:`fixture:${i}`,contentVersion:'v1',dimension:'reading',answer:'a',correctAnswer:'b',correct:false,observedAt:'2026-11-11T08:00:00.000Z',reviewSnapshot:{level:2,levelBand:'2',skillLabel:'Vocabulary',prompt:`Fixture ${i}`,answerMode:'choice',options:{a:'wrong',b:`right ${i}`},correctAnswer:'b',correctAnswerText:`right ${i}`,explanation:"Fixture explanation"}});
    state.cards.push({id:`c${i}`,contentId:`fixture:${i}`,contentVersion:'v1',dimension:'reading',dueAt:`2026-11-11T08:00:0${i}.000Z`,intervalDays:1,ease:2.5,revision:0,reviewCount:0,algorithmVersion:'hskkit-srs-v1',sourceAttemptId:`a${i}`,gradeKeys:[]});
  }
  const content=selectTodayContent(2,1);assert.equal(content.status,'ready');if(content.status!=='ready')return;
  const input={ownerId:'fixture',localDay:'2026-11-12',ruleVersion:'today-v10',now,dailyContent:content,budgetMinutes:30,newWordCount:1,focus:'review_first' as const};
  let built=buildDailySession(state,input);
  const ids=[...built.session.reviewCardIds!], batch=built.session.reviewBatchId;
  assert.equal(ids.length,3);
  const round=bindTodayReviewRound(built.session,ids,built.session.reviewItemIds![0]);
  const changed={...content,items:content.items.map(item=>({...item,isContinuing:true,resumeSteps:{learn:true,audio:false,contextAudio:false}}))};
  for(let i=0;i<ids.length;i++){
    const card=built.state.cards.find(card=>card.id===ids[i])!;
    const grade=gradeReview(built.state,{cardId:card.id,grade:i===0?'again':'good',idempotencyKey:`g${i}`,observedAt:now,clientRevision:card.revision});
    const replay=gradeReview(grade.state,{cardId:card.id,grade:'good',idempotencyKey:`g${i}`,observedAt:now,clientRevision:card.revision});
    assert.equal(replay.card.reviewCount,1);
    built=buildDailySession(replay.state,{...input,dailyContent:changed});
    assert.deepEqual(built.session.reviewCardIds,ids);assert.equal(built.session.reviewBatchId,batch);
    const restored=bindTodayReviewRound(built.session,ids,round.itemIds[0],JSON.parse(JSON.stringify(round)));
    const completed=completedTodayReviewCards(built.session,restored);
    assert.equal(completed.size,i+1);assert.equal(activeTodayReviewCardId(ids,completed),ids[i+1]);
  }
  assert.equal(built.session.items.find(item=>!item.deferred&&item.status==='pending')?.kind,'learn');
  const undone=undoLastReview(built.state,{cardId:ids[2],idempotencyKey:'undo'});
  const undoSession=undone.dailySessions.find(s=>s.id===round.sessionId)!;
  assert.equal(activeTodayReviewCardId(ids,completedTodayReviewCards(undoSession,round)),ids[2]);
});

test('an old Today URL recovers a completed first task archived outside the replacement batch',()=>{
  const session={id:'today',reviewCardIds:['b','c','d'],reviewItemIds:['b0','c0','d0'],items:[
    {id:'a1',kind:'review',reviewCardId:'a',status:'completed'},
    {id:'b0',kind:'review',reviewCardId:'b',status:'pending'},
    {id:'c0',kind:'review',reviewCardId:'c',status:'pending'},
    {id:'d0',kind:'review',reviewCardId:'d',status:'pending'},
  ]};
  const round=bindTodayReviewRound(session,['a','b','c'],'a1');
  assert.deepEqual(round.itemIds,['a1','b0','c0']);
  assert.equal(activeTodayReviewCardId(round.cardIds,completedTodayReviewCards(session,round)),'b');
  assert.deepEqual([...completedTodayReviewCards({...session,id:'tomorrow'},round)],[]);
});

test('an older completed revision cannot complete a new pending task for the same card',()=>{
  const session={id:'today',reviewCardIds:['a'],reviewItemIds:['a2'],items:[{id:'a1',kind:'review',reviewCardId:'a',status:'completed'},{id:'a2',kind:'review',reviewCardId:'a',status:'pending'}]};
  const round=bindTodayReviewRound(session,['a'],'a2',{sessionId:'someone-else',cardIds:['a'],itemIds:['a1']});
  assert.equal(completedTodayReviewCards(session,round).size,0);
  assert.equal(activeTodayReviewCardId(round.cardIds,completedTodayReviewCards(session,round)),'a');
});

test('a missing bound task is retained as unavailable rather than silently shortening the round',()=>{
  const session={id:'today',items:[]};
  const round=bindTodayReviewRound(session,['missing'],'missing-task');
  assert.deepEqual(round.cardIds,['missing']);assert.deepEqual(round.itemIds,['']);
  assert.equal(completedTodayReviewCards(session,round).size,0);
});
