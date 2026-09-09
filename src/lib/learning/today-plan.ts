export const TODAY_BUDGET_OPTIONS = [5, 10, 15, 20, 30] as const;
export const TODAY_NEW_WORD_OPTIONS = [1, 2, 3] as const;
export const TODAY_FOCUS_OPTIONS = ["balanced", "review_first", "fix_mistakes", "listening_focus"] as const;
export type TodayBudgetMinutes = typeof TODAY_BUDGET_OPTIONS[number];
export type TodayNewWordCount = typeof TODAY_NEW_WORD_OPTIONS[number];
export type TodayFocus = typeof TODAY_FOCUS_OPTIONS[number];
export type TodayCompletedKind = "review" | "learn" | "listen" | "practice";
export type TodayCelebration = {
  kind: "step" | "session";
  icon: "review" | "book" | "headphones" | "pencil" | "target";
  eyebrow: string;
  title: string;
  message: string;
};

export type TodayJourneyProgressItem = {
  id: string;
  kind: "review" | "learn" | "listen" | "practice" | "summary";
  status: "pending" | "completed" | "skipped";
};

export function todayJourneyProgress(items: readonly TodayJourneyProgressItem[]) {
  const phases: TodayJourneyProgressItem[][] = [];
  let reviewPhase: TodayJourneyProgressItem[] | undefined;
  for (const item of items) {
    if (item.kind === "summary") continue;
    if (item.kind === "review") {
      if (!reviewPhase) {
        reviewPhase = [];
        phases.push(reviewPhase);
      }
      reviewPhase.push(item);
    } else {
      phases.push([item]);
    }
  }
  const completedPhases = phases.filter((phase) => phase.every((item) => item.status !== "pending")).length;
  const pendingIndex = phases.findIndex((phase) => phase.some((item) => item.status === "pending"));
  return {
    currentPhase: pendingIndex >= 0 ? pendingIndex + 1 : phases.length,
    totalPhases: phases.length,
    completedPhases,
  };
}

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

export function isTodayNewWordCount(value: unknown): value is TodayNewWordCount {
  return typeof value === "number" && Number.isInteger(value) && TODAY_NEW_WORD_OPTIONS.includes(value as TodayNewWordCount);
}

export function isTodayFocus(value: unknown): value is TodayFocus {
  return typeof value === "string" && TODAY_FOCUS_OPTIONS.includes(value as TodayFocus);
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
