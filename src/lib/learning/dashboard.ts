type PlacementResultSignal = { recommendedLevel?: number; createdAt?: string };
type LearningEntryState = {
  attempts?: unknown[];
  cards?: unknown[];
  mistakes?: unknown[];
  dailySessions?: unknown[];
  placementSessions?: unknown[];
  placementResults?: PlacementResultSignal[];
  practiceSessions?: unknown[];
  preferredLearningLevel?: number;
};

type DashboardItemSignal = {
  kind: string;
  status: string;
};

export function hasEstablishedLearning(state: LearningEntryState) {
  return Boolean(
    state.placementResults?.length
    || state.attempts?.length
    || state.cards?.length
    || state.mistakes?.length
    || state.dailySessions?.length
    || state.practiceSessions?.length,
  );
}

export function learningEntryDestination(authenticated: boolean, state: LearningEntryState) {
  if (!authenticated) return "/login?returnTo=%2Fstart" as const;
  return hasEstablishedLearning(state) ? "/dashboard" as const : "/placement?onboarding=1" as const;
}

export function resolveCurrentLearningLevel(state: LearningEntryState) {
  if (Number.isInteger(state.preferredLearningLevel) && Number(state.preferredLearningLevel) >= 1 && Number(state.preferredLearningLevel) <= 9) {
    return Number(state.preferredLearningLevel);
  }
  const latest = [...(state.placementResults ?? [])]
    .filter((result) => Number.isInteger(result.recommendedLevel) && Number(result.recommendedLevel) >= 1 && Number(result.recommendedLevel) <= 9)
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")))[0];
  return Number(latest?.recommendedLevel ?? 1);
}

export function dashboardPrimaryAction(input: {
  dueReviews: number;
  currentLevel: number;
  items: DashboardItemSignal[];
}) {
  const taskItems = input.items.filter((item) => item.kind !== "summary");
  const hasCompletedTask = taskItems.some((item) => item.status === "completed");
  const hasPendingTask = taskItems.some((item) => item.status === "pending");
  if (hasCompletedTask && hasPendingTask) return { label: "Continue today’s learning", href: "/today" as const };
  if (input.dueReviews > 0) return { label: "Start today’s review", href: "/review?source=today" as const };
  const level = Math.min(9, Math.max(1, Math.trunc(input.currentLevel) || 1));
  return {
    label: "Learn new words",
    href: `/vocabulary/${level}?mode=flashcards#vocabulary-activities` as const,
  };
}
