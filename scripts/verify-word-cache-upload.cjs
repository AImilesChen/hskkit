const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const routes = ['/word/hsk2025.word.l1.0007.v1', '/word/hsk2025.word.l1.0007.v1/practice', '/word/hsk2025.word.l6.4559.v1'];
function cacheObjectKey(build, route) {
  assert.match(build, /^[A-Za-z0-9_-]{10,64}$/);
  assert.match(route, /^\/word\/hsk2025\.word\.l[1-7]\.\d{4,5}\.v\d+(?:\/practice)?$/);
  return `system/opennext-cache/${build}/${crypto.createHash('sha256').update(route).digest('hex')}.cache`;
}
function verifyBytes(local, remote) {
  assert.ok(local.length > 0, 'Empty local cache entry');
  assert.equal(crypto.createHash('sha256').update(remote).digest('hex'), crypto.createHash('sha256').update(local).digest('hex'), 'Uploaded cache differs from this build');
}
module.exports = { cacheObjectKey, verifyBytes };
if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  const build = fs.readFileSync(path.join(root, '.next/BUILD_ID'), 'utf8').trim();
  const temp = process.env.RUNNER_TEMP;
  assert.ok(temp, 'RUNNER_TEMP is required');
  const checked = [];
  for (const [index, route] of routes.entries()) {
    const key = cacheObjectKey(build, route);
    const file = path.join(temp, `word-cache-upload-${index}.json`);
    const result = spawnSync(process.execPath, [path.join(root, 'node_modules/wrangler/bin/wrangler.js'), 'r2', 'object', 'get', `hskkit-page-cache/${key}`, '--file', file, '--remote'], { cwd: root, env: process.env, encoding: 'utf8', timeout: 60000 });
    assert.equal(result.status, 0, `Cannot read uploaded word cache: ${route}\n${result.stderr || ''}`);
    const local = fs.readFileSync(path.join(root, '.open-next/cache', build, route.slice(1) + '.cache'));
    const remote = fs.readFileSync(file);
    verifyBytes(local, remote);
    checked.push({ route, bytes: remote.length, sha256: crypto.createHash('sha256').update(remote).digest('hex') });
  }
  const report = { build, bucket: 'hskkit-page-cache', verifiedBeforeActivation: true, checked };
  fs.writeFileSync(path.join(temp, 'word-cache-upload.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}
