import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getHsk4VocabularyInitialPage, hsk4VocabularyTopics } from "../src/lib/content/hsk4-vocabulary-landing.ts";
import { getHsk3LevelStatus } from "../src/lib/content/level-status.ts";
import { handleCatalogWordsRequest } from "../src/lib/content/catalog-route.ts";
import { findPublicCatalogWordById, publicCatalogReleaseId } from "../src/lib/content/public-catalog-index.ts";
import snapshot from "../src/lib/content/hsk4-vocabulary-landing.json" with { type: "json" };

const query = async (params: string) => {
  const response = await handleCatalogWordsRequest(new Request("https://hskkit.com/api/v1/catalog/words?" + params));
  assert.equal(response.status, 200);
  return response.json();
};

test("HSK 4 initial words preserve the query's ordering, traditional forms, readings and audio", async () => {
  const live = await query("level=4&page=1&pageSize=50");
  const initial = getHsk4VocabularyInitialPage();
  assert.equal(initial.contentAssets.length, 50);
  assert.deepEqual(initial.pagination, live.pagination);
  for (const [index, word] of initial.contentAssets.entries()) {
    const published = live.contentAssets[index];
    assert.equal(word.id, published.id);
    assert.equal(word.level, 4);
    assert.deepEqual(word.payload, published.payload);
    assert.equal(word.formalAudioAvailable, published.formalAudioAvailable);
    assert.equal(word.formalAudioUrl, published.formalAudioUrl);
  }
});

test("topic entries and the discussion example use verified word IDs and levels", () => {
  const words = hsk4VocabularyTopics.flatMap(topic => topic.words);
  assert.equal(hsk4VocabularyTopics.length, 6);
  assert.equal(words.length, 18);
  assert.equal(new Set(words.map(word => word.id)).size, 18);
  for (const word of words) {
    const published = findPublicCatalogWordById(word.id);
    assert.ok(published);
    assert.equal(published.level_band, "4");
    assert.equal(word.payload.hanzi, published.hanzi);
    assert.equal(word.payload.pinyin, published.pinyin);
    assert.equal(word.payload.meaning, published.meaning);
  }
  for (const [id, hanzi, level] of [
    ["hsk2025.word.l4.1723.v1", "讨论", "4"], ["hsk2025.word.l4.1490.v1", "旅行", "4"],
    ["hsk2025.word.l4.1329.v1", "计划", "4"], ["hsk2025.word.l1.0222.v1", "我们", "1"],
    ["hsk2025.word.l1.0286.v1", "正在", "1"], ["hsk2025.word.l1.0030.v1", "的", "1"],
  ]) {
    const word = findPublicCatalogWordById(id);
    assert.equal(word?.hanzi, hanzi);
    assert.equal(word?.level_band, level);
  }
});

test("the 1000 HSK 4 entries are distinct from the combined 2000, with only a bounded initial snapshot", async () => {
  assert.equal(snapshot.releaseId, publicCatalogReleaseId);
  const initial = getHsk4VocabularyInitialPage();
  assert.equal(initial.pagination.total, getHsk3LevelStatus(4).wordCount);
  assert.equal(initial.pagination.total, 1000);
  assert.equal(initial.pagination.totalPages, 20);
  assert.equal([1, 2, 3, 4].reduce((total, level) => total + getHsk3LevelStatus(level).wordCount, 0), 2000);
  assert.ok(fs.statSync(new URL("../src/lib/content/hsk4-vocabulary-landing.json", import.meta.url)).size < 40_000);
  const secondPage = await query("level=4&page=2&pageSize=50");
  assert.equal(secondPage.contentAssets.length, 50);
  assert.equal(secondPage.contentAssets[0].id, "hsk2025.word.l4.1051.v1");
  const firstIds = new Set(initial.contentAssets.map(word => word.id));
  assert.ok(secondPage.contentAssets.every((word: { id: string }) => !firstIds.has(word.id)));
});

test("different readings and same-reading senses remain separate, including chong/zhong, kong and sheng", async () => {
  for (const [hanzi, readings, ids] of [
    ["重", ["chóng", "zhòng"], ["1086", "1960"]],
    ["空", ["kōng", "kòng"], ["1436", "1439"]],
    ["生", ["shēng", "shēng"], ["1646", "1647"]],
  ] as const) {
    const result = await query("level=4&q=" + encodeURIComponent(hanzi) + "&pageSize=50");
    const matching = result.contentAssets.filter((word: { payload: { hanzi: string } }) => word.payload.hanzi === hanzi);
    assert.equal(matching.length, 2);
    assert.deepEqual(matching.map((word: { id: string }) => word.id), ids.map(id => `hsk2025.word.l4.${id}.v1`));
    assert.deepEqual(matching.map((word: { payload: { pinyin: string } }) => word.payload.pinyin), [...readings]);
    assert.notEqual(matching[0].payload.meaning, matching[1].payload.meaning);
  }
  const earlier = await query("level=2&q=%E5%95%8A&pageSize=50");
  assert.ok(earlier.contentAssets.some((word: { id: string; payload: { pinyin: string } }) => word.id === "hsk2025.word.l2.0301.v1" && word.payload.pinyin === "a"));
  assert.equal(getHsk4VocabularyInitialPage().contentAssets[0].payload.pinyin, "ā");
});
