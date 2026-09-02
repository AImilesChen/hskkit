import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";
import {
  findCatalogWordsByIds,
  getUniqueActiveCatalogSearchRelease,
  type CatalogSearchRow,
} from "@/lib/content/catalog-search";
import { publicAudioAsset, publishedContentAudioAsset } from "@/lib/audio/assets";
import {
  learningTopics,
  publishedTopicRoutesForVerifiedAssets,
  topicsSourceReleaseId,
  type LearningTopic,
} from "./catalog";
import { buildTopicPracticeQuestions, type TopicPracticeWord } from "./practice";

export type VerifiedTopicsSnapshot =
  | { status: "unavailable"; releaseId: null; rows: [] }
  | { status: "ready"; releaseId: string; rows: CatalogSearchRow[] };

const allMappedAssetIds = [...new Set(learningTopics.flatMap((topic) => topic.wordAssetIds))];

export const getVerifiedTopicsSnapshot = cache(async (): Promise<VerifiedTopicsSnapshot> => {
  try {
    const db = (await getCloudflareContext({ async: true })).env.LEARNING_DB;
    const release = await getUniqueActiveCatalogSearchRelease(db);
    if (!release || release.id !== topicsSourceReleaseId) {
      return { status: "unavailable", releaseId: null, rows: [] };
    }
    const rows: CatalogSearchRow[] = [];
    for (let start = 0; start < allMappedAssetIds.length; start += 100) {
      rows.push(...await findCatalogWordsByIds(db, allMappedAssetIds.slice(start, start + 100), release.id));
    }
    const returnedIds = new Set(rows.map((row) => row.id));
    if (
      rows.some((row) => row.release_id !== release.id)
      || returnedIds.size !== allMappedAssetIds.length
      || allMappedAssetIds.some((assetId) => !returnedIds.has(assetId))
    ) {
      return { status: "unavailable", releaseId: null, rows: [] };
    }
    return { status: "ready", releaseId: release.id, rows };
  } catch {
    return { status: "unavailable", releaseId: null, rows: [] };
  }
});

export function verifiedTopicsFromSnapshot(snapshot: VerifiedTopicsSnapshot) {
  if (snapshot.status !== "ready") return [];
  const activeIds = new Set(snapshot.rows.map((row) => row.id));
  return learningTopics.filter((topic) =>
    topic.status === "published"
    && topic.sourceReleaseId === snapshot.releaseId
    && topic.wordAssetIds.every((assetId) => activeIds.has(assetId))
  );
}

export async function getVerifiedTopicForMutation(slug: string) {
  const snapshot = await getVerifiedTopicsSnapshot();
  return verifiedTopicsFromSnapshot(snapshot).find((topic) => topic.slug === slug) ?? null;
}

export function verifiedTopicRoutesFromSnapshot(snapshot: VerifiedTopicsSnapshot) {
  return publishedTopicRoutesForVerifiedAssets(
    snapshot.status === "ready" ? snapshot.releaseId : null,
    snapshot.status === "ready" ? snapshot.rows.map((row) => row.id) : [],
  );
}

function mapWord(row: CatalogSearchRow) {
  return {
    assetId: row.id,
    contentVersion: row.content_version,
    levelBand: row.level_band,
    hanzi: row.hanzi,
    traditional: row.traditional,
    pinyin: row.pinyin,
    meaning: row.meaning,
    partOfSpeech: row.part_of_speech,
    audioAsset: publicAudioAsset(publishedContentAudioAsset(row.id, row.hanzi)),
  };
}

export async function getVerifiedTopicWords(topic: LearningTopic) {
  const snapshot = await getVerifiedTopicsSnapshot();
  if (snapshot.status !== "ready" || snapshot.releaseId !== topic.sourceReleaseId) {
    return { status: "unavailable" as const, releaseId: null, words: [] };
  }
  const byId = new Map(snapshot.rows.map((row) => [row.id, row]));
  const words = topic.wordAssetIds.flatMap((assetId) => {
    const row = byId.get(assetId);
    return row ? [mapWord(row)] : [];
  });
  return {
    status: words.length === topic.wordAssetIds.length ? "ready" as const : "partial" as const,
    releaseId: snapshot.releaseId,
    words,
  };
}

export async function getTrustedTopicPracticeQuestions(slug: string) {
  const topic = learningTopics.find((candidate) => candidate.slug === slug && candidate.status === "published");
  if (!topic) return null;
  const verified = await getVerifiedTopicWords(topic);
  if (verified.status !== "ready" || verified.releaseId !== topic.sourceReleaseId) return null;
  const words: TopicPracticeWord[] = verified.words.map((word) => ({
    assetId: word.assetId,
    contentId: `word:${word.assetId}`,
    contentVersion: `${verified.releaseId}:${word.contentVersion}`,
    level: word.levelBand === "7-9" ? 7 : Number(word.levelBand),
    levelBand: word.levelBand,
    hanzi: word.hanzi,
    pinyin: word.pinyin,
    meaning: word.meaning,
    audioAsset: publishedContentAudioAsset(word.assetId, word.hanzi),
  }));
  const questions = buildTopicPracticeQuestions(topic, words);
  return questions.length >= 4 ? { topic, questions } : null;
}
