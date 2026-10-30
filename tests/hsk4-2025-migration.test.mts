import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildPackManifest, selectPackAssets } from "../src/lib/commercial/catalog.ts";
import { generationVersionForProduct, HSK1234_VOCABULARY_GENERATION_VERSION } from "../src/lib/commercial/products.ts";
import { findPublicCatalogWordById, searchPublicCatalogWords } from "../src/lib/content/public-catalog-index.ts";
import { parseCatalogSearchParams } from "../src/lib/content/catalog-search.ts";

const catalog = JSON.parse(readFileSync("src/lib/content/catalog.json", "utf8"));
const release = JSON.parse(readFileSync("content/releases/hsk3-hsk1234-2025-v8.json", "utf8"));

test("HSK 4 has exactly 1,000 distinct approved 2025 entries and preserves old links", () => {
  const words = catalog.contentAssets.filter((word: { id: string; level_band: string; publish_status: string }) => word.id.startsWith("hsk2025.word.l4.") && word.level_band === "4" && word.publish_status === "published");
  assert.equal(words.length, 1000);
  assert.equal(new Set(words.map((word: { id: string }) => word.id)).size, 1000);
  assert.ok(words.every((word: { standard_version: string; qa_status: string }) => word.standard_version === "HSK-EXAM-2025" && word.qa_status === "approved"));
  assert.equal(release.word_count_by_level["4"], 1000);
  assert.equal(searchPublicCatalogWords(parseCatalogSearchParams(new URL("https://hskkit.com/?level=4"))).pagination.total, 1000);
  assert.equal(findPublicCatalogWordById("hsk2025.word.l4.1001.v1")?.hanzi, "啊");
  assert.ok(findPublicCatalogWordById("hsk3.word.l4.0001.v1"));
});

test("HSK 4 PDF and its bundles select the 2025 release without claiming new audio", () => {
  assert.equal(generationVersionForProduct("level-4"), HSK1234_VOCABULARY_GENERATION_VERSION);
  const selection = selectPackAssets(4, "hsk1234-2025");
  assert.equal(selection.words.length, 1000);
  assert.equal(buildPackManifest(selection, HSK1234_VOCABULARY_GENERATION_VERSION).standardVersion, "HSK-EXAM-2025");
  assert.equal(catalog.audioAssets.filter((audio: { content_asset_id: string; publish_status: string }) => audio.content_asset_id?.startsWith("hsk2025.word.l4.") && audio.publish_status === "published").length, 0);
});
