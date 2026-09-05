export type LearningActivityEvent = { action: string; createdAt: string };
export type GrowthAttempt = { contentId: string; reviewSnapshot?: { level?: number } };
export type GrowthLevelTotal = { level: number; label: string; total: number };

export type GrowthDay = {
  date: string;
  day: number;
  count: number;
  active: boolean;
  isToday: boolean;
};

export type GrowthSnapshot = {
  timezone: string;
  calendar: { monthLabel: string; firstWeekday: number; days: GrowthDay[] };
  curve30: Array<{ date: string; label: string; count: number }>;
  levelProgress: Array<GrowthLevelTotal & { learned: number; percent: number }>;
  totalActions30: number;
  totalTrackedWords: number;
  hasActivity: boolean;
  hasCalendarActivity: boolean;
  hasLevelProgress: boolean;
};

export const GROWTH_LEARNING_ACTIONS = new Set([
  "attempt",
  "topic_practice_attempt",
  "dictionary_practice_attempt",
  "step7_attempt",
  "audio_attempt",
  "retry_review",
  "grade",
  "complete_item",
]);

function localDate(instant: Date | string, timezone: string): string | null {
  const date = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(date.getTime())) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const value = (type: string) => parts.find((part) => part.type === type)?.value;
    const year = value("year");
    const month = value("month");
    const day = value("day");
    return year && month && day ? `${year}-${month}-${day}` : null;
  } catch {
    return localDate(date, "UTC");
  }
}

function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days, 12));
  return shifted.toISOString().slice(0, 10);
}

function shortDateLabel(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  return `${month}/${day}`;
}

export function buildGrowthSnapshot(input: {
  now: Date;
  timezone: string;
  activity: LearningActivityEvent[];
  attempts: GrowthAttempt[];
  levelTotals: GrowthLevelTotal[];
}): GrowthSnapshot {
  const timezone = input.timezone || "UTC";
  const today = localDate(input.now, timezone) ?? input.now.toISOString().slice(0, 10);
  const counts = new Map<string, number>();
  for (const event of input.activity) {
    if (!GROWTH_LEARNING_ACTIONS.has(event.action)) continue;
    const day = localDate(event.createdAt, timezone);
    if (!day) continue;
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const curve30 = Array.from({ length: 30 }, (_, index) => {
    const date = shiftDate(today, index - 29);
    return { date, label: shortDateLabel(date), count: counts.get(date) ?? 0 };
  });

  const [year, month] = today.split("-").map(Number);
  const firstDate = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
  const numberOfDays = new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
  const calendarDays = Array.from({ length: numberOfDays }, (_, index) => {
    const date = shiftDate(firstDate, index);
    const count = counts.get(date) ?? 0;
    return { date, day: index + 1, count, active: count > 0, isToday: date === today };
  });
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1, 12)));

  const learnedByLevel = new Map<number, Set<string>>();
  for (const attempt of input.attempts) {
    if (!attempt.contentId.startsWith("word:")) continue;
    const rawLevel = Number(attempt.reviewSnapshot?.level);
    if (!Number.isInteger(rawLevel) || rawLevel < 1 || rawLevel > 9) continue;
    const level = rawLevel >= 7 ? 7 : rawLevel;
    const words = learnedByLevel.get(level) ?? new Set<string>();
    words.add(attempt.contentId);
    learnedByLevel.set(level, words);
  }

  const levelProgress = input.levelTotals.map((row) => {
    const learned = learnedByLevel.get(row.level)?.size ?? 0;
    const percent = row.total > 0 ? Math.min(100, Math.round((learned / row.total) * 1000) / 10) : 0;
    return { ...row, learned, percent };
  });
  const totalTrackedWords = [...learnedByLevel.values()].reduce((sum, words) => sum + words.size, 0);
  const totalActions30 = curve30.reduce((sum, day) => sum + day.count, 0);

  return {
    timezone,
    calendar: {
      monthLabel,
      firstWeekday: new Date(`${firstDate}T12:00:00.000Z`).getUTCDay(),
      days: calendarDays,
    },
    curve30,
    levelProgress,
    totalActions30,
    totalTrackedWords,
    hasActivity: totalActions30 > 0,
    hasCalendarActivity: calendarDays.some((day) => day.active),
    hasLevelProgress: totalTrackedWords > 0,
  };
}
