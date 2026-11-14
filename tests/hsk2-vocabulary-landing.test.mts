import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getHsk2VocabularyInitialPage, hsk2VocabularyTopics } from "../src/lib/content/hsk2-vocabulary-landing.ts";
import { getHsk3LevelStatus } from "../src/lib/content/level-status.ts";
import { handleCatalogWordsRequest } from "../src/lib/content/catalog-route.ts";
import { findPublicCatalogWordById, publicCatalogReleaseId } from "../src/lib/content/public-catalog-index.ts";
import snapshot from "../src/lib/content/hsk2-vocabulary-landing.json" with { type: "json" };

test("the HSK 2 initial page matches the real query order, traditional forms, readings and audio", async () => {
  const response = await handleCatalogWordsRequest(new Request("https://hskkit.com/api/v1/catalog/words?level=2&page=1&pageSize=50"));
  assert.equal(response.status, 200);
  const live = await response.json();
  const initial = getHsk2VocabularyInitialPage();
  assert.equal(initial.contentAssets.length, 50);
  assert.deepEqual(initial.pagination, live.pagination);
  for (const [index, word] of initial.contentAssets.entries()) {
    const published = live.contentAssets[index];
    assert.equal(word.id, published.id);
    assert.equal(word.level, 2);
    assert.deepEqual(word.payload, published.payload);
    assert.equal(word.formalAudioAvailable, published.formalAudioAvailable);
    assert.equal(word.formalAudioUrl, published.formalAudioUrl);
  }
});

test("the 18 topic entries and four comparison words belong to the current HSK 2 release", () => {
  const words = hsk2VocabularyTopics.flatMap(topic => topic.words);
  assert.equal(hsk2VocabularyTopics.length, 6);
  assert.equal(words.length, 18);
  assert.equal(new Set(words.map(word => word.id)).size, 18);
  for (const word of words) {
    const published = findPublicCatalogWordById(word.id);
    assert.ok(published);
    assert.equal(published.level_band, "2");
    assert.equal(word.payload.hanzi, published.hanzi);
    assert.equal(word.payload.pinyin, published.pinyin);
    assert.equal(word.payload.meaning, published.meaning);
  }
  for (const [id, hanzi] of [["0335", "地铁"], ["0309", "比"], ["0346", "公交车"], ["0384", "快"]]) {
    const word = findPublicCatalogWordById(`hsk2025.word.l2.${id}.v1`);
    assert.equal(word?.hanzi, hanzi);
    assert.equal(word?.level_band, "2");
  }
});

test("level-entry totals stay separate from the combined HSK 1 and 2 total", () => {
  assert.equal(snapshot.releaseId, publicCatalogReleaseId);
  const initial = getHsk2VocabularyInitialPage();
  assert.equal(initial.pagination.total, getHsk3LevelStatus(2).wordCount);
  assert.equal(initial.pagination.total, 200);
  assert.equal(initial.pagination.totalPages, 4);
  assert.equal(initial.pagination.total + getHsk3LevelStatus(1).wordCount, 500);
  assert.ok(fs.statSync(new URL("../src/lib/content/hsk2-vocabulary-landing.json", import.meta.url)).size < 40_000);
});

test("the distinct guo readings remain separate entries across pagination and search", async () => {
  const response = await handleCatalogWordsRequest(new Request("https://hskkit.com/api/v1/catalog/words?level=2&q=%E8%BF%87&pageSize=50"));
  const result = await response.json();
  const readings = result.contentAssets.filter((word: { payload: { hanzi: string } }) => word.payload.hanzi === "过");
  assert.equal(readings.length, 2);
  assert.deepEqual(new Set(readings.map((word: { payload: { pinyin: string } }) => word.payload.pinyin)), new Set(["guò", "guo"]));
  const secondPage = await (await handleCatalogWordsRequest(new Request("https://hskkit.com/api/v1/catalog/words?level=2&page=2&pageSize=50"))).json();
  assert.equal(secondPage.contentAssets[0].id, "hsk2025.word.l2.0351.v1");
  assert.ok(!getHsk2VocabularyInitialPage().contentAssets.some(word => word.id === secondPage.contentAssets[0].id));
});
