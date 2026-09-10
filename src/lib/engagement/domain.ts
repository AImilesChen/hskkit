export const badgeMilestones = [3, 7, 14, 30, 60, 90] as const;

export type LearningRewardDay = {
  localDay: string;
  activeSeconds: number;
  points: number;
};

export const learningPointTiers = [
  { seconds: 600, points: 1 },
  { seconds: 1_800, points: 5 },
  { seconds: 3_600, points: 10 },
] as const;

const APPROVED_LEARNING_PREFIXES = [
  "/today",
  "/vocabulary",
  "/review",
  "/mistakes",
  "/listen",
  "/reading",
  "/grammar",
  "/practice",
  "/placement",
  "/hsk-level-test",
] as const;

export function isEligibleLearningPath(pathname: string): boolean {
  const path = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  if (APPROVED_LEARNING_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return true;
  return /^\/hsk-(?:[1-9]|7-9)-(?:practice-test|reading-practice)(?:\/|$)/.test(path);
}

export function learningPointsForActiveSeconds(seconds: number): number {
  const safe = Math.max(0, Math.min(3_600, Math.trunc(seconds) || 0));
  if (safe >= 3_600) return 10;
  if (safe >= 1_800) return 5;
  if (safe >= 600) return 1;
  return 0;
}

export function creditedHeartbeatSeconds(requestedSeconds: number, sessionCreatedAt: Date, now: Date): number {
  if (!Number.isInteger(requestedSeconds) || requestedSeconds < 1 || requestedSeconds > 60) return 0;
  const elapsed = Math.floor((now.getTime() - sessionCreatedAt.getTime()) / 1_000);
  if (!Number.isFinite(elapsed) || elapsed < 1) return 0;
  return Math.min(60, requestedSeconds, elapsed);
}

function dateAtNoon(day: string): Date {
  return new Date(`${day}T12:00:00.000Z`);
}

function dayBefore(day: string): string {
  const date = dateAtNoon(day);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function mondayFor(day: string): string {
  const date = dateAtNoon(day);
  const offset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
}

function streaks(today: string, days: LearningRewardDay[]) {
  const learned = new Set(days.filter((day) => day.activeSeconds > 0).map((day) => day.localDay));
  let current = 0;
  let cursor = learned.has(today) ? today : dayBefore(today);
  while (learned.has(cursor)) {
    current += 1;
    cursor = dayBefore(cursor);
  }
  const ordered = [...learned].sort();
  let longest = 0;
  let run = 0;
  let previous = "";
  for (const day of ordered) {
    run = previous && dayBefore(day) === previous ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }
  return { current, longest };
}

export function buildRewardSnapshot(input: {
  today: string;
  activeSeconds: number;
  activityDays: LearningRewardDay[];
  lifetimePoints: number;
  redeemedPoints?: number;
}) {
  const activeSeconds = Math.max(0, Math.min(3_600, Math.trunc(input.activeSeconds) || 0));
  const todayAward = learningPointsForActiveSeconds(activeSeconds);
  const nextTier = learningPointTiers.find((tier) => tier.seconds > activeSeconds) ?? null;
  const monthPrefix = input.today.slice(0, 7);
  const weekStart = mondayFor(input.today);
  const activityDays = input.activityDays.map((day) => ({
    localDay: day.localDay,
    activeSeconds: Math.max(0, Math.min(3_600, Math.trunc(day.activeSeconds) || 0)),
    points: Math.max(0, Math.trunc(day.points) || 0),
  }));
  const monthDays = activityDays.filter((day) => day.localDay.startsWith(monthPrefix) && day.activeSeconds > 0);
  const weekDays = activityDays.filter((day) => day.localDay >= weekStart && day.localDay <= input.today);
  const streak = streaks(input.today, activityDays);
  const redeemedPoints = Math.max(0, Math.trunc(input.redeemedPoints ?? 0));
  const lifetimePoints = Math.max(0, Math.trunc(input.lifetimePoints) || 0);
  const availablePoints = Math.max(0, lifetimePoints - redeemedPoints);
  const unlockedBadges = badgeMilestones
    .filter((days) => streak.longest >= days)
    .map((days) => ({ days, key: `streak-${days}`, label: `${days}-day streak` }));
  const nextDays = badgeMilestones.find((days) => days > streak.longest);

  return {
    today: input.today,
    activeSeconds,
    todayAward,
    todayAwarded: todayAward > 0,
    nextTierPoints: nextTier?.points ?? null,
    nextTierSeconds: nextTier?.seconds ?? null,
    remainingSeconds: nextTier ? nextTier.seconds - activeSeconds : 0,
    monthLearningDays: monthDays.length,
    monthPoints: monthDays.reduce((sum, day) => sum + day.points, 0),
    weekMinutes: Math.floor(weekDays.reduce((sum, day) => sum + day.activeSeconds, 0) / 60),
    weekPoints: weekDays.reduce((sum, day) => sum + day.points, 0),
    lifetimePoints,
    redeemedPoints,
    availablePoints,
    redeemableCredits: Math.floor(availablePoints / 10),
    currentStreak: streak.current,
    longestStreak: streak.longest,
    unlockedBadges,
    nextBadge: nextDays ? { days: nextDays, remainingDays: nextDays - streak.longest, key: `streak-${nextDays}`, label: `${nextDays}-day streak` } : null,
    exchangeRate: { learningPoints: 10, aiCredits: 1, available: availablePoints >= 10 },
    activityDays,
  };
}
