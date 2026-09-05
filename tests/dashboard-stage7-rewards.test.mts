import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  badgeMilestones,
  buildRewardSnapshot,
  creditedHeartbeatSeconds,
  isEligibleLearningPath,
  learningPointsForMonthlyDay,
} from "../src/lib/engagement/domain.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("monthly learning points use the approved natural-month tiers", () => {
  for (const day of [1, 7]) assert.equal(learningPointsForMonthlyDay(day), 2);
  for (const day of [8, 14]) assert.equal(learningPointsForMonthlyDay(day), 4);
  for (const day of [15, 21]) assert.equal(learningPointsForMonthlyDay(day), 6);
  for (const day of [22, 30, 31]) assert.equal(learningPointsForMonthlyDay(day), 10);
  assert.throws(() => learningPointsForMonthlyDay(0), /INVALID_MONTHLY_LEARNING_DAY/);
});

test("reward snapshot requires 15 active foreground minutes and one real task", () => {
  const inactive = buildRewardSnapshot({
    today: "2026-09-05", activeSeconds: 899, qualifyingTasks: 1,
    rewardedDays: [], lifetimePoints: 0,
  });
  assert.equal(inactive.todayQualified, false);
  assert.equal(inactive.todayAward, 0);
  assert.equal(inactive.remainingSeconds, 1);

  const noTask = buildRewardSnapshot({
    today: "2026-09-05", activeSeconds: 900, qualifyingTasks: 0,
    rewardedDays: [], lifetimePoints: 0,
  });
  assert.equal(noTask.todayQualified, false);
  assert.equal(noTask.needsTask, true);
});

test("the server never credits more heartbeat time than has elapsed since session creation", () => {
  const createdAt = new Date("2026-09-05T12:00:00.000Z");
  assert.equal(creditedHeartbeatSeconds(30, createdAt, new Date("2026-09-05T12:00:00.000Z")), 0);
  assert.equal(creditedHeartbeatSeconds(30, createdAt, new Date("2026-09-05T12:00:07.900Z")), 7);
  assert.equal(creditedHeartbeatSeconds(30, createdAt, new Date("2026-09-05T12:00:45.000Z")), 30);
});

test("natural-month ordinal resets while lifetime points do not", () => {
  const snapshot = buildRewardSnapshot({
    today: "2026-09-05", activeSeconds: 900, qualifyingTasks: 1,
    rewardedDays: [
      { localDay: "2026-08-30", points: 10 },
      { localDay: "2026-09-01", points: 2 },
      { localDay: "2026-09-03", points: 2 },
    ],
    lifetimePoints: 14,
  });
  assert.equal(snapshot.monthLearningDays, 2);
  assert.equal(snapshot.nextMonthLearningDay, 3);
  assert.equal(snapshot.todayAward, 2);
  assert.equal(snapshot.lifetimePoints, 14);

  const tierBoundary = buildRewardSnapshot({
    today: "2026-09-08", activeSeconds: 0, qualifyingTasks: 0,
    rewardedDays: Array.from({ length: 7 }, (_, index) => ({ localDay: `2026-09-${String(index + 1).padStart(2, "0")}`, points: 2 })),
    lifetimePoints: 14,
  });
  assert.equal(tierBoundary.nextAward, 4);
});

test("streak and approved badges use effective rewarded days, not visits", () => {
  const rewardedDays = ["2026-08-30", "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05", "2026-09-06", "2026-09-07"].map((localDay) => ({ localDay, points: 2 }));
  const snapshot = buildRewardSnapshot({ today: "2026-09-07", activeSeconds: 900, qualifyingTasks: 1, rewardedDays, lifetimePoints: 16 });
  assert.equal(snapshot.currentStreak, 7);
  assert.equal(snapshot.longestStreak, 7);
  assert.deepEqual(snapshot.unlockedBadges.map((badge) => badge.days), [3, 7]);
  assert.equal(snapshot.nextBadge?.days, 14);
  assert.deepEqual(badgeMilestones, [3, 7, 14, 30, 60, 90]);
});

test("broken streak keeps earned badges and points to the first still-locked milestone", () => {
  const rewardedDays = [1, 2, 3, 4, 5].map((day) => ({ localDay: `2026-08-${String(day).padStart(2, "0")}`, points: 2 }));
  const snapshot = buildRewardSnapshot({ today: "2026-08-10", activeSeconds: 0, qualifyingTasks: 0, rewardedDays, lifetimePoints: 10 });
  assert.equal(snapshot.currentStreak, 0);
  assert.deepEqual(snapshot.unlockedBadges.map((badge) => badge.days), [3]);
  assert.equal(snapshot.nextBadge?.days, 7);
});

test("eligible learning routes include SPA destinations used by daily tasks", () => {
  for (const path of ["/today", "/review", "/practice/2/listening", "/listen/a", "/reading/session/a", "/vocabulary/3", "/topics/travel/practice", "/word/xue-xi/practice", "/grammar/ba-sentence-basics", "/hsk-1-practice-test", "/hsk-1-reading-practice"]) {
    assert.equal(isEligibleLearningPath(path), true, path);
  }
  assert.equal(isEligibleLearningPath("/pricing"), false);
  assert.equal(isEligibleLearningPath("/dashboard"), false);
});

test("stage 7 ships server reconciliation, foreground heartbeat and dashboard reward UI without AI conversion", () => {
  const migration = read("../migrations/0033_learning_engagement_rewards.sql");
  const route = read("../src/app/api/v1/account/learning-rewards/route.ts");
  const tracker = read("../src/app/components/learning-engagement-tracker.tsx");
  const dashboard = read("../src/app/dashboard/dashboard-rewards.tsx");
  const layout = read("../src/app/layout.tsx");
  const accountStorage = read("../src/lib/account/storage.ts");
  assert.match(migration, /learning_engagement_days/);
  assert.match(migration, /learning_point_ledger/);
  assert.match(migration, /UNIQUE\s*\(owner_id,\s*local_day\)/i);
  assert.match(route, /requestIdentity/);
  assert.match(route, /recordForegroundHeartbeat/);
  assert.match(route, /startLearningEngagement/);
  assert.match(route, /verifiedPageRoute/);
  assert.match(tracker, /document\.visibilityState/);
  assert.match(tracker, /usePathname/);
  assert.match(tracker, /sessionToken/);
  assert.match(tracker, /timeupdate/);
  assert.match(tracker, /\/api\/v1\/account\/learning-rewards/);
  assert.match(dashboard, /Today:/);
  assert.match(dashboard, /15 min/);
  assert.match(dashboard, /Badge wall/);
  assert.match(dashboard, /10 learning points = 1 AI credit/);
  assert.match(dashboard, /Conversion is not open yet/);
  assert.match(layout, /LearningEngagementTracker/);
  assert.match(accountStorage, /rewards:\s*\{/);
  assert.match(accountStorage, /DELETE FROM learning_reward_profiles/);
  assert.doesNotMatch(route, /credit_ledger/);
  assert.doesNotMatch(route, /error instanceof Error \? error\.message/);
});
