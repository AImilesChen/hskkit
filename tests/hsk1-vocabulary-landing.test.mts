import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getHsk1VocabularyInitialPage, hsk1VocabularyTopics } from "../src/lib/content/hsk1-vocabulary-landing.ts";
import { handleCatalogWordsRequest } from "../src/lib/content/catalog-route.ts";
import { findPublicCatalogWordById } from "../src/lib/content/public-catalog-index.ts";

test("the prerendered HSK 1 page matches the real API's order, fields, audio and pagination", async () => {
  const response = await handleCatalogWordsRequest(new Request("https://hskkit.com/api/v1/catalog/words?level=1&page=1&pageSize=50"));
  assert.equal(response.status, 200);
  const live = await response.json();
  const initial = getHsk1VocabularyInitialPage();
  assert.equal(initial.contentAssets.length, 50);
  assert.deepEqual(initial.pagination, live.pagination);
  for (const [index, word] of initial.contentAssets.entries()) {
    const published = live.contentAssets[index];
    assert.equal(word.id, published.id);
    assert.deepEqual(word.payload, published.payload);
    assert.equal(word.level, published.level);
    assert.equal(word.formalAudioAvailable, published.formalAudioAvailable);
    assert.equal(word.formalAudioUrl, published.formalAudioUrl);
  }
});

test("all 18 topic words are distinct current HSK 1 entries with matching public definitions", () => {
  const words = hsk1VocabularyTopics.flatMap((topic) => topic.words);
  assert.equal(hsk1VocabularyTopics.length, 6);
  assert.equal(words.length, 18);
  assert.equal(new Set(words.map((word) => word.id)).size, 18);
  for (const word of words) {
    const published = findPublicCatalogWordById(word.id);
    assert.ok(published);
    assert.equal(published.level_band, "1");
    assert.equal(word.payload.hanzi, published.hanzi);
    assert.equal(word.payload.pinyin, published.pinyin);
    assert.equal(word.payload.meaning, published.meaning);
  }
});

test("the initial page remains small and uses the active publication's total", () => {
  const initial = getHsk1VocabularyInitialPage();
  assert.equal(initial.pagination.total, 300);
  assert.equal(initial.pagination.totalPages, 6);
  assert.equal(initial.pagination.hasPrevious, false);
  assert.equal(initial.pagination.hasNext, true);
  const size = fs.statSync(new URL("../src/lib/content/hsk1-vocabulary-landing.json", import.meta.url)).size;
  assert.ok(size < 40_000);
});
