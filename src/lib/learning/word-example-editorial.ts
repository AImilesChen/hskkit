import legacyHsk1 from "../data/hsk1_vocab.json" with { type: "json" };
import { HSK1_2025_NEW_EXAMPLES } from "./hsk1-2025-new-examples.ts";
import hsk23Examples from "./hsk23-2025-examples.json" with { type: "json" };
import hsk4Examples from "./hsk4-2025-examples.json" with { type: "json" };
import hsk5Examples from "./hsk5-2025-examples.json" with { type: "json" };
import hsk6Examples from "./hsk6-2025-examples.json" with { type: "json" };

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
  if (level === 4 || level === 5 || level === 6) {
    const examples = level === 4 ? hsk4Examples : level === 5 ? hsk5Examples : hsk6Examples;
    const entry = assetId ? (examples as Record<string, string[]>)[assetId] : undefined;
    return entry?.length === 5 && entry[0] === hanzi && entry[1] === pinyin
      ? { hanzi: entry[2], pinyin: entry[3], meaning: entry[4] }
      : undefined;
  }
  if (level === 2 || level === 3) {
    if (!assetId?.startsWith(`hsk2025.word.l${level}.`)) return undefined;
    const example = (hsk23Examples as Record<string, string[]>)[assetId];
    return example?.length === 3 && example[0].includes(hanzi)
      ? { hanzi: example[0], pinyin: example[1], meaning: example[2] }
      : undefined;
  }
  if (level !== 1) return undefined;
  const existing = hsk1Examples.get(`${hanzi}\u0000${pinyin}`);
  if (existing) return existing;
  const sequence = assetId?.match(/^hsk2025\.word\.l1\.(\d{4})\.v\d+$/)?.[1];
  const authored = sequence ? HSK1_2025_NEW_EXAMPLES[Number(sequence)] : undefined;
  return authored && authored[0].includes(hanzi)
    ? { hanzi: authored[0], pinyin: authored[1], meaning: authored[2] }
    : undefined;
}
