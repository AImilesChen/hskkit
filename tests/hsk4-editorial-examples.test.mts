import assert from "node:assert/strict";
import { test } from "node:test";
import catalog from "../src/lib/content/public-catalog-index.json" with { type: "json" };
import examples from "../src/lib/learning/hsk4-2025-examples.json" with { type: "json" };
import { matchedWordExample } from "../src/lib/learning/word-example-editorial.ts";
import { getPublishedWordBySlug } from "../src/lib/dictionary/runtime-word.ts";
import { todayContentFromCatalogRow, todayContentByAssetId } from "../src/lib/learning/today-content.ts";
import { findPublicCatalogWordById } from "../src/lib/content/public-catalog-index.ts";

const untoned = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");

test("all 1000 HSK 4 entries expose complete examples in word detail and Today", async () => {
  const rows = catalog.words.filter(row => row[3] === "4");
  assert.equal(rows.length, 1000);
  assert.equal(Object.keys(examples).length, 1000);
  for (const row of rows) {
    const example = matchedWordExample(4, row[4], row[6], row[0]);
    assert.ok(example, row[0]);
    assert.ok(example.hanzi.includes(row[4]), row[0]);
    assert.ok(untoned(example.pinyin).includes(untoned(row[6].split("/")[0])), row[0]);
    assert.ok(example.meaning.trim(), row[0]);
    const word = await getPublishedWordBySlug(row[0]);
    assert.equal(word.status, "published", row[0]);
    if (word.status === "published") {
      assert.ok(word.item.examples.length, row[0]);
      assert.ok(word.item.example?.hanzi.includes(row[4]), row[0]);
    }
    const found = findPublicCatalogWordById(row[0]);
    assert.ok(found);
    assert.deepEqual(todayContentFromCatalogRow(found).example, example);
    const runtime = todayContentByAssetId(row[0]);
    if (runtime) assert.ok(runtime.example?.hanzi.includes(row[4]), row[0]);
  }
});

test("examples stay attached to reviewed readings and distinct senses", () => {
  const get = (sequence: number) => (examples as Record<string, string[]>)[`hsk2025.word.l4.${sequence}.v1`];
  for (const [id, reading] of [[1020, "bēi"], [1131, "dāi"], [1439, "kòng"], [1472, "liáng"], [1818, "xiě"], [1959, "zhòng"], [1960, "zhòng"]] as const) {
    assert.ok(get(id)[3].includes(reading), `${id}: incorrect reading`);
  }
  assert.match(get(1646)[2], /宝宝/);
  assert.match(get(1647)[2], /肉/);
  assert.match(get(1799)[2], /课/);
  assert.match(get(1712)[2], /爷爷/);
  assert.equal(matchedWordExample(4, "背", "bèi", "hsk2025.word.l4.1020.v1"), undefined);
  assert.equal(matchedWordExample(4, "别的词", "bēi", "hsk2025.word.l4.1020.v1"), undefined);
  assert.equal(matchedWordExample(5, "背", "bēi", "hsk2025.word.l4.1020.v1"), undefined);
  assert.equal(matchedWordExample(4, "背", "bēi", "hsk2025.word.l4.1020.v2"), undefined);
});
