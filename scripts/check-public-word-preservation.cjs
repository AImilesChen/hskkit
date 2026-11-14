// One-release guard, invoked by CI only for the marked CPU-only release.
const fs = require('node:fs'), path = require('node:path');
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const baseline = require('../tests/fixtures/public-word-assets-ui-baseline.json');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 });
assert.equal(git('rev-parse', `${baseline.base}^{commit}`).trim(), baseline.base, 'Missing verified production baseline');
const allowed = new Set([
  'src/app/word/[slug]/page.tsx', 'src/app/word/[slug]/practice/page.tsx',
  'src/lib/dictionary/word-prebuild.ts', 'src/lib/dictionary/word-prebuild-slugs.json',
  'src/lib/runtime/public-word-cache.ts', 'src/lib/runtime/public-word-asset-policy.json',
]);
for (const file of git('diff', '--name-only', baseline.base, 'HEAD', '--', 'src').trim().split('\n').filter(Boolean))
  assert.ok(allowed.has(file), `Unapproved page, style or learning-code change: ${file}`);
const normalize = text => text.replace(/\r\n/g, '\n')
  .split('\n').filter(line => !/^export const revalidate = (?:86_?400|false);$/.test(line)
    && !line.startsWith('// Published vocabulary is versioned source data;')
    && !line.startsWith('// Exercises use versioned public content;')).join('\n').trimEnd();
for (const file of ['src/app/word/[slug]/page.tsx', 'src/app/word/[slug]/practice/page.tsx'])
  assert.equal(normalize(fs.readFileSync(file, 'utf8')), normalize(git('show', `${baseline.base}:${file}`)), `Word renderer changed: ${file}`);
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
// Next may regroup identical CSS modules into different files across platforms.
// Preserve every selector, media context, ordered declaration and font descriptor;
// ignore only file boundaries and repeated copies of identical definitions.
const definitions = new Set(), postcss = require('postcss');
const cssDir = path.join('.next/static/css');
for (const file of fs.readdirSync(cssDir).filter(f => f.endsWith('.css'))) {
  postcss.parse(fs.readFileSync(path.join(cssDir, file), 'utf8')).walk(node => {
    let tag;
    if (node.type === 'rule') tag = ['rule', node.selector];
    else if (node.type === 'atrule' && (!node.nodes || node.nodes.some(n => n.type === 'decl')))
      tag = ['at', node.name, node.params];
    if (!tag) return;
    const parents = [];
    for (let p = node.parent; p && p.type !== 'root'; p = p.parent)
      parents.unshift(p.type === 'atrule' ? `@${p.name} ${p.params}` : p.selector);
    definitions.add(JSON.stringify([parents, tag, (node.nodes || []).filter(n => n.type === 'decl')
      .map(n => [n.prop, n.value, !!n.important])]));
  });
}
assert.equal(definitions.size, baseline.styleDefinitionsCount, 'Stylesheet definitions changed');
assert.equal(crypto.createHash('sha256').update([...definitions].sort().join('\n')).digest('hex'),
  baseline.styleDefinitionsSha256, 'Style values, selectors or font descriptors changed; stop deployment');
for (const [url, expected] of Object.entries(baseline.fonts))
  assert.equal(hash(path.join('.open-next/assets', new URL(url).pathname.slice(1))), expected, `Live font bytes changed: ${url}`);
const report = { base: baseline.base, pageRenderersUnchanged: true, learningCodeUnchanged: true,
  cssDefinitions: definitions.size, cssDefinitionsIdentical: true,
  liveFontSamples: Object.keys(baseline.fonts).length, fontByteIdentical: true };
fs.writeFileSync('.open-next/public-word-ui-preservation.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
