import publicCatalog from "./public-catalog-index.json" with { type: "json" };
import {
  CatalogQueryError,
  normalizeCatalogQuery,
  toCatalogWordResponse,
  type CatalogSearchField,
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

type CatalogArtifact = {
  indexVersion: number;
  releaseId: string;
  releaseVersion: number;
  words: PackedWord[];
  levelShards: Record<string, [start: number, count: number]>;
  searchIndexes: Record<"hanzi" | "pinyin" | "english", Record<string, number[]>>;
  characterAssociations: Record<string, number[]>;
};

const artifact = publicCatalog as unknown as CatalogArtifact;
const packedWords = artifact.words;
export const publicCatalogReleaseId = artifact.releaseId;
export const publicCatalogReleaseVersion = artifact.releaseVersion;

function rowAt(index: number): CatalogSearchRow {
  const packed = packedWords[index];
  return {
    id: packed[0],
    release_id: artifact.releaseId,
    standard_version: packed[1],
    content_version: packed[2],
    level_band: packed[3],
    hanzi: packed[4],
    traditional: packed[5],
    pinyin: packed[6],
    meaning: packed[7],
    part_of_speech: packed[8],
  };
}

function findPackedIndex(value: string, keyAt: (packed: PackedWord) => string): number | null {
  let low = 0;
  let high = packedWords.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    const comparison = keyAt(packedWords[middle]).localeCompare(value);
    if (comparison === 0) return middle;
    if (comparison < 0) low = middle + 1;
    else high = middle - 1;
  }
  return null;
}

function levelShard(level?: number): [start: number, count: number] {
  if (level === undefined) return [0, packedWords.length];
  return artifact.levelShards[level >= 7 ? "7-9" : String(level)] ?? [0, 0];
}

function indicesForShard(level?: number): number[] {
  const [start, count] = levelShard(level);
  return Array.from({ length: count }, (_, offset) => start + offset);
}

function hasPartOfSpeech(packed: PackedWord, requested?: string) {
  return !requested || packed[8].toLowerCase().split("/").includes(requested.toLowerCase());
}

function searchFieldValue(packed: PackedWord, field?: CatalogSearchField) {
  if (field === "hanzi") return packed[9];
  if (field === "pinyin") return packed[10];
  if (field === "english") return packed[11];
  return `${packed[9]} ${packed[10]} ${packed[11]}`;
}

function candidateIndices(needle: string, field?: CatalogSearchField): number[] {
  if (!needle) return [];
  const first = Array.from(needle)[0];
  const fields = field && field !== "all" ? [field] : ["hanzi", "pinyin", "english"] as const;
  const candidates = new Set<number>();
  for (const selectedField of fields) {
    for (const index of artifact.searchIndexes[selectedField][first] ?? []) candidates.add(index);
  }
  return [...candidates].sort((left, right) => left - right);
}

function flashcardScore(index: number, seed: number) {
  const sequence = Number(packedWords[index][0].match(/\.(\d{4})\.v\d+$/)?.[1] ?? 0);
  return ((sequence + seed) * 1_103_515_245 + 12_345) & 0x7fffffff;
}

export function findPublicCatalogWordById(assetId: string): CatalogSearchRow | null {
  const index = findPackedIndex(assetId, (packed) => packed[0]);
  return index === null ? null : rowAt(index);
}

export function findPublicCatalogWordByLogicalId(logicalId: string): CatalogSearchRow | null {
  const index = findPackedIndex(logicalId, (packed) => packed[0].replace(/\.v\d+$/, ""));
  return index === null ? null : rowAt(index);
}

export function findPublicCatalogWordsContainingCharacter(hanzi: string, limit = 36): CatalogSearchRow[] {
  return (artifact.characterAssociations[hanzi] ?? []).slice(0, Math.max(0, limit)).map(rowAt);
}

export function findPublicCatalogWordsByIds(assetIds: string[]): CatalogSearchRow[] {
  return [...new Set(assetIds)].flatMap((assetId) => {
    const index = findPackedIndex(assetId, (packed) => packed[0]);
    return index === null ? [] : [rowAt(index)];
  });
}

export function listPublicCatalogWordsForLevel(level: number): CatalogSearchRow[] {
  return indicesForShard(level).map(rowAt);
}

export function searchPublicCatalogWords(params: CatalogSearchParams, formalAudioIds: readonly string[] = []) {
  const needle = normalizeCatalogQuery(params.q);
  const searchCandidates = needle ? new Set(candidateIndices(needle, params.field)) : null;
  const formalAudioSet = params.audio === "formal" ? new Set(formalAudioIds) : null;
  const [start, count] = levelShard(params.level);
  const filtered: number[] = [];

  for (let index = start; index < start + count; index += 1) {
    const packed = packedWords[index];
    if (searchCandidates && !searchCandidates.has(index)) continue;
    if (!hasPartOfSpeech(packed, params.partOfSpeech)) continue;
    if (formalAudioSet && !formalAudioSet.has(packed[0])) continue;
    if (needle && !searchFieldValue(packed, params.field).includes(needle)) continue;
    filtered.push(index);
  }

  if (params.mode === "flashcards") {
    const seed = params.seed ?? 0;
    filtered.sort((left, right) => flashcardScore(left, seed) - flashcardScore(right, seed) || packedWords[left][0].localeCompare(packedWords[right][0]));
  } else if (params.sort === "pinyin") {
    filtered.sort((left, right) => packedWords[left][6].localeCompare(packedWords[right][6], "en", { sensitivity: "base" }) || packedWords[left][0].localeCompare(packedWords[right][0]));
  }

  const total = filtered.length;
  const offset = (params.page - 1) * params.pageSize;
  if (params.page > 1 && (total === 0 || offset >= total)) {
    throw new CatalogQueryError("page exceeds the available result pages");
  }
  return toCatalogWordResponse({
    rows: filtered.slice(offset, offset + params.pageSize + 1).map(rowAt),
    total,
    releaseId: artifact.releaseId,
    releaseVersion: artifact.releaseVersion,
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
  const first = Array.from(needle)[0];
  const isHanQuery = /\p{Script=Han}/u.test(first);
  if (!isHanQuery && !/[a-z0-9]/.test(first)) return [];

  const directIndices = candidateIndices(needle).filter((index) => searchFieldValue(packedWords[index]).includes(needle));
  const prefixPool = isHanQuery
    ? artifact.characterAssociations[first] ?? []
    : candidateIndices(first, "pinyin").concat(candidateIndices(first, "english"));
  const prefixIndices = [...new Set(prefixPool)].sort((left, right) => left - right).filter((index) => {
    if (isHanQuery) return true;
    const packed = packedWords[index];
    return packed[10][0] === first || packed[11][0] === first;
  });
  const source = [...new Set([...directIndices, ...prefixIndices])];
  const levelBand = input.level === undefined ? undefined : input.level >= 7 ? "7-9" : String(input.level);
  const formalAudioSet = input.formalAudioIds ? new Set(input.formalAudioIds) : null;
  if (formalAudioSet?.size === 0) return [];
  const limit = Math.max(1, Math.min(input.limit ?? 4, 10));

  return source.filter((index) => {
    const packed = packedWords[index];
    return (!levelBand || packed[3] === levelBand)
      && hasPartOfSpeech(packed, input.partOfSpeech)
      && (!formalAudioSet || formalAudioSet.has(packed[0]));
  }).map((index) => {
    const word = rowAt(index);
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
  const currentIndex = findPackedIndex(assetId, (packed) => packed[0]);
  if (currentIndex === null) return null;
  const current = rowAt(currentIndex);
  const levelIndices = indicesForShard(current.level_band === "7-9" ? 7 : Number(current.level_band));
  const position = levelIndices.indexOf(currentIndex);
  const candidates = Array.from({ length: Math.min(8, Math.max(0, levelIndices.length - 1)) }, (_, offset) =>
    rowAt(levelIndices[(position + offset + 1) % levelIndices.length]),
  );
  const first = Array.from(packedWords[currentIndex][10])[0];
  const toneComparisons = (artifact.searchIndexes.pinyin[first] ?? [])
    .filter((index) => index !== currentIndex && packedWords[index][10] === packedWords[currentIndex][10])
    .slice(0, 8)
    .map(rowAt);
  return { current, candidates, nextWord: candidates[0] ?? null, toneComparisons };
}
