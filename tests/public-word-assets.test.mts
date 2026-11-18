import test from 'node:test';
import assert from 'node:assert/strict';
import type { IncrementalCache } from '@opennextjs/aws/types/overrides.js';
import { publicWordAssetKey, publicCharacterAssetKey, publicWordCache } from '../src/lib/runtime/public-word-cache.ts';
import characters from '../src/lib/dictionary/character-prebuild-slugs.json' with { type: 'json' };
import characterIndex from '../src/lib/dictionary/character-index.json' with { type: 'json' };
import slugs from '../src/lib/dictionary/word-prebuild-slugs.json' with { type: 'json' };
import validity from '../src/lib/runtime/word-route-validity.json' with { type: 'json' };

test('compact asset policy exactly matches the generated slugs, including retained IDs and gaps', () => {
  const selected = new Set(slugs);
  for (const slug of slugs) for (const tail of ['', '/practice'])
    assert.equal(publicWordAssetKey('/word/' + slug + tail), true, slug);
  for (const [key, intervals] of Object.entries(validity)) {
    const match = /^(.*)(\.v\d+):(\d+)$/.exec(key)!;
    for (let n = 0; n <= intervals.at(-1)![1] + 1; n++) {
      const slug = `${match[1]}.${String(n).padStart(Number(match[3]), '0')}${match[2]}`;
      assert.equal(publicWordAssetKey('/word/' + slug), selected.has(slug), slug);
    }
  }
});

test('private, mutable, encoded and data-cache keys cannot use immutable word storage', () => {
  for (const route of ['/api/v1/account', '/today', '/formal-media/file', '/dictionary',
    '/word/unknown', '/word/xue-xi/extra', '/word/%78ue-xi', '/word/xue-xi?private=1',
    '//word/xue-xi', '/word/../api/account']) assert.equal(publicWordAssetKey(route), false, route);
  assert.equal(publicWordAssetKey('/word/xue-xi', 'fetch'), false);
  assert.equal(publicWordAssetKey('/word/xue-xi', 'composable'), false);
});

test('public word reads never touch R2 and writes cannot create duplicate R2 caches', async () => {
  const calls: string[] = [];
  const assets = { name: 'assets', async get() { calls.push('assets.get'); return null; },
    async set() { throw Error('Assets are read-only'); }, async delete() { throw Error('Assets are read-only'); } } as IncrementalCache;
  const fallback = { name: 'fallback', async get() { calls.push('r2.get'); return null; },
    async set() { calls.push('r2.set'); }, async delete() { calls.push('r2.delete'); } } as IncrementalCache;
  const cache = publicWordCache(assets, fallback);
  await cache.get('/word/xue-xi');
  await cache.set('/word/xue-xi', { type: 'app', html: 'x', rsc: 'x' });
  await cache.delete('/word/xue-xi');
  assert.deepEqual(calls, ['assets.get']);
  await cache.get('/dictionary');
  await cache.set('/dictionary', { type: 'app', html: 'x', rsc: 'x' });
  await cache.delete('/dictionary');
  assert.deepEqual(calls.slice(1), ['r2.get', 'r2.set', 'r2.delete']);
  await cache.get('/word/xue-xi', 'fetch');
  assert.equal(calls.at(-1), 'r2.get');
});
test('immutable asset hits carry their revalidation policy without expanded route records', async () => {
  const assets = { name: 'assets', async get() { return { value: { type: 'app', html: 'same HTML', rsc: 'same Flight' }, lastModified: 123 }; } } as IncrementalCache;
  const unused = { name: 'unused', async get() { throw Error('R2 must not be used'); } } as IncrementalCache;
  const hit = await publicWordCache(assets, unused).get('/word/xue-xi');
  assert.equal(hit?.value?.revalidate, false);
  assert.equal(hit?.value?.type === 'app' && hit.value.html, 'same HTML');
});

test('every published character has a small exact allowlist; encoded/private/unknown keys retain fallback', () => {
  assert.deepEqual(characters, characterIndex.characters.map(item => item.hanzi));
  assert.equal(characters.length, 3088);
  for (const hanzi of characters) assert.equal(publicCharacterAssetKey('/character/' + hanzi), true);
  for (const key of ['/character/学/extra', '/character/%E5%AD%A6', '/character/学习', '/character/not-found',
    '/character/学?private=1', '//character/学', '/api/v1/account/session']) assert.equal(publicCharacterAssetKey(key), false, key);
  assert.equal(publicCharacterAssetKey('/character/学', 'fetch'), false);
  assert.equal(publicCharacterAssetKey('/character/学', 'composable'), false);
});

test('character HTML and Flight use assets with zero R2 reads/writes; invalid characters keep original fallback', async () => {
  const calls: string[] = [];
  const assets = { name: 'assets', async get() { calls.push('assets'); return { value: { type:'app', html:'unchanged character HTML', rsc:'unchanged Flight' } }; } } as IncrementalCache;
  const fallback = { name: 'fallback', async get() { calls.push('r2.get'); return null; },
    async set() { calls.push('r2.set'); }, async delete() { calls.push('r2.delete'); } } as IncrementalCache;
  const cache = publicWordCache(assets, fallback);
  const hit = await cache.get('/character/学');
  assert.equal(hit?.value?.revalidate, false);
  assert.equal(hit?.value?.type === 'app' && hit.value.html, 'unchanged character HTML');
  await cache.set('/character/学', {type:'app',html:'x',rsc:'x'});
  await cache.delete('/character/学');
  assert.deepEqual(calls, ['assets']);
  await cache.get('/character/unknown');
  assert.equal(calls.at(-1), 'r2.get');
});
