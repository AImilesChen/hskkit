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

const dashboardRetryDelaysMs = [50, 150] as const;
const sleep = (delayMs: number) => new Promise<void>((resolve) => setTimeout(resolve, delayMs));

export function isTransientDashboardStorageError(error: unknown): boolean {
  const record = error && typeof error === "object" ? error as { code?: unknown; message?: unknown; cause?: unknown } : undefined;
  const message = String(record?.message ?? error ?? "").toLowerCase();
  if (record?.code === 7429 || record?.code === "7429") return true;
  if (/\b7429\b|d1 db is overloaded|requests queued for too long|d1_error.*overload/.test(message)) return true;
  return record?.cause ? isTransientDashboardStorageError(record.cause) : false;
}

export async function loadDashboardServerData<T>(
  load: () => Promise<T>,
  wait: (delayMs: number) => Promise<void> = sleep,
): Promise<{ status: "ready"; data: T } | { status: "temporarily_unavailable" }> {
  for (let attempt = 0; attempt <= dashboardRetryDelaysMs.length; attempt += 1) {
    try {
      return { status: "ready", data: await load() };
    } catch (error) {
      if (!isTransientDashboardStorageError(error)) throw error;
      const delayMs = dashboardRetryDelaysMs[attempt];
      if (delayMs === undefined) return { status: "temporarily_unavailable" };
      await wait(delayMs);
    }
  }
  return { status: "temporarily_unavailable" };
}

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
