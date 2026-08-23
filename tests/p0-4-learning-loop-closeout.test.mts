import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { emptyLearningState, type LearningState } from "../src/lib/learning/domain.ts";
import { computeOffsetSessionStreak, deriveHomeNextStep, learningLocalDay } from "../src/lib/learning/progress.ts";

const now = "2026-08-23T12:00:00.000Z";
const placement = {
  id: "result-1",
  sessionId: "placement-1",
  submitIdempotencyKey: "submit-1",
  questionVersion: "placement-v2",
  recommendedLevel: 3,
  correctCount: 3,
  totalCount: 8,
  confidence: "low" as const,
  missingDimensions: ["listening"],
  weakSkills: ["reading"],
  evidenceSummary: "diagnostic",
  disclaimer: "not official",
  createdAt: now,
};

function learning(overrides: Partial<LearningState> = {}): LearningState {
  return { ...emptyLearningState(), ...overrides };
}

test("home next step is deterministic for new, progressing and due-review learners", () => {
  assert.deepEqual(deriveHomeNextStep(learning(), now), {
    kind: "placement",
    label: "Start placement",
    href: "/placement",
    explanation: "Find an evidence-based starting level before building today's queue.",
  });
  assert.deepEqual(deriveHomeNextStep(learning({ placementResults: [placement] }), now), {
    kind: "today",
    label: "Continue today",
    href: "/today",
    explanation: "Continue the learning queue built from your saved progress.",
  });
  const due = learning({
    placementResults: [placement],
    cards: [{
      id: "card-1", contentId: "practice:q1", contentVersion: "v1", dimension: "reading",
      dueAt: now, intervalDays: 0, ease: 2.5, revision: 0, reviewCount: 0,
      algorithmVersion: "hskkit-srs-v1", sourceAttemptId: "attempt-1", gradeKeys: [],
    }],
  });
  assert.deepEqual(deriveHomeNextStep(due, now), {
    kind: "review",
    label: "Review due",
    href: "/review",
    explanation: "Review due items before adding more new work.",
  });
});

test("device-local streak counts only completed Daily sessions with real completed work", () => {
  const sessions = [
    { id: "d1", ownerId: "guest", localDay: "2026-08-21", ruleVersion: "today-v4", createdAt: "2026-08-21T12:00:00.000Z", completedAt: "2026-08-21T12:20:00.000Z", items: [{ id: "learn", kind: "learn" as const, contentId: "word:1", status: "completed" as const }, { id: "summary", kind: "summary" as const, contentId: "summary", status: "completed" as const }] },
    { id: "d2", ownerId: "guest", localDay: "2026-08-22", ruleVersion: "today-v4", createdAt: "2026-08-22T12:00:00.000Z", completedAt: "2026-08-22T12:20:00.000Z", items: [{ id: "learn", kind: "learn" as const, contentId: "word:2", status: "completed" as const }, { id: "summary", kind: "summary" as const, contentId: "summary", status: "completed" as const }] },
    { id: "visit-only", ownerId: "guest", localDay: "2026-08-23", ruleVersion: "today-v4", createdAt: now, items: [{ id: "summary", kind: "summary" as const, contentId: "summary", status: "completed" as const }] },
  ];
  const streak = computeOffsetSessionStreak(sessions, 0, now);
  assert.equal(streak.current, 2);
  assert.equal(streak.longest, 2);
  assert.equal(streak.lastLearningDay, "2026-08-22");
  assert.equal(streak.policy, "completed_daily_session_device_day_v1");
});

test("account learning day uses the saved account timezone while guest history keeps stored local days", () => {
  assert.equal(learningLocalDay("2026-08-23T01:00:00.000Z", -540, "America/New_York"), "2026-08-22");
  assert.equal(learningLocalDay("2026-08-23T01:00:00.000Z", -540), "2026-08-23");
  assert.throws(() => learningLocalDay(now, 0, "Invalid/Timezone"), /INVALID_TIMEZONE/);
});

test("production UI and learning API expose the same next action, scope and streak contract", async () => {
  const [home, route, dashboard] = await Promise.all([
    readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/v1/learning/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/components/learning-dashboard.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(home, /HomeNextStep/);
  assert.match(route, /deriveHomeNextStep/);
  assert.match(route, /streak/);
  assert.match(route, /scope/);
  assert.match(route, /IDENTITY_CHANGED/);
  assert.match(dashboard, /Current streak/);
  assert.match(dashboard, /scope === "account"/);
  assert.match(dashboard, /queueBinding/);
  assert.match(dashboard, /retryPending\(loaded\)/);
  assert.match(dashboard, /retryPending\(dataRef\.current\)/);
});
