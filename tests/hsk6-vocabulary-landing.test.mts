import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getHsk6VocabularyInitialPage, hsk6VocabularyTopics } from "../src/lib/content/hsk6-vocabulary-landing.ts";
import { getHsk3LevelStatus } from "../src/lib/content/level-status.ts";
import { handleCatalogWordsRequest } from "../src/lib/content/catalog-route.ts";
import { findPublicCatalogWordById, publicCatalogReleaseId } from "../src/lib/content/public-catalog-index.ts";
import snapshot from "../src/lib/content/hsk6-vocabulary-landing.json" with { type: "json" };

const query = async (params: string) => {
  const response = await handleCatalogWordsRequest(new Request("https://hskkit.com/api/v1/catalog/words?" + params));
  assert.equal(response.status, 200);
  return response.json();
};

test("HSK 6 prerendered entries match actual order, traditional forms, readings, audio and pagination", async () => {
  const live = await query("level=6&page=1&pageSize=50");
  const initial = getHsk6VocabularyInitialPage();
  assert.equal(initial.contentAssets.length, 50);
  assert.deepEqual(initial.pagination, live.pagination);
  for (const [index, word] of initial.contentAssets.entries()) {
    const published = live.contentAssets[index];
    assert.equal(word.id, published.id);
    assert.equal(word.level, 6);
    assert.deepEqual(word.payload, published.payload);
    assert.equal(word.formalAudioAvailable, published.formalAudioAvailable);
    assert.equal(word.formalAudioUrl, published.formalAudioUrl);
  }
});

test("all topic words and the position sentence refer to the correct published levels and entries", () => {
  const words = hsk6VocabularyTopics.flatMap(topic => topic.words);
  assert.equal(hsk6VocabularyTopics.length, 6);
  assert.equal(words.length, 18);
  assert.equal(new Set(words.map(word => word.id)).size, 18);
  for (const word of words) {
    const published = findPublicCatalogWordById(word.id);
    assert.ok(published);
    assert.equal(published.level_band, "6");
    assert.equal(word.payload.hanzi, published.hanzi);
    assert.equal(word.payload.pinyin, published.pinyin);
    assert.equal(word.payload.meaning, published.meaning);
  }
  const example = findPublicCatalogWordById("hsk2025.word.l6.4437.v1");
  assert.equal(example?.hanzi, "立场");
  assert.equal(example?.level_band, "6");
});

test("1800 HSK 6 entries stay separate from 5400 across levels 1–6, with a bounded snapshot and unique pages", async () => {
  assert.equal(snapshot.releaseId, publicCatalogReleaseId);
  const initial = getHsk6VocabularyInitialPage();
  assert.equal(initial.pagination.total, getHsk3LevelStatus(6).wordCount);
  assert.equal(initial.pagination.total, 1800);
  assert.equal(initial.pagination.totalPages, 36);
  assert.equal([1, 2, 3, 4, 5, 6].reduce((total, level) => total + getHsk3LevelStatus(level).wordCount, 0), 5400);
  assert.ok(fs.statSync(new URL("../src/lib/content/hsk6-vocabulary-landing.json", import.meta.url)).size < 40_000);
  const secondPage = await query("level=6&page=2&pageSize=50");
  assert.equal(secondPage.contentAssets.length, 50);
  assert.equal(secondPage.contentAssets[0].id, "hsk2025.word.l6.3651.v1");
  const firstIds = new Set(initial.contentAssets.map(word => word.id));
  assert.ok(secondPage.contentAssets.every((word: { id: string }) => !firstIds.has(word.id)));
});

test("HSK 6 lou/lu readings and cross-level didao meanings stay distinct", async () => {
  const result = await query("level=6&q=" + encodeURIComponent("露") + "&pageSize=50");
  const matches = result.contentAssets.filter((word: { payload: { hanzi: string } }) => word.payload.hanzi === "露");
  assert.deepEqual(matches.map((word: { id: string }) => word.id), ["hsk2025.word.l6.4461.v1", "hsk2025.word.l6.4463.v1"]);
  assert.deepEqual(matches.map((word: { payload: { pinyin: string } }) => word.payload.pinyin), ["lòu", "lù"]);
  assert.equal(findPublicCatalogWordById("hsk2025.word.l6.3891.v1")?.pinyin, "dìdao");
  assert.equal(findPublicCatalogWordById("hsk2025.word.l7.06258.v1")?.pinyin, "dìdào");
});
