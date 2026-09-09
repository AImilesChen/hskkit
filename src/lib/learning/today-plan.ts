export const TODAY_BUDGET_OPTIONS = [5, 10, 15, 20, 30] as const;
export type TodayBudgetMinutes = typeof TODAY_BUDGET_OPTIONS[number];
export type TodayCompletedKind = "review" | "learn" | "listen" | "practice";
export type TodayCelebration = {
  kind: "step" | "session";
  icon: "review" | "book" | "headphones" | "pencil" | "target";
  eyebrow: string;
  title: string;
  message: string;
};

export function resolveTodayCelebration(input: {
  returnedKind: TodayCompletedKind | null;
  completedCount: number;
  summaryComplete: boolean;
}): TodayCelebration | null {
  if (!input.returnedKind || input.completedCount < 1) return null;
  if (input.summaryComplete) return {
    kind: "session",
    icon: "target",
    eyebrow: "Today complete",
    title: "Today’s session wrapped up!",
    message: "Completed work is saved, and any skipped steps remain visible to restore.",
  };
  const labels: Record<TodayCompletedKind, { title: string; noun: string; icon: TodayCelebration["icon"] }> = {
    review: { title: "Review complete!", noun: "review item", icon: "review" },
    learn: { title: "Word learned!", noun: "learning step", icon: "book" },
    listen: { title: "Listening complete!", noun: "listening step", icon: "headphones" },
    practice: { title: "Practice complete!", noun: "practice step", icon: "pencil" },
  };
  const label = labels[input.returnedKind];
  return {
    kind: "step",
    icon: label.icon,
    eyebrow: "Step complete",
    title: label.title,
    message: `${input.completedCount} ${label.noun}${input.completedCount === 1 ? "" : "s"} saved. Your next Today step is ready.`,
  };
}

export function todayCompletionProofKey(dailySessionId: string, dailyItemId: string) {
  return `today-completion:${dailySessionId}:${dailyItemId}`;
}

export function isTodayBudgetMinutes(value: unknown): value is TodayBudgetMinutes {
  return typeof value === "number" && Number.isInteger(value) && TODAY_BUDGET_OPTIONS.includes(value as TodayBudgetMinutes);
}

export function recommendTodayMinutes(input: {
  monthPoints: number;
  openMistakes: number;
  currentStreak: number;
  mastery: Record<"reading" | "audio" | "context_audio", number>;
  cardCount: number;
}): TodayBudgetMinutes {
  const weakestMastery = Math.min(...Object.values(input.mastery));
  if (input.openMistakes >= 3 || (input.cardCount >= 6 && weakestMastery <= 1)) return 30;
  if (input.openMistakes > 0 || input.monthPoints >= 100 || input.currentStreak >= 3) return 20;
  return 15;
}
