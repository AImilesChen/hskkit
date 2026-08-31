import characterIndexData from "./character-index.json" with { type: "json" };
import { parsePinyinSyllable } from "./p1-character-data.ts";

export interface IndexedCharacter {
  hanzi: string;
  pinyin: string[];
  meanings: string[];
  radical: string;
  radicalNumber: number;
  residualStrokes: number;
  strokes: number;
  levels: number[];
  firstLevel: number;
  wordCount: number;
  traditional?: string;
  simplified?: string;
}

export interface CharacterSearchParams {
  q?: string;
  level?: number;
  radical?: string;
  strokes?: number;
  initial?: string;
  final?: string;
  tone?: number;
  page: number;
  pageSize: number;
}

export class CharacterQueryError extends Error {}

const characters = characterIndexData.characters as IndexedCharacter[];
const byHanzi = new Map(characters.map((item) => [item.hanzi, item]));
const parsedReadings = new Map(characters.map((item) => [
  item.hanzi,
  item.pinyin.map(parsePinyinSyllable),
]));

export const characterIndexMetadata = {
  releaseId: characterIndexData.releaseId,
  characterCount: characterIndexData.characterCount,
  source: characterIndexData.source,
};

export const characterIndexFacets = (() => {
  const radicalNumbers = new Map<string, number>();
  for (const item of characters) radicalNumbers.set(item.radical, item.radicalNumber);
  const sounds = [...parsedReadings.values()].flat();
  return {
    radicals: [...radicalNumbers].sort((left, right) => left[1] - right[1]).map(([radical]) => radical),
    strokes: [...new Set(characters.map((item) => item.strokes))].sort((a, b) => a - b),
    initials: [...new Set(sounds.map((item) => item.initial))].sort(),
    finals: [...new Set(sounds.map((item) => item.final))].sort(),
    tones: [...new Set(sounds.map((item) => item.tone))].sort((a, b) => a - b),
  };
})();

function integerParam(value: string | null, fallback: number, name: string) {
  if (value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new CharacterQueryError(`${name} must be an integer`);
  return parsed;
}

export function parseCharacterSearchParams(url: URL): CharacterSearchParams {
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (q.length > 40) throw new CharacterQueryError("q must be at most 40 characters");
  const page = integerParam(url.searchParams.get("page"), 1, "page");
  if (page < 1 || page > 1000) throw new CharacterQueryError("page must be between 1 and 1000");
  const pageSize = integerParam(url.searchParams.get("pageSize"), 48, "pageSize");
  if (pageSize < 1 || pageSize > 96) throw new CharacterQueryError("pageSize must be between 1 and 96");
  const rawLevel = url.searchParams.get("level");
  const level = rawLevel ? integerParam(rawLevel, 0, "level") : undefined;
  if (level !== undefined && (level < 1 || level > 9)) throw new CharacterQueryError("level must be between 1 and 9");
  const rawStrokes = url.searchParams.get("strokes");
  const strokes = rawStrokes ? integerParam(rawStrokes, 0, "strokes") : undefined;
  if (strokes !== undefined && (strokes < 1 || strokes > 64)) throw new CharacterQueryError("strokes must be between 1 and 64");
  const rawTone = url.searchParams.get("tone");
  const tone = rawTone ? integerParam(rawTone, 0, "tone") : undefined;
  if (tone !== undefined && (tone < 1 || tone > 5)) throw new CharacterQueryError("tone must be between 1 and 5");
  const radical = url.searchParams.get("radical")?.trim() || undefined;
  const initial = url.searchParams.get("initial")?.trim() || undefined;
  const final = url.searchParams.get("final")?.trim() || undefined;
  if (radical && !characterIndexFacets.radicals.includes(radical)) throw new CharacterQueryError("radical is not available");
  if (initial && !characterIndexFacets.initials.includes(initial)) throw new CharacterQueryError("initial is not available");
  if (final && !characterIndexFacets.finals.includes(final)) throw new CharacterQueryError("final is not available");
  return { q, level, radical, strokes, initial, final, tone, page, pageSize };
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[\s'’\-]+/g, "");
}

export function searchCharacterIndex(params: CharacterSearchParams) {
  const rawQuery = (params.q ?? "").trim();
  const numericPinyin = rawQuery.match(/^([a-zA-ZüÜvV:]+)([1-5])$/);
  const needle = normalize(numericPinyin ? numericPinyin[1].replace(/[v:]/gi, "ü") : rawQuery);
  const queryTone = numericPinyin ? Number(numericPinyin[2]) : undefined;
  const filtered = characters.filter((item) => {
    if (needle && ![item.hanzi, item.traditional ?? "", item.simplified ?? "", ...item.pinyin, ...item.meanings].some((value) => normalize(value).includes(needle))) return false;
    if (queryTone && !(parsedReadings.get(item.hanzi) ?? []).some((reading) => reading.plain.includes(needle) && reading.tone === queryTone)) return false;
    if (params.level && !item.levels.includes(params.level)) return false;
    if (params.radical && item.radical !== params.radical) return false;
    if (params.strokes && item.strokes !== params.strokes) return false;
    if (params.initial || params.final || params.tone) {
      const readings = parsedReadings.get(item.hanzi) ?? [];
      if (!readings.some((reading) => (!params.initial || reading.initial === params.initial)
        && (!params.final || reading.final === params.final)
        && (!params.tone || reading.tone === params.tone))) return false;
    }
    return true;
  });
  const total = filtered.length;
  const totalPages = total ? Math.ceil(total / params.pageSize) : 0;
  const offset = (params.page - 1) * params.pageSize;
  if (params.page > 1 && offset >= total) throw new CharacterQueryError("page exceeds the available result pages");
  return {
    releaseId: characterIndexMetadata.releaseId,
    characters: filtered.slice(offset, offset + params.pageSize),
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages,
      hasPrevious: params.page > 1,
      hasNext: params.page < totalPages,
    },
  };
}

export function getIndexedCharacter(hanzi: string) {
  return byHanzi.get(hanzi);
}

export function relatedIndexedCharacters(item: IndexedCharacter) {
  const sameRadical = characters.filter((candidate) => candidate.hanzi !== item.hanzi && candidate.radical === item.radical)
    .sort((left, right) => left.firstLevel - right.firstLevel || left.strokes - right.strokes || right.wordCount - left.wordCount)
    .slice(0, 12);
  const sound = parsePinyinSyllable(item.pinyin[0]);
  const samePinyin = characters.filter((candidate) => candidate.hanzi !== item.hanzi && (parsedReadings.get(candidate.hanzi) ?? []).some((reading) => reading.plain === sound.plain))
    .sort((left, right) => left.firstLevel - right.firstLevel || right.wordCount - left.wordCount)
    .slice(0, 12);
  return { sameRadical, samePinyin };
}
