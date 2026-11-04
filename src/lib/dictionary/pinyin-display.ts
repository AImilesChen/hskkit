import syllables from "./pinyin-syllables.json" with { type: "json" };

export type PinyinSegment = { text: string; tone: 0 | 1 | 2 | 3 | 4 | null };
// Base syllables are derived from the published character index, not from guesses
// about where a tone mark happens to appear in a concatenated word.
const known = new Set(syllables);
const toneMarks: Record<string, 1 | 2 | 3 | 4> = { "\u0304": 1, "\u0301": 2, "\u030c": 3, "\u0300": 4 };
const base = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300\u0301\u0304\u030c]/g, "").normalize("NFC").replace(/ü/g, "v");

function parseSyllable(text: string): PinyinSegment | null {
  const plain = base(text);
  if (!known.has(plain) && !(plain.endsWith("r") && known.has(plain.slice(0, -1)))) return null;
  const marks = [...text.normalize("NFD")].flatMap((char) => toneMarks[char] ? [toneMarks[char]] : []);
  if (marks.length > 1) return null;
  return { text, tone: marks[0] ?? 0 };
}

function splitWord(text: string): PinyinSegment[] {
  type Result = { count: number; paths: PinyinSegment[][] };
  const memo = new Map<number, Result>();
  function solve(offset: number): Result {
    if (offset === text.length) return { count: 0, paths: [[]] };
    const existing = memo.get(offset);
    if (existing) return existing;
    let result: Result = { count: Infinity, paths: [] };
    for (let end = Math.min(offset + 7, text.length); end > offset; end--) {
      const item = parseSyllable(text.slice(offset, end));
      if (!item) continue;
      const suffix = solve(end);
      const count = 1 + suffix.count;
      if (!suffix.paths.length || count > result.count) continue;
      const paths = suffix.paths.map((path) => [item, ...path]);
      result = count < result.count ? { count, paths: paths.slice(0, 2) } : { count, paths: [...result.paths, ...paths].slice(0, 2) };
    }
    memo.set(offset, result);
    return result;
  }
  const result = solve(0);
  // When spelling admits multiple equally short readings, keep it readable and
  // uncoloured instead of assigning a misleading syllable boundary.
  return result.paths.length === 1 ? result.paths[0] : [{ text, tone: null }];
}

export function pinyinDisplaySegments(input: string): PinyinSegment[] {
  const text = input.normalize("NFC");
  const segments: PinyinSegment[] = [];
  let offset = 0;
  for (const match of text.matchAll(/[\p{Script=Latin}\p{M}]+/gu)) {
    const start = match.index!;
    if (start > offset) segments.push({ text: text.slice(offset, start), tone: null });
    segments.push(...splitWord(match[0]));
    offset = start + match[0].length;
  }
  if (offset < text.length) segments.push({ text: text.slice(offset), tone: null });
  return segments;
}
