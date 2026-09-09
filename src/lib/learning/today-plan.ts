export const TODAY_BUDGET_OPTIONS = [5, 10, 15, 20, 30] as const;
export const TODAY_NEW_WORD_OPTIONS = [1, 2, 3, 5] as const;
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
  dimension?: "reading" | "audio" | "context_audio";
};

export function todayJourneyProgress(items: readonly TodayJourneyProgressItem[]) {
  const phases: TodayJourneyProgressItem[][] = [];
  const phaseIndexes = new Map<string, number>();
  for (const item of items) {
    if (item.kind === "summary") continue;
    const phaseKey = item.kind === "listen" && !item.dimension ? `listen:${item.id}` : `${item.kind}:${item.dimension ?? "default"}`;
    const existingIndex = phaseIndexes.get(phaseKey);
    if (existingIndex !== undefined) phases[existingIndex].push(item);
    else {
      phaseIndexes.set(phaseKey, phases.length);
      phases.push([item]);
    }
  }
  const completedPhases = phases.filter((phase) => phase.every((item) => item.status === "completed")).length;
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

export type TodayCompletionProof = {
  dailySessionId: string;
  dailyItemId: string;
  revision: number;
  summaryComplete: boolean;
};

export function todayCompletionProof(proof: TodayCompletionProof) {
  return JSON.stringify(proof);
}

export function parseTodayCompletionProof(value: string | null): TodayCompletionProof | null {
  if (!value) return null;
  try {
    const proof = JSON.parse(value) as Partial<TodayCompletionProof>;
    if (typeof proof.dailySessionId !== "string" || !proof.dailySessionId || typeof proof.dailyItemId !== "string" || !proof.dailyItemId || !Number.isInteger(proof.revision) || Number(proof.revision) < 0 || typeof proof.summaryComplete !== "boolean") return null;
    return proof as TodayCompletionProof;
  } catch {
    return null;
  }
}

export function completionProofNeedsSync(proof: TodayCompletionProof | null, current: {
  sessionId: string;
  revision: number;
  completedItemId: string;
  completedItem: boolean;
  summaryComplete: boolean;
}) {
  if (!proof || proof.dailySessionId !== current.sessionId || proof.dailyItemId !== current.completedItemId) return false;
  return current.revision < proof.revision || !current.completedItem || (proof.summaryComplete && !current.summaryComplete);
}

export function todaySummaryStats(items: readonly TodayJourneyProgressItem[]) {
  const completed = items.filter((item) => item.kind !== "summary" && item.status === "completed");
  return {
    completedTasks: completed.length,
    skippedTasks: items.filter((item) => item.kind !== "summary" && item.status === "skipped").length,
    reviewsCompleted: completed.filter((item) => item.kind === "review").length,
    wordsLearned: completed.filter((item) => item.kind === "learn").length,
    listeningCompleted: completed.filter((item) => item.kind === "listen").length,
    practiceCompleted: completed.filter((item) => item.kind === "practice").length,
  };
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

export function recommendTodayNewWordCount(minutes: TodayBudgetMinutes): TodayNewWordCount {
  if (minutes <= 5) return 1;
  if (minutes <= 10) return 2;
  if (minutes <= 20) return 3;
  return 5;
}
