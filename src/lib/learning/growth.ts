export type LearningActivityEvent = { action: string; createdAt: string; reviewCorrect?: boolean };
export type GrowthAttempt = {
  contentId: string;
  observedAt?: string;
  correct?: boolean;
  dimension?: string;
  skill?: string;
  reviewSnapshot?: { level?: number; skillLabel?: string };
};
export type GrowthDailySession = {
  localDay: string;
  items: Array<{ kind: string; status: string; contentId: string }>;
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

type ComparisonValue = { current: number | null; previous: number | null; changePercent: number | null };
type ComparisonSet = Record<"minutes" | "tasks" | "newWords" | "accuracy", ComparisonValue>;
export type GrowthSkill = { key: "listening" | "speaking" | "reading" | "writing"; label: string; attempts: number; correct: number; accuracy: number | null };

export type GrowthSnapshot = {
  timezone: string;
  calendar: { monthLabel: string; firstWeekday: number; days: GrowthDay[] };
  curve30: Array<Omit<GrowthDay, "day" | "isToday" | "isFuture"> & { label: string }>;
  comparisons: Record<7 | 30, ComparisonSet>;
  skillOverview: GrowthSkill[];
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
  "audio_attempt", "retry_review", "grade", "complete_item", "reading_article_complete",
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

function percentChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return Math.round((current - previous) / previous * 100);
}

function classifySkill(attempt: GrowthAttempt): GrowthSkill["key"] | null {
  const evidence = `${attempt.dimension ?? ""} ${attempt.skill ?? ""} ${attempt.reviewSnapshot?.skillLabel ?? ""} ${attempt.contentId}`.toLowerCase();
  if (/speak|pronunc|oral/.test(evidence)) return "speaking";
  if (/writ/.test(evidence)) return "writing";
  if (/listen|audio|context_audio/.test(evidence)) return "listening";
  if (/read/.test(evidence)) return "reading";
  return null;
}

export function buildGrowthSnapshot(input: {
  now: Date;
  timezone: string;
  activity: LearningActivityEvent[];
  attempts: GrowthAttempt[];
  dailySessions?: GrowthDailySession[];
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
  const rememberWord = (contentId: string, date: string) => {
    const existing = firstWordDay.get(contentId);
    if (!existing || date < existing) firstWordDay.set(contentId, date);
  };
  for (const attempt of input.attempts) {
    if (!attempt.observedAt) continue;
    const date = localDate(attempt.observedAt, timezone);
    if (!date) continue;
    attemptsByDay.set(date, [...(attemptsByDay.get(date) ?? []), attempt]);
    if (attempt.contentId.startsWith("word:")) rememberWord(attempt.contentId, date);
  }
  for (const session of input.dailySessions ?? []) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(session.localDay)) continue;
    for (const item of session.items) {
      if (item.kind === "learn" && item.status === "completed" && item.contentId.startsWith("word:")) rememberWord(item.contentId, session.localDay);
    }
  }
  const newWordsByDay = new Map<string, number>();
  for (const date of firstWordDay.values()) newWordsByDay.set(date, (newWordsByDay.get(date) ?? 0) + 1);
  const engagement = new Map((input.engagementDays ?? []).map((day) => [day.localDay, day]));

  const metricsFor = (date: string): Omit<GrowthDay, "day" | "isToday" | "isFuture"> => {
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
      active: activeSeconds > 0 || completedTasks > 0 || reviewCount > 0 || newWords > 0,
    };
  };

  const history60 = Array.from({ length: 60 }, (_, index) => {
    const date = shiftDate(today, index - 59);
    return { ...metricsFor(date), label: shortDateLabel(date) };
  });
  const curve30 = history60.slice(-30);
  const aggregate = (days: typeof history60, metric: keyof ComparisonSet): number | null => {
    if (metric === "accuracy") {
      const reviewDays = days.filter((day) => day.reviewCount > 0 && day.reviewAccuracy !== null);
      const count = reviewDays.reduce((sum, day) => sum + day.reviewCount, 0);
      return count ? Math.round(reviewDays.reduce((sum, day) => sum + (day.reviewAccuracy ?? 0) * day.reviewCount, 0) / count) : null;
    }
    return days.reduce((sum, day) => sum + (metric === "minutes" ? day.minutes : metric === "tasks" ? day.completedTasks : day.newWords), 0);
  };
  const comparisonFor = (range: 7 | 30): ComparisonSet => {
    const currentDays = history60.slice(-range);
    const previousDays = history60.slice(-range * 2, -range);
    return Object.fromEntries((["minutes", "tasks", "newWords", "accuracy"] as const).map((metric) => {
      const current = aggregate(currentDays, metric);
      const previous = aggregate(previousDays, metric);
      return [metric, { current, previous, changePercent: percentChange(current, previous) }];
    })) as ComparisonSet;
  };

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

  const skillKeys: Array<{ key: GrowthSkill["key"]; label: string }> = [
    { key: "listening", label: "Listening" }, { key: "speaking", label: "Speaking" },
    { key: "reading", label: "Reading" }, { key: "writing", label: "Writing" },
  ];
  const skillStart = shiftDate(today, -29);
  const skillOverview = skillKeys.map(({ key, label }) => {
    const evidence = input.attempts.filter((attempt) => {
      if (typeof attempt.correct !== "boolean" || classifySkill(attempt) !== key || !attempt.observedAt) return false;
      const date = localDate(attempt.observedAt, timezone);
      return Boolean(date && date >= skillStart && date <= today);
    });
    const correct = evidence.filter((attempt) => attempt.correct).length;
    return { key, label, attempts: evidence.length, correct, accuracy: evidence.length ? Math.round(correct / evidence.length * 100) : null };
  });

  return {
    timezone,
    calendar: { monthLabel, firstWeekday: new Date(`${firstDate}T12:00:00.000Z`).getUTCDay(), days: calendarDays },
    curve30,
    comparisons: { 7: comparisonFor(7), 30: comparisonFor(30) },
    skillOverview,
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
