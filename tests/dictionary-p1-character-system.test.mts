import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCharacterByHanzi, getWordBySlug } from "../src/lib/dictionary/catalog.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

test("published character records expose structure, radical explanation and common words", () => {
  const result = getCharacterByHanzi("学");
  assert.equal(result.status, "published");
  if (result.status !== "published") return;
  assert.equal(result.item.structure, "top-bottom");
  assert.match(result.item.radicalExplanation, /子/);
  assert.ok(result.item.relatedWordSlugs.includes("xue-xi"));
  assert.equal(result.item.sourceVersion, "dictionary-character-editorial-v1");
});

test("character browse supports radical, stroke, pinyin initial, final and tone facets", async () => {
  const system = await import("../src/lib/dictionary/p1-browse.ts");
  const byRadical = system.browseCharacters({ radical: "子" });
  assert.ok(byRadical.some((item) => item.hanzi === "学"));
  const byStrokes = system.browseCharacters({ strokes: 8 });
  assert.ok(byStrokes.some((item) => item.hanzi === "学"));
  const byPinyin = system.browseCharacters({ initial: "x", final: "ue", tone: 2 });
  assert.ok(byPinyin.some((item) => item.hanzi === "学"));
});

test("pinyin facet parsing handles tone marks and zero initials", async () => {
  const { parsePinyinSyllable } = await import("../src/lib/dictionary/p1-browse.ts");
  assert.deepEqual(parsePinyinSyllable("xué"), { plain: "xue", initial: "x", final: "ue", tone: 2 });
  assert.deepEqual(parsePinyinSyllable("ài"), { plain: "ai", initial: "∅", final: "ai", tone: 4 });
});

test("word editorial provides trusted collocations and more than one real example", () => {
  const result = getWordBySlug("xue-xi");
  assert.equal(result.status, "published");
  if (result.status !== "published") return;
  assert.ok(result.item.collocations.length >= 2);
  assert.ok(result.item.examples.length >= 2);
  assert.ok(result.item.collocations.every((item) => item.hanzi && item.pinyin && item.meaning));
  assert.ok(result.item.examples.every((item) => item.hanzi && item.pinyin && item.meaning));
});

test("no-result suggestions correct spelling and offer real alternatives", async () => {
  const { suggestDictionaryAlternatives } = await import("../src/lib/dictionary/p1-browse.ts");
  const suggestions = suggestDictionaryAlternatives("xuee xi", 4);
  assert.ok(suggestions.some((item) => item.hanzi === "学习"));
  assert.ok(suggestions.length <= 4);
});

test("dictionary UI exposes full character browse modes, truthfully labelled synthesized audio and whole-row results", () => {
  const page = read("src/app/dictionary/page.tsx");
  const client = read("src/app/components/dictionary-search.tsx");
  assert.match(page, /2,971 HSK characters/);
  assert.match(client, /Browse by radical/);
  assert.match(client, /Browse by stroke count/);
  assert.match(client, /Initial/);
  assert.match(client, /Final/);
  assert.match(client, /Tone/);
  assert.match(client, /Published synthesized audio only/);
  assert.doesNotMatch(client, /Quick preview/);
  assert.match(client, /data-dictionary-word-link/);
  assert.match(client, /No exact matches/);
  assert.match(client, /Did you mean|Try these words/);
  assert.match(client, /formalAudioUrl/);
  assert.match(client, /src=\{word\.formalAudioUrl\}/);
  assert.match(client, /aria-live="polite"/);
  assert.match(client, /2,971 characters/);
});

test("dictionary preserves formal-audio and character facet URL state", () => {
  const client = read("src/app/components/dictionary-search.tsx");
  for (const key of ["audio", "radical", "strokes", "structure", "initial", "final", "tone"]) {
    assert.match(client, new RegExp(`searchParams\\.get\\(\\"${key}\\"\\)`));
  }
  assert.match(client, /params\.set\("audio", "formal"\)/);
  assert.match(client, /characterFacets\.radicals\.includes\(rawRadical\)/);
  assert.match(client, /characterFacets\.tones\.some/);
});

test("catalog-wide spelling suggestions are bounded and use active catalog candidates", async () => {
  const { suggestCatalogWords } = await import("../src/lib/content/catalog-search.ts");
  const rows = [
    { id: "hsk3.word.l1.0001.v1", release_id: "release", standard_version: "3.0", content_version: "1", level_band: "1", hanzi: "学习", traditional: "學習", pinyin: "xué xí", meaning: "to study", part_of_speech: "V" },
    { id: "hsk3.word.l1.0002.v1", release_id: "release", standard_version: "3.0", content_version: "1", level_band: "1", hanzi: "西瓜", traditional: "西瓜", pinyin: "xī guā", meaning: "watermelon", part_of_speech: "N" },
  ];
  const db = {
    prepare(sql: string) {
      return {
        bind() { return this; },
        async first() { return sql.includes("catalog_search_releases") ? { id: "release", version: 1, published_at: "2026-01-01", word_count: 2 } : null; },
        async all() { return { success: true, results: rows }; },
      };
    },
  };
  const suggestions = await suggestCatalogWords(db, { q: "xuee xi", limit: 4 });
  assert.equal(suggestions[0]?.hanzi, "学习");
  assert.ok(suggestions.length <= 4);
});

test("character and word pages render P1 learning content", () => {
  const characterPage = read("src/app/character/[hanzi]/page.tsx");
  const wordPage = read("src/app/word/[slug]/page.tsx");
  assert.match(characterPage, /Same radical/);
  assert.match(characterPage, /Published words containing/);
  assert.match(characterPage, /Same pinyin/);
  assert.match(characterPage, /Structure/);
  assert.match(characterPage, /Decomposition/);
  assert.match(characterPage, /item\.structure/);
  assert.match(characterPage, /item\.decomposition/);
  assert.doesNotMatch(characterPage, /Stroke order/);
  assert.match(wordPage, /Common collocations/);
  assert.match(wordPage, /More real examples/);
});

test("Dictionary and Vocabulary Level 1–9 provide reciprocal contextual links", () => {
  const dictionaryClient = read("src/app/components/dictionary-search.tsx");
  const vocabularyPage = read("src/app/vocabulary/[level]/page.tsx");
  assert.match(dictionaryClient, /Open HSK.*vocabulary/);
  assert.match(dictionaryClient, /href=\{`\/vocabulary\/\$\{selectedLevel\}`\}/);
  assert.match(vocabularyPage, /Browse this level in Dictionary/);
  assert.match(vocabularyPage, /\/dictionary\?level=\$\{requestedLevel\}/);
});
