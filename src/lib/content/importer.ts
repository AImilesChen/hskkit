import {
  validateRepository,
  type AudioAsset,
  type ContentAsset,
  type ContentRelease,
  type ContentRepository,
  type HskStandard,
} from "./repository.ts";

export interface ContentImportBatch {
  standard: HskStandard;
  contentAssets: ContentAsset[];
  audioAssets: AudioAsset[];
  release: ContentRelease;
}

function nextReleaseVersion(repository: ContentRepository, standard: HskStandard): number {
  return Math.max(0, ...repository.releases.filter((release) => release.standard === standard).map((release) => release.version)) + 1;
}

function assertNextAssetVersions<T extends { id: string; logicalId: string; standard: HskStandard; version: number }>(
  existing: T[],
  incoming: T[],
  label: string,
): void {
  const incomingLineages = new Set<string>();
  for (const asset of incoming) {
    const lineage = `${asset.standard}:${asset.logicalId}`;
    if (incomingLineages.has(lineage)) {
      throw new Error(`${label} import may contain only one next version per lineage: ${asset.logicalId}`);
    }
    incomingLineages.add(lineage);
    const expected = Math.max(0, ...existing.filter((candidate) => candidate.standard === asset.standard && candidate.logicalId === asset.logicalId).map((candidate) => candidate.version)) + 1;
    if (asset.version !== expected) {
      throw new Error(`Next ${label} version for ${asset.logicalId} must be ${expected}`);
    }
  }
}

export function importBatch(repository: ContentRepository, batch: ContentImportBatch): ContentRepository {
  validateRepository(repository);
  if (batch.standard !== "hsk2" && batch.standard !== "hsk3") throw new Error("Import batch standard must be hsk2 or hsk3");
  if (batch.release.standard !== batch.standard || batch.release.status !== "draft") {
    throw new Error("Import release must be a draft for the batch standard");
  }
  for (const asset of [...batch.contentAssets, ...batch.audioAssets]) {
    if (asset.standard !== batch.standard) throw new Error(`Batch standard ${batch.standard} does not match asset ${asset.id}`);
  }

  const existingIds = new Set([
    ...repository.contentAssets.map((asset) => asset.id),
    ...repository.audioAssets.map((asset) => asset.id),
    ...repository.releases.map((release) => release.id),
  ]);
  for (const id of [
    ...batch.contentAssets.map((asset) => asset.id),
    ...batch.audioAssets.map((asset) => asset.id),
    batch.release.id,
  ]) {
    if (existingIds.has(id)) throw new Error(`Import ID already exists: ${id}`);
    existingIds.add(id);
  }

  const expectedReleaseVersion = nextReleaseVersion(repository, batch.standard);
  if (batch.release.version !== expectedReleaseVersion) {
    throw new Error(`Next release version for ${batch.standard} must be ${expectedReleaseVersion}`);
  }
  assertNextAssetVersions(repository.contentAssets, batch.contentAssets, "ContentAsset");
  assertNextAssetVersions(repository.audioAssets, batch.audioAssets, "AudioAsset");

  const next: ContentRepository = structuredClone(repository);
  next.contentAssets.push(...structuredClone(batch.contentAssets));
  next.audioAssets.push(...structuredClone(batch.audioAssets));
  next.releases.push(structuredClone(batch.release));
  validateRepository(next);
  return next;
}
