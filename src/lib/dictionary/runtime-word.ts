import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";
import { findActiveCatalogWordById, isCatalogWordAssetId } from "../content/catalog-search.ts";
import { formalWordAudioUrlByContentId } from "../content/level-status.ts";
import { getWordBySlug, type LookupResult, type StudyWord } from "./catalog.ts";

export function splitDictionaryMeanings(meaning: string): string[] {
  const values = meaning.split(/\s*;\s*|\s*\/\s*/).map((value) => value.trim()).filter(Boolean);
  return values.length ? values : [meaning];
}

export const getPublishedWordBySlug = cache(async (slug: string): Promise<LookupResult<StudyWord>> => {
  const local = getWordBySlug(slug);
  if (local.status === "published") return local;
  if (!isCatalogWordAssetId(slug)) return local;

  const db = (await getCloudflareContext({ async: true })).env.LEARNING_DB;
  const row = await findActiveCatalogWordById(db, slug);
  if (!row) return { status: "missing" };

  const audioSrc = formalWordAudioUrlByContentId.get(row.id);
  return {
    status: "published",
    item: {
      id: row.id,
      slug: row.id,
      level: row.level_band === "7-9" ? 7 : Number(row.level_band),
      hanzi: row.hanzi,
      traditional: row.traditional || row.hanzi,
      pinyin: row.pinyin,
      meaning: row.meaning,
      partOfSpeech: row.part_of_speech,
      examples: [],
      collocations: [],
      releaseStatus: "published",
      qaStatus: "approved",
      contentVersion: Number(row.id.match(/\.v(\d+)$/)?.[1] ?? "1"),
      sourceVersion: row.release_id,
      audio: audioSrc
        ? { status: "formal", locale: "zh-CN", src: audioSrc }
        : { status: "unavailable", locale: "zh-CN" },
    },
  };
});
