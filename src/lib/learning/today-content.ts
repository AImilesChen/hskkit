import runtimeIndex from "../content/runtime-content-index.json" with { type: "json" };
import type { CatalogSearchRow } from "../content/catalog-search.ts";
import { getHsk3LevelStatus } from "../content/level-status.ts";
import { getWordBySlug, listPublishedWords, type StudyWord } from "../dictionary/catalog.ts";

const planCache = new Map<number, TodayContentPlan>();
const runtimeWordAssets = Object.values(runtimeIndex.runtimeWords).flat();
type RuntimeTodayAsset = (typeof runtimeWordAssets)[number];

export interface TodayContentItem {
  assetId: string;
  contentId: string;
  contentVersion: string;
  releaseId: string;
  level: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  partOfSpeech: string;
  studySlug: string;
  example?: StudyWord["example"];
}

export type TodayContentPlan =
  | { status: "ready"; startLevel: number; levelBand: string; releaseId: string; item: TodayContentItem; practiceHref?: string; unavailableCapabilities?: Array<"context_audio" | "practice"> }
  | { status: "empty"; startLevel: number; releaseId?: string; code: "EMPTY_CONTENT_QUEUE" | "CONTEXT_AUDIO_UNAVAILABLE"; message: string; actionHref: string; actionLabel: string };

function activeLevel(level: number) {
  const status = getHsk3LevelStatus(level);
  const catalogLevel = level >= 7 ? 7 : level;
  return {
    releaseId: runtimeIndex.releaseId,
    contentAssets: runtimeIndex.dictionaryAssets.filter((asset) => asset.level === catalogLevel),
    availability: status.availability,
  };
}

function compatibleAsset(asset: RuntimeTodayAsset, words: StudyWord[]): { asset: RuntimeTodayAsset; word: StudyWord } | undefined {
  const word = words.find((candidate) => candidate.hanzi === asset.hanzi);
  return word ? { asset, word } : undefined;
}

function versionFor(asset: RuntimeTodayAsset, releaseId: string) {
  return `${releaseId}:${asset.contentVersion}`;
}

function mapItem(asset: RuntimeTodayAsset, word: StudyWord | undefined, releaseId: string): TodayContentItem {
  return {
    assetId: asset.id,
    contentId: `catalog:${asset.logicalId}`,
    contentVersion: versionFor(asset, releaseId),
    releaseId,
    level: asset.level,
    hanzi: asset.hanzi,
    pinyin: asset.pinyin,
    meaning: asset.meaning,
    partOfSpeech: asset.partOfSpeech,
    studySlug: word?.slug ?? asset.id,
    example: word?.example,
  };
}

export function selectTodayContent(startLevel: number): TodayContentPlan {
  const level = Number.isInteger(startLevel) && startLevel >= 1 && startLevel <= 9 ? startLevel : 1;
  const cached = planCache.get(level);
  if (cached) return cached;
  const result = activeLevel(level);
  let plan: TodayContentPlan;
  if (result.availability !== "ready") {
    plan = {
      status: "empty",
      startLevel: level,
      releaseId: result.releaseId,
      code: "EMPTY_CONTENT_QUEUE",
      message: `No approved Level ${level} tasks are available in the active content release. Your saved progress is unchanged.`,
      actionHref: level >= 8 ? "/vocabulary/7" : "/levels",
      actionLabel: level >= 8 ? "Open the unified HSK 7–9 advanced ability band catalog" : "Choose another available level",
    };
  } else {
    const words = listPublishedWords();
    const joined = result.contentAssets
      .map((asset) => compatibleAsset(asset, words))
      .find(Boolean)
      ?? (result.contentAssets[0] ? { asset: result.contentAssets[0], word: undefined } : undefined);
    plan = joined ? {
      status: "ready",
      startLevel: level,
      levelBand: level >= 7 ? "7-9" : String(level),
      releaseId: result.releaseId,
      item: mapItem(joined.asset, joined.word, result.releaseId),
      practiceHref: level <= 6 ? `/practice/${level}/vocabulary` : undefined,
      unavailableCapabilities: [
        ...(!joined.word?.example ? ["context_audio" as const] : []),
        ...(level > 6 ? ["practice" as const] : []),
      ],
    } : {
      status: "empty",
      startLevel: level,
      releaseId: result.releaseId,
      code: "CONTEXT_AUDIO_UNAVAILABLE",
      message: `Level ${level} content is published, but no approved context-audio task is available yet. Your saved progress is unchanged.`,
      actionHref: `/vocabulary/${level}`,
      actionLabel: `Open Level ${level} vocabulary`,
    };
  }
  planCache.set(level, plan);
  return plan;
}

export function todayContentByContentId(contentId: string): TodayContentItem | undefined {
  const logicalId = contentId.startsWith("catalog:") ? contentId.slice("catalog:".length) : undefined;
  const asset = logicalId ? runtimeWordAssets.find((candidate) => candidate.logicalId === logicalId) : undefined;
  return asset ? todayContentByAssetId(asset.id) : undefined;
}

export function todayContentByAssetId(assetId: string): TodayContentItem | undefined {
  const asset = runtimeWordAssets.find((candidate) => candidate.id === assetId);
  if (!asset) return undefined;
  const result = getWordBySlug(asset.id);
  return mapItem(asset, result.status === "published" ? result.item : undefined, runtimeIndex.releaseId);
}

export function todayContentFromCatalogRow(row: CatalogSearchRow): TodayContentItem {
  const logicalId = row.id.replace(/\.v\d+$/, "");
  return {
    assetId: row.id,
    contentId: `catalog:${logicalId}`,
    contentVersion: `${row.release_id}:${row.content_version}`,
    releaseId: row.release_id,
    level: row.level_band === "7-9" ? 7 : Number(row.level_band),
    hanzi: row.hanzi,
    pinyin: row.pinyin,
    meaning: row.meaning,
    partOfSpeech: row.part_of_speech,
    studySlug: row.id,
    example: undefined,
  };
}
