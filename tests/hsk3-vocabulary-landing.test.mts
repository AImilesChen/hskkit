import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getHsk3VocabularyInitialPage, hsk3VocabularyTopics } from "../src/lib/content/hsk3-vocabulary-landing.ts";
import { getHsk3LevelStatus } from "../src/lib/content/level-status.ts";
import { handleCatalogWordsRequest } from "../src/lib/content/catalog-route.ts";
import { findPublicCatalogWordById, publicCatalogReleaseId } from "../src/lib/content/public-catalog-index.ts";
import snapshot from "../src/lib/content/hsk3-vocabulary-landing.json" with { type: "json" };

test("HSK 3 prerendered words retain actual catalog ordering, readings, traditional forms and audio", async () => {
  const response = await handleCatalogWordsRequest(new Request("https://hskkit.com/api/v1/catalog/words?level=3&page=1&pageSize=50"));
  assert.equal(response.status, 200);
  const live = await response.json();
  const initial = getHsk3VocabularyInitialPage();
  assert.equal(initial.contentAssets.length, 50);
  assert.deepEqual(initial.pagination, live.pagination);
  for (const [index, word] of initial.contentAssets.entries()) {
    const published = live.contentAssets[index];
    assert.equal(word.id, published.id);
    assert.equal(word.level, 3);
    assert.deepEqual(word.payload, published.payload);
    assert.equal(word.formalAudioAvailable, published.formalAudioAvailable);
    assert.equal(word.formalAudioUrl, published.formalAudioUrl);
  }
});

test("the topic words and weekend-plan example use their real published levels and IDs", () => {
  const words = hsk3VocabularyTopics.flatMap(topic => topic.words);
  assert.equal(hsk3VocabularyTopics.length, 6);
  assert.equal(words.length, 18);
  assert.equal(new Set(words.map(word => word.id)).size, 18);
  for (const word of words) {
    const published = findPublicCatalogWordById(word.id);
    assert.ok(published);
    assert.equal(published.level_band, "3");
    assert.equal(word.payload.hanzi, published.hanzi);
    assert.equal(word.payload.pinyin, published.pinyin);
    assert.equal(word.payload.meaning, published.meaning);
  }
  for (const [id, hanzi, level] of [
    ["hsk2025.word.l3.0986.v1", "周末", "3"], ["hsk2025.word.l3.0572.v1", "打算", "3"],
    ["hsk2025.word.l3.0863.v1", "图书馆", "3"], ["hsk2025.word.l3.0634.v1", "复习", "3"],
    ["hsk2025.word.l1.0221.v1", "我", "1"], ["hsk2025.word.l1.0167.v1", "去", "1"],
  ]) {
    const word = findPublicCatalogWordById(id);
    assert.equal(word?.hanzi, hanzi);
    assert.equal(word?.level_band, level);
  }
});

test("HSK 3 has 500 level entries and 1000 across the first three levels, in a bounded snapshot", () => {
  assert.equal(snapshot.releaseId, publicCatalogReleaseId);
  const initial = getHsk3VocabularyInitialPage();
  assert.equal(initial.pagination.total, getHsk3LevelStatus(3).wordCount);
  assert.equal(initial.pagination.total, 500);
  assert.equal(initial.pagination.totalPages, 10);
  assert.equal(initial.pagination.total + getHsk3LevelStatus(1).wordCount + getHsk3LevelStatus(2).wordCount, 1000);
  assert.ok(fs.statSync(new URL("../src/lib/content/hsk3-vocabulary-landing.json", import.meta.url)).size < 40_000);
});

test("the de, de2 and dei3 records stay distinct and pagination does not repeat the first 50 words", async () => {
  const query = async (params: string) => (await handleCatalogWordsRequest(new Request("https://hskkit.com/api/v1/catalog/words?" + params))).json();
  const level3 = await query("level=3&q=%E5%BE%97&pageSize=50");
  const readings = level3.contentAssets.filter((word: { payload: { hanzi: string } }) => word.payload.hanzi === "得");
  assert.equal(readings.length, 2);
  assert.deepEqual(new Set(readings.map((word: { payload: { pinyin: string } }) => word.payload.pinyin)), new Set(["dé", "děi"]));
  const level2 = await query("level=2&q=%E5%BE%97&pageSize=50");
  assert.ok(level2.contentAssets.some((word: { id: string; payload: { pinyin: string } }) => word.id === "hsk2025.word.l2.0332.v1" && word.payload.pinyin === "de"));
  const secondPage = await query("level=3&page=2&pageSize=50");
  assert.equal(secondPage.contentAssets.length, 50);
  assert.equal(secondPage.contentAssets[0].id, "hsk2025.word.l3.0551.v1");
  const firstIds = new Set(getHsk3VocabularyInitialPage().contentAssets.map(word => word.id));
  assert.ok(secondPage.contentAssets.every((word: { id: string }) => !firstIds.has(word.id)));
});
