import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const bank = JSON.parse(readFileSync('src/lib/numbers/bank.json', 'utf8'));
const assetRoot = resolve('.open-next/assets');
assert.equal(bank.items.length, 160, 'Ship the complete fixed listening bank');
for (const mode of ['numbers', 'prices', 'dates', 'times']) {
  assert.equal(bank.items.filter(item => item.mode === mode).length, 40);
}
for (const item of bank.items) {
  assert.match(item.audioSrc, /^\/number-audio\/v1\/[a-z]+-\d{2}-[a-f0-9]{12}\.mp3$/);
  const file = resolve(assetRoot, `.${item.audioSrc}`);
  const actual = createHash('sha256').update(readFileSync(file)).digest('hex');
  assert.equal(actual, item.audioSha256, `Packaged audio differs: ${item.id}`);
}
const headers = readFileSync(resolve(assetRoot, '_headers'), 'utf8');
assert.match(headers, /\/number-audio\/v1\/\*\s+Cache-Control:\s*public,max-age=31536000,immutable/);
const page = readFileSync('.next/server/app/tools/chinese-number-converter.html', 'utf8');
for (const text of ['Reading notes', 'Frequently asked questions', 'How to read Chinese numbers']) {
  assert.ok(page.includes(text), `Missing static content: ${text}`);
}
console.log('Verified 160 packaged MP3 checksums, immutable cache rule and static teaching page.');
