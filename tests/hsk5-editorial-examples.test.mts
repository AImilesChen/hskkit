import assert from "node:assert/strict";
import { test } from "node:test";
import catalog from "../src/lib/content/public-catalog-index.json" with { type: "json" };
import examples from "../src/lib/learning/hsk5-2025-examples.json" with { type: "json" };
import { matchedWordExample } from "../src/lib/learning/word-example-editorial.ts";
import { getPublishedWordBySlug } from "../src/lib/dictionary/runtime-word.ts";
import { todayContentFromCatalogRow, todayContentByAssetId } from "../src/lib/learning/today-content.ts";
import { findPublicCatalogWordById } from "../src/lib/content/public-catalog-index.ts";

const untoned = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");

test("all 1600 HSK 5 entries expose complete examples in word detail and Today", async () => {
  const rows = catalog.words.filter(row => row[3] === "5");
  assert.equal(rows.length, 1600);
  assert.equal(Object.keys(examples).length, 1600);
  for (const row of rows) {
    const example = matchedWordExample(5, row[4], row[6], row[0]);
    assert.ok(example, row[0]);
    assert.ok(example.hanzi.includes(row[4]), row[0]);
    assert.ok(untoned(example.pinyin).includes(untoned(row[6].split("/")[0])), row[0]);
    assert.ok(example.meaning.trim(), row[0]);
    const word = await getPublishedWordBySlug(row[0]);
    assert.equal(word.status, "published", row[0]);
    if (word.status === "published") {
      assert.deepEqual(word.item.examples[0], example, row[0]);
      assert.deepEqual(word.item.example, example, row[0]);
    }
    const found = findPublicCatalogWordById(row[0]);
    assert.ok(found);
    assert.deepEqual(todayContentFromCatalogRow(found).example, example);
    const runtime = todayContentByAssetId(row[0]);
    if (runtime) assert.deepEqual(runtime.example, example, row[0]);
  }
});

test("HSK 5 senses and readings stay distinct", () => {
  const get = (id: number) => (examples as Record<string, string[]>)[`hsk2025.word.l5.${id}.v1`];
  for (const [id, reading] of [[2250, "dàng"], [2472, "hào"], [2539, "jì"], [2657, "kān"], [2949, "shān"], [3063, "shǔ"]] as const) {
    assert.ok(get(id)[3].includes(reading), `${id}: wrong reading`);
  }
  assert.match(get(2132)[2], /称他为/);
  assert.match(get(2133)[2], /苹果/);
  assert.match(get(2825)[2], /货/);
  assert.match(get(2826)[2], /申请/);
  assert.match(get(3363)[2], /水果以及/);
  assert.match(get(3071)[2], /吸收水分/);
  assert.match(get(2917)[2], /人才培养/);
  assert.equal(matchedWordExample(5, "系", "xì", "hsk2025.word.l5.2539.v1"), undefined);
  assert.equal(matchedWordExample(5, "错字", "jì", "hsk2025.word.l5.2539.v1"), undefined);
  assert.equal(matchedWordExample(4, "系", "jì", "hsk2025.word.l5.2539.v1"), undefined);
  assert.equal(matchedWordExample(6, "系", "jì", "hsk2025.word.l5.2539.v1"), undefined);
  assert.equal(matchedWordExample(5, "系", "jì", "hsk2025.word.l5.2539.v2"), undefined);
});
