import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import catalogJson from "../src/lib/content/catalog.json" with { type: "json" };
import manifestJson from "../content/releases/hsk3-gf0025-2021-v2.json" with { type: "json" };
import { queryCatalog, validateRepository, type ContentRepository } from "../src/lib/content/repository.ts";
import { toPublicCatalogResponse } from "../src/lib/content/public-catalog.ts";

type ManifestEntry = { id: string; standard_version: string; level_band: string; content_version: string; source_ref: string; license_ref: string; qa_status: string; publish_status: string; hanzi: string; pinyin: string; meaning: string };
type Manifest = { entry_count: number; counts_by_level_band: Record<string, number>; entries: ManifestEntry[] };
const repository = catalogJson as ContentRepository;
const manifest = manifestJson as unknown as Manifest;
const expected = { "1": 500, "2": 772, "3": 973, "4": 1000, "5": 1071, "6": 1140, "7-9": 5636 };

test("batch 1 manifest, repository, API and D1 seed counts agree", () => {
  validateRepository(repository);
  assert.equal(manifest.entry_count, 11092);
  assert.deepEqual(manifest.counts_by_level_band, expected);
  const results = [1, 2, 3, 4, 5, 6, 7].map((level) => queryCatalog(repository, { standard: "hsk3", level }));
  assert.deepEqual(results.map((result) => result.contentAssets.length), Object.values(expected));
  assert.equal(results.reduce((sum, result) => sum + result.contentAssets.length, 0), manifest.entry_count);
  const seed = fs.readFileSync(new URL("../content/releases/hsk3-gf0025-2021-v2.sql", import.meta.url), "utf8");
  assert.equal((seed.match(/INSERT INTO content_assets/g) ?? []).length, manifest.entry_count);
});

test("only approved, published HSK 3.0 content is exposed", () => {
  for (const level of [1, 2, 3, 4, 5, 6, 7]) {
    const response = toPublicCatalogResponse(queryCatalog(repository, { standard: "hsk3", level }));
    assert.equal(response.contentAssets.every((asset) => asset.standard_version === "GF0025-2021" && asset.qa_status === "approved" && asset.publish_status === "published"), true);
  }
  assert.equal(queryCatalog(repository, { standard: "hsk3", level: 8 }).contentAssets.length, 0);
  assert.equal(queryCatalog(repository, { standard: "hsk3", level: 9 }).contentAssets.length, 0);
  const release = repository.releases.find((candidate) => candidate.id === "hsk3-gf0025-2021-v2");
  assert.ok(release);
  assert.equal(release.contentAssetIds.some((id) => repository.contentAssets.find((asset) => asset.id === id)?.standard === "hsk2"), false);
  assert.equal(release.audioAssetIds.length, 0);
});

test("every published entry carries required provenance and validated lexical fields", () => {
  assert.equal(manifest.entries.every((entry) => entry.standard_version && entry.level_band && entry.content_version && entry.source_ref && entry.license_ref && entry.qa_status === "approved" && entry.publish_status === "published" && entry.hanzi && entry.pinyin && entry.meaning), true);
  assert.equal(new Set(manifest.entries.map((entry) => entry.id)).size, manifest.entry_count);
});

test("source notices and editorial scope remain internally consistent", () => {
  const notice = fs.readFileSync(new URL("../content/licenses/ivankra-hsk30-MIT.txt", import.meta.url), "utf8");
  assert.match(notice, /Copyright \(c\) 2023 Ivan Krasilnikov/);
  assert.match(notice, /Copyright \(c\) 2021 Shawky/);
  assert.match(notice, /Copyright \(c\) 2021 Pleco Inc\./);
  const editorialSource = (manifestJson as { source_refs: Array<{ id: string; scope: string }> }).source_refs.find((source) => source.id === "hskkit-editorial-v1");
  assert.equal(editorialSource?.scope, "28 missing compositional phrase glosses");
});
