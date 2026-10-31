import publicCatalog from "./public-catalog-index.json" with { type: "json" };
import legacyHsk1 from "./legacy-hsk1-words.json" with { type: "json" };
import legacyHsk23 from "./legacy-hsk23-words.json" with { type: "json" };
import legacyHsk4 from "./legacy-hsk4-words.json" with { type: "json" };
import legacyHsk5 from "./legacy-hsk5-words.json" with { type: "json" };
import {
  CatalogQueryError,
  normalizeCatalogQuery,
  toCatalogWordResponse,
  type CatalogSearchParams,
  type CatalogSearchRow,
} from "./catalog-search.ts";

type PackedWord = [
  id: string,
  standardVersion: string,
  contentVersion: string,
  levelBand: string,
  hanzi: string,
  traditional: string,
  pinyin: string,
  meaning: string,
  partOfSpeech: string,
  searchHanzi: string,
  searchPinyin: string,
  searchEnglish: string,
];

type IndexedWord = CatalogSearchRow & {
  search_hanzi: string;
  search_pinyin: string;
  search_english: string;
  sort_level: number;
};

const packedWords = publicCatalog.words as PackedWord[];
export const publicCatalogReleaseId = publicCatalog.releaseId;
const words: IndexedWord[] = packedWords.map((packed) => ({
  id: packed[0],
  release_id: publicCatalog.releaseId,
  standard_version: packed[1],
  content_version: packed[2],
  level_band: packed[3],
  hanzi: packed[4],
  traditional: packed[5],
  pinyin: packed[6],
  meaning: packed[7],
  part_of_speech: packed[8],
  search_hanzi: packed[9],
  search_pinyin: packed[10],
  search_english: packed[11],
  sort_level: packed[3] === "7-9" ? 7 : Number(packed[3]),
}));
const wordById = new Map(words.map((word) => [word.id, word]));
// Lookup only: retired IDs remain readable in saved learning records.
// These rows are intentionally excluded from the live level list and search.
const legacyWordById = new Map([...legacyHsk1.words, ...legacyHsk23.words, ...legacyHsk4.words, ...legacyHsk5.words].map((row) => [row[0], {
  id: row[0], release_id: row[3] === "1" ? legacyHsk1.releaseId : row[3] === "4" ? legacyHsk4.releaseId : row[3] === "5" ? legacyHsk5.releaseId : legacyHsk23.releaseId, standard_version: row[1],
  content_version: row[2], level_band: row[3], hanzi: row[4], traditional: row[5],
  pinyin: row[6], meaning: row[7], part_of_speech: row[8],
}] as const));
const wordsByLevel = new Map<string, IndexedWord[]>();
const wordsByCharacter = new Map<string, IndexedWord[]>();
const suggestionCandidates = new Map<string, IndexedWord[]>();
const wordsBySearchPinyin = new Map<string, IndexedWord[]>();
const wordPositionWithinLevel = new Map<string, number>();

function appendToIndex<Key, Value>(index: Map<Key, Value[]>, key: Key, value: Value) {
  const existing = index.get(key);
  if (existing) existing.push(value);
  else index.set(key, [value]);
}

for (const word of words) {
  const levelWords = wordsByLevel.get(word.level_band);
  wordPositionWithinLevel.set(word.id, levelWords?.length ?? 0);
  appendToIndex(wordsByLevel, word.level_band, word);
  appendToIndex(wordsBySearchPinyin, word.search_pinyin, word);
  for (const character of new Set([...word.hanzi])) {
    appendToIndex(wordsByCharacter, character, word);
  }
  for (const first of new Set([word.search_pinyin[0], word.search_english[0]].filter(Boolean))) {
    appendToIndex(suggestionCandidates, first, word);
  }
}

function hasPartOfSpeech(word: IndexedWord, requested?: string) {
  if (!requested) return true;
  return word.part_of_speech.toLowerCase().split("/").includes(requested.toLowerCase());
}

function flashcardScore(word: IndexedWord, seed: number) {
  const sequence = Number(word.id.match(/\.(\d{4})\.v\d+$/)?.[1] ?? 0);
  return (Math.imul(sequence + seed, 1_103_515_245) + 12_345) & 0x7fffffff;
}

export function findPublicCatalogWordById(assetId: string): CatalogSearchRow | null {
  return wordById.get(assetId) ?? legacyWordById.get(assetId) ?? null;
}

export function findPublicCatalogWordsContainingCharacter(hanzi: string, limit = 36): CatalogSearchRow[] {
  return (wordsByCharacter.get(hanzi) ?? []).slice(0, Math.max(0, limit));
}

export function findPublicCatalogWordsByIds(assetIds: string[]): CatalogSearchRow[] {
  return [...new Set(assetIds)].flatMap((assetId) => {
    const word = wordById.get(assetId) ?? legacyWordById.get(assetId);
    return word ? [word] : [];
  });
}

export function findNextPublicCatalogWordsForToday(level: number, excludedContentIds: ReadonlySet<string>, limit: number): CatalogSearchRow[] {
  const levelBand = level >= 7 ? "7-9" : String(level);
  const result: CatalogSearchRow[] = [];
  for (const word of wordsByLevel.get(levelBand) ?? []) {
    const contentId = `catalog:${word.id.replace(/\.v\d+$/, "")}`;
    if (excludedContentIds.has(contentId)) continue;
    result.push(word);
    if (result.length >= limit) break;
  }
  return result;
}

export function searchPublicCatalogWords(params: CatalogSearchParams, formalAudioIds: readonly string[] = []) {
  const levelBand = params.level === undefined ? undefined : params.level >= 7 ? "7-9" : String(params.level);
  const source = levelBand ? wordsByLevel.get(levelBand) ?? [] : words;
  const needle = normalizeCatalogQuery(params.q);
  const formalAudioSet = params.audio === "formal" ? new Set(formalAudioIds) : null;
  let filtered = source.filter((word) => {
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
    const seed = params.seed ?? 0;
    filtered = [...filtered].sort((left, right) => flashcardScore(left, seed) - flashcardScore(right, seed) || left.id.localeCompare(right.id));
  } else if (params.sort === "pinyin") {
    filtered = [...filtered].sort((left, right) => left.pinyin.localeCompare(right.pinyin, "en", { sensitivity: "base" }) || left.id.localeCompare(right.id));
  }

  const total = filtered.length;
  const offset = (params.page - 1) * params.pageSize;
  if (params.page > 1 && (total === 0 || offset >= total)) {
    throw new CatalogQueryError("page exceeds the available result pages");
  }
  return toCatalogWordResponse({
    rows: filtered.slice(offset, offset + params.pageSize + 1),
    total,
    releaseId: publicCatalog.releaseId,
    releaseVersion: publicCatalog.releaseVersion,
    params,
    formalAudioIds,
  });
}

function boundedEditDistance(left: string, right: string): number {
  const a = left.slice(0, 120);
  const b = right.slice(0, 120);
  const row = Array.from({ length: a.length + 1 }, (_, index) => index);
  for (let column = 1; column <= b.length; column += 1) {
    let previous = row[0];
    row[0] = column;
    for (let index = 1; index <= a.length; index += 1) {
      const current = row[index];
      row[index] = a[index - 1] === b[column - 1]
        ? previous
        : Math.min(previous + 1, row[index] + 1, row[index - 1] + 1);
      previous = current;
    }
  }
  return row[a.length];
}

export function suggestPublicCatalogWords(input: {
  q: string;
  level?: number;
  partOfSpeech?: string;
  formalAudioIds?: readonly string[];
  limit?: number;
}): CatalogSearchRow[] {
  const needle = normalizeCatalogQuery(input.q.trim()).slice(0, 100);
  if (!needle) return [];
  const first = needle[0];
  const isHanQuery = /\p{Script=Han}/u.test(first);
  if (!isHanQuery && !/[a-z0-9]/.test(first)) return [];
  const prefixCandidates = isHanQuery ? wordsByCharacter.get(first) ?? [] : suggestionCandidates.get(first) ?? [];
  const directCandidates = words.filter((word) =>
    word.search_hanzi.includes(needle)
    || word.search_pinyin.includes(needle)
    || word.search_english.includes(needle),
  );
  const source = [...new Set([...directCandidates, ...prefixCandidates])];
  const levelBand = input.level === undefined ? undefined : input.level >= 7 ? "7-9" : String(input.level);
  const formalAudioSet = input.formalAudioIds ? new Set(input.formalAudioIds) : null;
  if (formalAudioSet?.size === 0) return [];
  const limit = Math.max(1, Math.min(input.limit ?? 4, 10));

  return source.filter((word) =>
    (!levelBand || word.level_band === levelBand)
    && hasPartOfSpeech(word, input.partOfSpeech)
    && (!formalAudioSet || formalAudioSet.has(word.id)),
  ).map((word) => {
    const forms = [word.hanzi, word.pinyin, word.meaning].map(normalizeCatalogQuery).filter(Boolean);
    const score = Math.min(...forms.map((form) => {
      if (form === needle) return 0;
      if (form.startsWith(needle)) return 0.05 + Math.min(Math.abs(form.length - needle.length) * 0.005, 0.2);
      if (form.includes(needle)) return 0.15 + Math.min(form.indexOf(needle) * 0.01, 0.2);
      return boundedEditDistance(needle, form) / Math.max(needle.length, Math.min(form.length, 120), 1);
    }));
    return { word, score };
  }).filter(({ score }) => score <= 0.55)
    .sort((left, right) => left.score - right.score || left.word.id.localeCompare(right.word.id))
    .slice(0, limit)
    .map(({ word }) => word);
}

export function findPublicCatalogWordLearningContext(assetId: string) {
  const current = wordById.get(assetId);
  if (!current) return null;
  const levelWords = wordsByLevel.get(current.level_band) ?? [];
  const currentIndex = wordPositionWithinLevel.get(current.id) ?? -1;
  const candidates = Array.from({ length: Math.min(8, Math.max(0, levelWords.length - 1)) }, (_, offset) =>
    levelWords[(currentIndex + offset + 1) % levelWords.length],
  );
  const toneComparisons = (wordsBySearchPinyin.get(current.search_pinyin) ?? [])
    .filter((word) => word.id !== current.id)
    .slice(0, 8);
  return { current, candidates, nextWord: candidates[0] ?? null, toneComparisons };
}
