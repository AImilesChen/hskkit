const assert = require('node:assert/strict');
const fs = require('node:fs');

// Check the actual production HTML, not the React source or hydration payload.
const html = fs.readFileSync(process.argv[2] || '.next/server/app/dictionary.html', 'utf8');
const links = [...html.matchAll(/<a\b([^>]+)>/g)]
  .filter((match) => /\bdata-dictionary-word-link(?:=|\s)/.test(match[1]))
  .map((match) => match[1].match(/\bhref="([^"]+)"/)?.[1]);
assert.equal(links.length, 12, 'Default word links must be present before JavaScript runs');
assert.equal(new Set(links).size, 12, 'Default words must not be duplicated');
assert.ok(links.every((link) => link?.startsWith('/word/')));
assert.match(html, /<h1[^>]*>Chinese-English Dictionary<\/h1>/);
assert.match(html, /rel="canonical" href="https:\/\/hskkit.com\/dictionary"/);
for (const section of ['dictionary-how-to-search', 'dictionary-entry-guide', 'dictionary-words-and-characters', 'dictionary-hsk-levels', 'dictionary-explore', 'dictionary-coverage', 'dictionary-faq']) {
  assert.ok(html.includes(`id="${section}"`), `${section} must be in the initial HTML`);
}
assert.ok(!html.includes('Opening the dictionary…'), 'Do not replace the dictionary with a client-only placeholder');
console.log(JSON.stringify({ initialWordLinks: links.length, uniqueWords: new Set(links).size, staticContentSections: 7, canonical: 'https://hskkit.com/dictionary', htmlBytes: Buffer.byteLength(html) }));
