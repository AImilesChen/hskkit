export type ReviewQueueCard = {
  id: string;
  isMistake: boolean;
  dimension: "reading" | "audio" | "context_audio";
  dueAt: string;
};

export function buildReviewQueue<T extends ReviewQueueCard>(cards: T[], cap: number): T[] {
  return [...cards]
    .sort((a, b) => Number(b.isMistake) - Number(a.isMistake) || a.dueAt.localeCompare(b.dueAt))
    .slice(0, Math.max(1, cap));
}

export type ReviewEntryIntent =
  | { kind: "setup" }
  | { kind: "today" }
  | { kind: "mistake"; contentId: string };

export function reviewEntryIntent(search: string): ReviewEntryIntent {
  const params = new URLSearchParams(search);
  if (params.get("source") === "today") return { kind: "today" };
  if (params.get("source") === "mistakes") {
    const contentId = params.get("contentId")?.trim();
    if (contentId) return { kind: "mistake", contentId };
  }
  return { kind: "setup" };
}

export function buildIntentReviewQueue<T extends ReviewQueueCard & { contentId: string }>(cards: T[], intent: ReviewEntryIntent, cap: number): T[] {
  if (intent.kind === "today") return buildReviewQueue(cards, cap);
  if (intent.kind === "mistake") {
    const target = cards.find((card) => card.isMistake && card.contentId === intent.contentId);
    return target ? [target] : [];
  }
  return [];
}

export type ReviewGrade = "again" | "hard" | "good" | "easy";

export function reviewGradeOptions(ease: number, intervalDays: number): Array<{ grade: ReviewGrade; label: string; hint: string }> {
  const rememberedDays = Math.max(2, Math.round(Math.max(1, intervalDays) * ease));
  const easyDays = Math.max(4, Math.round(Math.max(1, intervalDays) * (ease + 0.3)));
  return [
    { grade: "again", label: "Forgot", hint: "Review again in 10 min" },
    { grade: "hard", label: "Difficult", hint: "Review tomorrow" },
    { grade: "good", label: "Remembered", hint: `Review in ${rememberedDays} days` },
    { grade: "easy", label: "Easy", hint: `Review in ${easyDays} days` },
  ];
}

export function reviewReason(card: { isMistake: boolean; reviewCount?: number }) {
  if (card.isMistake) return "You missed this in an earlier practice session.";
  if ((card.reviewCount ?? 0) === 0) return "This is your first scheduled memory check.";
  return "This item is due now based on your previous review.";
}
