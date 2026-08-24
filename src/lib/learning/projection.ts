import type { ProductCapabilities } from "../commercial/capabilities";
import type { LearningState } from "./domain";

const recent = (timestamp: string | undefined, cutoff: number) => Boolean(timestamp && Date.parse(timestamp) >= cutoff);
const capped = <T>(items: T[], maximum: number) => items.slice(-maximum);

export function projectLearningHistory(state: LearningState, capabilities: ProductCapabilities, now = new Date()): LearningState {
  const cutoff = capabilities.historyRetentionDays === null
    ? Number.NEGATIVE_INFINITY
    : now.getTime() - capabilities.historyRetentionDays * 86_400_000;
  const attempts = capped(state.attempts.filter((item) => recent(item.observedAt, cutoff)), capabilities.historyMaxEntries);
  const attemptIds = new Set(attempts.map((item) => item.id));
  const cards = capped(state.cards.filter((item) => attemptIds.has(item.sourceAttemptId)), capabilities.historyMaxEntries);
  const cardIds = new Set(cards.map((item) => item.id));

  return {
    ...state,
    attempts,
    cards,
    mistakes: capped(state.mistakes.filter((item) => recent(item.createdAt, cutoff) && attemptIds.has(item.sourceAttemptId)), capabilities.historyMaxEntries),
    dailySessions: capped(state.dailySessions.filter((item) => recent(item.createdAt, cutoff)), capabilities.historyMaxEntries),
    placementSessions: state.placementSessions ? capped(state.placementSessions.filter((item) => recent(item.createdAt, cutoff)), capabilities.historyMaxEntries) : undefined,
    placementResults: state.placementResults ? capped(state.placementResults.filter((item) => recent(item.createdAt, cutoff)), capabilities.historyMaxEntries) : undefined,
    practiceSessions: state.practiceSessions ? capped(state.practiceSessions.filter((item) => recent(item.createdAt, cutoff)), capabilities.historyMaxEntries) : undefined,
    questionReports: state.questionReports ? capped(state.questionReports.filter((item) => recent(item.createdAt, cutoff)), capabilities.historyMaxEntries) : undefined,
    audioReviewReady: state.audioReviewReady?.filter((item) => cardIds.has(item.cardId)),
    audioPlaybackKeys: state.audioPlaybackKeys ? capped(state.audioPlaybackKeys, capabilities.historyMaxEntries) : undefined,
    dailyOperationKeys: state.dailyOperationKeys ? capped(state.dailyOperationKeys, capabilities.historyMaxEntries) : undefined,
  };
}
