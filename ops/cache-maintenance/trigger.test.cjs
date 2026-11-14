const { test } = require('node:test');
const assert = require('node:assert/strict');
const { policy } = require('./trigger.cjs');
const run = { conclusion: 'success', head_branch: 'fix/review-playback-current-prod-20261004',
  head_repository: { full_name: 'AImilesChen/hskkit' }, head_sha: 'a'.repeat(40),
  path: '.github/workflows/deploy-production.yml', event: 'push' };

test('a successful trusted production deployment triggers cleanup for exactly its source commit', () => {
  assert.deepEqual(policy('workflow_run', { workflow_run: run }), { due: true, mode: 'apply', expectedSource: run.head_sha });
  assert.equal(policy('workflow_run', { workflow_run: { ...run, event: 'workflow_dispatch' } }).due, true);
});
test('failed, canceled and incomplete production releases cannot trigger cleanup', () => {
  for (const conclusion of ['failure', 'cancelled', null, 'timed_out']) {
    assert.equal(policy('workflow_run', { workflow_run: { ...run, conclusion } }).due, false);
  }
});
test('other branches, forks, pull requests and unrelated workflows cannot use the post-release trigger', () => {
  for (const change of [{ head_branch: 'main' }, { head_repository: { full_name: 'someone/hskkit' } },
    { event: 'pull_request' }, { path: '.github/workflows/test.yml' }]) {
    assert.equal(policy('workflow_run', { workflow_run: { ...run, ...change } }).due, false);
  }
  assert.equal(policy('workflow_run', {}).due, false);
});
test('scheduled fallback keeps alternating UTC days, exactly 48 hours apart', () => {
  const days = Array.from({ length: 8 }, (_, day) => policy('schedule', {}, day * 86400000).due);
  assert.deepEqual(days, [true, false, true, false, true, false, true, false]);
});
test('a maintenance code push is read-only and manual runs default to read-only', () => {
  assert.deepEqual(policy('push', {}), { due: true, mode: 'dry-run', expectedSource: '' });
  assert.deepEqual(policy('workflow_dispatch', {}), { due: true, mode: 'dry-run', expectedSource: '' });
  assert.deepEqual(policy('workflow_dispatch', { inputs: { mode: 'apply', expected_source: run.head_sha } }),
    { due: true, mode: 'apply', expectedSource: run.head_sha });
});
test('malformed provenance and unsupported modes fail closed', () => {
  assert.throws(() => policy('workflow_run', { workflow_run: { ...run, head_sha: 'bad\nmode=apply' } }));
  assert.throws(() => policy('workflow_dispatch', { inputs: { mode: 'delete-all' } }));
  assert.throws(() => policy('workflow_dispatch', { inputs: { expected_source: 'bad' } }));
  assert.equal(policy('pull_request', {}).due, false);
});
