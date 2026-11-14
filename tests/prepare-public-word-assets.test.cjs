const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { prepare } = require('../scripts/prepare-public-word-assets.cjs');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hskkit-word-assets-'));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('hskkit-word-assets-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  const build = 'TestBuild0123456789ab', slug = 'hsk2025.word.l6.3727.v1';
  for (const dir of ['.next', 'src/lib/dictionary', `.open-next/cache/${build}/word/${slug}`, '.open-next/assets'])
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  fs.writeFileSync(path.join(root, '.next/BUILD_ID'), build);
  fs.writeFileSync(path.join(root, 'src/lib/dictionary/word-prebuild-slugs.json'), JSON.stringify([slug]));
  const routes = {};
  for (const tail of ['', '/practice']) {
    routes[`/word/${slug}${tail}`] = { initialRevalidateSeconds: false };
    fs.writeFileSync(path.join(root, `.open-next/cache/${build}/word/${slug}${tail}.cache`),
      JSON.stringify({ type: 'app', html: '<html>HSKKit existing renderer</html>', rsc: 'existing Flight data' }));
  }
  fs.writeFileSync(path.join(root, '.next/prerender-manifest.json'), JSON.stringify({ routes }));
  return { root, build, slug };
}
test('packages exact HTML/Flight bytes for both routes with zero planned R2 growth', t => {
  const { root, build, slug } = fixture(t);
  const report = prepare(root);
  assert.equal(report.wordAssets, 2); assert.equal(report.plannedWordR2Bytes, 0);
  assert.deepEqual(prepare(root, { verify: true }), report);
  const target = path.join(root, `.open-next/assets/cdn-cgi/_next_cache/${build}/word/${slug}.cache`);
  fs.writeFileSync(target, 'corrupt');
  assert.throws(() => prepare(root, { verify: true }), /Stale or corrupt/);
});
test('missing or periodically revalidating public pages stop publication', t => {
  const { root, build, slug } = fixture(t);
  const file = path.join(root, `.open-next/cache/${build}/word/${slug}/practice.cache`);
  fs.unlinkSync(file); assert.throws(() => prepare(root), /ENOENT/);
  fs.writeFileSync(path.join(root, '.next/prerender-manifest.json'), JSON.stringify({ routes: {} }));
  assert.throws(() => prepare(root), /missing or not immutable/);
});
test('an old-build or non-word cache accidentally bundled in assets stops publication', t => {
  const { root } = fixture(t); prepare(root);
  const unexpected = path.join(root, '.open-next/assets/cdn-cgi/_next_cache/old/private.cache');
  fs.mkdirSync(path.dirname(unexpected), { recursive: true }); fs.writeFileSync(unexpected, '{}');
  assert.throws(() => prepare(root), /Unexpected or obsolete/);
});
test('compacted runtime uses the full matching build proof and rejects stale proof', t => {
  const { root, build } = fixture(t);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, '.next/prerender-manifest.json')));
  const proof = path.join(root, '.next/cache/public-word-prerender.json');
  fs.mkdirSync(path.dirname(proof), { recursive: true });
  fs.writeFileSync(proof, JSON.stringify({ build, manifest }));
  fs.writeFileSync(path.join(root, '.next/prerender-manifest.json'), '{"routes":{}}');
  assert.equal(prepare(root).wordAssets, 2);
  fs.writeFileSync(proof, JSON.stringify({ build: 'old-build', manifest }));
  assert.throws(() => prepare(root), /Stale full word-route proof/);
});
