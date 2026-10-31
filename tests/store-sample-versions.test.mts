import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { generationVersionForProduct } from "../src/lib/commercial/products.ts";
import { storeProductDetail } from "../src/lib/commercial/product-details.ts";

type SampleSource = { generationVersion: string; samples: Array<{ file: string; page: number; sourcePdfSha256: string }>; cardFrom: number };
const sources = JSON.parse(readFileSync(new URL("../src/lib/commercial/store-sample-sources.json", import.meta.url), "utf8")) as Record<string, SampleSource>;

test("updated vocabulary samples and cards are tied to the current delivery generation", () => {
  for (const [productId, source] of Object.entries(sources)) {
    assert.equal(source.generationVersion, generationVersionForProduct(productId), productId);
    assert.equal(source.samples.length, 2, productId);
    const detail = storeProductDetail(productId);
    assert.ok(detail, productId);
    for (const sample of source.samples) {
      assert.ok(Number.isInteger(sample.page) && sample.page > 0, productId);
      assert.match(sample.sourcePdfSha256, /^[0-9a-f]{64}$/, productId);
      assert.ok(existsSync(new URL(`../public/store/samples/vocabulary/${sample.file}`, import.meta.url)), sample.file);
      assert.ok(detail.samplePages.some(page => page.src.startsWith(`/store/samples/vocabulary/${sample.file}?v=${source.generationVersion}`)), sample.file);
    }
    assert.equal(detail.previewImage, detail.samplePages[0].src, productId);
    assert.match(detail.previewAlt, /Complete watermarked sample page/, productId);
  }
});

test("store sample galleries lead with product content", () => {
  for (const productId of ["worksheet-pack", "30-day-planner", "practice-assessment-pack", "teacher-lesson-plan-pack", "learner-practice-toolkit", "exam-preparation-bundle", "advanced-7-9"]) {
    const first = storeProductDetail(productId)?.samplePages[0];
    assert.ok(first, productId);
    assert.doesNotMatch(first.label, /start here|quick start|instructions|guide/i, productId);
  }
});

