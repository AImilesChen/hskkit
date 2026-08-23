import type { DailySession, LearningState } from "./domain.ts";

export type HomeNextStep = {
  kind: "placement" | "today" | "review";
  label: "Start placement" | "Continue today" | "Review due";
  href: "/placement" | "/today" | "/review";
  explanation: string;
};

export function deriveHomeNextStep(state: LearningState, now: string): HomeNextStep {
  const due = state.cards.some((card) => Date.parse(card.dueAt) <= Date.parse(now));
  if (due) return {
    kind: "review",
    label: "Review due",
    href: "/review",
    explanation: "Review due items before adding more new work.",
  };
  const hasProgress = Boolean(
    state.placementResults?.length
    || state.placementSessions?.length
    || state.practiceSessions?.length
    || state.attempts.length
    || state.cards.length
    || state.mistakes.length
    || state.dailySessions.length,
  );
  if (hasProgress) return {
    kind: "today",
    label: "Continue today",
    href: "/today",
    explanation: "Continue the learning queue built from your saved progress.",
  };
  return {
    kind: "placement",
    label: "Start placement",
    href: "/placement",
    explanation: "Find an evidence-based starting level before building today's queue.",
  };
}

function offsetLocalDay(instant: string, offsetMinutes: number) {
  return new Date(new Date(instant).getTime() - offsetMinutes * 60_000).toISOString().slice(0, 10);
}

export function learningLocalDay(instant: string, offsetMinutes: number, accountTimezone?: string) {
  if (!accountTimezone) return offsetLocalDay(instant, offsetMinutes);
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: accountTimezone,
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

export function computeOffsetSessionStreak(sessions: DailySession[], offsetMinutes: number, now: string) {
  const completed = sessions.filter((session) =>
    session.items.some((item) => item.kind === "summary" && item.status === "completed")
    && session.items.some((item) => item.kind !== "summary" && item.status === "completed"),
  );
  const days = [...new Set(completed.map((session) => session.localDay))].sort();
  let longest = 0;
  let run = 0;
  let prior: number | undefined;
  for (const day of days) {
    const current = dayNumber(day);
    run = prior !== undefined && current === prior + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prior = current;
  }
  const today = dayNumber(offsetLocalDay(now, offsetMinutes));
  let current = 0;
  if (days.length && [0, 1].includes(today - dayNumber(days.at(-1)!))) {
    current = 1;
    for (let index = days.length - 1; index > 0; index -= 1) {
      if (dayNumber(days[index]) - dayNumber(days[index - 1]) !== 1) break;
      current += 1;
    }
  }
  return {
    current,
    longest,
    lastLearningDay: days.at(-1) ?? null,
    policy: "completed_daily_session_device_day_v1" as const,
  };
}
