import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import catalog from "../src/lib/content/public-catalog-index.json" with { type: "json" };
import examples from "../src/lib/learning/hsk789-2025-examples.json" with { type: "json" };
import progress from "../docs/quality/hsk789-example-progress.json" with { type: "json" };
import { matchedWordExample } from "../src/lib/learning/word-example-editorial.ts";
import { getPublishedWordBySlug } from "../src/lib/dictionary/runtime-word.ts";
import { todayContentFromCatalogRow, todayContentByAssetId } from "../src/lib/learning/today-content.ts";
import { findPublicCatalogWordById, searchPublicCatalogWords } from "../src/lib/content/public-catalog-index.ts";
import { isCatalogWordAssetId, buildCatalogQuery } from "../src/lib/content/catalog-search.ts";

const review = JSON.parse(readFileSync(new URL("../scripts/hsk789-example-review.json", import.meta.url), "utf8"));
const reading = (value: string) => value.toLowerCase().replace(/[^a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, "");
const get = (n: number) => (examples as Record<string, string[]>)[`hsk2025.word.l7.${String(n).padStart(5, "0")}.v1`];

test("all 5600 five-digit advanced IDs resolve, while invented split bands remain invalid", async () => {
  for (const row of catalog.words.filter(r => r[3] === "7-9")) {
    assert.ok(isCatalogWordAssetId(row[0]), row[0]);
    assert.equal((await getPublishedWordBySlug(row[0])).status, "published", row[0]);
  }
  for (const id of ["hsk2025.word.l8.05401.v1", "hsk2025.word.l9.05401.v1", "hsk2025.word.l7.5401.v1", "hsk2025.word.l7.005401.v1", "hsk2025.word.l6.05401.v1", "../hsk2025.word.l7.05401.v1"]) {
    assert.equal(isCatalogWordAssetId(id), false, id);
  }
  assert.ok(isCatalogWordAssetId("hsk3.word.l7.5636.v1"));
});

test("advanced flashcards randomize five-digit sequences identically in static and D1 catalogs", () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec("CREATE TABLE catalog_search_index (id TEXT, release_id TEXT, standard_version TEXT, content_version TEXT, level_band TEXT, hanzi TEXT, traditional TEXT, pinyin TEXT, meaning TEXT, part_of_speech TEXT)");
    const insert = db.prepare("INSERT INTO catalog_search_index VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    db.exec("BEGIN");
    for (const r of catalog.words.filter(r => r[3] === "7-9")) insert.run(r[0], catalog.releaseId, r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8]);
    db.exec("COMMIT");
    const select = (seed: number) => {
      const params = { q: "", level: 7, partOfSpeech: "", page: 1, pageSize: 20, mode: "flashcards" as const, seed };
      const staticIds = searchPublicCatalogWords(params).contentAssets.map(word => word.id);
      const query = buildCatalogQuery(params, catalog.releaseId);
      const databaseIds = db.prepare(query.sql).all(...query.bindings).slice(0, 20).map(row => row.id);
      assert.deepEqual(staticIds, databaseIds);
      return staticIds;
    };
    const first = select(90210);
    assert.deepEqual(select(90210), first);
    assert.notDeepEqual(select(90211), first);
    assert.notDeepEqual(first, catalog.words.filter(r => r[3] === "7-9").slice(0, 20).map(r => r[0]));
    assert.equal(new Set(first).size, 20);
  } finally {
    db.close();
  }
});

test("search database migration preserves the catalog's reviewed meanings and normalized search fields", () => {
  const db = new DatabaseSync(":memory:");
  try {
    for (const file of ["0053_catalog_search_index_hsk123456789_2025.sql", "0054_hsk789_polyphonic_gloss_corrections.sql", "0055_hsk789_example_gloss_corrections.sql"]) {
      db.exec(readFileSync(new URL(`../migrations/${file}`, import.meta.url), "utf8"));
    }
    const check = () => {
      assert.equal(db.prepare("SELECT COUNT(*) AS n FROM catalog_search_index").get()?.n, 11000);
      for (const n of [5448, 5629, 5631, 5641]) {
        const id = `hsk2025.word.l7.${String(n).padStart(5, "0")}.v1`;
        const row = catalog.words.find(r => r[0] === id)!;
        const stored = db.prepare("SELECT meaning, search_english, search_text FROM catalog_search_index WHERE id=? AND release_id=?").get(id, catalog.releaseId);
        assert.deepEqual({ ...stored }, { meaning: row[7], search_english: row[11], search_text: `${row[9]} ${row[10]} ${row[11]}` });
      }
    };
    check();
    db.exec(readFileSync(new URL("../migrations/0055_hsk789_example_gloss_corrections.sql", import.meta.url), "utf8"));
    check();
  } finally {
    db.close();
  }
});

test("reviewed advanced examples reach word detail and Today through runtime and catalog paths", async () => {
  assert.equal(catalog.words.filter(r => r[3] === "7-9").length, 5600);
  assert.equal(Object.keys(examples).length, 500);
  assert.deepEqual(Object.keys(examples), Object.keys(review.entries));
  for (const [id, entry] of Object.entries(examples)) {
    const row = findPublicCatalogWordById(id);
    assert.ok(row, id);
    const approved = review.entries[id];
    assert.equal(approved.status, "reviewed", id);
    assert.equal(approved.meaningReviewed, row.meaning, id);
    assert.equal(approved.partOfSpeechReviewed, row.part_of_speech, id);
    assert.deepEqual(entry, [approved.hanzi, approved.pinyin, ...approved.example], id);
    assert.ok(entry[2].includes(row.hanzi), id);
    assert.ok(reading(entry[3]).includes(reading(row.pinyin)), id);
    const example = matchedWordExample(7, row.hanzi, row.pinyin, id);
    assert.ok(example, id);
    const word = await getPublishedWordBySlug(id);
    assert.equal(word.status, "published", id);
    if (word.status === "published") {
      assert.deepEqual(word.item.example, example, id);
      assert.deepEqual(word.item.examples[0], example, id);
    }
    assert.deepEqual(todayContentFromCatalogRow(row).example, example, id);
    assert.deepEqual(todayContentByAssetId(id)?.example, example, id);
    for (const level of [8, 9]) assert.deepEqual(matchedWordExample(level, row.hanzi, row.pinyin, id), example, id);
  }
});

test("the single 7–9 band preserves pending coverage and rejects stale lexical matches", () => {
  assert.equal(progress.reviewedExamples, 500);
  assert.equal(progress.pendingExamples, 5100);
  assert.equal(progress.fullBandReviewComplete, false);
  assert.equal(progress.pendingIds.length, 5100);
  const reviewed = new Set(Object.keys(examples));
  for (const row of catalog.words.filter(r => r[3] === "7-9")) {
    assert.equal(progress.pendingIds.includes(row[0]), !reviewed.has(row[0]), row[0]);
    if (!reviewed.has(row[0])) assert.equal(matchedWordExample(7, row[4], row[6], row[0]), undefined, row[0]);
  }
  assert.equal(matchedWordExample(7, "挨", "ái", "hsk2025.word.l7.05401.v1"), undefined);
  assert.equal(matchedWordExample(7, "别字", "āi", "hsk2025.word.l7.05401.v1"), undefined);
  assert.equal(matchedWordExample(7, "挨", "āi", "hsk2025.word.l7.05401.v2"), undefined);
  assert.equal(matchedWordExample(6, "挨", "āi", "hsk2025.word.l7.05401.v1"), undefined);
  assert.equal(matchedWordExample(7, "挨", "āi", "hsk3.word.l7.0001.v1"), undefined);
});

test("review catches incorrect senses, proper names and accidental character boundaries", () => {
  assert.match(get(5401)[2], /挨着森林/);
  assert.match(get(5404)[2], /挨训/);
  assert.match(get(5442)[2], /杂草拔/);
  assert.match(get(5569)[2], /绳子绷紧/);
  assert.match(get(5634)[2], /文章中的标点/);
  assert.doesNotMatch(get(5634)[2], /图标点击/);
  assert.doesNotMatch(get(5641)[4], /Peugeot/);
  assert.match(get(5701)[2], /不下三百人/);
  assert.match(get(5714)[4], /breastfeeding/);
  assert.match(get(5744)[2], /不容否认/);
  assert.match(get(5759)[2], /布裁成/);
  assert.match(get(5768)[2], /采野花/);
  assert.match(get(5831)[2], /缠了两圈/);
  const row = (n: number) => catalog.words.find(r => r[0] === `hsk2025.word.l7.${String(n).padStart(5, "0")}.v1`)!;
  assert.equal(row(5448)[7], "overbearing; domineering");
  assert.match(row(5629)[7], /dialectical/);
  assert.match(row(5631)[7], /to mark/);
  assert.equal(row(5641)[7], "beautiful; pretty; good-looking");
});
