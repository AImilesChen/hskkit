import type { DailySession, LearningState } from "../learning/domain";

export type MergeStrategy = "account_wins_conflicts";
export type DataRequestType = "export" | "delete";
export type DataRequestState = "requested" | "confirmed" | "processing" | "ready" | "completed" | "failed" | "cancelled";
export type DataRequestAction = "confirm" | "process" | "complete" | "fail" | "retry" | "cancel";

export interface AccountDataRequest {
  id: string;
  type: DataRequestType;
  state: DataRequestState;
  attempt: number;
  requestedAt: string;
  updatedAt: string;
  confirmedAt?: string;
  completedAt?: string;
  failureCode?: string;
}

const stable = (value: unknown) => JSON.stringify(value);

function mergeById<T extends { id: string }>(account: T[], guest: T[]) {
  const byId = new Map(account.map((item) => [item.id, item]));
  let conflicts = 0;
  for (const item of guest) {
    const current = byId.get(item.id);
    if (!current) byId.set(item.id, item);
    else if (stable(current) !== stable(item)) conflicts += 1;
  }
  return { values: [...byId.values()], conflicts };
}

function mergeStrings(account: string[] = [], guest: string[] = []) {
  return [...new Set([...account, ...guest])];
}

export function mergeLearningStates(account: LearningState, guest: LearningState, accountOwnerId?: string) {
  const attempts = mergeById(account.attempts, guest.attempts);
  const cards = mergeById(account.cards, guest.cards);
  const mistakes = mergeById(account.mistakes, guest.mistakes);
  const sessions = mergeById(account.dailySessions, guest.dailySessions.map((session) => accountOwnerId ? { ...session, ownerId: accountOwnerId } : session));
  const readyKey = (entry: { cardId: string; cardRevision: number }) => `${entry.cardId}:${entry.cardRevision}`;
  const ready = new Map((account.audioReviewReady ?? []).map((entry) => [readyKey(entry), entry]));
  for (const entry of guest.audioReviewReady ?? []) if (!ready.has(readyKey(entry))) ready.set(readyKey(entry), entry);
  return {
    state: {
      attempts: attempts.values,
      cards: cards.values,
      mistakes: mistakes.values,
      dailySessions: sessions.values,
      audioReviewReady: [...ready.values()],
      audioPlaybackKeys: mergeStrings(account.audioPlaybackKeys, guest.audioPlaybackKeys),
    } satisfies LearningState,
    conflicts: attempts.conflicts + cards.conflicts + mistakes.conflicts + sessions.conflicts,
  };
}

export function previewMerge(account: LearningState, guest: LearningState) {
  const merged = mergeLearningStates(account, guest);
  return {
    accountAttempts: account.attempts.length,
    guestAttempts: guest.attempts.length,
    additions: Math.max(0, merged.state.attempts.length - account.attempts.length),
    conflicts: merged.conflicts,
    strategy: "account_wins_conflicts" as MergeStrategy,
  };
}

export function syncDecision(serverRevision: number, clientRevision: number, deviceId: string) {
  if (serverRevision === clientRevision) return { state: "synced" as const, serverRevision };
  return {
    state: "conflict" as const,
    serverRevision,
    clientRevision,
    deviceId,
    resolution: "reload_then_retry" as const,
  };
}

function localDay(instant: string, timezone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(instant));
    const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    if (!value.year || !value.month || !value.day) throw new Error();
    return `${value.year}-${value.month}-${value.day}`;
  } catch {
    throw new Error("INVALID_TIMEZONE");
  }
}

const dayNumber = (day: string) => Math.floor(Date.parse(`${day}T00:00:00.000Z`) / 86_400_000);

export function computeStreak(completedAt: string[], timezone: string, now: string) {
  // Validate timezone even when there are no events.
  const today = localDay(now, timezone);
  const days = [...new Set(completedAt.map((instant) => localDay(instant, timezone)))].sort();
  let longest = 0;
  let run = 0;
  let prior: number | undefined;
  for (const day of days) {
    const current = dayNumber(day);
    run = prior !== undefined && current === prior + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prior = current;
  }
  let current = 0;
  if (days.length) {
    const gap = dayNumber(today) - dayNumber(days.at(-1)!);
    if (gap === 0 || gap === 1) {
      current = 1;
      for (let index = days.length - 1; index > 0; index -= 1) {
        if (dayNumber(days[index]) - dayNumber(days[index - 1]) !== 1) break;
        current += 1;
      }
    }
  }
  return {
    timezone,
    current,
    longest,
    lastLearningDay: days.at(-1) ?? null,
    policy: "completed_daily_session_v1" as const,
    makeups: "not_configured" as const,
  };
}

export function computeSessionStreak(sessions: DailySession[], timezone: string, now: string) {
  const completed = sessions.filter((session) =>
    session.items.some((item) => item.kind === "summary" && item.status === "completed"),
  );
  const legacyFallbackCount = completed.filter((session) => !session.completedAt).length;
  const streak = computeStreak(
    completed.map((session) => session.completedAt ?? session.createdAt),
    timezone,
    now,
  );
  return {
    ...streak,
    policy: "completed_daily_session_v1_with_created_at_legacy_fallback" as const,
    legacyFallbackCount,
  };
}

export function createDataRequest(id: string, type: DataRequestType, now: string): AccountDataRequest {
  return { id, type, state: "requested", attempt: 1, requestedAt: now, updatedAt: now };
}

export function transitionDataRequest(request: AccountDataRequest, action: DataRequestAction, now: string, failureCode?: string): AccountDataRequest {
  const next: Partial<Record<DataRequestState, Partial<Record<DataRequestAction, DataRequestState>>>> = {
    requested: request.type === "delete"
      ? { confirm: "confirmed", cancel: "cancelled" }
      : { process: "processing", cancel: "cancelled" },
    confirmed: { process: "processing", cancel: "cancelled" },
    processing: { complete: request.type === "export" ? "ready" : "completed", fail: "failed" },
    failed: { retry: request.type === "export" ? "requested" : "confirmed", cancel: "cancelled" },
  };
  const state = next[request.state]?.[action];
  if (!state) throw new Error("INVALID_REQUEST_TRANSITION");
  return {
    ...request,
    state,
    updatedAt: now,
    attempt: action === "retry" ? request.attempt + 1 : request.attempt,
    confirmedAt: action === "confirm" ? now : request.confirmedAt,
    completedAt: action === "complete" ? now : request.completedAt,
    failureCode: action === "fail" ? failureCode ?? "REQUEST_FAILED" : action === "retry" ? undefined : request.failureCode,
  };
}
