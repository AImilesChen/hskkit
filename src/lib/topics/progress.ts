import type { LearningState } from "../learning/domain.ts";
import type { LearningTopic } from "./catalog.ts";

export type TopicWordProgress = { learned?: boolean };
export type TopicVisit = { topicSlug: string; lastAssetId: string; visitedAt: string };

export function topicWordProgressFromState(state: LearningState, assetId: string) {
  const contentId = `word:${assetId}`;
  const completedToday = state.dailySessions.some((session) => session.items.some((item) => item.id === `dictionary:${assetId}` && item.status === "completed"));
  const genuineAttempt = state.attempts.some((attempt) => attempt.contentId === contentId && attempt.idempotencyKey !== `dictionary-review:${assetId}:${attempt.contentVersion}`);
  const reviewedCard = state.cards.some((card) => card.contentId === contentId && (card.reviewCount > 0 || card.gradeKeys.length > 0));
  return { learned: completedToday || genuineAttempt || reviewedCard };
}

export function computeTopicProgress(topic: LearningTopic, topicProgress: Record<string, TopicWordProgress> = {}) {
  const learned = topic.wordAssetIds.filter((assetId) => topicProgress[assetId]?.learned === true).length;
  return {
    learned,
    total: topic.wordAssetIds.length,
    percent: topic.wordAssetIds.length ? Math.round(learned / topic.wordAssetIds.length * 100) : 0,
  };
}

export function nextTopicAssetId(topic: LearningTopic, topicProgress: Record<string, TopicWordProgress> = {}, preferredAssetId?: string) {
  if (preferredAssetId && topic.wordAssetIds.includes(preferredAssetId) && !topicProgress[preferredAssetId]?.learned) return preferredAssetId;
  return topic.wordAssetIds.find((assetId) => !topicProgress[assetId]?.learned);
}

export function latestTopicVisit(visits: TopicVisit[] | undefined) {
  return [...(visits ?? [])].sort((left, right) => right.visitedAt.localeCompare(left.visitedAt))[0];
}

export function recordTopicVisit<T extends Pick<LearningState, "topicVisits">>(state: T, input: TopicVisit): T {
  const previous = state.topicVisits ?? [];
  return {
    ...state,
    topicVisits: [input, ...previous.filter((visit) => visit.topicSlug !== input.topicSlug)].slice(0, 20),
  };
}
