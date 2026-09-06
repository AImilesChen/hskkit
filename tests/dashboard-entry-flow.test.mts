import assert from "node:assert/strict";
import test from "node:test";
import {
  dashboardPrimaryAction,
  isTransientDashboardStorageError,
  learningEntryDestination,
  loadDashboardServerData,
  resolveCurrentLearningLevel,
} from "../src/lib/learning/dashboard.ts";

const emptyState = {
  attempts: [],
  cards: [],
  mistakes: [],
  dailySessions: [],
};

test("learning entry sends signed-out visitors through login and back to the dispatcher", () => {
  assert.equal(learningEntryDestination(false, emptyState), "/login?returnTo=%2Fstart");
});

test("learning entry sends new accounts and incomplete placement sessions to onboarding", () => {
  assert.equal(learningEntryDestination(true, emptyState), "/placement?onboarding=1");
  assert.equal(learningEntryDestination(true, {
    ...emptyState,
    placementSessions: [{ id: "placement-in-progress" }],
  }), "/placement?onboarding=1");
});

test("learning entry sends established learners to dashboard", () => {
  assert.equal(learningEntryDestination(true, {
    ...emptyState,
    placementResults: [{ id: "result-1", recommendedLevel: 3, createdAt: "2026-09-05T00:00:00.000Z" }],
  }), "/dashboard");
  assert.equal(learningEntryDestination(true, {
    ...emptyState,
    cards: [{ id: "card-1" }],
  }), "/dashboard");
});

test("dashboard resolves the saved or latest recommended HSK level", () => {
  assert.equal(resolveCurrentLearningLevel(emptyState), 1);
  assert.equal(resolveCurrentLearningLevel({
    ...emptyState,
    placementResults: [
      { id: "older", recommendedLevel: 2, createdAt: "2026-09-01T00:00:00.000Z" },
      { id: "latest", recommendedLevel: 4, createdAt: "2026-09-05T00:00:00.000Z" },
    ],
  }), 4);
  assert.equal(resolveCurrentLearningLevel({
    ...emptyState,
    preferredLearningLevel: 5,
    placementResults: [{ id: "latest", recommendedLevel: 4, createdAt: "2026-09-05T00:00:00.000Z" }],
  }), 5);
});

test("dashboard exposes exactly one primary action in the approved priority order", () => {
  assert.deepEqual(dashboardPrimaryAction({
    dueReviews: 7,
    currentLevel: 3,
    items: [{ kind: "learn", status: "completed" }, { kind: "practice", status: "pending" }],
  }), { label: "Continue today’s learning", href: "/today" });
  assert.deepEqual(dashboardPrimaryAction({ dueReviews: 7, currentLevel: 3, items: [] }), {
    label: "Start today’s review",
    href: "/review?source=today",
  });
  assert.deepEqual(dashboardPrimaryAction({ dueReviews: 0, currentLevel: 3, items: [] }), {
    label: "Learn new words",
    href: "/vocabulary/3?mode=flashcards#vocabulary-activities",
  });
});

test("dashboard recognizes Cloudflare D1 overload failures as transient", () => {
  assert.equal(isTransientDashboardStorageError(new Error("D1_ERROR: D1 DB is overloaded. Requests queued for too long. [code: 7429]")), true);
  assert.equal(isTransientDashboardStorageError(new Error("no such table: learning_states")), false);
});

test("dashboard server data retries a transient D1 failure and then succeeds", async () => {
  let attempts = 0;
  const waits: number[] = [];
  const result = await loadDashboardServerData(async () => {
    attempts += 1;
    if (attempts === 1) throw new Error("D1 DB is overloaded [code: 7429]");
    return "ready";
  }, async (delayMs) => { waits.push(delayMs); });
  assert.equal(result.status, "ready");
  assert.equal(result.data, "ready");
  assert.equal(attempts, 2);
  assert.deepEqual(waits, [50]);
});

test("dashboard server data returns a retryable fallback after bounded D1 failures", async () => {
  let attempts = 0;
  const result = await loadDashboardServerData(async () => {
    attempts += 1;
    throw new Error("D1 DB is overloaded [code: 7429]");
  }, async () => {});
  assert.equal(result.status, "temporarily_unavailable");
  assert.equal(attempts, 3);
});

test("dashboard server data does not hide non-transient failures", async () => {
  let attempts = 0;
  await assert.rejects(() => loadDashboardServerData(async () => {
    attempts += 1;
    throw new Error("no such table: learning_states");
  }, async () => {}), /no such table/);
  assert.equal(attempts, 1);
});
