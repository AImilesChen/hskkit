import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getHsk5VocabularyInitialPage, hsk5VocabularyTopics } from "../src/lib/content/hsk5-vocabulary-landing.ts";
import { getHsk3LevelStatus } from "../src/lib/content/level-status.ts";
import { handleCatalogWordsRequest } from "../src/lib/content/catalog-route.ts";
import { findPublicCatalogWordById, publicCatalogReleaseId } from "../src/lib/content/public-catalog-index.ts";
import snapshot from "../src/lib/content/hsk5-vocabulary-landing.json" with { type: "json" };

const query = async (params: string) => {
  const response = await handleCatalogWordsRequest(new Request("https://hskkit.com/api/v1/catalog/words?" + params));
  assert.equal(response.status, 200);
  return response.json();
};

test("HSK 5 prerendered entries match actual order, traditional forms, readings, audio and pagination", async () => {
  const live = await query("level=5&page=1&pageSize=50");
  const initial = getHsk5VocabularyInitialPage();
  assert.equal(initial.contentAssets.length, 50);
  assert.deepEqual(initial.pagination, live.pagination);
  for (const [index, word] of initial.contentAssets.entries()) {
    const published = live.contentAssets[index];
    assert.equal(word.id, published.id);
    assert.equal(word.level, 5);
    assert.deepEqual(word.payload, published.payload);
    assert.equal(word.formalAudioAvailable, published.formalAudioAvailable);
    assert.equal(word.formalAudioUrl, published.formalAudioUrl);
  }
});

test("all topic words and the analysis sentence refer to the correct published levels and entries", () => {
  const words = hsk5VocabularyTopics.flatMap(topic => topic.words);
  assert.equal(hsk5VocabularyTopics.length, 6);
  assert.equal(words.length, 18);
  assert.equal(new Set(words.map(word => word.id)).size, 18);
  for (const word of words) {
    const published = findPublicCatalogWordById(word.id);
    assert.ok(published);
    assert.equal(published.level_band, "5");
    assert.equal(word.payload.hanzi, published.hanzi);
    assert.equal(word.payload.pinyin, published.pinyin);
    assert.equal(word.payload.meaning, published.meaning);
  }
  for (const [id, hanzi, level] of [
    ["hsk2025.word.l1.0222.v1", "我们", "1"], ["hsk2025.word.l3.0645.v1", "根据", "3"],
    ["hsk2025.word.l5.3067.v1", "数据", "5"], ["hsk2025.word.l5.2355.v1", "分析", "5"],
    ["hsk2025.word.l1.0220.v1", "问题", "1"],
  ]) {
    const word = findPublicCatalogWordById(id);
    assert.equal(word?.hanzi, hanzi);
    assert.equal(word?.level_band, level);
  }
});

test("1600 HSK 5 entries stay separate from 3600 across levels 1–5, with a bounded snapshot and unique pages", async () => {
  assert.equal(snapshot.releaseId, publicCatalogReleaseId);
  const initial = getHsk5VocabularyInitialPage();
  assert.equal(initial.pagination.total, getHsk3LevelStatus(5).wordCount);
  assert.equal(initial.pagination.total, 1600);
  assert.equal(initial.pagination.totalPages, 32);
  assert.equal([1, 2, 3, 4, 5].reduce((total, level) => total + getHsk3LevelStatus(level).wordCount, 0), 3600);
  assert.ok(fs.statSync(new URL("../src/lib/content/hsk5-vocabulary-landing.json", import.meta.url)).size < 40_000);
  const secondPage = await query("level=5&page=2&pageSize=50");
  assert.equal(secondPage.contentAssets.length, 50);
  assert.equal(secondPage.contentAssets[0].id, "hsk2025.word.l5.2051.v1");
  const firstIds = new Set(initial.contentAssets.map(word => word.id));
  assert.ok(secondPage.contentAssets.every((word: { id: string }) => !firstIds.has(word.id)));
});

test("different readings and same-reading meanings stay distinct across chu, diao/tiao, ji/xi, cheng and pi", async () => {
  for (const [hanzi, readings, ids] of [
    ["处", ["chǔ", "chù"], ["2179", "2182"]],
    ["调", ["diào", "tiáo"], ["2284", "3130"]],
    ["系", ["jì", "xì"], ["2539", "3226"]],
    ["称", ["chēng", "chēng"], ["2132", "2133"]],
    ["批", ["pī", "pī"], ["2825", "2826"]],
  ] as const) {
    const result = await query("level=5&q=" + encodeURIComponent(hanzi) + "&pageSize=50");
    const matching = result.contentAssets.filter((word: { payload: { hanzi: string } }) => word.payload.hanzi === hanzi);
    assert.equal(matching.length, 2);
    assert.deepEqual(matching.map((word: { id: string }) => word.id), ids.map(id => `hsk2025.word.l5.${id}.v1`));
    assert.deepEqual(matching.map((word: { payload: { pinyin: string } }) => word.payload.pinyin), [...readings]);
    assert.notEqual(matching[0].payload.meaning, matching[1].payload.meaning);
  }
});
