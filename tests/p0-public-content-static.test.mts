import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import publicIndex from "../src/lib/content/public-catalog-index.json" with { type: "json" };
import {
  findPublicCatalogWordById,
  findPublicCatalogWordsContainingCharacter,
  searchPublicCatalogWords,
  suggestPublicCatalogWords,
} from "../src/lib/content/public-catalog-index.ts";

const read = async (path: string) => readFile(new URL(path, import.meta.url), "utf8");

test("public static catalog contains the complete active approved HSK 3.0 word release", () => {
  assert.equal(publicIndex.releaseId, "hsk3-content-truth-v5");
  assert.equal(publicIndex.words.length, 11_092);
  assert.equal(publicIndex.wordCount, publicIndex.words.length);
});

test("public static catalog supports Hanzi, pinyin, English, detail, and character lookups", () => {
  assert.equal(findPublicCatalogWordById("hsk3.word.l1.0001.v1")?.hanzi, "爱");
  assert.ok(searchPublicCatalogWords({ q: "学习", page: 1, pageSize: 20 }).contentAssets.some((word) => word.payload.hanzi === "学习"));
  assert.ok(searchPublicCatalogWords({ q: "xue xi", page: 1, pageSize: 20 }).contentAssets.some((word) => word.payload.hanzi === "学习"));
  assert.ok(searchPublicCatalogWords({ q: "learn", page: 1, pageSize: 20 }).contentAssets.some((word) => word.payload.hanzi === "学习"));
  assert.ok(suggestPublicCatalogWords({ q: "xue xi", limit: 4 }).some((word) => word.hanzi === "学习"));
  assert.ok(findPublicCatalogWordsContainingCharacter("学", 36).some((word) => word.hanzi.includes("学")));
});

test("public catalog request paths do not bind or query D1", async () => {
  const files = [
    "../src/app/api/v1/catalog/words/route.ts",
    "../src/app/api/v1/dictionary/suggestions/route.ts",
    "../src/lib/content/catalog-route.ts",
    "../src/lib/dictionary/runtime-word.ts",
    "../src/lib/dictionary/runtime-character.ts",
    "../src/lib/dictionary/p2-server.ts",
  ];
  for (const file of files) {
    const source = await read(file);
    assert.doesNotMatch(source, /LEARNING_DB|CatalogSearchDatabase|findActiveCatalog|findCatalogWordLearningContext|searchCatalogWords\(/);
  }
});

test("learning page load does not create a reward session before real interaction", async () => {
  const source = await read("../src/app/components/learning-engagement-tracker.tsx");
  assert.doesNotMatch(source, /void begin\(\);/);
  assert.match(source, /const markActive = [\s\S]*begin\(\)/);
});
