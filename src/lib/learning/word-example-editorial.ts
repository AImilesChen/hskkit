import legacyHsk1 from "../data/hsk1_vocab.json" with { type: "json" };
import { HSK1_2025_NEW_EXAMPLES } from "./hsk1-2025-new-examples.ts";

export type WordExample = { hanzi: string; pinyin: string; meaning: string };

// Reuse only HSKKit's existing editorial examples when the headword and
// tone-marked reading both match the active 2025 entry. The 2025 level comes
// from the caller; this file does not import old level assignments.
const hsk1Examples = new Map<string, WordExample>(legacyHsk1
  .filter((entry) => entry.example_cn.includes(entry.chinese)
    && entry.example_pinyin.trim() && entry.example_en.trim())
  .map((entry) => [`${entry.chinese}\u0000${entry.pinyin}`, {
    hanzi: entry.example_cn,
    pinyin: entry.example_pinyin,
    meaning: entry.example_en,
  }]));

export function matchedWordExample(level: number, hanzi: string, pinyin: string, assetId?: string): WordExample | undefined {
  if (level !== 1) return undefined;
  const existing = hsk1Examples.get(`${hanzi}\u0000${pinyin}`);
  if (existing) return existing;
  const sequence = assetId?.match(/^hsk2025\.word\.l1\.(\d{4})\.v\d+$/)?.[1];
  const authored = sequence ? HSK1_2025_NEW_EXAMPLES[Number(sequence)] : undefined;
  return authored && authored[0].includes(hanzi)
    ? { hanzi: authored[0], pinyin: authored[1], meaning: authored[2] }
    : undefined;
}
