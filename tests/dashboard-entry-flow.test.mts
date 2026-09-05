import assert from "node:assert/strict";
import test from "node:test";
import {
  dashboardPrimaryAction,
  learningEntryDestination,
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
