import runtimeIndex from "./runtime-content-index.json" with { type: "json" };

export interface LevelPublicationStatus {
  standard: "hsk3";
  level: number;
  title: string;
  releaseId: string;
  releaseVersion: number;
  availability: "ready" | "gap";
  contentCount: number;
  wordCount: number;
  audioCount: number;
  isAdvancedPath: boolean;
  message: string;
}

type LevelPreview = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  partOfSpeech: string;
  levelBand: string;
};

type PublishedAudioAsset = {
  contentAssetId: string;
  audioKind: string;
  qaStatus: string;
  storageKey: string;
};

const statuses = runtimeIndex.levels as LevelPublicationStatus[];
const statusByLevel = new Map(statuses.map((status) => [status.level, status]));
const previews = runtimeIndex.runtimeWords as Record<string, LevelPreview[]>;

export function getHsk3LevelStatus(level: number): LevelPublicationStatus {
  if (!Number.isInteger(level) || level < 1 || level > 9) throw new Error("HSK 3.0 level must be between 1 and 9");
  const status = statusByLevel.get(level);
  if (!status) throw new Error(`No HSK 3.0 Level ${level} definition`);
  return status;
}

export function getHsk3LevelStatuses(): LevelPublicationStatus[] {
  return statuses;
}

export function getHsk3LevelPreview(level: number, limit = 100): LevelPreview[] {
  getHsk3LevelStatus(level);
  return (previews[String(level)] ?? []).slice(0, limit);
}

export const formalAudioAssetCount = runtimeIndex.formalAudioAssetCount;
const formalWordAudioAssets = (runtimeIndex.publishedAudioAssets as PublishedAudioAsset[])
  .filter((asset) => asset.audioKind === "word" && asset.qaStatus === "approved");
export const formalWordAudioAssetIds = formalWordAudioAssets.map((asset) => asset.contentAssetId);
export const formalWordAudioUrlByContentId = new Map(formalWordAudioAssets.map((asset) => [asset.contentAssetId, `/${asset.storageKey}`]));
