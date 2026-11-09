import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MOCK_LEVELS, MOCK_FORMS, FREE_MOCK_COUNT, TOTAL_MOCK_COUNT, EXTRA_MOCK_COUNT, mockPaperHref, mockAccessState } from '../src/lib/formal-exams/offer.ts';
import { FREE_PLAN_BENEFITS, PRO_PLAN_BENEFITS, PLAN_COMPARISON } from '../src/lib/commercial/plan-presentation.ts';

test('published paper counts and per-level timing match all18 deployed papers',()=>{
 assert.equal(FREE_MOCK_COUNT,6);assert.equal(TOTAL_MOCK_COUNT,18);assert.equal(EXTRA_MOCK_COUNT,12);
 for(const row of MOCK_LEVELS)for(const form of MOCK_FORMS){
  const path=`src/lib/formal-exams/${row.level===1?'':`hsk${row.level}/`}data/${form}.json`;
  const p=JSON.parse(readFileSync(path,'utf8'));assert.equal(p.parts.flatMap((x:any)=>x.questions).length,row.questions);
  assert.equal((p.timing.approximatelyTotalSeconds-(p.timing.preparationSeconds??p.timing.personalInformationSeconds))/60,row.timedMinutes);
  assert.equal(p.form,form);assert.match(mockPaperHref(row.level,form),new RegExp(`/hsk-${row.level}/mock/${form}$`));
 }
 assert.throws(()=>mockPaperHref(7));assert.throws(()=>mockPaperHref(6,'d'));
});
test('benefit descriptions distinguish included18 from12 additional papers',()=>{
 assert.match(FREE_PLAN_BENEFITS[0],/6 free.*HSK 1–6/);assert.match(PRO_PLAN_BENEFITS[0].title,/18/);assert.match(PRO_PLAN_BENEFITS[0].detail,/12 additional/);
 assert.deepEqual(PLAN_COMPARISON.find(row=>row[0]==='Additional B/C papers'),['Additional B/C papers','Not included','12 papers']);
 assert.deepEqual(PLAN_COMPARISON.find(row=>row[0]==='Standard review of learned items'),['Standard review of learned items','Unlimited','Unlimited']);
 assert(!JSON.stringify([FREE_PLAN_BENEFITS,PRO_PLAN_BENEFITS,PLAN_COMPARISON]).includes('HSK 1 and HSK 2'));
});
test('access messaging is fail-closed and distinguishes trial, expiry, Free and anonymous',()=>{
 const now=Date.parse('2026-11-09T12:00:00Z'),base={available:true,authenticated:true};
 assert.equal(mockAccessState({...base,authenticated:false},now),'anonymous');
 assert.equal(mockAccessState({...base,available:false,access:{tier:'pro'}},now),'unavailable');
 assert.equal(mockAccessState({...base,access:{tier:'free'}},now),'free');
 assert.equal(mockAccessState({...base,access:{tier:'pro',source:'trial',endsAt:'2026-11-10T00:00:00Z'}},now),'trial');
 assert.equal(mockAccessState({...base,access:{tier:'pro',source:'paid',endsAt:'2026-11-10T00:00:00Z'}},now),'pro');
 assert.equal(mockAccessState({...base,access:{tier:'pro',endsAt:'2026-11-09T12:00:00Z'}},now),'expired');
 assert.equal(mockAccessState({...base,access:{tier:'free'},subscriptionEndsAt:'2026-11-01T00:00:00Z'},now),'expired');
 assert.equal(mockAccessState({...base,access:{tier:'pro',source:'promo',endsAt:'2026-12-01'},subscriptionEndsAt:'2026-11-01'},now),'pro');
 assert.equal(mockAccessState({...base,access:{tier:'pro',endsAt:'invalid'}},now),'unavailable');
 assert.equal(mockAccessState(base,now),'unavailable');
});
