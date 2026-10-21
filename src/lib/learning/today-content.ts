import runtimeIndex from "../content/runtime-content-index.json" with { type: "json" };
import type { CatalogSearchRow } from "../content/catalog-search.ts";
import { getHsk3LevelStatus } from "../content/level-status.ts";
import { listPublishedWords, type StudyWord } from "../dictionary/catalog.ts";
import type { DailySession } from "./domain.ts";

const poolCache = new Map<number, TodayContentItem[]>();
const runtimeWordAssets = Object.values(runtimeIndex.runtimeWords).flat();
type RuntimeTodayAsset = (typeof runtimeWordAssets)[number];

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
  example?: StudyWord["example"];
  audioSrc?: string;
  isContinuing?: boolean;
  resumeSteps?: TodayResumeSteps;
}

export type TodayMeaningCheck = {
  prompt: string;
  options: Array<{ key: "A" | "B" | "C" | "D"; text: string }>;
  correctAnswer: "A" | "B" | "C" | "D";
};

export interface TodayResumeSteps {
  learn: boolean;
  audio: boolean;
  contextAudio: boolean;
}

export type TodayContentPlan =
  | { status: "ready"; startLevel: number; levelBand: string; releaseId: string; item: TodayContentItem; items: TodayContentItem[]; practiceHref?: string; unavailableCapabilities?: Array<"context_audio" | "practice"> }
  | { status: "empty"; startLevel: number; releaseId?: string; code: "EMPTY_CONTENT_QUEUE" | "NO_NEW_WORDS"; message: string; actionHref: string; actionLabel: string };

export interface TodayWordSelection {
  pinnedContentIds?: readonly string[];
  continuingContentIds?: readonly string[];
  continuingSteps?: Readonly<Record<string, TodayResumeSteps>>;
  completedContentIds?: readonly string[];
  listeningEnabled?: boolean;
  freezePinned?: boolean;
}

export function todayWordHistory(sessions: readonly DailySession[], ownerId: string, localDay: string, level: number): TodayWordSelection {
  const own = sessions.filter((session) => session.ownerId === ownerId);
  const current = own.find((session) => session.localDay === localDay && session.startLevel === level);
  const previous = own.filter((session) => session.localDay < localDay && session.startLevel === level)
    .sort((a, b) => b.localDay.localeCompare(a.localDay));
  const completedContentIds = [...new Set(own.flatMap((session) => session.items
    .filter((item) => item.kind === "learn" && item.status === "completed")
    .map((item) => item.contentId)))];
  const seenEarlierWords = new Set<string>();
  const continuingSteps: Record<string, TodayResumeSteps> = {};
  const continuingContentIds = previous.flatMap((session) => session.items.flatMap((item) => {
    if (item.kind !== "learn" || seenEarlierWords.has(item.contentId)) return [];
    seenEarlierWords.add(item.contentId);
    const steps = previous.flatMap((day) => day.items.filter((step) => step.contentId === item.contentId));
    const learn = !steps.some((step) => step.kind === "learn" && step.status === "completed");
    const audio = learn || (steps.some((step) => step.kind === "listen" && step.dimension === "audio")
      && !steps.some((step) => step.kind === "listen" && step.dimension === "audio" && step.status === "completed"));
    const contextAudio = learn || (steps.some((step) => step.kind === "listen" && step.dimension === "context_audio")
      && !steps.some((step) => step.kind === "listen" && step.dimension === "context_audio" && step.status === "completed"));
    if (!learn && !audio && !contextAudio) return [];
    continuingSteps[item.contentId] = { learn, audio, contextAudio };
    return [item.contentId];
  }));
  return {
    pinnedContentIds: [...new Set(current?.items.filter((item) => item.kind === "learn" || item.kind === "listen").map((item) => item.contentId) ?? [])],
    continuingContentIds: [...new Set([...continuingContentIds, ...(current?.items.filter((item) => (item.kind === "learn" || item.kind === "listen") && item.isContinuing).map((item) => item.contentId) ?? [])])],
    continuingSteps,
    completedContentIds,
    freezePinned: Boolean(current),
  };
}

function activeLevel(level: number) {
  const status = getHsk3LevelStatus(level);
  const catalogLevel = level >= 7 ? 7 : level;
  return {
    releaseId: runtimeIndex.releaseId,
    catalogLevel,
    availability: status.availability,
  };
}

function versionFor(asset: RuntimeTodayAsset, releaseId: string) {
  return `${releaseId}:${asset.contentVersion}`;
}

function mapItem(asset: RuntimeTodayAsset, word: StudyWord | undefined, releaseId: string): TodayContentItem {
  return {
    assetId: asset.id,
    contentId: `catalog:${asset.logicalId}`,
    contentVersion: versionFor(asset, releaseId),
    releaseId,
    level: asset.level,
    hanzi: asset.hanzi,
    pinyin: asset.pinyin,
    meaning: asset.meaning,
    partOfSpeech: asset.partOfSpeech,
    studySlug: word?.slug ?? asset.id,
    example: word?.example,
    audioSrc: word?.audio.status === "formal" ? word.audio.src : (asset as unknown as { audioSrc?: string | null }).audioSrc || undefined,
  };
}

function availableItems(catalogLevel: number): TodayContentItem[] {
  const cached = poolCache.get(catalogLevel);
  if (cached) return cached;
  const words = listPublishedWords();
  const dictionary = runtimeIndex.dictionaryAssets.filter((asset) => asset.level === catalogLevel);
  const runtime = runtimeIndex.runtimeWords[String(catalogLevel) as keyof typeof runtimeIndex.runtimeWords] ?? [];
  const curated = dictionary.filter((asset) => words.some((word) => word.id === asset.id));
  const seen = new Set<string>();
  const items = [...curated, ...dictionary, ...runtime]
    .filter((asset) => !seen.has(asset.id) && Boolean(seen.add(asset.id)))
    .map((asset) => mapItem(asset, words.find((word) => word.id === asset.id), runtimeIndex.releaseId));
  poolCache.set(catalogLevel, items);
  return items;
}

const meaningOptionKeys = ["A", "B", "C", "D"] as const;
const normalizedMeaning = (value: string) => value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
const stableNumber = (value: string) => [...value].reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 17);

export function todayMeaningCheck(item: TodayContentItem): TodayMeaningCheck | undefined {
  const catalogLevel = item.level >= 7 ? 7 : item.level;
  const seen = new Set([normalizedMeaning(item.meaning)]);
  const candidates = availableItems(catalogLevel).filter((candidate) => {
    const meaning = normalizedMeaning(candidate.meaning);
    if (candidate.contentId === item.contentId || !meaning || seen.has(meaning)) return false;
    seen.add(meaning);
    return true;
  });
  if (candidates.length < 3) return undefined;
  const start = stableNumber(item.assetId) % candidates.length;
  const distractors: string[] = [];
  for (let offset = 0; offset < candidates.length && distractors.length < 3; offset += 1) {
    distractors.push(candidates[(start + offset) % candidates.length].meaning);
  }
  const correctIndex = stableNumber(`${item.assetId}:meaning`) % 4;
  const meanings = [...distractors];
  meanings.splice(correctIndex, 0, item.meaning);
  return {
    prompt: `What does “${item.hanzi}” mean?`,
    options: meanings.map((text, index) => ({ key: meaningOptionKeys[index], text })),
    correctAnswer: meaningOptionKeys[correctIndex],
  };
}

export function selectTodayContent(startLevel: number, requestedCount = 1, selection: TodayWordSelection = {}): TodayContentPlan {
  const level = Number.isInteger(startLevel) && startLevel >= 1 && startLevel <= 9 ? startLevel : 1;
  const count = Number.isInteger(requestedCount) ? Math.min(5, Math.max(1, requestedCount)) : 1;
  const result = activeLevel(level);
  let plan: TodayContentPlan;
  if (result.availability !== "ready") {
    plan = {
      status: "empty",
      startLevel: level,
      releaseId: result.releaseId,
      code: "EMPTY_CONTENT_QUEUE",
      message: `No approved Level ${level} tasks are available in the active content release. Your saved progress is unchanged.`,
      actionHref: level >= 8 ? "/vocabulary/7" : "/levels",
      actionLabel: level >= 8 ? "Open the unified HSK 7–9 advanced ability band catalog" : "Choose another available level",
    };
  } else {
    const pool = availableItems(result.catalogLevel);
    const byId = new Map(pool.map((item) => [item.contentId, item]));
    const completed = new Set(selection.completedContentIds ?? []);
    const continuing = new Set(selection.continuingContentIds ?? []);
    const pinned = (selection.pinnedContentIds ?? []).flatMap((id) => byId.has(id) ? [byId.get(id)!] : []);
    const freezePinned = Boolean(selection.freezePinned && pinned.length);
    const carried = freezePinned ? [] : (selection.continuingContentIds ?? []).flatMap((id) => byId.has(id) ? [byId.get(id)!] : []);
    const chosen = new Set<string>();
    const items: TodayContentItem[] = [];
    for (const item of [...pinned, ...carried].slice(0, 5)) {
      if (chosen.has(item.contentId)) continue;
      chosen.add(item.contentId);
      items.push({ ...item, isContinuing: continuing.has(item.contentId), resumeSteps: selection.continuingSteps?.[item.contentId] });
    }
    const remaining = pool.filter((item) => !chosen.has(item.contentId) && !completed.has(item.contentId));
    const ordered = selection.listeningEnabled === false ? remaining : [
      ...remaining.filter((item) => Boolean(item.audioSrc)),
      ...remaining.filter((item) => !item.audioSrc),
    ];
    const alreadyNew = items.filter((item) => !item.isContinuing).length;
    for (const item of ordered.slice(0, freezePinned ? 0 : Math.max(0, count - alreadyNew))) items.push(item);
    plan = items.length ? {
      status: "ready",
      startLevel: level,
      levelBand: level >= 7 ? "7-9" : String(level),
      releaseId: result.releaseId,
      item: items[0],
      items,
      practiceHref: level <= 6 ? `/practice/${level}/vocabulary` : undefined,
      unavailableCapabilities: [
        ...(items.some((item) => !item.example) ? ["context_audio" as const] : []),
        ...(level > 6 ? ["practice" as const] : []),
      ],
    } : {
      status: "empty",
      startLevel: level,
      releaseId: result.releaseId,
      code: "NO_NEW_WORDS",
      message: `You have completed the available Today words at HSK ${level}. Due reviews remain available; choose another level for more new words.`,
      actionHref: `/vocabulary/${level}`,
      actionLabel: `Explore HSK ${level} vocabulary`,
    };
  }
  return plan;
}

export function todayContentByContentId(contentId: string): TodayContentItem | undefined {
  const logicalId = contentId.startsWith("catalog:") ? contentId.slice("catalog:".length) : undefined;
  const asset = logicalId
    ? runtimeIndex.dictionaryAssets.find((candidate) => candidate.logicalId === logicalId)
      ?? runtimeWordAssets.find((candidate) => candidate.logicalId === logicalId)
    : undefined;
  return asset ? todayContentByAssetId(asset.id) : undefined;
}

export function todayContentByAssetId(assetId: string): TodayContentItem | undefined {
  const asset = runtimeIndex.dictionaryAssets.find((candidate) => candidate.id === assetId)
    ?? runtimeWordAssets.find((candidate) => candidate.id === assetId);
  if (!asset) return undefined;
  const words = listPublishedWords();
  const word = words.find((candidate) => candidate.id === asset.id);
  return mapItem(asset, word, runtimeIndex.releaseId);
}

export function todayContentFromCatalogRow(row: CatalogSearchRow): TodayContentItem {
  const logicalId = row.id.replace(/\.v\d+$/, "");
  return {
    assetId: row.id,
    contentId: `catalog:${logicalId}`,
    contentVersion: `${row.release_id}:${row.content_version}`,
    releaseId: row.release_id,
    level: row.level_band === "7-9" ? 7 : Number(row.level_band),
    hanzi: row.hanzi,
    pinyin: row.pinyin,
    meaning: row.meaning,
    partOfSpeech: row.part_of_speech,
    studySlug: row.id,
    example: undefined,
    audioSrc: undefined,
  };
}
