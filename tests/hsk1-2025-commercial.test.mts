import assert from "node:assert/strict";
import test from "node:test";
import { buildPackManifest, manifestStillAuthorized, selectPackAssets } from "../src/lib/commercial/catalog.ts";
import { DIGITAL_PRODUCTS, generationVersionForProduct, HSK1_VOCABULARY_GENERATION_VERSION, HSK123_VOCABULARY_GENERATION_VERSION, HSK123456_VOCABULARY_GENERATION_VERSION } from "../src/lib/commercial/products.ts";

test("the three HSK 1 commercial deliveries use the current 300-word list", () => {
  const selection = selectPackAssets(1, "hsk1-2025");
  assert.equal(selection.words.length, 300);
  assert.equal(new Set(selection.words.map(word => word.id)).size, 300);
  assert.ok(selection.words.every(word => word.id.startsWith("hsk2025.word.l1.")));
  const manifest = buildPackManifest(selection, HSK1_VOCABULARY_GENERATION_VERSION);
  assert.equal(manifest.standardVersion, "HSK-EXAM-2025");
  assert.ok(manifestStillAuthorized(JSON.stringify(manifest)));

  for (const productId of ["level-1", "starter-1-3"]) {
    assert.equal(generationVersionForProduct(productId), HSK123_VOCABULARY_GENERATION_VERSION);
  }
  assert.equal(generationVersionForProduct("complete-1-9"), HSK123456_VOCABULARY_GENERATION_VERSION);
  assert.equal(DIGITAL_PRODUCTS.find(product => product.id === "level-1")?.vocabularyCount, 300);
  assert.equal(DIGITAL_PRODUCTS.find(product => product.id === "starter-1-3")?.vocabularyCount, 1000);
  assert.equal(DIGITAL_PRODUCTS.find(product => product.id === "complete-1-9")?.vocabularyCount, 11036);
});

test("retired catalogs remain accessible for historical deliveries while current products switch generations", () => {
  assert.equal(selectPackAssets(1).words.length, 500);
  assert.equal(selectPackAssets(2).words.length, 772);
  assert.equal(generationVersionForProduct("level-2"), HSK123_VOCABULARY_GENERATION_VERSION);
  assert.equal(generationVersionForProduct("progression-4-6"), HSK123456_VOCABULARY_GENERATION_VERSION);
});
