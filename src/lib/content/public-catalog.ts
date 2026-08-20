import type { CatalogResult } from "./repository.ts";

export function toPublicCatalogResponse(result: CatalogResult) {
  const contentAssets = result.contentAssets
    .filter((asset) => asset.kind === "word")
    .map((asset) => ({
      id: asset.id,
      logicalId: asset.logicalId,
      level: asset.level,
      version: asset.version,
      kind: asset.kind,
      payload: {
        hanzi: asset.payload.hanzi,
        ...(typeof asset.payload.traditional === "string" ? { traditional: asset.payload.traditional } : {}),
        ...(typeof asset.payload.pinyin === "string" ? { pinyin: asset.payload.pinyin } : {}),
        ...(typeof asset.payload.meaning === "string" ? { meaning: asset.payload.meaning } : {}),
        ...(typeof asset.payload.partOfSpeech === "string" ? { partOfSpeech: asset.payload.partOfSpeech } : {}),
      },
    }));
  const contentIds = new Set(contentAssets.map((asset) => asset.id));
  const audioAssets = result.audioAssets
    .filter((asset) => contentIds.has(asset.contentAssetId))
    .map((asset) => ({
      id: asset.id,
      logicalId: asset.logicalId,
      contentAssetId: asset.contentAssetId,
      level: asset.level,
      version: asset.version,
      locale: asset.locale,
      voice: asset.voice,
      speed: asset.speed,
      available: true,
    }));

  return {
    standard: result.standard,
    releaseId: result.releaseId,
    releaseVersion: result.releaseVersion,
    availability: contentAssets.length > 0 ? "ready" : "gap",
    level: result.level,
    contentAssets,
    audioAssets,
  };
}
