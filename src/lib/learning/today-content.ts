import { getHsk3LevelStatus, formalWordAudioUrlByContentId } from "../content/level-status.ts";
import runtimeIndex from "../content/runtime-content-index.json" with { type: "json" };
import type { CatalogSearchRow } from "../content/catalog-search.ts";
import { findPublicCatalogWordById, findPublicCatalogWordByLogicalId, listPublicCatalogWordsForLevel } from "../content/public-catalog-index.ts";
import { listPublishedWords, type StudyWord } from "../dictionary/catalog.ts";
import { learningTopics } from "../topics/catalog.ts";
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
  lastNewLocalDayByContentId?: Readonly<Record<string, string>>;
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

const topicCategoryByAssetId = new Map<string, string>();
for (const topic of learningTopics) {
  if (topic.status !== "published" || topic.sourceReleaseId !== releaseId) continue;
  for (const assetId of topic.wordAssetIds) {
    if (!topicCategoryByAssetId.has(assetId)) topicCategoryByAssetId.set(assetId, topic.categoryId);
  }
}

function primaryPartOfSpeech(item: TodayContentItem) {
  return item.partOfSpeech.split(/[\/,+]/)[0].trim().toLowerCase();
}

function dayDistance(fromDay: string, toDay: string) {
  const from = Date.parse(`${fromDay}T00:00:00.000Z`);
  const to = Date.parse(`${toDay}T00:00:00.000Z`);
  return Number.isFinite(from) && Number.isFinite(to) ? Math.max(0, Math.round((to - from) / 86_400_000)) : 0;
}

function weightedSelection(items: TodayContentItem[], count: number, seed: string, localDay: string, lastShown: Readonly<Record<string, string>>) {
  const remaining = [...items];
  const selected: Array<{ item: TodayContentItem; balancedTopic: boolean; balancedPart: boolean }> = [];
  const usedParts = new Set<string>();
  const usedTopics = new Set<string>();
  const windowDenominator = Math.max(1, items.length - 1);

  while (remaining.length && selected.length < count) {
    const ranked = remaining.map((item) => {
      const sequenceIndex = items.findIndex((candidate) => candidate.contentId === item.contentId);
      const proximity = 1 - sequenceIndex / windowDenominator;
      const seededVariation = stableHash(`${seed}:${item.contentId}`) / 0xffffffff;
      const sequenceSignal = proximity * 0.8 + seededVariation * 0.2;
      const priorDay = lastShown[item.contentId];
      const recencySignal = priorDay ? Math.min(1, dayDistance(priorDay, localDay) / 90) : 1;
      const topic = topicCategoryByAssetId.get(item.assetId);
      const topicSignal = topic ? (usedTopics.size === 0 ? 0.5 : usedTopics.has(topic) ? 0 : 1) : 0;
      const part = primaryPartOfSpeech(item);
      const partSignal = usedParts.size === 0 ? 0.5 : usedParts.has(part) ? 0 : 1;
      return {
        item,
        topic,
        part,
        balancedTopic: Boolean(topic && usedTopics.size > 0 && !usedTopics.has(topic)),
        balancedPart: Boolean(usedParts.size > 0 && !usedParts.has(part)),
        score: sequenceSignal * 0.5 + recencySignal * 0.2 + topicSignal * 0.15 + partSignal * 0.15,
      };
    }).sort((left, right) => right.score - left.score || stableHash(`${seed}:tie:${left.item.contentId}`) - stableHash(`${seed}:tie:${right.item.contentId}`));
    const choice = ranked[0];
    selected.push({ item: choice.item, balancedTopic: choice.balancedTopic, balancedPart: choice.balancedPart });
    usedParts.add(choice.part);
    if (choice.topic) usedTopics.add(choice.topic);
    remaining.splice(remaining.findIndex((item) => item.contentId === choice.item.contentId), 1);
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
  const lastNewLocalDayByContentId = Object.fromEntries(sessions
    .filter((session) => session.localDay < localDay)
    .sort((left, right) => left.localDay.localeCompare(right.localDay))
    .flatMap((session) => session.items
      .filter((item) => item.kind === "learn" && item.todayStatus !== "continue")
      .map((item) => [item.contentId, session.localDay] as const)));
  const latestStarted = sessions
    .filter((session) => session.localDay === daysBefore(localDay, 1))
    .flatMap((session) => session.items
      .filter((item) => item.kind === "learn" && item.status !== "completed" && Boolean(item.startedAt) && item.todayStatus !== "continue")
      .sort((left, right) => (right.startedAt ?? "").localeCompare(left.startedAt ?? "")))
    .find((item) => !completedContentIds.includes(item.contentId));
  return {
    ownerId,
    localDay,
    completedContentIds,
    recentNewContentIds,
    lastNewLocalDayByContentId,
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
  const selectedNew = weightedSelection(progressWindow, remainingCount, seed, selection.localDay ?? "today", selection.lastNewLocalDayByContentId ?? {}).map(({ item, balancedTopic, balancedPart }) => ({
    ...item,
    todayStatus: "new" as const,
    selectionReason: balancedTopic && balancedPart
      ? `This is a new HSK ${level} word you haven’t studied, selected near your current progress to balance today’s vocabulary topics and part-of-speech variety.`
      : balancedTopic
        ? `This is a new HSK ${level} word you haven’t studied, selected near your current progress to balance today’s vocabulary topics.`
        : balancedPart
          ? `This is a new HSK ${level} word you haven’t studied, selected near your current progress for part-of-speech variety.`
          : `This is a new HSK ${level} word you haven’t studied, selected near your current progress.`,
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
  if (asset) {
    const word = listPublishedWords().find((candidate) => candidate.id === asset.id || candidate.hanzi === asset.hanzi);
    return mapItem(asset, word);
  }
  const publicWord = findPublicCatalogWordById(assetId);
  return publicWord ? todayContentFromCatalogRow(publicWord) : undefined;
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
