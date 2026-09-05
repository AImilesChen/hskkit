export const EFFECTIVE_LEARNING_SECONDS = 15 * 60;
export const badgeMilestones = [3, 7, 14, 30, 60, 90] as const;

export function isEligibleLearningPath(path: string) {
  return /^\/(today|review|practice|listen|placement|hsk-level-test|reading|vocabulary|mistakes|grammar)(\/|$)/.test(path)
    || /^\/(topics|word|character)\//.test(path)
    || /^\/hsk-[1-9]-(practice-test|reading-practice)(\/|$)/.test(path);
}

export type RewardedLearningDay = { localDay: string; points: number };

const dayNumber = (day: string) => Math.floor(Date.parse(`${day}T00:00:00.000Z`) / 86_400_000);
const monthKey = (day: string) => day.slice(0, 7);

export function creditedHeartbeatSeconds(claimedSeconds: number, sessionCreatedAt: Date, now: Date) {
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - sessionCreatedAt.getTime()) / 1000));
  return Math.min(30, Math.max(0, Math.trunc(claimedSeconds)), elapsedSeconds);
}

export function learningPointsForMonthlyDay(day: number) {
  if (!Number.isInteger(day) || day < 1) throw new Error("INVALID_MONTHLY_LEARNING_DAY");
  if (day <= 7) return 2;
  if (day <= 14) return 4;
  if (day <= 21) return 6;
  return 10;
}

export function learningStreak(days: string[], today: string) {
  const ordered = [...new Set(days)].sort();
  let longest = 0;
  let run = 0;
  let prior: number | undefined;
  for (const day of ordered) {
    const current = dayNumber(day);
    run = prior !== undefined && current === prior + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prior = current;
  }
  let current = 0;
  if (ordered.length) {
    const last = dayNumber(ordered.at(-1)!);
    const gap = dayNumber(today) - last;
    if (gap === 0 || gap === 1) {
      current = 1;
      for (let index = ordered.length - 1; index > 0; index -= 1) {
        if (dayNumber(ordered[index]) - dayNumber(ordered[index - 1]) !== 1) break;
        current += 1;
      }
    }
  }
  return { current, longest };
}

export function buildRewardSnapshot(input: {
  today: string;
  activeSeconds: number;
  qualifyingTasks: number;
  rewardedDays: RewardedLearningDay[];
  lifetimePoints: number;
}) {
  const todayReward = input.rewardedDays.find((entry) => entry.localDay === input.today);
  const monthDays = input.rewardedDays.filter((entry) => monthKey(entry.localDay) === monthKey(input.today));
  const todayQualified = Boolean(todayReward) || (input.activeSeconds >= EFFECTIVE_LEARNING_SECONDS && input.qualifyingTasks >= 1);
  const nextMonthLearningDay = monthDays.length + (todayReward ? 0 : 1);
  const streak = learningStreak(input.rewardedDays.map((entry) => entry.localDay), input.today);
  const unlockedBadges = badgeMilestones
    .filter((days) => streak.longest >= days)
    .map((days) => ({ days, key: `streak-${days}`, label: `${days}-day streak` }));
  const nextBadgeDays = badgeMilestones.find((days) => days > streak.longest);
  return {
    today: input.today,
    todayQualified,
    todayAwarded: Boolean(todayReward),
    todayAward: todayReward?.points ?? (todayQualified ? learningPointsForMonthlyDay(nextMonthLearningDay) : 0),
    activeSeconds: Math.min(EFFECTIVE_LEARNING_SECONDS, Math.max(0, Math.trunc(input.activeSeconds))),
    remainingSeconds: Math.max(0, EFFECTIVE_LEARNING_SECONDS - Math.max(0, Math.trunc(input.activeSeconds))),
    qualifyingTasks: Math.max(0, Math.trunc(input.qualifyingTasks)),
    needsTask: input.qualifyingTasks < 1,
    monthLearningDays: monthDays.length,
    nextMonthLearningDay,
    nextAward: learningPointsForMonthlyDay(nextMonthLearningDay),
    monthPoints: monthDays.reduce((sum, entry) => sum + entry.points, 0),
    lifetimePoints: Math.max(0, Math.trunc(input.lifetimePoints)),
    currentStreak: streak.current,
    longestStreak: streak.longest,
    unlockedBadges,
    nextBadge: nextBadgeDays
      ? { days: nextBadgeDays, remainingDays: Math.max(0, nextBadgeDays - streak.current), key: `streak-${nextBadgeDays}`, label: `${nextBadgeDays}-day streak` }
      : null,
    exchangeRate: { learningPoints: 10, aiCredits: 1, available: false },
  };
}
