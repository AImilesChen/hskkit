import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  FREE_CAPABILITIES,
  PRO_CAPABILITIES,
  capabilitiesForEntitlement,
  historyWindow,
  usagePeriodKey,
  aiCreditCost,
} from "../src/lib/commercial/capabilities.ts";
import { projectLearningHistory } from "../src/lib/learning/projection.ts";
import type { LearningState } from "../src/lib/learning/domain.ts";

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("P0 freezes Free and Pro product capabilities without adding another plan", () => {
  assert.deepEqual(FREE_CAPABILITIES, {
    tier: "free",
    dailyNewItems: 10,
    dailyReviewGrades: 20,
    syncDevices: 1,
    historyMaxEntries: 100,
    historyRetentionDays: 7,
    focusedReview: false,
    aiMonthlyCredits: 0,
    aiRequestsPerHour: 0,
    aiConcurrency: 0,
  });
  assert.deepEqual(PRO_CAPABILITIES, {
    tier: "pro",
    dailyNewItems: null,
    dailyReviewGrades: null,
    syncDevices: 3,
    historyMaxEntries: 10_000,
    historyRetentionDays: null,
    focusedReview: true,
    aiMonthlyCredits: 500,
    aiRequestsPerHour: 10,
    aiConcurrency: 1,
  });
});

test("only a currently active, non-expired entitlement resolves to Pro", () => {
  const now = new Date("2026-08-24T12:00:00Z");
  assert.equal(capabilitiesForEntitlement({ status: "active", endsAt: "2026-09-24T00:00:00Z" }, now).tier, "pro");
  assert.equal(capabilitiesForEntitlement({ status: "active", endsAt: null }, now).tier, "pro");
  for (const status of ["suspended", "ended", "revoked", null] as const) {
    assert.equal(capabilitiesForEntitlement(status ? { status, endsAt: null } : null, now).tier, "free");
  }
  assert.equal(capabilitiesForEntitlement({ status: "active", endsAt: "2026-08-24T11:59:59Z" }, now).tier, "free");
});

test("usage periods and AI costs are deterministic", () => {
  const now = new Date("2026-08-24T12:34:56Z");
  assert.equal(usagePeriodKey("day", now), "2026-08-24");
  assert.equal(usagePeriodKey("month", now), "2026-08");
  assert.equal(aiCreditCost("explanation"), 1);
  assert.equal(aiCreditCost("study_plan"), 5);
});

test("history projection applies Free retention and Pro maximum entry count", () => {
  const rows = [
    { id: "new", observedAt: "2026-08-24T10:00:00Z" },
    { id: "old", observedAt: "2026-08-01T10:00:00Z" },
  ];
  assert.deepEqual(historyWindow(rows, FREE_CAPABILITIES, new Date("2026-08-24T12:00:00Z")).map((row) => row.id), ["new"]);
  assert.deepEqual(historyWindow(rows, PRO_CAPABILITIES, new Date("2026-08-24T12:00:00Z")).map((row) => row.id), ["new", "old"]);
});

test("server history projection blocks expired Free history without deleting Pro history", () => {
  const state = {
    attempts: [
      { id: "old-attempt", observedAt: "2026-08-01T10:00:00Z" },
      { id: "new-attempt", observedAt: "2026-08-24T10:00:00Z" },
    ],
    cards: [
      { id: "old-card", sourceAttemptId: "old-attempt" },
      { id: "new-card", sourceAttemptId: "new-attempt" },
    ],
    mistakes: [
      { id: "old-mistake", sourceAttemptId: "old-attempt", createdAt: "2026-08-01T10:00:00Z" },
      { id: "new-mistake", sourceAttemptId: "new-attempt", createdAt: "2026-08-24T10:00:00Z" },
    ],
    dailySessions: [
      { id: "old-session", createdAt: "2026-08-01T10:00:00Z" },
      { id: "new-session", createdAt: "2026-08-24T10:00:00Z" },
    ],
  } as unknown as LearningState;
  const now = new Date("2026-08-24T12:00:00Z");
  const free = projectLearningHistory(state, FREE_CAPABILITIES, now);
  assert.deepEqual(free.attempts.map((item) => item.id), ["new-attempt"]);
  assert.deepEqual(free.cards.map((item) => item.id), ["new-card"]);
  assert.deepEqual(free.mistakes.map((item) => item.id), ["new-mistake"]);
  assert.deepEqual(free.dailySessions.map((item) => item.id), ["new-session"]);
  assert.equal(projectLearningHistory(state, PRO_CAPABILITIES, now).attempts.length, 2);
  assert.equal(state.attempts.length, 2, "projection must not destroy retained server history");
});

test("P0 is wired into entitlement, learning, sync, AI, account UI and a dedicated migration", async () => {
  const [storage, learning, learningStorage, sync, ai, account, migration] = await Promise.all([
    read("src/lib/commercial/storage.ts"),
    read("src/app/api/v1/learning/route.ts"),
    read("src/lib/learning/storage.ts"),
    read("src/app/api/v1/account/sync/route.ts"),
    read("src/lib/ai/storage.ts"),
    read("src/app/account/account-client.tsx"),
    read("migrations/0017_p0_pro_capabilities.sql"),
  ]);
  assert.match(storage, /resolveCapabilities/);
  assert.match(storage, /SUM\(COALESCE\(credit_units,cost_units\)\)/);
  assert.match(learning, /daily_new_items/);
  assert.match(learning, /daily_review_grades/);
  assert.match(learning, /focusedReview/);
  assert.doesNotMatch(learning, /1_000_000/);
  assert.match(learning, /dailyReviewGrades !== null/);
  assert.match(learning, /dailyNewItems !== null/);
  assert.match(learning, /action === "grade"/);
  assert.match(learning, /action === "undo_review" \|\| dailyAction/);
  assert.match(learningStorage, /SELECT 1 replayed FROM entitlement_usage_events/);
  assert.match(sync, /DEVICE_LIMIT_REACHED/);
  assert.match(sync, /searchParams\.get\("deviceId"\)/);
  assert.match(sync, /projectLearningHistory/);
  assert.match(ai, /cost_units/);
  assert.match(ai, /rateLimitPerHour/);
  assert.match(account, /Focused Review/);
  assert.match(account, /500 AI credits/);
  assert.match(migration, /allowance BETWEEN 0 AND 500/);
  assert.match(migration, /credit_units INTEGER NOT NULL DEFAULT 1/);
  for (const table of ["entitlement_usage_counters", "entitlement_usage_events", "account_devices"]) {
    assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  }
});
