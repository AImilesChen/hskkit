import catalog from "./catalog.json" with { type: "json" };
import {
  queryCatalog,
  type ContentRepository,
} from "./repository.ts";

const repository = catalog as ContentRepository;

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
  const result = queryCatalog(repository, { standard: "hsk3", level });
  const availability = result.availability;
  return {
    standard: "hsk3",
    level,
    title: result.level.title,
    releaseId: result.releaseId,
    releaseVersion: result.releaseVersion,
    availability,
    contentCount: result.contentAssets.length,
    audioCount: result.audioAssets.length,
    isAdvancedPath: level >= 7,
    message: availability === "ready"
      ? "QA-approved study content is available in the active release."
      : "QA-approved study content is not yet available for this level.",
  };
}

export function getHsk3LevelStatuses(): LevelPublicationStatus[] {
  return Array.from({ length: 9 }, (_, index) => getHsk3LevelStatus(index + 1));
}
