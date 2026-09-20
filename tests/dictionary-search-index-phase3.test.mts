import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import publicCatalog from "../src/lib/content/public-catalog-index.json" with { type: "json" };
import { normalizeCatalogQuery, toCatalogWordResponse, type CatalogSearchParams, type CatalogSearchRow } from "../src/lib/content/catalog-search.ts";
import {
  findPublicCatalogWordById,
  findPublicCatalogWordByLogicalId,
  findPublicCatalogWordLearningContext,
  findPublicCatalogWordsContainingCharacter,
  searchPublicCatalogWords,
  suggestPublicCatalogWords,
} from "../src/lib/content/public-catalog-index.ts";

const source = fs.readFileSync(new URL("../src/lib/content/public-catalog-index.ts", import.meta.url), "utf8");

type PackedWord = [string, string, string, string, string, string, string, string, string, string, string, string];
type LegacyWord = CatalogSearchRow & { search_hanzi: string; search_pinyin: string; search_english: string; sort_level: number };
const packedWords = publicCatalog.words as PackedWord[];

function legacyWords(): LegacyWord[] {
  return (publicCatalog.words as PackedWord[]).map((packed) => ({
    id: packed[0], release_id: publicCatalog.releaseId, standard_version: packed[1], content_version: packed[2], level_band: packed[3],
    hanzi: packed[4], traditional: packed[5], pinyin: packed[6], meaning: packed[7], part_of_speech: packed[8],
    search_hanzi: packed[9], search_pinyin: packed[10], search_english: packed[11], sort_level: packed[3] === "7-9" ? 7 : Number(packed[3]),
  }));
}

function hasPartOfSpeech(word: LegacyWord, requested?: string) {
  return !requested || word.part_of_speech.toLowerCase().split("/").includes(requested.toLowerCase());
}

function flashcardScore(word: LegacyWord, seed: number) {
  const sequence = Number(word.id.match(/\.(\d{4})\.v\d+$/)?.[1] ?? 0);
  return ((sequence + seed) * 1_103_515_245 + 12_345) & 0x7fffffff;
}

function legacySearch(params: CatalogSearchParams, formalAudioIds: readonly string[] = []) {
  const levelBand = params.level === undefined ? undefined : params.level >= 7 ? "7-9" : String(params.level);
  const needle = normalizeCatalogQuery(params.q);
  const formalAudioSet = params.audio === "formal" ? new Set(formalAudioIds) : null;
  let filtered = legacyWords().filter((word) => {
    if (levelBand && word.level_band !== levelBand) return false;
    if (!hasPartOfSpeech(word, params.partOfSpeech)) return false;
    if (formalAudioSet && !formalAudioSet.has(word.id)) return false;
    if (!needle) return true;
    const haystack = params.field === "hanzi" ? word.search_hanzi
      : params.field === "pinyin" ? word.search_pinyin
      : params.field === "english" ? word.search_english
      : `${word.search_hanzi} ${word.search_pinyin} ${word.search_english}`;
    return haystack.includes(needle);
  });
  if (params.mode === "flashcards") {
    filtered = [...filtered].sort((left, right) => flashcardScore(left, params.seed ?? 0) - flashcardScore(right, params.seed ?? 0) || left.id.localeCompare(right.id));
  } else if (params.sort === "pinyin") {
    filtered = [...filtered].sort((left, right) => left.pinyin.localeCompare(right.pinyin, "en", { sensitivity: "base" }) || left.id.localeCompare(right.id));
  }
  const offset = (params.page - 1) * params.pageSize;
  return toCatalogWordResponse({ rows: filtered.slice(offset, offset + params.pageSize + 1), total: filtered.length, releaseId: publicCatalog.releaseId, releaseVersion: publicCatalog.releaseVersion, params, formalAudioIds });
}

function boundedEditDistance(left: string, right: string): number {
  const a = left.slice(0, 120); const b = right.slice(0, 120);
  const row = Array.from({ length: a.length + 1 }, (_, index) => index);
  for (let column = 1; column <= b.length; column += 1) {
    let previous = row[0]; row[0] = column;
    for (let index = 1; index <= a.length; index += 1) {
      const current = row[index];
      row[index] = a[index - 1] === b[column - 1] ? previous : Math.min(previous + 1, row[index] + 1, row[index - 1] + 1);
      previous = current;
    }
  }
  return row[a.length];
}

function legacySuggest(input: { q: string; level?: number; partOfSpeech?: string; formalAudioIds?: readonly string[]; limit?: number }) {
  const words = legacyWords();
  const needle = normalizeCatalogQuery(input.q.trim()).slice(0, 100);
  if (!needle) return [];
  const first = needle[0];
  const isHanQuery = /\p{Script=Han}/u.test(first);
  if (!isHanQuery && !/[a-z0-9]/.test(first)) return [];
  const prefixCandidates = isHanQuery
    ? words.filter((word) => [...word.hanzi].includes(first))
    : words.filter((word) => word.search_pinyin[0] === first || word.search_english[0] === first);
  const directCandidates = words.filter((word) => word.search_hanzi.includes(needle) || word.search_pinyin.includes(needle) || word.search_english.includes(needle));
  const sourceWords = [...new Set([...directCandidates, ...prefixCandidates])];
  const levelBand = input.level === undefined ? undefined : input.level >= 7 ? "7-9" : String(input.level);
  const formalAudioSet = input.formalAudioIds ? new Set(input.formalAudioIds) : null;
  if (formalAudioSet?.size === 0) return [];
  const limit = Math.max(1, Math.min(input.limit ?? 4, 10));
  return sourceWords.filter((word) => (!levelBand || word.level_band === levelBand) && hasPartOfSpeech(word, input.partOfSpeech) && (!formalAudioSet || formalAudioSet.has(word.id)))
    .map((word) => {
      const forms = [word.hanzi, word.pinyin, word.meaning].map(normalizeCatalogQuery).filter(Boolean);
      const score = Math.min(...forms.map((form) => form === needle ? 0 : form.startsWith(needle) ? 0.05 + Math.min(Math.abs(form.length - needle.length) * 0.005, 0.2) : form.includes(needle) ? 0.15 + Math.min(form.indexOf(needle) * 0.01, 0.2) : boundedEditDistance(needle, form) / Math.max(needle.length, Math.min(form.length, 120), 1)));
      return { word, score };
    }).filter(({ score }) => score <= 0.55)
    .sort((left, right) => left.score - right.score || left.word.id.localeCompare(right.word.id))
    .slice(0, limit).map(({ word }) => word);
}

test("build artifact contains direct runtime indexes for each approved lookup dimension", () => {
  const artifact = publicCatalog as unknown as Record<string, unknown>;
  assert.equal(artifact.indexVersion, 1);
  assert.ok(artifact.levelShards && typeof artifact.levelShards === "object");
  assert.ok(artifact.searchIndexes && typeof artifact.searchIndexes === "object");
  assert.ok(artifact.characterAssociations && typeof artifact.characterAssociations === "object");
});

test("runtime consumes generated indexes without expanding every word into objects or Maps at cold start", () => {
  assert.doesNotMatch(source, /packedWords\.map\(/);
  assert.doesNotMatch(source, /new Map\(words\.map/);
  assert.doesNotMatch(source, /for \(const word of words\)/);
  assert.match(source, /artifact\.searchIndexes/);
  assert.match(source, /artifact\.levelShards/);
});

test("indexed search preserves Hanzi, pinyin, English, level, POS, paging, sorting and flashcard contracts", () => {
  const defaults = (overrides: Partial<CatalogSearchParams>): CatalogSearchParams => ({
    q: "",
    partOfSpeech: "",
    page: 1,
    pageSize: 20,
    ...overrides,
  });
  const cases: CatalogSearchParams[] = [
    defaults({ q: "爱" }),
    defaults({ q: "xue xi", field: "pinyin" }),
    defaults({ q: "learn", field: "english" }),
    defaults({ level: 1, partOfSpeech: "verb", pageSize: 10 }),
    defaults({ level: 2, page: 2, pageSize: 10, sort: "pinyin" }),
    defaults({ q: "中", level: 7, pageSize: 50 }),
    defaults({ level: 1, mode: "flashcards", seed: 90_210 }),
  ];
  for (const params of cases) {
    assert.deepEqual(searchPublicCatalogWords(params), legacySearch(params), JSON.stringify(params));
  }

  const fields = ["hanzi", "pinyin", "english"] as const;
  for (let index = 0; index < packedWords.length; index += 137) {
    const packed = packedWords[index];
    const values = [packed[9], packed[10], packed[11]];
    for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex += 1) {
      const value = values[fieldIndex];
      if (!value) continue;
      const start = Math.min(Math.max(0, Math.floor(value.length / 2) - 1), Math.max(0, value.length - 2));
      const q = value.slice(start, start + Math.min(3, value.length));
      const params = defaults({ q, field: fields[fieldIndex], pageSize: 7 });
      assert.deepEqual(searchPublicCatalogWords(params), legacySearch(params), JSON.stringify(params));
    }
  }

  for (const seed of [0, 1, 42, 99_999, 2_147_483_647]) {
    const params = defaults({ mode: "flashcards", seed, level: 7 });
    assert.deepEqual(searchPublicCatalogWords(params), legacySearch(params), JSON.stringify(params));
  }
});

test("indexed suggestions preserve exact ranking and filtering", () => {
  for (const input of [
    { q: "xue" },
    { q: "学" },
    { q: "learn", level: 1 },
    { q: "zhong", partOfSpeech: "noun" },
    { q: "notaword" },
  ]) {
    assert.deepEqual(
      suggestPublicCatalogWords(input).map((word) => word.id),
      legacySuggest(input).map((word) => word.id),
      JSON.stringify(input),
    );
  }
});

test("direct, logical, character and learning-context lookups preserve catalog ordering", () => {
  const words = legacyWords();
  for (let index = 0; index < words.length; index += 211) {
    const expected = words[index];
    assert.deepEqual(findPublicCatalogWordById(expected.id)?.id, expected.id);
    assert.deepEqual(findPublicCatalogWordByLogicalId(expected.id.replace(/\.v\d+$/, ""))?.id, expected.id);
  }

  for (const character of ["爱", "学", "中", "人"]) {
    assert.deepEqual(
      findPublicCatalogWordsContainingCharacter(character).map((word) => word.id),
      words.filter((word) => word.hanzi.includes(character)).slice(0, 36).map((word) => word.id),
    );
  }

  const expectedCurrent = words[500];
  const context = findPublicCatalogWordLearningContext(expectedCurrent.id);
  assert.equal(context?.current.id, expectedCurrent.id);
  const levelWords = words.filter((word) => word.level_band === expectedCurrent.level_band);
  const position = levelWords.findIndex((word) => word.id === expectedCurrent.id);
  const expectedCandidates = Array.from({ length: Math.min(8, levelWords.length - 1) }, (_, offset) =>
    levelWords[(position + offset + 1) % levelWords.length].id,
  );
  assert.deepEqual(context?.candidates.map((word) => word.id), expectedCandidates);
  assert.deepEqual(
    context?.toneComparisons.map((word) => word.id),
    words.filter((word) => word.id !== expectedCurrent.id && word.search_pinyin === expectedCurrent.search_pinyin).slice(0, 8).map((word) => word.id),
  );
});
