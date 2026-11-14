// Public words already have immutable asset caches. Their two blocking dynamic
// routes are sufficient at runtime; do not inline 22k identical route records.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
function compact(root) {
  const next = path.join(root, '.next'), file = path.join(next, 'prerender-manifest.json');
  const raw = fs.readFileSync(file, 'utf8'), manifest = JSON.parse(raw);
  const standalone = path.join(next, 'standalone/.next/prerender-manifest.json');
  assert.ok(fs.existsSync(standalone), 'Standalone manifest missing');
  assert.deepEqual(JSON.parse(fs.readFileSync(standalone, 'utf8')), manifest, 'Standalone/source manifests differ');
  for (const route of ['/word/[slug]', '/word/[slug]/practice'])
    assert.equal(manifest.dynamicRoutes[route]?.fallback, null, 'Word runtime must retain blocking dynamic fallback');
  const slugs = JSON.parse(fs.readFileSync(path.join(root, 'src/lib/dictionary/word-prebuild-slugs.json'), 'utf8'));
  assert.ok(slugs.length > 0 && slugs.length <= 15000);
  const full = JSON.parse(raw);
  for (const slug of slugs) for (const tail of ['', '/practice']) {
    const route = `/word/${slug}${tail}`;
    assert.equal(manifest.routes[route]?.initialRevalidateSeconds, false, `Word is not immutable: ${route}`);
    assert.equal(manifest.routes[route].srcRoute, tail ? '/word/[slug]/practice' : '/word/[slug]');
    delete manifest.routes[route];
  }
  // Keep the full build proof outside standalone and outside *-manifest.json
  // globs, so it is used for publication checks but never inlined in the Worker.
  const backup = path.join(next, 'cache/public-word-prerender.json');
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.writeFileSync(backup, JSON.stringify({ build: fs.readFileSync(path.join(next, 'BUILD_ID'), 'utf8').trim(), manifest: full }));
  const bytes = JSON.stringify(manifest);
  fs.writeFileSync(file, bytes); fs.writeFileSync(standalone, bytes);
  const report = { publicWordEntriesRemoved: slugs.length * 2, retainedRoutes: Object.keys(manifest.routes).length,
    originalManifestBytes: Buffer.byteLength(raw), runtimeManifestBytes: Buffer.byteLength(bytes),
    dynamicWordFallbacksPreserved: true, pageFilesModified: false };
  fs.writeFileSync(path.join(root, '.open-next/public-word-manifest-compact.json'), JSON.stringify(report, null, 2));
  return report;
}
module.exports = { compact };
if (require.main === module) console.log(JSON.stringify(compact(path.resolve(__dirname, '..'))));
