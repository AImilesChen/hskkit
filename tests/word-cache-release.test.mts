import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import catalog from '../src/lib/content/public-catalog-index.json' with { type: 'json' };
import runtime from '../src/lib/content/runtime-content-index.json' with { type: 'json' };
import legacy1 from '../src/lib/content/legacy-hsk1-words.json' with { type: 'json' };
import legacy23 from '../src/lib/content/legacy-hsk23-words.json' with { type: 'json' };
import legacy4 from '../src/lib/content/legacy-hsk4-words.json' with { type: 'json' };
import legacy5 from '../src/lib/content/legacy-hsk5-words.json' with { type: 'json' };
import validity from '../src/lib/runtime/word-route-validity.json' with { type: 'json' };
import { knownStructuredWordId, missingWordResponse } from '../src/lib/runtime/word-not-found.ts';
import { getPublishedWordBySlug } from '../src/lib/dictionary/runtime-word.ts';
import { wordPrebuildParams } from '../src/lib/dictionary/word-prebuild.ts';

test('compact validity preserves all published and retained IDs and every gap', async () => {
  const ids = new Set([...catalog.words.map(r => r[0]),
    ...[...legacy1.words, ...legacy23.words, ...legacy4.words, ...legacy5.words].map(r => r[0]),
    ...runtime.dictionaryAssets.map(r => r.id), ...Object.values(runtime.runtimeWords).flat().map(r => r.id)]);
  for (const id of ids) assert.equal(knownStructuredWordId(id), (await getPublishedWordBySlug(id)).status === 'published', id);
  for (const [key, intervals] of Object.entries(validity)) {
    const match = /^(.*)(\.v\d+):(\d+)$/.exec(key)!;
    for (let n = 0; n <= intervals.at(-1)![1] + 1; n++) {
      const id = `${match[1]}.${String(n).padStart(Number(match[3]), '0')}${match[2]}`;
      assert.equal(knownStructuredWordId(id), ids.has(id), id);
    }
  }
  assert.equal(knownStructuredWordId('hsk3.word.l7.1831.v1'), false);
  assert.equal(knownStructuredWordId('hsk2025.word.l1.0102.v2'), false);
});

test('missing document keeps exact built HTML, 404 semantics and HEAD behavior', async () => {
  const html = '<!doctype html><title>Study item not found</title>';
  for (const tail of ['', '/practice']) {
    const url = `https://hskkit.com/word/hsk3.word.l7.1831.v1${tail}`;
    const response = missingWordResponse(new Request(url), html)!;
    assert.equal(response.status, 404); assert.equal(await response.text(), html);
    assert.match(response.headers.get('x-robots-tag')!, /noindex/);
    const head = missingWordResponse(new Request(url, { method: 'HEAD' }), html)!;
    assert.equal(head.status, 404); assert.equal(await head.text(), '');
  }
});

test('valid, curated, encoded, Flight, action, preview and private requests retain their old path', () => {
  for (const path of ['/word/xue-xi', '/word/withdrawn-sample', '/word/hsk2025.word.l1.0102.v1',
    '/word/hsk2025.word.l1.0102.v1/practice', '/word/%68sk3.word.l7.1831.v1',
    '/word/hsk3.word.l7.1831.v1/', '/api/v1/learning', '/formal-media/private.json']) {
    assert.equal(missingWordResponse(new Request('https://hskkit.com' + path), 'x'), undefined, path);
  }
  const url = 'https://hskkit.com/word/hsk3.word.l7.1831.v1';
  for (const header of ['rsc','next-action','next-router-prefetch','next-router-segment-prefetch','x-prerender-revalidate']) {
    assert.equal(missingWordResponse(new Request(url, { headers: { [header]: '1' } }), 'x'), undefined);
  }
  for (const cookie of ['__prerender_bypass=fixture', '__next_preview_data=fixture'])
    assert.equal(missingWordResponse(new Request(url, { headers: { cookie } }), 'x'), undefined);
  assert.equal(missingWordResponse(new Request(url + '?_rsc=fixture'), 'x'), undefined);
  assert.equal(missingWordResponse(new Request(url, { method: 'POST', body: '{}' }), 'x'), undefined);
});

test('bounded prebuild covers foundation and valid priority words without changing renderers', async () => {
  const params = wordPrebuildParams(); const ids = new Set(params.map(p => p.slug));
  assert.equal(ids.size, params.length); assert.ok(ids.size <= 1269);
  for (const row of catalog.words.filter(r => ['1', '2', '3'].includes(r[3]))) assert.ok(ids.has(row[0]));
  for (const { slug } of params) assert.equal((await getPublishedWordBySlug(slug)).status, 'published', slug);
  const patch = await readFile(new URL('../scripts/patch-open-next-email.mjs', import.meta.url), 'utf8');
  assert.ok(patch.includes('.next/server/app/_not-found.html'));
  // Early 404 remains after middleware (redirects/crawler/media checks), before Next import.
  assert.ok(patch.includes('missingWordResponse(request, wordNotFoundHtml)'));
});
