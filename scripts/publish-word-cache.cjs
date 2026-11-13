const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { cacheObjectKey } = require('./verify-word-cache-upload.cjs');
function wordCacheFiles(root, build) {
  const base = path.join(root, '.open-next/cache', build), files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile() && entry.name.endsWith('.cache')) {
        const route = '/' + path.relative(base, file).split(path.sep).join('/').slice(0, -6);
        files.push({ file, route, key: cacheObjectKey(build, route) });
      }
    }
  }
  walk(path.join(base, 'word'));
  return files.sort((a,b) => a.route.localeCompare(b.route));
}
function uploadWordCache(root, build, expected, manifest, run = spawnSync) {
  const entries = wordCacheFiles(root, build);
  assert.equal(entries.length, expected, 'Missing generated word cache');
  assert.ok(entries.length > 0 && entries.length <= 2538, 'Word cache publication budget exceeded');
  fs.writeFileSync(manifest, JSON.stringify(entries.map(({key,file}) => ({key,file}))));
  // Wrangler streams original files and throttles its REST queue to 1,100 requests / 5 minutes.
  // All keys belong to this new build, leaving existing production cache objects untouched.
  const result = run(process.execPath, [path.join(root,'node_modules/wrangler/bin/wrangler.js'),
    'r2','bulk','put','hskkit-page-cache','--filename',manifest,'--remote','--force','--concurrency','8'],
    {cwd:root,env:process.env,stdio:'inherit',timeout:720000});
  if (result.error) throw result.error;
  assert.equal(result.status,0,`Word cache upload failed (signal: ${result.signal || 'none'})`);
  return entries.length;
}
module.exports = {wordCacheFiles, uploadWordCache};
if (require.main === module) {
  const root=path.resolve(__dirname,'..'), temp=process.env.RUNNER_TEMP;
  assert.ok(temp,'RUNNER_TEMP is required');
  assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID,'77bc392d46985cd3425691358f5e8a77','Unexpected Cloudflare account');
  const build=fs.readFileSync(path.join(root,'.next/BUILD_ID'),'utf8').trim();
  const selected=JSON.parse(fs.readFileSync(path.join(root,'src/lib/dictionary/word-prebuild-slugs.json'),'utf8'));
  console.log(`Publishing ${selected.length*2} generated word cache entries for build ${build}`);
  const count=uploadWordCache(root,build,selected.length*2,path.join(temp,'word-cache-manifest.json'));
  console.log(JSON.stringify({build,uploaded:count,bucket:'hskkit-page-cache',transport:'Wrangler R2 REST bulk upload'}));
}
