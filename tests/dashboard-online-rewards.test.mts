import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import * as rewardsDomain from "../src/lib/engagement/domain.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const pointsForSeconds = (rewardsDomain as unknown as { learningPointsForActiveSeconds: (seconds: number) => number }).learningPointsForActiveSeconds;

test("daily online tiers are cumulative 0/1/5/10 with a 60 minute cap", () => {
  assert.equal(typeof pointsForSeconds, "function");
  assert.deepEqual(
    [0, 599, 600, 1_799, 1_800, 3_599, 3_600, 7_200].map(pointsForSeconds),
    [0, 0, 1, 1, 5, 5, 10, 10],
  );
});

test("reward snapshot needs no completed task and explains the next tier", () => {
  const buildRewardSnapshot = rewardsDomain.buildRewardSnapshot as unknown as (input: object) => Record<string, unknown>;
  const snapshot = buildRewardSnapshot({
    today: "2026-09-10",
    activeSeconds: 1_080,
    activityDays: [{ localDay: "2026-09-10", activeSeconds: 1_080, points: 1 }],
    lifetimePoints: 16,
    redeemedPoints: 0,
  });
  assert.equal(snapshot.todayAward, 1);
  assert.equal(snapshot.nextTierPoints, 5);
  assert.equal(snapshot.remainingSeconds, 720);
  assert.equal(snapshot.availablePoints, 16);
  assert.deepEqual(snapshot.exchangeRate, { learningPoints: 10, aiCredits: 1, available: true });
  assert.equal("needsTask" in snapshot, false);
  assert.equal("qualifyingTasks" in snapshot, false);
});

test("only the approved learning routes count online time", () => {
  const eligible = rewardsDomain.isEligibleLearningPath;
  for (const path of ["/today", "/vocabulary/3", "/review", "/mistakes", "/listen", "/reading", "/grammar", "/practice", "/placement", "/hsk-level-test", "/hsk-3-practice-test", "/hsk-4-reading-practice"]) {
    assert.equal(eligible(path), true, path);
  }
  for (const path of ["/dashboard", "/", "/pricing", "/store", "/blog", "/account", "/topics/travel", "/word/你好", "/character/你"]) {
    assert.equal(eligible(path), false, path);
  }
});

test("HSK 7–9 vocabulary total uses the unified advanced band once", async () => {
  const { releaseVocabularyTotals } = await import("../src/lib/learning/vocabulary-progress.ts");
  const advanced = releaseVocabularyTotals().find((row) => row.label === "HSK 7–9");
  assert.equal(advanced?.level, 7);
  assert.equal(advanced?.total, 5_636);
});

test("review accuracy uses only saved review outcomes, never ordinary attempts", async () => {
  const { buildGrowthSnapshot } = await import("../src/lib/learning/growth.ts");
  const snapshot = buildGrowthSnapshot({
    now: new Date("2026-09-10T12:00:00.000Z"),
    timezone: "UTC",
    activity: [
      { action: "attempt", createdAt: "2026-09-10T08:00:00.000Z" },
      { action: "grade", createdAt: "2026-09-10T09:00:00.000Z", reviewCorrect: true },
      { action: "retry_review", createdAt: "2026-09-10T10:00:00.000Z", reviewCorrect: false },
    ],
    attempts: [
      { contentId: "practice:not-review", observedAt: "2026-09-10T08:00:00.000Z", correct: true },
    ],
    levelTotals: [],
  });
  const today = snapshot.curve30.at(-1);
  assert.equal(today?.reviewCount, 2);
  assert.equal(today?.reviewAccuracy, 50);
});

test("review outcome metadata is persisted and read for truthful daily accuracy", () => {
  const route = read("src/app/api/v1/learning/route.ts");
  const storage = read("src/lib/learning/storage.ts");
  assert.match(route, /reviewCorrect/);
  assert.match(storage, /metadata_json/);
  assert.match(storage, /reviewCorrect/);
});

test("migration supports 60 minute days, incremental tiers and exact 10:1 redemption", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(read("migrations/0033_learning_engagement_rewards.sql"));
  db.exec(`CREATE TABLE credit_ledger (
    id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, units INTEGER NOT NULL CHECK(units <> 0),
    source TEXT NOT NULL CHECK(source IN ('referral_qualified','referral_paid','referral_spend','admin_reversal')),
    reward_id TEXT, operation_id TEXT, expires_at TEXT NOT NULL, created_at TEXT NOT NULL,
    UNIQUE(reward_id), UNIQUE(operation_id)
  );`);
  db.exec(read("migrations/0042_daily_online_rewards.sql"));
  db.prepare("INSERT INTO learning_engagement_days(owner_id,local_day,active_seconds,last_heartbeat_at,created_at,updated_at) VALUES(?,?,?,?,?,?)")
    .run("user:u1", "2026-09-10", 3_600, "2026-09-10T01:00:00Z", "2026-09-10T00:00:00Z", "2026-09-10T01:00:00Z");
  for (const points of [1, 5, 10]) {
    db.prepare("INSERT OR REPLACE INTO learning_point_ledger(id,owner_id,local_day,period_key,units,source,idempotency_key,created_at) VALUES(?,?,?,?,?,'daily_online_learning',?,?)")
      .run(`p${points}`, "user:u1", "2026-09-10", "2026-09", points, "daily-online:2026-09-10", "2026-09-10T01:00:00Z");
  }
  db.prepare("INSERT INTO learning_point_redemptions(id,owner_id,idempotency_key,points_spent,credits_granted,created_at) VALUES(?,?,?,?,?,?)")
    .run("r1", "user:u1", "redeem-0000000001", 10, 1, "2026-09-10T01:00:00Z");
  assert.throws(() => db.prepare("INSERT INTO learning_point_redemptions(id,owner_id,idempotency_key,points_spent,credits_granted,created_at) VALUES(?,?,?,?,?,?)")
    .run("r2", "user:u1", "redeem-0000000002", 20, 1, "2026-09-10T01:00:01Z"));
  db.prepare("INSERT INTO credit_ledger(id,owner_id,units,source,reward_id,operation_id,expires_at,created_at) VALUES(?,?,?,?,?,?,?,?)")
    .run("c1", "user:u1", 1, "learning_points_exchange", "r1", null, "9999-12-31T23:59:59.999Z", "2026-09-10T01:00:00Z");
  assert.equal(db.prepare("SELECT units FROM credit_ledger WHERE reward_id='r1'").get().units, 1);
});

test("server redemption is bounded, same-origin, idempotent and atomic", () => {
  const storage = read("src/lib/engagement/storage.ts");
  const route = read("src/app/api/v1/account/learning-rewards/route.ts");
  assert.match(storage, /export async function redeemLearningPoints/);
  assert.match(storage, /POINTS_MUST_BE_MULTIPLE_OF_10/);
  assert.match(storage, /INSUFFICIENT_LEARNING_POINTS/);
  assert.match(storage, /learning_point_redemptions/);
  assert.match(storage, /learning_points_exchange/);
  assert.match(storage, /db\.batch\(/);
  assert.match(route, /body\.action === "redeem"/);
  assert.match(route, /verifiedSameOrigin/);
  assert.match(route, /idempotencyKey/);
});
