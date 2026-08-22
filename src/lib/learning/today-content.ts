import catalog from "../content/catalog.json" with { type: "json" };
import { queryCatalog, type ContentAsset, type ContentRepository } from "../content/repository.ts";
import { listPublishedWords, type StudyWord } from "../dictionary/catalog.ts";

const repository = catalog as ContentRepository;

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
  example: StudyWord["example"];
}

export type TodayContentPlan =
  | { status: "ready"; startLevel: number; releaseId: string; item: TodayContentItem; practiceHref?: string }
  | { status: "empty"; startLevel: number; releaseId?: string; code: "EMPTY_CONTENT_QUEUE" | "CONTEXT_AUDIO_UNAVAILABLE"; message: string; actionHref: string; actionLabel: string };

function compatibleAsset(asset: ContentAsset, words: StudyWord[]): { asset: ContentAsset; word: StudyWord } | undefined {
  const hanzi = typeof asset.payload.hanzi === "string" ? asset.payload.hanzi : "";
  const word = words.find((candidate) => candidate.hanzi === hanzi);
  return word ? { asset, word } : undefined;
}

function versionFor(asset: ContentAsset, releaseId: string) {
  return `${releaseId}:${asset.content_version ?? `asset-v${asset.version}`}`;
}

function mapItem(asset: ContentAsset, word: StudyWord, releaseId: string): TodayContentItem {
  return {
    assetId: asset.id,
    contentId: `catalog:${asset.logicalId}`,
    contentVersion: versionFor(asset, releaseId),
    releaseId,
    level: asset.level,
    hanzi: String(asset.payload.hanzi),
    pinyin: String(asset.payload.pinyin),
    meaning: String(asset.payload.meaning),
    partOfSpeech: String(asset.payload.partOfSpeech),
    studySlug: word.slug,
    example: word.example,
  };
}

export function selectTodayContent(startLevel: number): TodayContentPlan {
  const level = Number.isInteger(startLevel) && startLevel >= 1 && startLevel <= 9 ? startLevel : 1;
  const result = queryCatalog(repository, { standard: "hsk3", level });
  if (result.availability !== "ready") {
    return {
      status: "empty",
      startLevel: level,
      releaseId: result.releaseId,
      code: "EMPTY_CONTENT_QUEUE",
      message: `No approved Level ${level} tasks are available in the active content release. Your saved progress is unchanged.`,
      actionHref: level >= 8 ? "/vocabulary/7" : "/levels",
      actionLabel: level >= 8 ? "Open the unified Levels 7–9 catalog" : "Choose another available level",
    };
  }
  const words = listPublishedWords();
  const joined = result.contentAssets
    .filter((asset) => asset.kind === "word")
    .map((asset) => compatibleAsset(asset, words))
    .find(Boolean);
  if (!joined) {
    return {
      status: "empty",
      startLevel: level,
      releaseId: result.releaseId,
      code: "CONTEXT_AUDIO_UNAVAILABLE",
      message: `Level ${level} content is published, but no approved context-audio task is available yet. Your saved progress is unchanged.`,
      actionHref: `/vocabulary/${level}`,
      actionLabel: `Open Level ${level} vocabulary`,
    };
  }
  return {
    status: "ready",
    startLevel: level,
    releaseId: result.releaseId,
    item: mapItem(joined.asset, joined.word, result.releaseId),
    practiceHref: level <= 6 ? `/practice/${level}/vocabulary` : undefined,
  };
}

export function todayContentByContentId(contentId: string): TodayContentItem | undefined {
  const logicalId = contentId.startsWith("catalog:") ? contentId.slice("catalog:".length) : undefined;
  const asset = logicalId ? repository.contentAssets.find((candidate) => candidate.logicalId === logicalId && candidate.publish_status === "published" && candidate.qa_status === "approved") : undefined;
  return asset ? todayContentByAssetId(asset.id) : undefined;
}

export function todayContentByAssetId(assetId: string): TodayContentItem | undefined {
  const asset = repository.contentAssets.find((candidate) => candidate.id === assetId && candidate.publish_status === "published" && candidate.qa_status === "approved");
  if (!asset) return undefined;
  const activeReleaseId = repository.activeReleaseByStandard.hsk3;
  const release = repository.releases.find((candidate) => candidate.id === activeReleaseId && candidate.status === "published");
  if (!release?.contentAssetIds.includes(asset.id)) return undefined;
  const word = listPublishedWords({ level: asset.level }).find((candidate) => candidate.hanzi === asset.payload.hanzi);
  return word ? mapItem(asset, word, release.id) : undefined;
}
