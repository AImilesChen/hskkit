import catalog from "./catalog.json" with { type: "json" };
import type { AudioAsset, ContentAsset, ContentRepository } from "./repository.ts";

const repository = catalog as ContentRepository;
const activeReleaseId = repository.activeReleaseByStandard.hsk3;
const activeRelease = repository.releases.find((release) => release.id === activeReleaseId && release.standard === "hsk3" && release.status === "published");

const activeContentIds = new Set(activeRelease?.contentAssetIds ?? []);
const activeAudioIds = new Set(activeRelease?.audioAssetIds ?? []);

export const publishedContentAssets: ContentAsset[] = repository.contentAssets.filter((asset) =>
  activeContentIds.has(asset.id)
  && asset.standard === "hsk3"
  && asset.authorization.status === "authorized"
  && asset.qaStatus === "approved"
  && asset.publish_status === "published",
);

export const publishedAudioAssets: AudioAsset[] = repository.audioAssets.filter((asset) =>
  activeAudioIds.has(asset.id)
  && asset.standard === "hsk3"
  && asset.authorization.status === "authorized"
  && asset.qaStatus === "approved"
  && asset.usageRights.streaming
  && !asset.withdrawnAt,
);

const contentByLogicalId = new Map(publishedContentAssets.map((asset) => [asset.logicalId, asset]));

export function publishedContentByLogicalId(logicalId: string): ContentAsset | undefined {
  return contentByLogicalId.get(logicalId);
}

export function isPublishedContentLogicalId(logicalId: string): boolean {
  return contentByLogicalId.has(logicalId);
}

export function publishedAudioForContent(contentAssetId: string): AudioAsset[] {
  return publishedAudioAssets.filter((asset) => asset.contentAssetId === contentAssetId);
}

export function publishedAudioByLogicalId(logicalId: string): AudioAsset | undefined {
  return publishedAudioAssets.find((asset) => asset.logicalId === logicalId);
}

export function publicAudioSrc(asset: AudioAsset): string {
  return `/${asset.storageKey}`;
}

export const activeContentRelease = {
  id: activeRelease?.id ?? "unavailable",
  version: activeRelease?.version ?? 0,
  publishedAt: activeRelease?.publishedAt,
};
