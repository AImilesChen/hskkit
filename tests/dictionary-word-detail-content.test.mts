import test from "node:test";
import assert from "node:assert/strict";
import { getPublishedWordBySlug } from "../src/lib/dictionary/runtime-word.ts";
import { wordDetailContent } from "../src/lib/dictionary/word-detail-content.ts";
import { WORD_DETAIL_EDITORIAL } from "../src/lib/dictionary/word-detail-editorial.ts";
import { GRAMMAR_CURRICULUM, READING_LESSONS } from "../src/lib/learning/step7-content.ts";
import { findPublicCatalogWordById, publicCatalogReleaseId } from "../src/lib/content/public-catalog-index.ts";

async function published(slug: string) {
  const result = await getPublishedWordBySlug(slug);
  assert.equal(result.status, "published");
  if (result.status !== "published") throw new Error(slug);
  return result.item;
}

test("爱 exposes real related words and beginner-first containing words without duplicating recommendations", async () => {
  const word = await published("hsk2025.word.l1.0001.v1");
  const result = wordDetailContent(word);
  assert.deepEqual(result.examples[0], word.examples[0]);
  assert.equal(result.examples.length, 3);
  assert.equal(result.collocations.length, 3);
  assert.ok(result.related.some(item => item.hanzi === "喜欢"));
  assert.ok(result.containing[0].words.some(item => item.hanzi === "爱好"));
  const relatedIds = new Set(result.related.map(item => item.id));
  const words = result.containing.flatMap(group => group.words);
  assert.equal(new Set(words.map(item => item.id)).size, words.length);
  for (const group of result.containing) {
    assert.ok(group.words.length <= 8);
    assert.deepEqual(group.words.map(item => item.level), group.words.map(item => item.level).sort((a, b) => a - b));
    for (const item of group.words) {
      assert.ok(item.hanzi.includes(group.character));
      assert.notEqual(item.id, word.id);
      assert.ok(!relatedIds.has(item.id));
      assert.equal(findPublicCatalogWordById(item.id)?.release_id, publicCatalogReleaseId);
    }
    const query = new URL(group.href, "https://hskkit.com").searchParams;
    assert.equal(query.get("q"), group.character);
    assert.equal(query.get("level"), "all");
  }
});

test("all three editorial samples have distinct complete examples and grounded grammar links", async () => {
  for (const id of Object.keys(WORD_DETAIL_EDITORIAL)) {
    const word = await published(id);
    const content = wordDetailContent(word);
    assert.ok(content.examples.length >= 3, word.hanzi);
    assert.equal(new Set(content.examples.map(item => item.hanzi)).size, content.examples.length);
    for (const item of [...content.examples, ...content.collocations]) {
      assert.ok(item.hanzi.includes(word.hanzi));
      assert.ok(item.pinyin.trim() && item.meaning.trim());
    }
    assert.ok(content.grammar.length > 0);
    for (const item of content.grammar) {
      assert.ok(GRAMMAR_CURRICULUM.some(lesson => lesson.slug === item.slug));
      assert.ok(content.examples.some(example => example.hanzi === item.sentence));
      assert.ok(item.reason.trim());
    }
    for (const item of content.related) assert.equal(findPublicCatalogWordById(item.id)?.hanzi, item.hanzi);
  }
});

test("canonical and friendly learning URLs receive the same ID-based supplements", async () => {
  const canonical = wordDetailContent(await published("hsk2025.word.l1.0249.v1"));
  const friendly = wordDetailContent(await published("xue-xi"));
  assert.deepEqual(friendly.grammar, canonical.grammar);
  assert.equal(friendly.usage?.explanation, canonical.usage?.explanation);
  assert.ok(canonical.containing.some(group => group.character === "学"));
  assert.ok(canonical.containing.some(group => group.character === "习"));
  for (const reading of canonical.readings) {
    const source = READING_LESSONS.find(item => item.slug === reading.slug);
    assert.ok(source?.text.includes("学习"));
    assert.equal(reading.level, source.level);
  }
});

test("unconfigured words do not receive invented grammar, usage or collocations", async () => {
  const word = await published("hsk2025.word.l1.0002.v1");
  const result = wordDetailContent(word);
  assert.deepEqual(result.grammar, []);
  assert.equal(result.usage, undefined);
  assert.deepEqual(result.collocations, word.collocations);
  assert.deepEqual(result.examples, word.examples);
  // A single incidental character in a high-level passage is not a recommendation.
  const san = wordDetailContent(await published("hsk2025.word.l1.0173.v1"));
  assert.ok(!san.readings.some(item => item.slug === "evidence-and-policy-evaluation"));
});
