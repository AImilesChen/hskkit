import assert from 'node:assert/strict';
import test from 'node:test';
import {assessmentScenario} from '../src/lib/commercial/mock-assessment-content.ts';
import {mockAssessmentListeningScript} from '../src/lib/commercial/product-generator.ts';

test('review: every form/level has 15 scored items with answer option and quoted support',()=>{
 const scenarios=Array.from({length:3},(_,form)=>Array.from({length:9},(_,idx)=>assessmentScenario(idx+1,form))).flat();
 assert.equal(scenarios.length,27);
 for(const scenario of scenarios){
  assert.equal(scenario.listening.length,5);
  assert.equal(scenario.reading.length,10);
  for(const item of [...scenario.listening,...scenario.reading]){
   assert.ok(['A','B','C'].includes(item.answer));
   assert.equal(new Set(item.options).size,3);
   assert.ok(item.explanation.length>=8);
   assert.ok(item.distractorAnalysis.length>20);
  }
 }
 assert.equal(new Set(scenarios.map(s=>s.transcript)).size,27);
 assert.equal(new Set(scenarios.map(s=>s.readingText)).size,27);
 assert.equal(new Set(scenarios.map(s=>s.sourceB)).size,27);
});

test('review: corrected tasks ask for supported information and do not repeat an answer within a form',()=>{
 for(let variant=0;variant<3;variant++){
  const beginner=assessmentScenario(1,variant);
  assert.match(beginner.listening[4].prompt,/最后一句/);
  for(let level=4;level<=7;level++){
   const scenario=assessmentScenario(level,variant);
   assert.doesNotMatch(scenario.listening[0].prompt,/要解决的核心问题/);
   assert.ok(scenario.listening[0].explanation.includes(scenario.readingText));
  }
  const upper=assessmentScenario(8,variant);
  assert.notEqual(upper.reading[3].options['ABC'.indexOf(upper.reading[3].answer)],upper.reading[5].options['ABC'.indexOf(upper.reading[5].answer)]);
  const highest=assessmentScenario(9,variant);
  const response=highest.reading[3].options['ABC'.indexOf(highest.reading[3].answer)];
  assert.doesNotMatch(response,/有冲突纳入考量|之间取舍纳入考量|形成直接张力纳入考量/);
  assert.ok(highest.reading[3].explanation.includes(highest.sourceB));
 }
});

test('review: level-three answers do not invent a full class or an AM qualifier',()=>{
 const b=assessmentScenario(3,1).reading[6];
 assert.match(b.prompt,/为什么改选夜间班/);
 assert.equal(b.options['ABC'.indexOf(b.answer)],'小周没报上下午摄影课');
 const c=assessmentScenario(3,2).listening[4];
 assert.equal(c.options['ABC'.indexOf(c.answer)],'周六九点');
 assert.doesNotMatch(c.options['ABC'.indexOf(c.answer)],/上午/);
});

test('review: all source question prompts occur in live narration once per level',()=>{
 for(const form of ['A','B','C'] as const){
  const script=mockAssessmentListeningScript(form);
  assert.equal((script.match(/本级听力结束。/g)||[]).length,9);
  assert.equal((script.match(/请作答。/g)||[]).length,45);
  for(let level=1;level<=9;level++){
   const scenario=assessmentScenario(level,form.charCodeAt(0)-65);
   assert.ok(script.includes(scenario.transcript));
   for(const item of scenario.listening)assert.ok(script.includes(item.prompt.replace(/^.*? · /u,'').replace(/[？。]+$/u,'')));
  }
 }
});

test('review: no earlier option gives away a later key within a level/form/modality',()=>{
 for(let level=1;level<=9;level++)for(let variant=0;variant<3;variant++){
  const scenario=assessmentScenario(level,variant);
  for(const [modality,items] of [['L',scenario.listening],['R',scenario.reading]] as const){
   const keys=items.map(item=>item.options['ABC'.indexOf(item.answer)]);
   assert.equal(new Set(keys).size,keys.length,`L${level}-${'ABC'[variant]}-${modality} has a repeated keyed response`);
   for(let later=1;later<items.length;later++)for(let earlier=0;earlier<later;earlier++){
    assert.ok(!items[earlier].options.includes(keys[later]),
     `L${level}-${'ABC'[variant]}-${modality}${earlier+1} leaks key of ${modality}${later+1}: ${keys[later]}`);
   }
  }
 }
});
