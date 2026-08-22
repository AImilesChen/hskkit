import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  applyDailyItemAction,
  buildDailySession,
  emptyLearningState,
  type LearningState,
} from "../src/lib/learning/domain.ts";
import {
  beginOfflineOperation,
  failOfflineOperation,
  resolveOfflineConflict,
  startOfflineSync,
  succeedOfflineOperation,
} from "../src/lib/learning/offline-sync.ts";
import { buildPlannerDraft, plannerSignalsFromLearning } from "../src/lib/planner/domain.ts";
import { accessDecision, errorContract } from "../src/lib/account/access-policy.ts";

const now = "2026-08-22T10:00:00.000Z";

function learning(overrides: Partial<LearningState> = {}): LearningState {
  return { ...emptyLearningState(), ...overrides };
}

test("Today honors a user time budget and exposes ordered estimates and resumable state", () => {
  const built = buildDailySession(learning(), {
    ownerId: "user:one",
    localDay: "2026-08-22",
    ruleVersion: "today-v4",
    now,
    budgetMinutes: 12,
  });
  assert.equal(built.session.budgetMinutes, 12);
  assert.ok(built.session.totalEstimatedMinutes <= 12);
  assert.deepEqual(built.session.items.map((item) => item.kind), ["learn", "listen", "listen", "summary"]);
  assert.ok(built.session.items.every((item) => Number.isInteger(item.estimatedMinutes) && item.estimatedMinutes >= 0));

  const learn = built.session.items[0];
  const skipped = applyDailyItemAction(built.state, {
    sessionId: built.session.id,
    itemId: learn.id,
    action: "skip",
    idempotencyKey: "skip-1",
    observedAt: now,
  });
  assert.equal(skipped.item.status, "skipped");
  const replay = applyDailyItemAction(skipped.state, {
    sessionId: built.session.id,
    itemId: learn.id,
    action: "skip",
    idempotencyKey: "skip-1",
    observedAt: now,
  });
  assert.deepEqual(replay.state, skipped.state);
  const restored = applyDailyItemAction(skipped.state, {
    sessionId: built.session.id,
    itemId: learn.id,
    action: "restore",
    idempotencyKey: "restore-1",
    observedAt: now,
  });
  assert.equal(restored.item.status, "pending");

  const skippedForRefresh = applyDailyItemAction(restored.state, {
    sessionId: built.session.id,
    itemId: learn.id,
    action: "skip",
    idempotencyKey: "skip-refresh-1",
    observedAt: now,
  });
  const refreshed = buildDailySession(skippedForRefresh.state, {
    ownerId: "user:one",
    localDay: "2026-08-22",
    ruleVersion: "today-v4",
    now: "2026-08-22T10:01:00.000Z",
    budgetMinutes: 15,
  });
  assert.equal(refreshed.session.id, built.session.id);
  assert.equal(refreshed.session.items.find((item) => item.id === learn.id)?.status, "skipped");
  const restoredAfterRefresh = applyDailyItemAction(refreshed.state, {
    sessionId: built.session.id,
    itemId: learn.id,
    action: "restore",
    idempotencyKey: "restore-refresh-1",
    observedAt: "2026-08-22T10:02:00.000Z",
  });
  assert.equal(restoredAfterRefresh.item.status, "pending");
});

test("offline queue has explicit local_pending, syncing, synced, conflict and failed/retry states", () => {
  const pending = beginOfflineOperation({ action: "skip_item", payload: { itemId: "learn:1" }, clientRevision: 3 }, "op-1", now);
  assert.equal(pending.state, "local_pending");
  assert.equal(startOfflineSync(pending).state, "syncing");
  assert.equal(succeedOfflineOperation(startOfflineSync(pending), 4).state, "synced");
  const failed = failOfflineOperation(startOfflineSync(pending), "NETWORK_UNAVAILABLE", true);
  assert.equal(failed.state, "failed");
  assert.equal(failed.retryable, true);
  assert.equal(startOfflineSync(failed).state, "syncing");
  const conflict = failOfflineOperation(startOfflineSync(pending), "REVISION_CONFLICT", true, 5);
  assert.equal(conflict.state, "conflict");
  assert.equal(resolveOfflineConflict(conflict, 5).state, "local_pending");
  assert.equal(resolveOfflineConflict(conflict, 5).clientRevision, 5);
});

test("Planner records Placement, Practice weaknesses, SRS load, goals, time and adjustment reasons", () => {
  const state = learning({
    placementResults: [{
      id: "result-1", sessionId: "placement-1", submitIdempotencyKey: "submit-1",
      questionVersion: "placement-v2", recommendedLevel: 4, correctCount: 5, totalCount: 8,
      confidence: "medium", missingDimensions: [], weakSkills: ["listening"],
      evidenceSummary: "mixed", disclaimer: "diagnostic", createdAt: now,
    }],
    attempts: [{
      id: "a1", idempotencyKey: "a1", contentId: "practice:grammar", contentVersion: "v1",
      dimension: "reading", answer: "B", correctAnswer: "A", correct: false, observedAt: now,
      mode: "practice", skill: "grammar",
    }],
    cards: [{
      id: "c1", contentId: "practice:grammar", contentVersion: "v1", dimension: "reading",
      dueAt: now, intervalDays: 0, ease: 2.5, revision: 0, reviewCount: 0,
      algorithmVersion: "hskkit-srs-v1", sourceAttemptId: "a1", gradeKeys: [],
    }],
    mistakes: [{ id: "m1", contentId: "practice:grammar", contentVersion: "v1", sourceAttemptId: "a1", status: "open", createdAt: now }],
  });
  const signals = plannerSignalsFromLearning(state, now);
  assert.equal(signals.placementLevel, 4);
  assert.ok(signals.weakPoints.includes("grammar"));
  assert.equal(signals.dueCards, 1);
  const result = buildPlannerDraft({
    goalLevel: 5, targetDate: "2027-08-22", weeklyMinutes: 180, preferredDays: [1, 3, 5],
    weakPoints: signals.weakPoints, state, now, placementLevel: signals.placementLevel,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.plan.signals.placementLevel, 4);
  assert.equal(result.plan.signals.dueCards, 1);
  assert.ok(result.plan.adjustmentReasons.some((reason) => reason.code === "PLACEMENT_BASELINE"));
  assert.ok(result.plan.adjustmentReasons.some((reason) => reason.code === "PRACTICE_WEAKNESS"));
  const lowerBaseline = buildPlannerDraft({
    goalLevel: 5, targetDate: "2027-08-22", weeklyMinutes: 180, preferredDays: [1, 3, 5],
    weakPoints: signals.weakPoints, state, now, placementLevel: 1,
  });
  assert.equal(lowerBaseline.ok, true);
  if (!lowerBaseline.ok) return;
  const goalMinutes = (plan: typeof result.plan) => plan.sessions.flatMap((session) => session.tasks).filter((task) => task.source === "goal").reduce((sum, task) => sum + task.minutes, 0);
  assert.ok(goalMinutes(lowerBaseline.plan) > goalMinutes(result.plan));
});

test("access policy fails closed after revocation and uses one recoverable error contract", () => {
  assert.deepEqual(accessDecision({ accountStatus: "active", permission: "learning:write" }), { allowed: true, policy: "hskkit-access-v1" });
  assert.deepEqual(accessDecision({ accountStatus: "deleted", permission: "learning:read" }), { allowed: false, policy: "hskkit-access-v1", code: "ACCESS_REVOKED" });
  assert.deepEqual(accessDecision({ accountStatus: "guest", permission: "account:sync" }), { allowed: false, policy: "hskkit-access-v1", code: "ACCOUNT_REQUIRED" });
  assert.deepEqual(errorContract("REVISION_CONFLICT"), { error: "REVISION_CONFLICT", recoverable: true, recovery: "reload_then_retry" });
  assert.deepEqual(errorContract("ACCESS_REVOKED"), { error: "ACCESS_REVOKED", recoverable: false, recovery: "sign_out" });
  assert.deepEqual(errorContract("ACCOUNT_REQUIRED"), { error: "ACCOUNT_REQUIRED", recoverable: true, recovery: "sign_in" });
});

test("Learning, Planner, Merge and Sync production routes use access, unified errors and policy audit", async () => {
  const routes = await Promise.all([
    readFile(new URL("../src/app/api/v1/learning/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/v1/planner/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/v1/account/merge/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/v1/account/sync/route.ts", import.meta.url), "utf8"),
  ]);
  for (const source of routes) {
    assert.match(source, /accessDecision/);
    assert.match(source, /errorContract/);
    assert.match(source, /(createAuditEvent|recordPolicyAudit)/);
  }
  const migration = await readFile(new URL("../migrations/0008_batch12_learning_system.sql", import.meta.url), "utf8");
  assert.match(migration, /CREATE TABLE policy_audit_events/);
  assert.match(migration, /UNIQUE\(subject_id,action,idempotency_key,result\)/);
});

test("Learning GET is read-only and the first learning record write belongs to an explicit POST action", async () => {
  const source = await readFile(new URL("../src/app/api/v1/learning/route.ts", import.meta.url), "utf8");
  const getBody = source.slice(source.indexOf("export async function GET"), source.indexOf("export async function POST"));
  assert.doesNotMatch(getBody, /saveState\s*\(/);
  assert.match(source, /action === "configure_today"/);
  assert.match(source, /action === "skip_item"/);
  assert.match(source, /action === "restore_item"/);
});
