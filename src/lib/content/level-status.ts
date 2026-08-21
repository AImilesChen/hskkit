import catalog from "./catalog.json" with { type: "json" };
import type { ContentAsset, ContentRepository } from "./repository.ts";

const repository = catalog as ContentRepository;
const activeReleaseId = repository.activeReleaseByStandard.hsk3;
const activeRelease = repository.releases.find(
  (release) => release.id === activeReleaseId && release.standard === "hsk3" && release.status === "published",
);
if (!activeRelease) throw new Error("No published active HSK 3.0 release");
const publishedRelease = activeRelease!;

const activeContentIds = new Set(publishedRelease.contentAssetIds);
const activeAudioIds = new Set(publishedRelease.audioAssetIds);
const publishedAssetsByLevel = new Map<number, ContentAsset[]>();
for (let level = 1; level <= 9; level += 1) publishedAssetsByLevel.set(level, []);
for (const asset of repository.contentAssets) {
  if (
    activeContentIds.has(asset.id)
    && asset.standard === "hsk3"
    && asset.standard_version === "GF0025-2021"
    && asset.qa_status === "approved"
    && asset.publish_status === "published"
  ) {
    publishedAssetsByLevel.get(asset.level)?.push(asset);
  }
}
const publishedAudioCountByLevel = new Map<number, number>();
for (let level = 1; level <= 9; level += 1) publishedAudioCountByLevel.set(level, 0);
for (const asset of repository.audioAssets) {
  if (activeAudioIds.has(asset.id) && asset.standard === "hsk3" && asset.qaStatus === "approved") {
    publishedAudioCountByLevel.set(asset.level, (publishedAudioCountByLevel.get(asset.level) ?? 0) + 1);
  }
}

export interface LevelPublicationStatus {
  standard: "hsk3";
  level: number;
  title: string;
  releaseId: string;
  releaseVersion: number;
  availability: "ready" | "gap";
  contentCount: number;
  audioCount: number;
  isAdvancedPath: boolean;
  message: string;
}

export function getHsk3LevelStatus(level: number): LevelPublicationStatus {
  if (!Number.isInteger(level) || level < 1 || level > 9) throw new Error("HSK 3.0 level must be between 1 and 9");
  const levelDefinition = repository.levels.find((candidate) => candidate.standard === "hsk3" && candidate.level === level);
  if (!levelDefinition) throw new Error(`No HSK 3.0 Level ${level} definition`);
  const contentCount = publishedAssetsByLevel.get(level)?.length ?? 0;
  const audioCount = publishedAudioCountByLevel.get(level) ?? 0;
  const availability = contentCount > 0 || audioCount > 0 ? "ready" : "gap";
  return {
    standard: "hsk3",
    level,
    title: levelDefinition.title,
    releaseId: publishedRelease.id,
    releaseVersion: publishedRelease.version,
    availability,
    contentCount,
    audioCount,
    isAdvancedPath: level >= 7,
    message: availability === "ready"
      ? "QA-approved study content is available in the active release."
      : "QA-approved study content is not yet available for this level.",
  };
}

export function getHsk3LevelStatuses(): LevelPublicationStatus[] {
  return Array.from({ length: 9 }, (_, index) => getHsk3LevelStatus(index + 1));
}

export function getHsk3LevelPreview(level: number, limit = 100) {
  getHsk3LevelStatus(level);
  return (publishedAssetsByLevel.get(level) ?? []).slice(0, limit).map((asset) => ({
    id: asset.id,
    hanzi: String(asset.payload.hanzi),
    pinyin: String(asset.payload.pinyin ?? ""),
    meaning: String(asset.payload.meaning ?? ""),
    partOfSpeech: String(asset.payload.partOfSpeech ?? ""),
    levelBand: asset.level_band ?? String(asset.level),
  }));
}
