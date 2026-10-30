import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildPackManifest, selectPackAssets } from "../src/lib/commercial/catalog.ts";
import { generationVersionForProduct, HSK12345_VOCABULARY_GENERATION_VERSION } from "../src/lib/commercial/products.ts";
import { findPublicCatalogWordById, searchPublicCatalogWords } from "../src/lib/content/public-catalog-index.ts";
import { parseCatalogSearchParams } from "../src/lib/content/catalog-search.ts";

const catalog = JSON.parse(readFileSync("src/lib/content/catalog.json", "utf8"));
const release = JSON.parse(readFileSync("content/releases/hsk3-hsk12345-2025-v9.json", "utf8"));

test("HSK 5 has exactly 1,600 approved 2025 entries and preserves retired links", () => {
  const words = catalog.contentAssets.filter((word: { id: string; level_band: string; publish_status: string }) => word.id.startsWith("hsk2025.word.l5.") && word.level_band === "5" && word.publish_status === "published");
  assert.equal(words.length, 1600);
  assert.equal(new Set(words.map((word: { id: string }) => word.id)).size, 1600);
  assert.ok(words.every((word: { standard_version: string; qa_status: string }) => word.standard_version === "HSK-EXAM-2025" && word.qa_status === "approved"));
  assert.equal(release.word_count_by_level["5"], 1600);
  assert.equal(searchPublicCatalogWords(parseCatalogSearchParams(new URL("https://hskkit.com/?level=5"))).pagination.total, 1600);
  assert.equal(findPublicCatalogWordById("hsk2025.word.l5.2001.v1")?.hanzi, "哎");
  assert.ok(findPublicCatalogWordById("hsk3.word.l5.0001.v1"));
});

test("HSK 5 PDF and its bundles use the 2025 release without claiming new audio", () => {
  for (const productId of ["level-5", "progression-4-6", "complete-1-9"] as const) {
    assert.equal(generationVersionForProduct(productId), HSK12345_VOCABULARY_GENERATION_VERSION);
  }
  const selection = selectPackAssets(5, "hsk12345-2025");
  assert.equal(selection.words.length, 1600);
  assert.equal(buildPackManifest(selection, HSK12345_VOCABULARY_GENERATION_VERSION).standardVersion, "HSK-EXAM-2025");
  assert.equal(catalog.audioAssets.filter((audio: { content_asset_id: string; publish_status: string }) => audio.content_asset_id?.startsWith("hsk2025.word.l5.") && audio.publish_status === "published").length, 0);
});
