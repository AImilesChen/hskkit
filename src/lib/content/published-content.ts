import runtimeIndex from "./runtime-content-index.json" with { type: "json" };
import type { AudioAsset, ContentRelease } from "./repository.ts";

export const publishedAudioAssets = runtimeIndex.publishedAudioAssets as AudioAsset[];
const audioByLogicalId = new Map(publishedAudioAssets.map((asset) => [asset.logicalId, asset]));

export function publishedAudioForContent(contentAssetId: string): AudioAsset[] {
  return publishedAudioAssets.filter((asset) => asset.contentAssetId === contentAssetId);
}

export function publishedAudioByLogicalId(logicalId: string): AudioAsset | undefined {
  return audioByLogicalId.get(logicalId);
}

export function publicAudioSrc(asset: AudioAsset): string {
  return `/${asset.storageKey}`;
}

export const activeContentRelease = {
  id: runtimeIndex.releaseId,
  standard: "hsk3",
  version: runtimeIndex.releaseVersion,
  status: "published",
  contentAssetIds: [],
  audioAssetIds: publishedAudioAssets.map((asset) => asset.id),
  publishedAt: runtimeIndex.releasePublishedAt,
} as ContentRelease;
