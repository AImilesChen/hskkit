import assert from "node:assert/strict";
import { test } from "node:test";
import catalog from "../src/lib/content/public-catalog-index.json" with { type: "json" };
import examples from "../src/lib/learning/hsk6-2025-examples.json" with { type: "json" };
import { matchedWordExample } from "../src/lib/learning/word-example-editorial.ts";
import { getPublishedWordBySlug } from "../src/lib/dictionary/runtime-word.ts";
import { todayContentFromCatalogRow, todayContentByAssetId } from "../src/lib/learning/today-content.ts";
import { findPublicCatalogWordById } from "../src/lib/content/public-catalog-index.ts";

const untoned = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");

test("all 1800 HSK 6 entries expose complete examples in word detail and Today", async () => {
  const rows = catalog.words.filter(row => row[3] === "6");
  assert.equal(rows.length, 1800);
  assert.equal(Object.keys(examples).length, 1800);
  for (const row of rows) {
    const example = matchedWordExample(6, row[4], row[6], row[0]);
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

test("HSK 6 examples distinguish readings, senses and accidental character matches", () => {
  const get = (id: number) => (examples as Record<string, string[]>)[`hsk2025.word.l6.${id}.v1`];
  for (const [id, reading] of [[3758, "chéng"], [3779, "chòng"], [4353, "juǎn"], [4410, "là"], [4461, "lòu"], [4463, "lù"], [4723, "sǎ"], [4726, "sǎn"], [4728, "sàn"], [4935, "tù"], [5328, "zhòng"], [5369, "zhuàn"]] as const) {
    assert.ok(get(id)[3].includes(reading), `${id}: wrong reading`);
  }
  assert.match(get(4353)[2], /地图/);
  assert.match(get(4354)[2], /考卷/);
  assert.match(get(4742)[2], /这把扇/);
  assert.match(get(4769)[2], /水/);
  assert.match(get(4771)[2], /声调/);
  assert.match(get(5043)[2], /相声/);
  assert.match(get(5084)[2], /未经许可/);
  assert.match(get(5127)[2], /会议要点/);
  assert.equal(matchedWordExample(6, "盛", "shèng", "hsk2025.word.l6.3758.v1"), undefined);
  assert.equal(matchedWordExample(6, "错字", "chéng", "hsk2025.word.l6.3758.v1"), undefined);
  assert.equal(matchedWordExample(5, "盛", "chéng", "hsk2025.word.l6.3758.v1"), undefined);
  assert.equal(matchedWordExample(7, "盛", "chéng", "hsk2025.word.l6.3758.v1"), undefined);
  assert.equal(matchedWordExample(6, "盛", "chéng", "hsk2025.word.l6.3758.v2"), undefined);
});

test("reviewed HSK 6 catalog corrections match word senses", () => {
  const row = (id: number) => catalog.words.find(r => r[0] === `hsk2025.word.l6.${id}.v1`)!;
  assert.equal(row(3847)[6], "dàdōu");
  assert.match(row(4341)[7], /round of a game/);
  assert.match(row(4451)[7], /anticipate/);
  assert.match(row(4513)[7], /reputation/);
  assert.match(row(5063)[7], /heart; mind/);
  assert.match(row(5195)[7], /employ/);
  assert.match(row(5206)[7], /preposition/);
  assert.match(row(5357)[7], /written work/);
});
