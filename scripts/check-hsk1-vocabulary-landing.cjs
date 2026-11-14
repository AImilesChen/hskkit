const fs = require('node:fs');
const assert = require('node:assert/strict');
const data = require('../src/lib/content/hsk1-vocabulary-landing.json');
const html = fs.readFileSync('.next/server/app/vocabulary/1.html', 'utf8');
const anchors = [...html.matchAll(/<a\b[^>]*href="(\/word\/[^\"]+)"[^>]*>/g)].map(match => match[1]);
const wordLinks = [...html.matchAll(/<a\b[^>]*aria-label="View details for [^\"]+"[^>]*>/g)];
assert.equal(wordLinks.length, 50, 'The default first 50 words must exist before JavaScript runs');
for (const word of data.firstPage) assert.ok(anchors.includes('/word/' + word.id), 'Missing initial word: ' + word.id);
for (const topic of data.topics) for (const word of topic.words) assert.ok(anchors.includes('/word/' + word.id), 'Missing topic detail link');
const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] || 'null');
const list = schema?.['@graph']?.find(item => item['@type'] === 'ItemList');
assert.equal(list?.numberOfItems, 50);
assert.deepEqual(list.itemListElement.map(item => item.url), data.firstPage.map(word => 'https://hskkit.com/word/' + word.id));
assert.ok(html.includes('<link rel="canonical" href="https://hskkit.com/vocabulary/1"'));
for (const id of ['hsk1-topics', 'hsk1-study-guide', 'hsk1-sources', 'hsk1-faq']) {
  assert.ok(html.includes(`id="${id}"`), 'Missing visible guide section');
  assert.ok(html.includes(`href="#${id}"`), 'Missing working page jump');
}
assert.equal((html.match(/<details\b/g) || []).length >= 6, true);
for (const level of [2, 3, 7]) {
  const other = fs.readFileSync(`.next/server/app/vocabulary/${level}.html`, 'utf8');
  assert.ok(!other.includes('data-hsk1-guide'), 'Do not repeat the HSK 1 guide on other levels');
}
console.log('HSK 1 production HTML: 50 linked words, 18 topic examples, schemas, guide sections and level isolation verified');
