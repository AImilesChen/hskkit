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
