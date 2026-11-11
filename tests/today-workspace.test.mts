import test from 'node:test';
import assert from 'node:assert/strict';
import { todayWorkspaceStages, todayWorkspaceWordLabel, todayWorkspaceSelection, todayTaskPreview, todaySessionRecap, todayRecapHidden, type WorkspaceItem } from '../src/lib/learning/today-workspace.ts';
const entry = (id: string, kind: WorkspaceItem['kind'], status: WorkspaceItem['status'] = 'pending', rest: Partial<WorkspaceItem> = {}) => ({ item: { id, kind, status, estimatedMinutes: 2, ...rest }, index: Number(id.replace(/\D/g,'')) });

test('workspace groups preserve server order, original indices and item identity without mutation', () => {
  const input=[entry('r0','review','completed'),entry('r1','review'),entry('w2','learn'),entry('a3','listen'),entry('w4','learn'),entry('s5','summary')];
  const before=JSON.stringify(input);
  const groups=todayWorkspaceStages(input,'r1');
  assert.deepEqual(groups.map(g=>g.kind),['review','learn','listen','learn','summary']);
  assert.deepEqual(groups.flatMap(g=>g.entries),input);
  assert.strictEqual(groups[0].entries[1].item,input[1].item);
  assert.equal(groups[0].state,'current');
  assert.equal(groups[0].completed,1);
  assert.equal(groups[0].remainingMinutes,2);
  assert.equal(groups[0].total,2);
  assert.equal(JSON.stringify(input),before);
});
test('moved steps are distinct from completed steps and cannot make a group complete', () => {
  const groups=todayWorkspaceStages([entry('w1','learn','completed'),entry('w2','learn','skipped')]);
  assert.equal(groups[0].state,'finished');
  assert.equal(groups[0].completed,1);
  assert.equal(groups[0].moved,1);
  assert.equal(groups[0].remainingMinutes,0);
  assert.equal(groups[0].total,2);
});
test('deferred and zero-minute work does not create phantom stages, but real summary is retained', () => {
  const groups=todayWorkspaceStages([entry('r0','review','pending',{deferred:true}),entry('w1','learn','pending',{estimatedMinutes:0}),entry('s2','summary','pending',{estimatedMinutes:0})]);
  assert.deepEqual(groups.map(g=>g.kind),['summary']);
  assert.equal(groups[0].state,'later');
  assert.deepEqual(todayWorkspaceStages([]),[]);
});
test('only pending work can be current; completed summaries are shown as completed', () => {
  const groups=todayWorkspaceStages([entry('w1','learn','completed'),entry('s2','summary','completed')],'w1');
  assert.equal(groups[0].state,'completed');
  assert.equal(groups[1].state,'completed');
});
test('word and context listening stay in the same visual group without duplicating their checks', () => {
  const groups=todayWorkspaceStages([entry('a1','listen'),entry('a2','listen'),entry('p3','practice')],'a2');
  assert.equal(groups.length,2);
  assert.equal(groups[0].total,2);
  assert.equal(groups[0].remainingMinutes,4);
  assert.equal(groups[0].state,'current');
  assert.equal(groups[1].state,'later');
});

test('word labels separate fresh and continuing words and omit empty counters', () => {
  assert.equal(todayWorkspaceWordLabel([entry('w1','learn').item]),'1 new word');
  assert.equal(todayWorkspaceWordLabel([entry('w1','learn','pending',{isContinuing:true}).item,entry('w2','learn').item]),'1 continuing word · 1 new word');
  assert.equal(todayWorkspaceWordLabel([entry('w1','learn','pending',{deferred:true}).item]),'No vocabulary steps planned');
});

test('the workspace opens the server-active task and advances beyond an earlier selected record', () => {
  const items=[entry('w1','learn','completed').item,entry('w2','learn').item,entry('a3','listen').item,entry('s4','summary').item];
  assert.equal(todayWorkspaceSelection(items,'w2')?.id,'w2');
  const selection={id:'w1',activeId:'w2'};
  assert.equal(todayWorkspaceSelection(items,'w2',selection)?.id,'w1');
  assert.equal(todayWorkspaceSelection(items,'a3',selection)?.id,'a3');
  assert.equal(todayWorkspaceSelection(items,'w2',{id:'missing',activeId:'w2'})?.id,'w2');
  assert.equal(todayWorkspaceSelection(items,undefined)?.id,'s4');
  assert.equal(todayWorkspaceSelection([],undefined),undefined);
});

test('listening previews count only their actual ordered stage and actual pending prerequisites', () => {
  const items=[entry('w0','learn','completed').item,entry('w1','learn').item,entry('w2','learn','skipped').item,entry('a3','listen','pending',{dimension:'audio'}).item,entry('a4','listen','pending',{dimension:'context_audio'}).item,entry('a5','listen','pending',{dimension:'audio',deferred:true}).item,entry('p6','practice').item,entry('a7','listen','pending',{dimension:'audio'}).item];
  const before=JSON.stringify(items),preview=todayTaskPreview(items,items[4]);
  assert.equal(preview.earlier,2);
  assert.equal(preview.wordAudio,1);
  assert.equal(preview.contextAudio,1);
  assert.equal(preview.groupTotal,2);
  assert.equal(preview.groupMinutes,4);
  assert.equal(JSON.stringify(items),before);
});

test('practice counts require exact content and version identity; unknown sets cannot borrow another count', () => {
  const item=entry('p0','practice','pending',{contentId:'practice:1:vocabulary',contentVersion:'v2'}).item;
  const info=[{contentId:'practice:1:vocabulary',version:'v2',count:8},{contentId:'practice:2:vocabulary',version:'v2',count:12}];
  assert.equal(todayTaskPreview([item],item,info).questionCount,8);
  assert.equal(todayTaskPreview([item],{...item,contentVersion:'v1'},info).questionCount,undefined);
  assert.equal(todayTaskPreview([item],{...item,contentId:'practice:3:vocabulary'},info).questionCount,undefined);
});

test('recap includes only completed visible word records and derives retry hints from saved checks', () => {
  const content={hanzi:'学习',pinyin:'xuéxí',meaning:'to study'};
  const word=entry('w0','learn','completed',{contentId:'word:study',contentVersion:'v1',learnContent:content,learnCheck:{attempts:2,firstTryCorrect:false}}).item;
  const items=[word,{...word,id:'duplicate'},entry('w2','learn','pending',{learnContent:content}).item,entry('w3','learn','skipped',{learnContent:content}).item,{...word,id:'deferred',deferred:true},entry('w4','learn','completed').item];
  assert.deepEqual(todaySessionRecap(items),[{id:'w0',...content,checked:true,needsPractice:true}]);
  assert.deepEqual(todaySessionRecap([]),[]);
});

test('recap details stay hidden for memory, listening, practice and review checks, including revisited words', () => {
  assert.equal(todayRecapHidden(entry('w0','learn').item,false),false);
  assert.equal(todayRecapHidden(entry('w0','learn').item,true),true);
  for(const kind of ['listen','practice','review'] as const)assert.equal(todayRecapHidden(entry('x0',kind).item,false),true);
  assert.equal(todayRecapHidden(undefined),false);
});
