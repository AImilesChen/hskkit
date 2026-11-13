const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { executeCacheGate, gateStatus } = require('../scripts/run-cache-gate.cjs');

function fixture(t, code) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hskkit-gate-'));
  t.after(() => {
    const target = fs.realpathSync(dir);
    assert.equal(path.dirname(target), fs.realpathSync(os.tmpdir()));
    fs.rmSync(target, { recursive: true, force: true });
  });
  const file = path.join(dir, 'gate.cjs'); fs.writeFileSync(file, code); return file;
}
test('isolated gate preserves success output and exit status', t => {
  const result = executeCacheGate(fixture(t, 'console.log("gate passed");'), 5000);
  assert.equal(gateStatus(result), 0); assert.match(result.stdout, /gate passed/);
});
test('assertion failure remains a failing gate with its diagnostic output', t => {
  const result = executeCacheGate(fixture(t, 'console.error("assertion failed"); process.exit(7);'), 5000);
  assert.equal(gateStatus(result), 7); assert.match(result.stderr, /assertion failed/);
});
test('a hung or signalled gate cannot be treated as success', t => {
  const result = executeCacheGate(fixture(t, 'setInterval(() => {}, 1000);'), 250);
  assert.equal(gateStatus(result), 1); assert.equal(result.error.code, 'ETIMEDOUT');
  assert.equal(gateStatus({ status: 0, signal: 'SIGTERM' }), 1);
});
