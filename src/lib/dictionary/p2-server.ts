import "server-only";
import { cache } from "react";
import type { CatalogSearchRow } from "../content/catalog-search.ts";
import { findPublicCatalogWordLearningContext, findPublicCatalogWordsByIds } from "../content/public-catalog-index.ts";
import { publicAudioAsset, publishedContentAudioAsset } from "../audio/assets.ts";
import type { DictionaryPracticeWord } from "./p2-learning.ts";

export function catalogRowToPracticeWord(row: CatalogSearchRow): DictionaryPracticeWord {
  return {
    assetId: row.id,
    contentId: `word:${row.id}`,
    contentVersion: `${row.release_id}:${row.content_version}`,
    level: row.level_band === "7-9" ? 7 : Number(row.level_band),
    levelBand: row.level_band,
    hanzi: row.hanzi,
    traditional: row.traditional || row.hanzi,
    pinyin: row.pinyin,
    meaning: row.meaning,
    audioAsset: publicAudioAsset(publishedContentAudioAsset(row.id, row.hanzi)),
  };
}

export const getDictionaryLearningContext = cache(async (assetId: string) => {
  const context = findPublicCatalogWordLearningContext(assetId);
  if (!context) return null;
  return {
    current: catalogRowToPracticeWord(context.current),
    candidates: context.candidates.map(catalogRowToPracticeWord),
    nextWord: context.nextWord ? catalogRowToPracticeWord(context.nextWord) : null,
    toneComparisons: context.toneComparisons.map(catalogRowToPracticeWord),
  };
});

export async function getDictionaryWordsByIds(assetIds: string[]) {
  return findPublicCatalogWordsByIds(assetIds).map(catalogRowToPracticeWord);
}
