import assert from "node:assert/strict";
import test from "node:test";
import { buildPackManifest, manifestStillAuthorized, selectPackAssets } from "../src/lib/commercial/catalog.ts";
import { DIGITAL_PRODUCTS, generationVersionForProduct, HSK123456789_VOCABULARY_GENERATION_VERSION, HSK123456789_LIBRARY_LAYOUT_GENERATION_VERSION } from "../src/lib/commercial/products.ts";

test("current advanced and complete vocabulary products use the 2025 syllabus release", () => {
  const advanced = selectPackAssets(7, "hsk123456789-2025");
  assert.equal(advanced.words.length, 5600);
  assert.equal(new Set(advanced.words.map((word) => word.id)).size, 5600);
  assert.ok(advanced.words.every((word) => word.id.startsWith("hsk2025.word.l7.") && word.standardVersion === "HSK-EXAM-2025"));
  assert.equal(advanced.words.find((word) => word.id === "hsk2025.word.l7.05401.v1")?.meaning, "in order; in sequence; close to; adjacent to");
  assert.equal(advanced.words.find((word) => word.id === "hsk2025.word.l7.08659.v1")?.meaning, "to irritate the nose; to choke on smoke or a strong smell; pungent");
  const manifest = buildPackManifest(advanced, HSK123456789_VOCABULARY_GENERATION_VERSION);
  assert.equal(manifest.standardVersion, "HSK-EXAM-2025");
  assert.ok(manifestStillAuthorized(JSON.stringify(manifest)));
  assert.equal(generationVersionForProduct("advanced-7-9"), HSK123456789_VOCABULARY_GENERATION_VERSION);
  assert.equal(generationVersionForProduct("complete-1-9"), HSK123456789_LIBRARY_LAYOUT_GENERATION_VERSION);
  assert.equal(DIGITAL_PRODUCTS.find((product) => product.id === "advanced-7-9")?.vocabularyCount, 5600);
  assert.equal(DIGITAL_PRODUCTS.find((product) => product.id === "complete-1-9")?.vocabularyCount, 11000);
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map((level) => selectPackAssets(level, "hsk123456789-2025").words.length), [300, 200, 500, 1000, 1600, 1800, 5600]);
});
