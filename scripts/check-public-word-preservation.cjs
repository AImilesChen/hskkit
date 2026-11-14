// One-release guard, invoked by CI only for the marked CPU-only release.
const fs = require('node:fs'), path = require('node:path');
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const baseline = require('../tests/fixtures/public-word-assets-ui-baseline.json');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 });
assert.equal(git('rev-parse', 'HEAD^').trim(), baseline.base, 'Production baseline changed; review preservation again');
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
const cssDir = path.join('.next', 'static', 'css');
const css = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'))
  .map(file => crypto.createHash('sha256').update(fs.readFileSync(path.join(cssDir, file))).digest('hex')).sort();
assert.deepEqual(css, baseline.cssSha256, 'CSS changed; this CPU-only release must not deploy');
const report = { base: baseline.base, pageRenderersUnchanged: true, learningCodeUnchanged: true, cssFiles: css.length, cssByteIdentical: true };
fs.writeFileSync('.open-next/public-word-ui-preservation.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
