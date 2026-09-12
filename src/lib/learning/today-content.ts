import { getHsk3LevelStatus, formalWordAudioUrlByContentId } from "../content/level-status.ts";
import runtimeIndex from "../content/runtime-content-index.json" with { type: "json" };
import type { CatalogSearchRow } from "../content/catalog-search.ts";
import { findPublicCatalogWordByLogicalId, listPublicCatalogWordsForLevel } from "../content/public-catalog-index.ts";
import { listPublishedWords, type StudyWord } from "../dictionary/catalog.ts";
import type { LearningState } from "./domain.ts";

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
  releaseStatus: "published";
  example?: { hanzi: string; pinyin: string; meaning: string };
  audioSrc?: string;
  sourceReleaseId: string;
  todayStatus?: "new" | "continue";
  selectionReason?: string;
}

export type TodayContentPlan =
  | { status: "ready"; startLevel: number; levelBand: string; releaseId: string; requestedCount: number; availableCount: number; item: TodayContentItem; items: TodayContentItem[]; practiceHref?: string; unavailableCapabilities?: Array<"context_audio" | "practice"> }
  | { status: "empty"; startLevel: number; releaseId?: string; requestedCount?: number; availableCount?: number; code: "EMPTY_CONTENT_QUEUE" | "CONTEXT_AUDIO_UNAVAILABLE" | "LEVEL_COMPLETE"; message: string; actionHref: string; actionLabel: string };

export interface TodaySelectionOptions {
  ownerId?: string;
  localDay?: string;
  completedContentIds?: readonly string[];
  recentNewContentIds?: readonly string[];
  excludedCurrentPlanContentIds?: readonly string[];
  fixedTodayContentIds?: readonly string[];
  continueContentIds?: readonly string[];
  refreshCount?: number;
  progressWindowSize?: number;
}

type RuntimeWord = {
  id: string;
  logicalId: string;
  version: number;
  contentVersion: string;
  level: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  partOfSpeech: string;
  audioSrc?: string;
};

const runtimeWords = runtimeIndex.runtimeWords as Record<string, RuntimeWord[]>;
const releaseId = runtimeIndex.releaseId;
const contentIdFor = (asset: RuntimeWord) => `catalog:${asset.logicalId}`;

function completePublishedAsset(asset: RuntimeWord) {
  return Boolean(
    asset.id
    && asset.logicalId
    && asset.contentVersion
    && Number.isInteger(asset.level)
    && asset.hanzi.trim()
    && asset.pinyin.trim()
    && asset.meaning.trim()
    && asset.partOfSpeech.trim(),
  );
}

function mapItem(asset: RuntimeWord, word?: StudyWord): TodayContentItem {
  const audioSrc = formalWordAudioUrlByContentId.get(asset.id) ?? (word?.audio.status === "formal" ? word.audio.src : undefined) ?? asset.audioSrc;
  return {
    assetId: asset.id,
    contentId: contentIdFor(asset),
    contentVersion: `${releaseId}:${asset.contentVersion}`,
    releaseId,
    level: asset.level,
    hanzi: asset.hanzi,
    pinyin: asset.pinyin,
    meaning: asset.meaning,
    partOfSpeech: asset.partOfSpeech,
    studySlug: word?.slug ?? asset.id,
    releaseStatus: "published",
    example: word?.example,
    audioSrc,
    sourceReleaseId: releaseId,
  };
}

export function listTodayContent(level: number): TodayContentItem[] {
  const status = getHsk3LevelStatus(level);
  if (status.availability !== "ready") return [];
  return listPublicCatalogWordsForLevel(level)
    .map((row) => todayContentFromCatalogRow(row, level))
    .filter((item) => Boolean(
      item.assetId
      && item.contentId
      && item.contentVersion
      && item.hanzi.trim()
      && item.pinyin.trim()
      && item.meaning.trim()
      && item.partOfSpeech.trim(),
    ));
}

function listLegacyTodayContent(level: number): TodayContentItem[] {
  const status = getHsk3LevelStatus(level);
  if (status.availability !== "ready") return [];
  const catalogLevel = level >= 7 ? 7 : level;
  const assets = (runtimeIndex.dictionaryAssets as RuntimeWord[]).filter((asset) => asset.level === catalogLevel && completePublishedAsset(asset));
  const words = listPublishedWords();
  const joined = assets
    .map((asset) => ({ asset, word: words.find((word) => word.id === asset.id || word.hanzi === asset.hanzi) }))
    .filter((value): value is { asset: RuntimeWord; word: StudyWord } => Boolean(value.word))
    .map(({ asset, word }) => mapItem(asset, word));
  return joined.length ? joined : assets.slice(0, 1).map((asset) => mapItem(asset));
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rank(items: TodayContentItem[], seed: string) {
  return [...items].sort((left, right) => stableHash(`${seed}:${left.contentId}`) - stableHash(`${seed}:${right.contentId}`) || left.contentId.localeCompare(right.contentId));
}

function mixedSelection(items: TodayContentItem[], count: number, seed: string) {
  const ranked = rank(items, seed);
  const selected: TodayContentItem[] = [];
  const usedParts = new Set<string>();
  for (const item of ranked) {
    const part = item.partOfSpeech.split(/[\/,+]/)[0].trim().toLowerCase();
    if (usedParts.has(part)) continue;
    selected.push(item);
    usedParts.add(part);
    if (selected.length === count) return selected;
  }
  for (const item of ranked) {
    if (selected.some((candidate) => candidate.contentId === item.contentId)) continue;
    selected.push(item);
    if (selected.length === count) break;
  }
  return selected;
}

function daysBefore(localDay: string, days: number) {
  const date = new Date(`${localDay}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export function todayPlanLevel(state: LearningState, ownerId: string, localDay: string, fallbackLevel: number) {
  return state.dailySessions.find((session) => session.ownerId === ownerId && session.localDay === localDay)?.startLevel ?? fallbackLevel;
}

export function todaySelectionContext(state: LearningState, ownerId: string, localDay: string): TodaySelectionOptions {
  const sessions = state.dailySessions.filter((session) => session.ownerId === ownerId);
  const today = sessions.find((session) => session.localDay === localDay);
  const completedContentIds = [...new Set([
    ...sessions.flatMap((session) => session.items
      .filter((item) => item.kind === "learn" && item.status === "completed")
      .map((item) => item.contentId)),
    ...state.cards
      .filter((card) => card.dimension === "reading" && card.contentId.startsWith("catalog:"))
      .map((card) => card.contentId),
  ])];
  const cutoff = daysBefore(localDay, 14);
  const recentNewContentIds = [...new Set(sessions
    .filter((session) => session.localDay >= cutoff && session.localDay < localDay)
    .flatMap((session) => session.items
      .filter((item) => item.kind === "learn" && item.todayStatus !== "continue")
      .map((item) => item.contentId)))];
  const latestStarted = sessions
    .filter((session) => session.localDay < localDay)
    .sort((left, right) => right.localDay.localeCompare(left.localDay))
    .flatMap((session) => session.items
      .filter((item) => item.kind === "learn" && item.status === "pending" && Boolean(item.startedAt))
      .sort((left, right) => (right.startedAt ?? "").localeCompare(left.startedAt ?? "")))
    .find((item) => !completedContentIds.includes(item.contentId));
  return {
    ownerId,
    localDay,
    completedContentIds,
    recentNewContentIds,
    fixedTodayContentIds: today?.items.filter((item) => item.kind === "learn").map((item) => item.contentId),
    continueContentIds: latestStarted ? [latestStarted.contentId] : [],
    refreshCount: today?.wordRefreshesUsed ?? 0,
  };
}

export function selectTodayContent(level: number, requestedCount = 1, options?: TodaySelectionOptions): TodayContentPlan {
  const selection = options ?? {};
  const status = getHsk3LevelStatus(level);
  const count = Math.max(1, Math.min(5, Math.trunc(requestedCount)));
  if (status.availability !== "ready") {
    return { status: "empty", startLevel: level, releaseId, requestedCount: count, availableCount: 0, code: "EMPTY_CONTENT_QUEUE", message: `HSK ${level} learning content is not published yet.`, actionHref: `/hsk-${level}`, actionLabel: `View HSK ${level} status` };
  }

  const all = options ? listTodayContent(level) : listLegacyTodayContent(level);
  const byContentId = new Map(all.map((item) => [item.contentId, item]));
  const fixed = (selection.fixedTodayContentIds ?? []).flatMap((contentId) => {
    const item = byContentId.get(contentId);
    return item ? [{ ...item, todayStatus: "new" as const, selectionReason: "Saved in today's plan." }] : [];
  });
  if (fixed.length >= count) {
    const items = fixed.slice(0, count);
    return { status: "ready", startLevel: level, levelBand: level >= 7 ? "7-9" : String(level), releaseId, requestedCount: count, availableCount: all.length, item: items[0], items, practiceHref: level <= 6 ? `/practice/${level}/vocabulary` : undefined };
  }

  const completed = new Set(selection.completedContentIds ?? []);
  const recent = new Set(selection.recentNewContentIds ?? []);
  const excludedToday = new Set(selection.excludedCurrentPlanContentIds ?? []);
  const continuing = (selection.continueContentIds ?? []).flatMap((contentId) => {
    const item = byContentId.get(contentId);
    return item && !completed.has(contentId) && !fixed.some((fixedItem) => fixedItem.contentId === contentId)
      ? [{ ...item, todayStatus: "continue" as const, selectionReason: "Continue · you started this word earlier." }]
      : [];
  }).slice(0, 1);
  const reserved = new Set([...fixed, ...continuing].map((item) => item.contentId));

  const lastCompletedIndex = all.reduce((cursor, item, index) => completed.has(item.contentId) ? Math.max(cursor, index) : cursor, -1);
  const progressWindowSize = Math.max(count, selection.progressWindowSize ?? 30);
  const eligible = all.filter((item) => !completed.has(item.contentId) && !recent.has(item.contentId) && !excludedToday.has(item.contentId) && !reserved.has(item.contentId));
  const afterCursor = eligible.filter((item) => all.indexOf(item) > lastCompletedIndex);
  const beforeCursor = eligible.filter((item) => all.indexOf(item) <= lastCompletedIndex);
  const progressWindow = [...afterCursor, ...beforeCursor].slice(0, progressWindowSize);
  const remainingCount = Math.max(0, count - fixed.length - continuing.length);
  const seed = `${selection.ownerId ?? "guest"}:${selection.localDay ?? "today"}:${releaseId}:hsk-${level}:refresh-${selection.refreshCount ?? 0}:progressWindowSize-${progressWindowSize}`;
  const selectedNew = mixedSelection(progressWindow, remainingCount, seed).map((item) => ({
    ...item,
    todayStatus: "new" as const,
    selectionReason: `New · selected near your current HSK ${level} progress.`,
  }));
  const items = [...fixed, ...continuing, ...selectedNew].slice(0, count);
  if (!items.length) {
    const levelComplete = all.length > 0 && all.every((item) => completed.has(item.contentId));
    return {
      status: "empty",
      startLevel: level,
      releaseId,
      requestedCount: count,
      availableCount: 0,
      code: levelComplete ? "LEVEL_COMPLETE" : "EMPTY_CONTENT_QUEUE",
      message: levelComplete
        ? `You’ve learned every published word for HSK ${level}. Review is ready while the next level stays your choice.`
        : "No new words are available today. Review learned words or return tomorrow.",
      actionHref: `/hsk-${level}`,
      actionLabel: `Review HSK ${level}`,
    };
  }
  return {
    status: "ready",
    startLevel: level,
    levelBand: level >= 7 ? "7-9" : String(level),
    releaseId,
    requestedCount: count,
    availableCount: eligible.length + continuing.length,
    item: items[0],
    items,
    practiceHref: level <= 6 ? `/practice/${level}/vocabulary` : undefined,
    unavailableCapabilities: [
      ...(items.some((item) => !item.example) ? ["context_audio" as const] : []),
      ...(level > 6 ? ["practice" as const] : []),
    ],
  };
}

export function todayContentByAssetId(assetId: string): TodayContentItem | undefined {
  const asset = [...Object.values(runtimeWords).flat(), ...(runtimeIndex.dictionaryAssets as RuntimeWord[])]
    .find((candidate) => candidate.id === assetId);
  if (!asset) return undefined;
  const word = listPublishedWords().find((candidate) => candidate.id === asset.id || candidate.hanzi === asset.hanzi);
  return mapItem(asset, word);
}

export function todayContentByContentId(contentId: string): TodayContentItem | undefined {
  const logicalId = contentId.startsWith("catalog:") ? contentId.slice("catalog:".length) : "";
  const asset = [...Object.values(runtimeWords).flat(), ...(runtimeIndex.dictionaryAssets as RuntimeWord[])]
    .find((candidate) => candidate.logicalId === logicalId);
  if (asset) return todayContentByAssetId(asset.id);
  const publicWord = findPublicCatalogWordByLogicalId(logicalId);
  return publicWord ? todayContentFromCatalogRow(publicWord) : undefined;
}

export function todayContentFromCatalogRow(row: CatalogSearchRow, selectedLevel?: number): TodayContentItem {
  const logicalId = row.id.replace(/\.v\d+$/, "");
  return {
    assetId: row.id,
    contentId: `catalog:${logicalId}`,
    contentVersion: `${row.release_id}:${row.content_version}`,
    releaseId: row.release_id,
    level: selectedLevel ?? (row.level_band === "7-9" ? 7 : Number(row.level_band)),
    hanzi: row.hanzi,
    pinyin: row.pinyin,
    meaning: row.meaning,
    partOfSpeech: row.part_of_speech,
    studySlug: row.id,
    releaseStatus: "published",
    audioSrc: formalWordAudioUrlByContentId.get(row.id),
    sourceReleaseId: row.release_id,
  };
}
