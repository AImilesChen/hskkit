import test from 'node:test';
import assert from 'node:assert/strict';
import {waitForPublishedBuild} from '../scripts/storage-build-check.mjs';
const expected='x'.repeat(21);
test('release verification tolerates propagation but accepts only the exact expected build',async()=>{
  const results=[new Response('old'.padEnd(21,'a')),new Response(expected)];let calls=0,waits=0;
  await waitForPublishedBuild(expected,{request:async()=>{calls++;return results.shift()!;},wait:async()=>{waits++;},attempts:3});
  assert.equal(calls,2);assert.equal(waits,1);
});
test('persistent wrong build and blocked requests fail closed after a bounded number of attempts',async()=>{
  let calls=0;
  await assert.rejects(waitForPublishedBuild(expected,{request:async()=>{calls++;return new Response('blocked',{status:403});},wait:async()=>{},attempts:2}),/MISMATCH_HTTP_403/);
  assert.equal(calls,2);
  await assert.rejects(waitForPublishedBuild(expected,{request:async()=>new Response('y'.repeat(21)),wait:async()=>{},attempts:1}),/MISMATCH_HTTP_200/);
});
