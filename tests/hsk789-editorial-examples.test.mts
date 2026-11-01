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
import { handleCatalogWordsRequest } from "../src/lib/content/catalog-route.ts";

const review = JSON.parse(readFileSync(new URL("../scripts/hsk789-example-review.json", import.meta.url), "utf8"));
const attribution = JSON.parse(readFileSync(new URL("../public/content/hsk789-example-attribution.json", import.meta.url), "utf8"));
const reading = (value: string) => value.toLowerCase().replace(/[^a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, "");
const get = (n: number) => (examples as Record<string, string[]>)[`hsk2025.word.l7.${String(n).padStart(5, "0")}.v1`];

test("public search serves corrected advanced glosses and flashcards without a legacy D1 catalog", async () => {
  const unavailableDatabase = new Proxy({}, { get() { throw new Error("Legacy D1 catalog must not be accessed"); } });
  for (const n of [5448, 5629, 5631, 5641, 6627, 6682, 6849, 7063, 7100, 7157, 7208, 7294, 7514, 7554, 7569, 7774, 8126, 8127, 8376]) {
    const id = `hsk2025.word.l7.${String(n).padStart(5, "0")}.v1`;
    const row = catalog.words.find(r => r[0] === id)!;
    const response = await handleCatalogWordsRequest(new Request(`https://hskkit.com/api/v1/catalog/words?level=7&pageSize=100&q=${encodeURIComponent(row[4])}`), unavailableDatabase);
    assert.equal(response.status, 200, id);
    const result = await response.json();
    assert.equal(result.contentAssets.find((word: { id: string }) => word.id === id)?.payload.meaning, row[7], id);
  }
  const response = await handleCatalogWordsRequest(new Request("https://hskkit.com/api/v1/catalog/words?level=7&mode=flashcards&seed=90210&pageSize=20"), unavailableDatabase);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).contentAssets.length, 20);
});

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
    for (const file of ["0053_catalog_search_index_hsk123456789_2025.sql", "0054_hsk789_polyphonic_gloss_corrections.sql", "0055_hsk789_example_gloss_corrections.sql", "0056_hsk789_common_sense_gloss_corrections.sql", "0057_hsk789_example_sense_corrections.sql"]) {
      db.exec(readFileSync(new URL(`../migrations/${file}`, import.meta.url), "utf8"));
    }
    const check = () => {
      assert.equal(db.prepare("SELECT COUNT(*) AS n FROM catalog_search_index").get()?.n, 11000);
      for (const n of [5448, 5629, 5631, 5641, 6627, 6682, 6849, 7063, 7100, 7157, 7208, 7294, 7514, 7554, 7569, 7774, 8126, 8127, 8376]) {
        const id = `hsk2025.word.l7.${String(n).padStart(5, "0")}.v1`;
        const row = catalog.words.find(r => r[0] === id)!;
        const stored = db.prepare("SELECT meaning, search_english, search_text FROM catalog_search_index WHERE id=? AND release_id=?").get(id, catalog.releaseId);
        assert.deepEqual({ ...stored }, { meaning: row[7], search_english: row[11], search_text: `${row[9]} ${row[10]} ${row[11]}` });
        assert.equal(db.prepare("SELECT part_of_speech FROM catalog_search_index WHERE id=? AND release_id=?").get(id, catalog.releaseId)?.part_of_speech, row[8]);
      }
    };
    check();
    db.exec(readFileSync(new URL("../migrations/0055_hsk789_example_gloss_corrections.sql", import.meta.url), "utf8"));
    db.exec(readFileSync(new URL("../migrations/0056_hsk789_common_sense_gloss_corrections.sql", import.meta.url), "utf8"));
    db.exec(readFileSync(new URL("../migrations/0057_hsk789_example_sense_corrections.sql", import.meta.url), "utf8"));
    check();
  } finally {
    db.close();
  }
});

test("reviewed advanced examples reach word detail and Today through runtime and catalog paths", async () => {
  assert.equal(catalog.words.filter(r => r[3] === "7-9").length, 5600);
  assert.equal(Object.keys(examples).length, 3000);
  assert.deepEqual(Object.keys(examples), Object.keys(review.entries));
  for (const [id, entry] of Object.entries(examples)) {
    const row = findPublicCatalogWordById(id);
    assert.ok(row, id);
    const approved = review.entries[id];
    assert.equal(approved.status, "reviewed", id);
    assert.equal(attribution.entries[id].provider, approved.source.provider, id);
    assert.equal(attribution.entries[id].license, approved.source.license, id);
    assert.equal(attribution.entries[id].upstreamId, approved.source.upstreamId ?? null, id);
    if (approved.source.replaces) assert.deepEqual(attribution.entries[id].replaces, approved.source.replaces, id);
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
  assert.equal(progress.reviewedExamples, 3000);
  assert.equal(progress.pendingExamples, 2600);
  assert.equal(progress.fullBandReviewComplete, false);
  assert.equal(progress.pendingIds.length, 2600);
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

test("second batch distinguishes polyphones, lexical roles and unrelated character substrings", () => {
  assert.match(get(5920)[2], /销售额.*持平/);
  assert.match(get(6021)[2], /穿着很朴素/);
  assert.match(get(6073)[2], /次要问题/);
  assert.match(get(6075)[2], /一丛竹子/);
  assert.match(get(6114)[2], /^打那以后/);
  assert.match(get(6143)[2], /大为惊讶/);
  assert.match(get(6145)[3], /dàyi/);
  assert.match(get(6146)[2], /文章的大意/);
  assert.match(get(6146)[3], /dàyì/);
  assert.match(get(6160)[2], /担着两桶水/);
  assert.match(get(6173)[3], /dàn/);
  assert.match(get(6258)[2], /一条地道/);
  assert.match(get(6298)[2], /歌的调/);
  assert.match(get(6308)[2], /甲、乙、丙、丁/);
  assert.match(get(6325)[2], /定做书柜/);
  assert.match(get(6339)[2], /充满动感/);
  assert.match(get(6351)[2], /动员居民/);
  assert.match(get(6362)[3], /dūhuì/);
  assert.equal(matchedWordExample(7, "大意", "dàyì", "hsk2025.word.l7.06145.v1"), undefined);
  assert.equal(matchedWordExample(7, "大意", "dàyi", "hsk2025.word.l7.06146.v1"), undefined);
  assert.equal(matchedWordExample(7, "担", "dàn", "hsk2025.word.l7.06160.v1"), undefined);
  assert.equal(matchedWordExample(7, "都会", "dōuhuì", "hsk2025.word.l7.06362.v1"), undefined);
});

test("batches three and four reject accidental matches and preserve the intended lexical sense", () => {
  assert.match(get(6411)[2], /几只鹅/);
  assert.doesNotMatch(get(6411)[2], /企鹅/);
  assert.match(get(6454)[4], /legal entity/);
  assert.match(get(6458)[4], /rule of law/);
  assert.match(get(6568)[4], /noodles/);
  assert.match(get(6569)[4], /\bfans?\b/i);
  assert.match(get(6616)[3], /féng/);
  assert.match(get(6619)[3], /fèng/);
  assert.match(get(6690)[2], /一杆秤/);
  assert.doesNotMatch(get(6690)[2], /旗杆|钓鱼竿/);
  assert.match(get(6866)[2], /奖金.*表现挂钩/);
  assert.match(get(7019)[4], /stone/);
  assert.match(get(7208)[4], /meat and vegetarian/);
  assert.match(get(7216)[4], /served him right/);
  assert.match(get(7302)[3], /jìdu/);
  assert.match(get(7341)[2], /驾着马车/);
  const meaning = (n: number) => findPublicCatalogWordById(`hsk2025.word.l7.${String(n).padStart(5, "0")}.v1`)!.meaning;
  assert.match(meaning(6627), /perfunctorily/);
  assert.match(meaning(6682), /without exception/);
  assert.match(meaning(6849), /therefore/);
  assert.match(meaning(7063), /to bake/);
  assert.match(meaning(7100), /to trick/);
  assert.match(meaning(7157), /to neglect/);
  assert.match(meaning(7208), /non-vegetarian food/);
  assert.match(meaning(7294), /to avoid/);
});

test("phonetic review removes duplicated syllables and corrects contextual readings", () => {
  for (const n of [6494, 6499, 6617, 6634, 6691, 6758, 6766, 6783, 6793, 6824, 6920, 6961, 6992, 6994, 7044, 7053, 7324, 7355, 7390]) {
    assert.equal(review.entries[`hsk2025.word.l7.${String(n).padStart(5, "0")}.v1`].source.kind, "editorial-replacement");
  }
  assert.match(get(6474)[3], /diàopèi/);
  assert.match(get(6645)[3], /fǎngfú/);
  assert.match(get(6956)[3], /yīnggāi/);
  assert.match(get(7237)[3], /jì hǎo ānquándài/);
  assert.match(get(5682)[3], /yīqiè/);
  assert.match(get(5729)[3], /xiūxi/);
  assert.match(get(5957)[3], /Jiànghu/);
  assert.match(get(5976)[3], /línguó/);
});

test("batches five and six distinguish verbal, nominal and classifier senses", () => {
  assert.match(get(7402)[2], /见外了/);
  assert.doesNotMatch(get(7402)[2], /只见外面|听见外头/);
  assert.match(get(7424)[4], /scorched/);
  assert.match(get(7538)[2], /大的劲/);
  assert.match(get(7553)[2], /须经主管/);
  assert.match(get(7667)[3], /juān/);
  assert.match(get(7670)[3], /juàn/);
  assert.match(get(7772)[4], /air force/);
  assert.match(get(7777)[2], /两个孔/);
  assert.match(get(7985)[3], /liáng kě/);
  assert.match(get(8081)[4], /dew/);
  assert.match(get(8115)[4], /completion/);
  assert.match(get(8119)[4], /numbing/);
  assert.match(get(8120)[4], /hemp/);
  assert.match(get(8126)[4], /two yards/);
  assert.match(get(8127)[4], /stacked/);
  assert.match(get(8129)[4], /horsepower/);
  assert.match(get(8165)[4], /virtue/);
  assert.match(get(8234)[4], /privately run/);
  assert.match(get(8252)[2], /命卫兵/);
  assert.match(get(8259)[4], /mushrooms/);
  assert.match(get(8290)[4], /three acts/);
  assert.match(get(8332)[4], /memory/);
  assert.doesNotMatch(get(8332)[2], /海内存|界内存在/);
  assert.match(get(8367)[4], /bird's nest/);
  assert.match(get(8370)[3], /níng gān/);
  assert.match(get(8376)[3], /nǐng kāi/);
  assert.equal(findPublicCatalogWordById("hsk2025.word.l7.07774.v1")!.part_of_speech, "Adj");
  assert.equal(matchedWordExample(7, "圈", "juàn", "hsk2025.word.l7.07667.v1"), undefined);
  assert.equal(matchedWordExample(7, "拧", "níng", "hsk2025.word.l7.08376.v1"), undefined);
});
