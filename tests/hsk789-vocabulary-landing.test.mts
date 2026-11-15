import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getHsk789VocabularyInitialPage, hsk789VocabularyTopics } from "../src/lib/content/hsk789-vocabulary-landing.ts";
import { getHsk3LevelStatus } from "../src/lib/content/level-status.ts";
import { handleCatalogWordsRequest } from "../src/lib/content/catalog-route.ts";
import { findPublicCatalogWordById, publicCatalogReleaseId } from "../src/lib/content/public-catalog-index.ts";
import snapshot from "../src/lib/content/hsk789-vocabulary-landing.json" with { type: "json" };

const query = async (params: string) => {
  const response = await handleCatalogWordsRequest(new Request("https://hskkit.com/api/v1/catalog/words?" + params));
  assert.equal(response.status, 200);
  return response.json();
};

test("HSK 7–9 prerendered entries match actual order, traditional forms, readings, audio and pagination", async () => {
  const live = await query("level=7&page=1&pageSize=50");
  const initial = getHsk789VocabularyInitialPage();
  assert.equal(initial.contentAssets.length, 50);
  assert.deepEqual(initial.pagination, live.pagination);
  for (const [index, word] of initial.contentAssets.entries()) {
    const published = live.contentAssets[index];
    assert.equal(word.id, published.id);
    assert.equal(word.level, 7);
    assert.deepEqual(word.payload, published.payload);
    assert.equal(word.formalAudioAvailable, published.formalAudioAvailable);
    assert.equal(word.formalAudioUrl, published.formalAudioUrl);
  }
});

test("all topic words and the proposal sentence refer to the correct published levels and entries", () => {
  const words = hsk789VocabularyTopics.flatMap(topic => topic.words);
  assert.equal(hsk789VocabularyTopics.length, 6);
  assert.equal(words.length, 18);
  assert.equal(new Set(words.map(word => word.id)).size, 18);
  for (const word of words) {
    const published = findPublicCatalogWordById(word.id);
    assert.ok(published);
    assert.equal(published.level_band, "7-9");
    assert.equal(word.payload.hanzi, published.hanzi);
    assert.equal(word.payload.pinyin, published.pinyin);
    assert.equal(word.payload.meaning, published.meaning);
  }
  const example = findPublicCatalogWordById("hsk2025.word.l7.08762.v1");
  assert.equal(example?.hanzi, "权衡");
  assert.equal(example?.level_band, "7-9");
});

test("5600 advanced-band entries stay separate from 11000 across all levels, with a bounded snapshot and unique pages", async () => {
  assert.equal(snapshot.releaseId, publicCatalogReleaseId);
  const initial = getHsk789VocabularyInitialPage();
  assert.equal(initial.pagination.total, getHsk3LevelStatus(7).wordCount);
  assert.equal(initial.pagination.total, 5600);
  assert.equal(initial.pagination.totalPages, 112);
  assert.equal([1, 2, 3, 4, 5, 6, 7].reduce((total, level) => total + getHsk3LevelStatus(level).wordCount, 0), 11000);
  assert.ok(fs.statSync(new URL("../src/lib/content/hsk789-vocabulary-landing.json", import.meta.url)).size < 40_000);
  const secondPage = await query("level=7&page=2&pageSize=50");
  assert.equal(secondPage.contentAssets.length, 50);
  assert.equal(secondPage.contentAssets[0].id, "hsk2025.word.l7.05451.v1");
  const firstIds = new Set(initial.contentAssets.map(word => word.id));
  assert.ok(secondPage.contentAssets.every((word: { id: string }) => !firstIds.has(word.id)));
});

test("same written forms retain advanced-band IDs, meanings and readings", async () => {
  const result = await query("level=7&q=" + encodeURIComponent("地道") + "&pageSize=50");
  const matches = result.contentAssets.filter((word: { payload: { hanzi: string } }) => word.payload.hanzi === "地道");
  assert.equal(matches.length, 1);
  assert.equal(matches[0].id, "hsk2025.word.l7.06258.v1");
  assert.equal(matches[0].payload.pinyin, "dìdào");
  assert.equal(findPublicCatalogWordById("hsk2025.word.l6.3891.v1")?.pinyin, "dìdao");
  const all = await query("q=" + encodeURIComponent("地道") + "&pageSize=50");
  assert.equal(all.contentAssets.filter((word: { payload: { hanzi: string } }) => word.payload.hanzi === "地道").length, 2);
});
