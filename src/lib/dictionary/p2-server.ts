import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";
import { findActiveCatalogWordsByIds, findCatalogWordLearningContext, type CatalogSearchRow } from "../content/catalog-search.ts";
import { formalWordAudioUrlByContentId } from "../content/level-status.ts";
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
    formalAudioUrl: formalWordAudioUrlByContentId.get(row.id),
  };
}

export const getDictionaryLearningContext = cache(async (assetId: string) => {
  const db = (await getCloudflareContext({ async: true })).env.LEARNING_DB;
  const context = await findCatalogWordLearningContext(db, assetId);
  if (!context) return null;
  return {
    current: catalogRowToPracticeWord(context.current),
    candidates: context.candidates.map(catalogRowToPracticeWord),
    nextWord: context.nextWord ? catalogRowToPracticeWord(context.nextWord) : null,
    toneComparisons: context.toneComparisons.map(catalogRowToPracticeWord),
  };
});

export async function getDictionaryWordsByIds(assetIds: string[]) {
  const db = (await getCloudflareContext({ async: true })).env.LEARNING_DB;
  return (await findActiveCatalogWordsByIds(db, assetIds)).map(catalogRowToPracticeWord);
}
