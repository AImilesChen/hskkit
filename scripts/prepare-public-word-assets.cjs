// Package only the immutable public word caches with the exact build's assets.
// This script has no Cloudflare credentials, network calls or R2 writes.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const CACHE_DIR = 'cdn-cgi/_next_cache';
const MAX_ASSET_FILES = 90000;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_WORD_BYTES = 6 * 1024 * 1024 * 1024;
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function filesUnder(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isSymbolicLink()) throw Error('Unexpected symlink in built assets');
    if (entry.isDirectory()) files.push(...filesUnder(file));
    else if (entry.isFile()) files.push(file);
  }
  return files;
}
function prepare(root, { verify = false } = {}) {
  const build = fs.readFileSync(path.join(root, '.next/BUILD_ID'), 'utf8').trim();
  assert.match(build, /^[A-Za-z0-9_-]{21}$/);
  const slugs = JSON.parse(fs.readFileSync(path.join(root, 'src/lib/dictionary/word-prebuild-slugs.json'), 'utf8'));
  assert.ok(slugs.length > 0 && slugs.length <= 15000);
  assert.equal(new Set(slugs).size, slugs.length, 'Duplicate public word');
  const proof = path.join(root, '.next/cache/public-word-prerender.json');
  const snapshot = fs.existsSync(proof) ? JSON.parse(fs.readFileSync(proof, 'utf8')) : null;
  if (snapshot) assert.equal(snapshot.build, build, 'Stale full word-route proof');
  const manifest = snapshot?.manifest ?? JSON.parse(fs.readFileSync(path.join(root, '.next/prerender-manifest.json'), 'utf8'));
  const assets = path.join(root, '.open-next/assets');
  const cache = path.join(root, '.open-next/cache', build);
  let totalBytes = 0;
  const digest = crypto.createHash('sha256');
  const entries = [];
  for (const slug of slugs) {
    assert.match(slug, /^(?:[a-z]+(?:-[a-z]+)*|(?:hsk3|hsk2025)\.word\.l[1-7]\.\d{4,5}\.v\d+)$/);
    for (const suffix of ['', '/practice']) {
      const route = `/word/${slug}${suffix}`;
      assert.equal(manifest.routes[route]?.initialRevalidateSeconds, false, `Word is missing or not immutable: ${route}`);
      const relative = `${route.slice(1)}.cache`;
      const source = path.join(cache, relative);
      const bytes = fs.readFileSync(source);
      assert.ok(bytes.length > 0 && bytes.length <= MAX_FILE_BYTES, `Invalid asset size: ${route}`);
      const value = JSON.parse(bytes);
      assert.equal(value.type, 'app', `Unexpected cache type: ${route}`);
      assert.ok(typeof value.html === 'string' && value.html.includes('HSKKit'), `Missing HTML: ${route}`);
      assert.ok(typeof value.rsc === 'string' && value.rsc.length > 0, `Missing Flight data: ${route}`);
      totalBytes += bytes.length;
      assert.ok(totalBytes <= MAX_WORD_BYTES, 'Public word asset byte budget exceeded');
      const target = path.join(assets, CACHE_DIR, build, relative);
      const hash = sha(bytes);
      entries.push({ route, bytes: bytes.length, sha256: hash });
      digest.update(`${route}\0${hash}\n`);
      if (verify) assert.equal(sha(fs.readFileSync(target)), hash, `Stale or corrupt public word asset: ${route}`);
      else {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(source, target);
      }
    }
  }
  // Prevent old BUILD_IDs, private caches and other route caches being included.
  const bundled = filesUnder(path.join(assets, CACHE_DIR));
  assert.equal(bundled.length, entries.length, 'Unexpected or obsolete public word assets');
  const totalFiles = filesUnder(assets).length;
  assert.ok(totalFiles <= MAX_ASSET_FILES, `Static asset file budget exceeded: ${totalFiles}`);
  const report = { schemaVersion: 1, build, publicWords: slugs.length, wordAssets: entries.length,
    wordBytes: totalBytes, totalAssetFiles: totalFiles, manifestSha256: digest.digest('hex'),
    plannedWordR2Objects: 0, plannedWordR2Bytes: 0, verified: true };
  fs.writeFileSync(path.join(root, '.open-next/public-word-assets.json'), JSON.stringify(report, null, 2));
  return report;
}
module.exports = { prepare, filesUnder, MAX_ASSET_FILES, MAX_WORD_BYTES };
if (require.main === module) console.log(JSON.stringify(prepare(path.resolve(__dirname, '..'), { verify: process.argv.includes('--verify') })));
