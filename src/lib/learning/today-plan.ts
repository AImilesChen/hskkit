export const TODAY_BUDGET_OPTIONS = [5, 10, 15, 20, 30] as const;
export type TodayBudgetMinutes = typeof TODAY_BUDGET_OPTIONS[number];

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
