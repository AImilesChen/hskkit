export type LearningActivityEvent = { action: string; createdAt: string; reviewCorrect?: boolean };
export type GrowthAttempt = {
  contentId: string;
  observedAt?: string;
  correct?: boolean;
  reviewSnapshot?: { level?: number };
};
export type GrowthLevelTotal = { level: number; label: string; total: number };
export type GrowthEngagementDay = { localDay: string; activeSeconds: number; points: number };

export type GrowthDay = {
  date: string;
  day: number;
  completedTasks: number;
  newWords: number;
  reviewCount: number;
  reviewAccuracy: number | null;
  activeSeconds: number;
  minutes: number;
  points: number;
  active: boolean;
  isToday: boolean;
  isFuture: boolean;
};

export type GrowthSnapshot = {
  timezone: string;
  calendar: { monthLabel: string; firstWeekday: number; days: GrowthDay[] };
  curve30: Array<Omit<GrowthDay, "day" | "isToday" | "isFuture"> & { label: string }>;
  weekSummary: { learningDays: number; minutes: number; points: number; newWords: number; completedTasks: number };
  levelProgress: Array<GrowthLevelTotal & { learned: number; percent: number }>;
  totalActions30: number;
  totalTrackedWords: number;
  hasActivity: boolean;
  hasCalendarActivity: boolean;
  hasLevelProgress: boolean;
};

export const GROWTH_LEARNING_ACTIONS = new Set([
  "attempt", "topic_practice_attempt", "dictionary_practice_attempt", "step7_attempt",
  "audio_attempt", "retry_review", "grade", "complete_item",
]);

function localDate(instant: Date | string, timezone: string): string | null {
  const date = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(date.getTime())) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
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
  return new Date(Date.UTC(year, month - 1, day + days, 12)).toISOString().slice(0, 10);
}

function shortDateLabel(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  return `${month}/${day}`;
}

function mondayFor(day: string) {
  const date = new Date(`${day}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

export function buildGrowthSnapshot(input: {
  now: Date;
  timezone: string;
  activity: LearningActivityEvent[];
  attempts: GrowthAttempt[];
  engagementDays?: GrowthEngagementDay[];
  levelTotals: GrowthLevelTotal[];
}): GrowthSnapshot {
  const timezone = input.timezone || "UTC";
  const today = localDate(input.now, timezone) ?? input.now.toISOString().slice(0, 10);
  const completed = new Map<string, number>();
  for (const event of input.activity) {
    if (!GROWTH_LEARNING_ACTIONS.has(event.action)) continue;
    const date = localDate(event.createdAt, timezone);
    if (date) completed.set(date, (completed.get(date) ?? 0) + 1);
  }

  const attemptsByDay = new Map<string, GrowthAttempt[]>();
  const reviewsByDay = new Map<string, boolean[]>();
  for (const event of input.activity) {
    if ((event.action !== "grade" && event.action !== "retry_review") || typeof event.reviewCorrect !== "boolean") continue;
    const date = localDate(event.createdAt, timezone);
    if (date) reviewsByDay.set(date, [...(reviewsByDay.get(date) ?? []), event.reviewCorrect]);
  }
  const firstWordDay = new Map<string, string>();
  for (const attempt of input.attempts) {
    if (!attempt.observedAt) continue;
    const date = localDate(attempt.observedAt, timezone);
    if (!date) continue;
    attemptsByDay.set(date, [...(attemptsByDay.get(date) ?? []), attempt]);
    if (attempt.contentId.startsWith("word:")) {
      const existing = firstWordDay.get(attempt.contentId);
      if (!existing || date < existing) firstWordDay.set(attempt.contentId, date);
    }
  }
  const newWordsByDay = new Map<string, number>();
  for (const date of firstWordDay.values()) newWordsByDay.set(date, (newWordsByDay.get(date) ?? 0) + 1);
  const engagement = new Map((input.engagementDays ?? []).map((day) => [day.localDay, day]));

  const metricsFor = (date: string): Omit<GrowthDay, "day" | "isToday" | "isFuture"> => {
    const attempts = attemptsByDay.get(date) ?? [];
    const reviewOutcomes = reviewsByDay.get(date) ?? [];
    const reviewCount = reviewOutcomes.length;
    const correct = reviewOutcomes.filter(Boolean).length;
    const activeSeconds = Math.max(0, Number(engagement.get(date)?.activeSeconds ?? 0));
    const completedTasks = completed.get(date) ?? 0;
    const newWords = newWordsByDay.get(date) ?? 0;
    return {
      date,
      completedTasks,
      newWords,
      reviewCount,
      reviewAccuracy: reviewCount ? Math.round(correct / reviewCount * 100) : null,
      activeSeconds,
      minutes: Math.floor(activeSeconds / 60),
      points: Math.max(0, Number(engagement.get(date)?.points ?? 0)),
      active: activeSeconds > 0 || completedTasks > 0 || reviewCount > 0,
    };
  };

  const curve30 = Array.from({ length: 30 }, (_, index) => {
    const date = shiftDate(today, index - 29);
    return { ...metricsFor(date), label: shortDateLabel(date) };
  });
  const [year, month] = today.split("-").map(Number);
  const firstDate = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
  const numberOfDays = new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
  const calendarDays = Array.from({ length: numberOfDays }, (_, index) => {
    const date = shiftDate(firstDate, index);
    return { ...metricsFor(date), day: index + 1, isToday: date === today, isFuture: date > today };
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
    const percent = row.total > 0 ? Math.min(100, Math.round((learned / row.total) * 1_000) / 10) : 0;
    return { ...row, learned, percent };
  });
  const totalTrackedWords = [...learnedByLevel.values()].reduce((sum, words) => sum + words.size, 0);
  const totalActions30 = curve30.reduce((sum, day) => sum + day.completedTasks, 0);
  const weekStart = mondayFor(today);
  const week = curve30.filter((day) => day.date >= weekStart && day.date <= today);

  return {
    timezone,
    calendar: {
      monthLabel,
      firstWeekday: new Date(`${firstDate}T12:00:00.000Z`).getUTCDay(),
      days: calendarDays,
    },
    curve30,
    weekSummary: {
      learningDays: week.filter((day) => day.active).length,
      minutes: week.reduce((sum, day) => sum + day.minutes, 0),
      points: week.reduce((sum, day) => sum + day.points, 0),
      newWords: week.reduce((sum, day) => sum + day.newWords, 0),
      completedTasks: week.reduce((sum, day) => sum + day.completedTasks, 0),
    },
    levelProgress,
    totalActions30,
    totalTrackedWords,
    hasActivity: curve30.some((day) => day.active),
    hasCalendarActivity: calendarDays.some((day) => day.active),
    hasLevelProgress: totalTrackedWords > 0,
  };
}
