import assert from "node:assert/strict";
import test from "node:test";

import catalog from "../src/lib/content/catalog.json" with { type: "json" };
import {
  getCharacterByHanzi,
  getWordBySlug,
  listPublishedWords,
  searchPublishedCharacters,
  searchPublishedWords,
  sitemapContentRoutes,
} from "../src/lib/dictionary/catalog.ts";

test("curated dictionary words are members of the active formal HSK 3.0 release", () => {
  const releaseId = catalog.activeReleaseByStandard.hsk3;
  const release = catalog.releases.find((item) => item.id === releaseId)!;
  const activeIds = new Set(release.contentAssetIds);
  const words = listPublishedWords();
  assert.ok(words.length > 0);
  for (const word of words) {
    assert.ok(activeIds.has(word.id));
    assert.equal(word.releaseStatus, "published");
    assert.equal(word.qaStatus, "approved");
    assert.equal(word.sourceVersion, releaseId);
    assert.ok(word.level >= 1 && word.level <= 7);
    assert.ok(word.hanzi && word.pinyin && word.meaning);
  }
  assert.equal(listPublishedWords({ level: 8 }).length, 0);
  assert.equal(listPublishedWords({ level: 9 }).length, 0);
});

test("dictionary searches Hanzi, normalized pinyin and English against formal entries", () => {
  assert.ok(searchPublishedWords("学习").some((word) => word.slug === "xue-xi"));
  assert.ok(searchPublishedWords("xue xi").some((word) => word.slug === "xue-xi"));
  assert.ok(searchPublishedWords("learn").some((word) => word.slug === "xue-xi"));
  assert.ok(searchPublishedWords("learn", { level: 1 }).every((word) => word.level === 1));
  assert.deepEqual(searchPublishedWords("no-such-study-word"), []);
  assert.ok(searchPublishedCharacters("学").some((character) => character.hanzi === "学"));
  assert.ok(searchPublishedCharacters("xue").some((character) => character.hanzi === "学"));
  assert.ok(searchPublishedCharacters("learn").some((character) => character.hanzi === "学"));
});

test("word and character lookups expose only active formal content", () => {
  const word = getWordBySlug("xue-xi");
  assert.equal(word.status, "published");
  assert.equal(getWordBySlug("withdrawn-sample").status, "missing");
  assert.equal(getWordBySlug("missing-study-word").status, "missing");

  const character = getCharacterByHanzi("学");
  assert.equal(character.status, "published");
  if (character.status === "published") {
    assert.ok(character.item.relatedWordSlugs.includes("xue-xi"));
    assert.ok(character.item.radical.length > 0);
    assert.ok(character.item.strokes > 0);
  }
  assert.equal(getCharacterByHanzi("撤").status, "missing");
});

test("dictionary sitemap gate includes only active canonical word and character routes", () => {
  const routes = sitemapContentRoutes();
  assert.ok(routes.includes("/levels"));
  assert.ok(routes.includes("/dictionary"));
  assert.ok(routes.includes("/word/xue-xi"));
  assert.ok(routes.includes(`/character/${encodeURIComponent("学")}`));
  assert.ok(!routes.includes("/vocabulary/8"));
  assert.ok(!routes.includes("/vocabulary/9"));
  assert.ok(!routes.some((route) => route.includes("withdrawn-sample")));
  assert.equal(new Set(routes).size, routes.length);
});
