const assert = require('node:assert/strict');
const fs = require('node:fs');
const REPOSITORY = 'AImilesChen/hskkit';
const PRODUCTION_BRANCH = 'fix/review-playback-current-prod-20261004';

function policy(eventName, event, now = Date.now()) {
  let due = false, mode = 'dry-run', expectedSource = '';
  if (eventName === 'workflow_run') {
    const run = event.workflow_run;
    due = Boolean(run && run.conclusion === 'success' && run.head_branch === PRODUCTION_BRANCH
      && run.head_repository?.full_name === REPOSITORY
      && run.path === '.github/workflows/deploy-production.yml'
      && ['push', 'workflow_dispatch'].includes(run.event));
    if (due) {
      assert.match(run.head_sha, /^[a-f0-9]{40}$/);
      expectedSource = run.head_sha;
      mode = 'apply';
    }
  } else if (eventName === 'schedule') {
    due = Math.floor(now / 86400000) % 2 === 0;
    mode = 'apply';
  } else if (eventName === 'push') {
    due = true; // Maintenance changes are audited before any deletion is enabled.
  } else if (eventName === 'workflow_dispatch') {
    due = true;
    mode = event.inputs?.mode || 'dry-run';
    assert.ok(['dry-run', 'apply'].includes(mode));
    expectedSource = event.inputs?.expected_source || '';
    if (expectedSource) assert.match(expectedSource, /^[a-f0-9]{40}$/);
  }
  return { due, mode, expectedSource };
}

module.exports = { policy };
if (require.main === module) {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const result = policy(process.env.GITHUB_EVENT_NAME, event);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `due=${result.due}\nmode=${result.mode}\nexpected_source=${result.expectedSource}\n`);
  console.log(JSON.stringify({ event: process.env.GITHUB_EVENT_NAME, ...result }));
}
