import assert from "node:assert/strict";
import test from "node:test";

import {
  getCharacterByHanzi,
  getWordBySlug,
  listPublishedWords,
  searchPublishedCharacters,
  searchPublishedWords,
  sitemapContentRoutes,
} from "../src/lib/dictionary/catalog.ts";

test("published catalog exposes searchable study words for every HSK 3.0 level", () => {
  for (let level = 1; level <= 9; level += 1) {
    const words = listPublishedWords({ level });
    assert.ok(words.length > 0, `Level ${level} should have published words`);
    for (const word of words) {
      assert.equal(word.level, level);
      assert.equal(word.releaseStatus, "published");
      assert.equal(word.qaStatus, "approved");
      assert.ok(word.hanzi && word.pinyin && word.meaning);
      assert.ok(word.example.hanzi && word.example.pinyin && word.example.meaning);
    }
  }
});

test("dictionary searches Hanzi, normalized pinyin, and English and supports a level filter", () => {
  assert.ok(searchPublishedWords("你好").some((word) => word.slug === "ni-hao"));
  assert.ok(searchPublishedWords("ni hao").some((word) => word.slug === "ni-hao"));
  assert.ok(searchPublishedWords("hello").some((word) => word.slug === "ni-hao"));
  assert.ok(searchPublishedWords("learn", { level: 2 }).every((word) => word.level === 2));
  assert.deepEqual(searchPublishedWords("no-such-study-word"), []);
  assert.ok(searchPublishedCharacters("你").some((character) => character.hanzi === "你"));
  assert.ok(searchPublishedCharacters("ni").some((character) => character.hanzi === "你"));
  assert.ok(searchPublishedCharacters("you").some((character) => character.hanzi === "你"));
  assert.deepEqual(searchPublishedCharacters("withdrawn sample"), []);
});

test("word and character lookups distinguish published, withdrawn, and missing content", () => {
  assert.equal(getWordBySlug("ni-hao").status, "published");
  assert.equal(getWordBySlug("withdrawn-sample").status, "withdrawn");
  assert.equal(getWordBySlug("missing-study-word").status, "missing");

  const character = getCharacterByHanzi("你");
  assert.equal(character.status, "published");
  if (character.status === "published") {
    assert.equal(character.item.hanzi, "你");
    assert.ok(character.item.pinyin.length > 0);
    assert.ok(character.item.radical.length > 0);
    assert.ok(character.item.strokes > 0);
    assert.ok(character.item.relatedWordSlugs.includes("ni-hao"));
  }
  assert.equal(getCharacterByHanzi("撤").status, "withdrawn");
  assert.equal(getCharacterByHanzi("𪚥").status, "missing");
});

test("sitemap publication gate includes only complete published canonical content", () => {
  const routes = sitemapContentRoutes();
  assert.ok(routes.includes("/levels"));
  assert.ok(routes.includes("/dictionary"));
  assert.ok(routes.includes("/vocabulary/9"));
  assert.ok(routes.includes("/word/ni-hao"));
  assert.ok(routes.includes(`/character/${encodeURIComponent("你")}`));
  assert.ok(!routes.some((route) => route.includes("withdrawn-sample")));
  assert.ok(!routes.some((route) => route.includes(encodeURIComponent("撤"))));
  assert.equal(new Set(routes).size, routes.length);
});
