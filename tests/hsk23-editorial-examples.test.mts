import assert from "node:assert/strict";
import { test } from "node:test";
import catalog from "../src/lib/content/public-catalog-index.json" with { type: "json" };
import examples from "../src/lib/learning/hsk23-2025-examples.json" with { type: "json" };
import { matchedWordExample } from "../src/lib/learning/word-example-editorial.ts";
import { getPublishedWordBySlug } from "../src/lib/dictionary/runtime-word.ts";
import { todayContentFromCatalogRow } from "../src/lib/learning/today-content.ts";
import { findPublicCatalogWordById } from "../src/lib/content/public-catalog-index.ts";

const untoned = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");

test("every active 2025 HSK 2 and 3 word has an aligned example", () => {
  const rows = catalog.words.filter((row) => row[3] === "2" || row[3] === "3");
  assert.equal(rows.length, 700);
  assert.equal(Object.keys(examples).length, 700);
  for (const row of rows) {
    const example = matchedWordExample(Number(row[3]), row[4], row[6], row[0]);
    assert.ok(example, `${row[0]}: no example`);
    assert.ok(example.hanzi.includes(row[4]), `${row[0]}: headword missing`);
    assert.ok(untoned(example.pinyin).includes(untoned(row[6].split("/")[0])), `${row[0]}: reading missing`);
    assert.ok(example.meaning.trim(), `${row[0]}: translation missing`);
    assert.equal(matchedWordExample(4, row[4], row[6], row[0]), undefined);
  }
});

test("runtime and catalog fallback expose HSK 2–3 examples to word and Today pages", async () => {
  for (const id of ["hsk2025.word.l2.0302.v1", "hsk2025.word.l2.0499.v1", "hsk2025.word.l3.0501.v1", "hsk2025.word.l3.0999.v1"]) {
    const row = findPublicCatalogWordById(id);
    assert.ok(row, id);
    const word = await getPublishedWordBySlug(id);
    assert.equal(word.status, "published", id);
    if (word.status !== "published") continue;
    assert.ok(word.item.example?.hanzi.includes(row.hanzi), id);
    assert.ok(todayContentFromCatalogRow(row).example?.hanzi.includes(row.hanzi), id);
  }
});
