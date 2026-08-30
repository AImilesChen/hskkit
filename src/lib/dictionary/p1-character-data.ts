export type CharacterStructure = "left-right" | "top-bottom" | "enclosure" | "single-component" | "three-part";

export interface P1CharacterRecord {
  hanzi: string;
  pinyin: string[];
  meanings: string[];
  radical: string;
  radicalExplanation: string;
  structure: CharacterStructure;
  strokes: number;
  relatedWordSlugs: string[];
  editorialVersion: string;
}

export interface PinyinFacet {
  plain: string;
  initial: string;
  final: string;
  tone: number;
}

export const P1_CHARACTER_RECORDS: readonly P1CharacterRecord[] = [
  { hanzi: "学", pinyin: ["xué"], meanings: ["to study; to learn"], radical: "子", radicalExplanation: "子 means child. In 学 it points to learning and education.", structure: "top-bottom", strokes: 8, relatedWordSlugs: ["xue-xi"], editorialVersion: "dictionary-character-editorial-v1" },
  { hanzi: "习", pinyin: ["xí"], meanings: ["to practise; habit"], radical: "乙", radicalExplanation: "乙 is the indexing radical used for 习 in modern dictionaries.", structure: "single-component", strokes: 3, relatedWordSlugs: ["xue-xi", "xi-guan"], editorialVersion: "dictionary-character-editorial-v1" },
  { hanzi: "买", pinyin: ["mǎi"], meanings: ["to buy"], radical: "乙", radicalExplanation: "乙 is the indexing radical used to locate 买 in a radical dictionary.", structure: "single-component", strokes: 6, relatedWordSlugs: ["mai"], editorialVersion: "dictionary-character-editorial-v1" },
] as const;

const toneMarks: Record<string, [string, number]> = {
  ā: ["a", 1], á: ["a", 2], ǎ: ["a", 3], à: ["a", 4],
  ē: ["e", 1], é: ["e", 2], ě: ["e", 3], è: ["e", 4],
  ī: ["i", 1], í: ["i", 2], ǐ: ["i", 3], ì: ["i", 4],
  ō: ["o", 1], ó: ["o", 2], ǒ: ["o", 3], ò: ["o", 4],
  ū: ["u", 1], ú: ["u", 2], ǔ: ["u", 3], ù: ["u", 4],
  ǖ: ["v", 1], ǘ: ["v", 2], ǚ: ["v", 3], ǜ: ["v", 4], ü: ["v", 5],
};
const initials = ["zh", "ch", "sh", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "r", "z", "c", "s", "y", "w"];

export function parsePinyinSyllable(value: string): PinyinFacet {
  let tone = 5;
  let plain = "";
  for (const character of value.toLowerCase()) {
    const marked = toneMarks[character];
    if (marked) { plain += marked[0]; tone = marked[1]; }
    else if (/[a-z]/.test(character)) plain += character;
  }
  const initial = initials.find((candidate) => plain.startsWith(candidate)) ?? "∅";
  return { plain, initial, final: initial === "∅" ? plain : plain.slice(initial.length), tone };
}

export const characterBrowseFacets = (() => {
  const parsed = P1_CHARACTER_RECORDS.flatMap((character) => character.pinyin.map(parsePinyinSyllable));
  return {
    radicals: [...new Set(P1_CHARACTER_RECORDS.map((character) => character.radical))].sort(),
    strokes: [...new Set(P1_CHARACTER_RECORDS.map((character) => character.strokes))].sort((a, b) => a - b),
    initials: [...new Set(parsed.map((item) => item.initial))].sort(),
    finals: [...new Set(parsed.map((item) => item.final))].sort(),
    tones: [...new Set(parsed.map((item) => item.tone))].sort(),
  };
})();
