import { STUDY_CHARACTERS, STUDY_WORDS, type StudyCharacter, type StudyWord } from "./catalog.ts";
import { parsePinyinSyllable } from "./p1-character-data.ts";

export { characterBrowseFacets, parsePinyinSyllable } from "./p1-character-data.ts";
export type { PinyinFacet } from "./p1-character-data.ts";

export interface CharacterBrowseQuery {
  radical?: string;
  strokes?: number;
  initial?: string;
  final?: string;
  tone?: number;
}

const browseCharacterRecords = STUDY_CHARACTERS as readonly StudyCharacter[];

export function browseCharacters(query: CharacterBrowseQuery): StudyCharacter[] {
  return browseCharacterRecords.filter((character) => {
    if (query.radical && character.radical !== query.radical) return false;
    if (query.strokes && character.strokes !== query.strokes) return false;
    if (query.initial || query.final || query.tone) {
      const matchesSound = character.pinyin.some((value) => {
        const parsed = parsePinyinSyllable(value);
        return (!query.initial || parsed.initial === query.initial)
          && (!query.final || parsed.final === query.final)
          && (!query.tone || parsed.tone === query.tone);
      });
      if (!matchesSound) return false;
    }
    return true;
  });
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\u3400-\u9fff]/g, "");
}

function editDistance(left: string, right: string) {
  const rows = Array.from({ length: left.length + 1 }, (_, index) => index);
  for (let column = 1; column <= right.length; column += 1) {
    let previous = rows[0]; rows[0] = column;
    for (let row = 1; row <= left.length; row += 1) {
      const current = rows[row];
      rows[row] = left[row - 1] === right[column - 1]
        ? previous
        : Math.min(previous + 1, rows[row] + 1, rows[row - 1] + 1);
      previous = current;
    }
  }
  return rows[left.length];
}

export function suggestDictionaryAlternatives(query: string, limit = 5): StudyWord[] {
  const needle = normalize(query);
  if (!needle) return [];
  return STUDY_WORDS.map((word) => {
    const forms = [word.hanzi, word.pinyin, word.meaning].map(normalize).filter(Boolean);
    const score = Math.min(...forms.map((form) => {
      if (form.includes(needle) || needle.includes(form)) return Math.abs(form.length - needle.length) * 0.25;
      return editDistance(needle, form) / Math.max(needle.length, form.length, 1);
    }));
    return { word, score };
  }).filter((entry) => entry.score <= 0.5)
    .sort((a, b) => a.score - b.score || a.word.hanzi.localeCompare(b.word.hanzi, "zh-Hans-CN"))
    .slice(0, Math.max(1, Math.min(limit, 10)))
    .map((entry) => entry.word);
}
