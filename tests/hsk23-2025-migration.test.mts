import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildPackManifest, selectPackAssets } from "../src/lib/commercial/catalog.ts";
import { generationVersionForProduct } from "../src/lib/commercial/products.ts";
import { findPublicCatalogWordById, searchPublicCatalogWords } from "../src/lib/content/public-catalog-index.ts";
import { parseCatalogSearchParams } from "../src/lib/content/catalog-search.ts";

const publicIndex = JSON.parse(readFileSync("src/lib/content/public-catalog-index.json", "utf8"));
const runtime = JSON.parse(readFileSync("src/lib/content/runtime-content-index.json", "utf8"));

test("2025 HSK 2 and 3 release has exact distinct level counts and preserves old learning links", () => {
  assert.equal(publicIndex.releaseId, "hsk3-hsk1234-2025-v8");
  assert.deepEqual(runtime.levels.slice(0, 3).map((level: { wordCount: number }) => level.wordCount), [300, 200, 500]);
  assert.equal(publicIndex.wordCount, 9847);
  assert.equal(searchPublicCatalogWords(parseCatalogSearchParams(new URL("https://hskkit.com/?level=2"))).pagination.total, 200);
  assert.equal(searchPublicCatalogWords(parseCatalogSearchParams(new URL("https://hskkit.com/?level=3"))).pagination.total, 500);
  assert.equal(findPublicCatalogWordById("hsk3.word.l2.0232.v1")?.hanzi, "花");
  assert.equal(findPublicCatalogWordById("hsk3.word.l3.0006.v1")?.hanzi, "把");
  assert.equal(findPublicCatalogWordById("hsk2025.word.l2.0357.v1")?.meaning, "to spend (time or money)");
  assert.equal(findPublicCatalogWordById("hsk2025.word.l2.0358.v1")?.meaning, "flower; blossom");
});

test("commercial Level 2, Level 3 and Starter use the same approved 2025 release", () => {
  const selections = [1, 2, 3].map((level) => selectPackAssets(level, "hsk123-2025"));
  assert.deepEqual(selections.map((selection) => selection.words.length), [300, 200, 500]);
  assert.equal(new Set(selections.flatMap((selection) => selection.words.map((word) => word.id))).size, 1000);
  for (const selection of selections) {
    assert.equal(buildPackManifest(selection, generationVersionForProduct(`level-${selection.level}`)).standardVersion, "HSK-EXAM-2025");
  }
  assert.notEqual(generationVersionForProduct("starter-1-3"), generationVersionForProduct("complete-1-9"));
});

test("unreviewed polyphonic and neutral-tone audio remains unavailable", () => {
  for (const number of [351, 583, 587, 968]) {
    const level = number <= 500 ? 2 : 3;
    const id = `hsk2025.word.l${level}.${String(number).padStart(4, "0")}.v1`;
    assert.ok(findPublicCatalogWordById(id));
    assert.equal(runtime.publishedAudioAssets.some((audio: { contentAssetId: string }) => audio.contentAssetId === id), false);
  }
});
