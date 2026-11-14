const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { compact } = require('../scripts/compact-public-word-manifest.cjs');
function fixture(t, revalidate = false, fallback = null) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hskkit-manifest-'));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('hskkit-manifest-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  for (const dir of ['.next/standalone/.next', '.next/server/app/word', 'src/lib/dictionary', '.open-next'])
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  const routes = { '/dictionary': { initialRevalidateSeconds: 86400 } };
  for (const tail of ['', '/practice']) routes['/word/xue-xi' + tail] = {
    initialRevalidateSeconds: revalidate, srcRoute: '/word/[slug]' + tail,
  };
  const manifest = { routes, dynamicRoutes: {
    '/word/[slug]': { fallback, routeRegex: '^/word/([^/]+?)(?:/)?$' },
    '/word/[slug]/practice': { fallback, routeRegex: '^/word/([^/]+?)/practice(?:/)?$' },
  } };
  for (const f of ['.next/prerender-manifest.json', '.next/standalone/.next/prerender-manifest.json'])
    fs.writeFileSync(path.join(root, f), JSON.stringify(manifest));
  fs.writeFileSync(path.join(root, '.next/BUILD_ID'), 'TestBuild0123456789ab');
  fs.writeFileSync(path.join(root, 'src/lib/dictionary/word-prebuild-slugs.json'), '["xue-xi"]');
  fs.writeFileSync(path.join(root, '.next/server/app/word/xue-xi.html'), 'EXACT ORIGINAL PAGE');
  return { root, manifest };
}
test('compaction preserves both dynamic fallbacks, full publication proof and every page byte', t => {
  const { root, manifest } = fixture(t), report = compact(root);
  assert.equal(report.publicWordEntriesRemoved, 2);
  const runtime = JSON.parse(fs.readFileSync(path.join(root, '.next/prerender-manifest.json')));
  assert.deepEqual(runtime.routes, { '/dictionary': manifest.routes['/dictionary'] });
  assert.deepEqual(runtime.dynamicRoutes, manifest.dynamicRoutes);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, '.next/cache/public-word-prerender.json'))).manifest, manifest);
  assert.equal(fs.readFileSync(path.join(root, '.next/server/app/word/xue-xi.html'), 'utf8'), 'EXACT ORIGINAL PAGE');
});
test('revalidating or non-blocking words cannot be compacted', t => {
  assert.throws(() => compact(fixture(t, 86400).root), /not immutable/);
  assert.throws(() => compact(fixture(t, false, false).root), /blocking dynamic fallback/);
});
