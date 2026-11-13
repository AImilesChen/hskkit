// Keep Wrangler/workerd's process I/O isolated from the Actions step runner.
// Run the original gate unchanged: no retries, skipped assertions or longer deadlines.
const { spawnSync } = require('node:child_process');
const path = require('node:path');

function executeCacheGate(script = path.join(__dirname, 'check-public-cache-hit.cjs'), timeout = 400000) {
  return spawnSync(process.execPath, [script], {
    cwd: path.join(__dirname, '..'),
    env: process.env,
    encoding: 'utf8',
    timeout,
    maxBuffer: 8 * 1024 * 1024,
  });
}
function gateStatus(result) {
  return result.error || result.signal ? 1 : (result.status ?? 1);
}
module.exports = { executeCacheGate, gateStatus };
if (require.main === module) {
  console.log('Running the unchanged local cache and guard assertions in an isolated subprocess.');
  const result = executeCacheGate();
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  if (result.error) console.error('Local cache gate process failed:', result.error.code || result.error.message);
  if (result.signal) console.error('Local cache gate process terminated:', result.signal);
  process.exitCode = gateStatus(result);
}
