import assert from "node:assert/strict";
import { test } from "node:test";
import publicCatalog from "../src/lib/content/public-catalog-index.json" with { type: "json" };
import { findPublicCatalogWordById } from "../src/lib/content/public-catalog-index.ts";
import { getWordBySlug } from "../src/lib/dictionary/catalog.ts";
import { getPublishedWordBySlug } from "../src/lib/dictionary/runtime-word.ts";
import { todayContentByAssetId, todayContentFromCatalogRow } from "../src/lib/learning/today-content.ts";
import { matchedWordExample } from "../src/lib/learning/word-example-editorial.ts";
import { HSK1_2025_NEW_EXAMPLES } from "../src/lib/learning/hsk1-2025-new-examples.ts";

const untoned = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");

test("all 300 HSK 1 words have a contextual example without assigning it to another level", async () => {
  const level1 = publicCatalog.words.filter((row) => row[3] === "1");
  const matched = level1.filter((row) => matchedWordExample(1, row[4], row[6], row[0]));
  assert.equal(level1.length, 300);
  assert.equal(matched.length, 300);
  for (const row of matched) {
    const example = matchedWordExample(1, row[4], row[6], row[0])!;
    assert.ok(example.hanzi.includes(row[4]));
    assert.ok(example.pinyin && example.meaning);
    assert.equal(matchedWordExample(2, row[4], row[6], row[0]), undefined);
  }
  assert.equal(Object.keys(HSK1_2025_NEW_EXAMPLES).length, 161);
  for (const [sequence, example] of Object.entries(HSK1_2025_NEW_EXAMPLES)) {
    const row = level1.find((item) => Number(item[0].split(".")[3]) === Number(sequence));
    assert.ok(row, sequence);
    assert.ok(example[0].includes(row[4]), `${sequence}: missing headword`);
    assert.ok(untoned(example[1]).includes(untoned(row[6].split("/")[0])), `${sequence}: reading not in example pinyin`);
  }
  assert.equal(matchedWordExample(1, "爱", "ài"), matchedWordExample(1, "爱", "ài"));
  assert.equal(matchedWordExample(1, "爱", "ǎi"), undefined);

  const local = getWordBySlug("hsk2025.word.l1.0001.v1");
  assert.equal(local.status, "published");
  if (local.status === "published") assert.equal(local.item.example?.hanzi, "我爱我的家。");
  assert.equal(todayContentByAssetId("hsk2025.word.l1.0001.v1")?.example?.hanzi, "我爱我的家。");

  const later = await getPublishedWordBySlug("hsk2025.word.l1.0125.v1");
  assert.equal(later.status, "published");
  if (later.status === "published") assert.equal(later.item.example?.hanzi, "我吃米饭。");
  const row = findPublicCatalogWordById("hsk2025.word.l1.0125.v1");
  assert.ok(row);
  assert.equal(todayContentFromCatalogRow(row).example?.hanzi, "我吃米饭。");
});
