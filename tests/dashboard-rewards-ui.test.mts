import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const rewards = read("src/app/dashboard/dashboard-rewards.tsx");
const growth = read("src/app/dashboard/dashboard-growth.tsx");
const core = read("src/app/dashboard/dashboard-core.tsx");
const tracker = read("src/app/components/learning-engagement-tracker.tsx");

test("today reward card exposes live minutes, cumulative milestones and a real next action", () => {
  for (const token of ["Today’s online learning", "10 min · 1 point", "30 min · 5 points", "60 min · 10 points", "Continue learning", "nextTierPoints", "activeSeconds"]) {
    assert.match(rewards, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(core, /primaryHref=\{primary\.href\}/);
  assert.doesNotMatch(rewards, /foreground|qualifying task|effective day|monthly reward tier/i);
});

test("learning tracker starts on approved pages, pauses in background and gives instant tier feedback", () => {
  assert.match(tracker, /lastActivityAt = Date\.now\(\)/);
  assert.match(tracker, /document\.visibilityState !== "visible"/);
  assert.match(tracker, /now - lastActivityAt > 90_000/);
  assert.match(tracker, /hskkit:learning-reward/);
  assert.match(tracker, /todayAward/);
  assert.match(tracker, /Online learning reached/);
});

test("redemption shows disabled, single and multiple-credit states with confirmation and history", () => {
  for (const token of ["Redeem AI credits", "availablePoints", "redeemableCredits", "Confirm exchange", "Redemption history", "action: \"redeem\"", "crypto.randomUUID()", "onRewardsChange"]) {
    assert.match(rewards, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(core, /onRewardsChange=\{setRewards\}/);
});

test("calendar is actionable today, inspectable in the past and blocks future dates", () => {
  for (const token of ["Daily learning calendar", "Start today’s learning", "selectedDay", "activeSeconds", "points", "newWords", "reviewAccuracy", "isFuture"]) {
    assert.match(growth, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(growth, /disabled=\{day\.isFuture\}/);
});

test("learning curve defaults to real minutes and supports four truthful metrics over 7 or 30 days", () => {
  for (const token of ["Effective learning minutes", "Learning time", "Completed tasks", "New vocabulary", "Review accuracy", "7 days", "30 days", "weekSummary"]) {
    assert.match(growth, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(growth, /useState<CurveMetric>\("minutes"\)/);
  assert.match(growth, /Start today’s learning/);
});

test("weekly signals and HSK vocabulary wording stay explicit and use a consistent icon system", () => {
  for (const token of ["This week’s learning", "Learning time", "Learning points", "New vocabulary", "Due for review", "saved learning records", "RewardIcon", "TrendIcon", "BookIcon", "HeadphonesIcon", "TargetIcon", "LockIcon"]) {
    assert.match(core + rewards + growth, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.doesNotMatch(core + rewards + growth, /🔥|🏆|⭐|🎁|📅|📈/);
});

test("remaining dashboard requirements expose rules, activity bands, interactive detail, comparisons, skills and full badges", () => {
  for (const token of ["How points work", "cumulative, not added together", "Up to 10 points per day", "locked or idle time pauses automatically"]) assert.match(rewards, new RegExp(token));
  for (const token of ["Under 10 min", "10–29 min", "30–59 min", "60 min", "calendarTone", "selectedCurveDay", "Compared with previous", "changePercent", "Click or focus a point for daily details", "Listening", "Speaking", "Reading", "Writing", "Skill evidence", "No saved attempts yet"]) assert.match(growth, new RegExp(token));
  for (const token of ["First rhythm", "One-week streak", "Two-week streak", "Monthly habit", "60-day momentum", "90-day consistency", "consecutive learning days"]) assert.match(rewards, new RegExp(token));
});
