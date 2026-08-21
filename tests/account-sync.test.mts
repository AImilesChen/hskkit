import assert from "node:assert/strict";
import test from "node:test";

import {
  computeSessionStreak,
  computeStreak,
  createDataRequest,
  mergeLearningStates,
  previewMerge,
  syncDecision,
  transitionDataRequest,
} from "../src/lib/account/domain.ts";
import type { LearningState } from "../src/lib/learning/domain.ts";

const empty = (): LearningState => ({ attempts: [], cards: [], mistakes: [], dailySessions: [] });

function stateWithAttempt(id: string, observedAt = "2026-08-20T10:00:00.000Z"): LearningState {
  return {
    ...empty(),
    attempts: [{
      id,
      idempotencyKey: id,
      contentId: "question:hsk1_001",
      contentVersion: "practice-v1",
      dimension: "reading",
      answer: "A",
      correctAnswer: "B",
      correct: false,
      observedAt,
    }],
  };
}

test("merge preview is explicit and cancellation can preserve the exact account state", () => {
  const account = stateWithAttempt("account-attempt");
  const guest = stateWithAttempt("guest-attempt");
  const preview = previewMerge(account, guest);
  assert.deepEqual(preview, {
    accountAttempts: 1,
    guestAttempts: 1,
    accountLearningSessions: 0,
    guestLearningSessions: 0,
    additions: 1,
    sessionAdditions: 0,
    conflicts: 0,
    strategy: "account_wins_conflicts",
  });
  const untouched = structuredClone(account);
  assert.deepEqual(untouched, account, "preview/cancel must not mutate the account state");
});

test("confirmed merge adds unique guest history once and account wins same-record conflicts", () => {
  const account = stateWithAttempt("same", "2026-08-20T10:00:00.000Z");
  const guest = stateWithAttempt("same", "2026-08-20T11:00:00.000Z");
  guest.attempts.push(stateWithAttempt("guest-only").attempts[0]);
  const first = mergeLearningStates(account, guest);
  const replay = mergeLearningStates(first.state, guest);
  assert.equal(first.conflicts, 1);
  assert.equal(first.state.attempts.find((item) => item.id === "same")?.observedAt, "2026-08-20T10:00:00.000Z");
  assert.equal(first.state.attempts.length, 2);
  assert.equal(replay.state.attempts.length, 2);
});

test("confirmed merge preserves placement, Practice and report state and rewrites guest ownership", () => {
  const account = empty();
  const guest: LearningState = {
    ...empty(),
    placementSessions: [{
      id: "placement-guest", ownerId: "guest:one", questionVersion: "placement-v1", questionIds: ["p1"],
      answers: [], status: "in_progress", idempotencyKey: "placement-start", createdAt: "2026-08-20T10:00:00.000Z",
    }],
    placementResults: [],
    practiceSessions: [{
      id: "practice-guest", ownerId: "guest:one", mode: "practice", standardVersion: "HSK 3.0",
      level: 1, skill: "vocabulary", questionVersion: "practice-v1", questionIds: ["q1"], answers: [],
      status: "in_progress", idempotencyKey: "practice-start", createdAt: "2026-08-20T10:00:00.000Z",
    }],
    questionReports: [{
      id: "report-guest", ownerId: "guest:one", sessionId: "practice-guest", questionId: "q1",
      questionVersion: "practice-v1", reason: "answer_or_explanation", idempotencyKey: "report-1",
      status: "open", createdAt: "2026-08-20T10:00:00.000Z",
    }],
  };
  const preview = previewMerge(account, guest);
  assert.equal(preview.guestLearningSessions, 2);
  assert.equal(preview.sessionAdditions, 2);
  const merged = mergeLearningStates(account, guest, "user:account");
  assert.equal(merged.state.placementSessions?.[0].ownerId, "user:account");
  assert.equal(merged.state.practiceSessions?.[0].ownerId, "user:account");
  assert.equal(merged.state.questionReports?.[0].ownerId, "user:account");
});

test("two-device stale revision becomes an explicit conflict instead of an overwrite", () => {
  assert.deepEqual(syncDecision(8, 8, "device-a"), { state: "synced", serverRevision: 8 });
  assert.deepEqual(syncDecision(9, 8, "device-b"), {
    state: "conflict",
    serverRevision: 9,
    clientRevision: 8,
    deviceId: "device-b",
    resolution: "reload_then_retry",
  });
});

test("streak uses completed learning events in the account IANA timezone, not UTC page views", () => {
  const events = [
    "2026-08-18T07:30:00.000Z", // Aug 18 in Asia/Shanghai
    "2026-08-19T15:30:00.000Z", // Aug 19 in Asia/Shanghai
    "2026-08-20T15:30:00.000Z", // Aug 20 in Asia/Shanghai
  ];
  const result = computeStreak(events, "Asia/Shanghai", "2026-08-20T16:00:00.000Z");
  assert.deepEqual(result, {
    timezone: "Asia/Shanghai",
    current: 3,
    longest: 3,
    lastLearningDay: "2026-08-20",
    policy: "completed_daily_session_v1",
    makeups: "not_configured",
  });
  assert.throws(() => computeStreak(events, "Mars/Olympus", "2026-08-20T16:00:00.000Z"), /INVALID_TIMEZONE/);
});

test("legacy completed sessions without completedAt remain in timezone streaks with an explicit fallback count", () => {
  const sessions = [
    {
      id: "legacy",
      ownerId: "account:user",
      localDay: "2026-08-19",
      ruleVersion: "today-v1",
      createdAt: "2026-08-19T15:30:00.000Z",
      items: [{ id: "summary", kind: "summary" as const, contentId: "summary", status: "completed" as const }],
    },
    {
      id: "current",
      ownerId: "account:user",
      localDay: "2026-08-20",
      ruleVersion: "today-v1",
      createdAt: "2026-08-20T08:00:00.000Z",
      completedAt: "2026-08-20T15:30:00.000Z",
      items: [{ id: "summary", kind: "summary" as const, contentId: "summary", status: "completed" as const }],
    },
  ];
  const result = computeSessionStreak(sessions, "Asia/Shanghai", "2026-08-20T16:00:00.000Z");
  assert.equal(result.current, 2);
  assert.equal(result.longest, 2);
  assert.equal(result.legacyFallbackCount, 1);
  assert.equal(result.policy, "completed_daily_session_v1_with_created_at_legacy_fallback");
});

test("export and deletion requests expose cancellable, failed, retryable and completed states", () => {
  const createdAt = "2026-08-20T09:00:00.000Z";
  const exportRequest = createDataRequest("req-export", "export", createdAt);
  const processing = transitionDataRequest(exportRequest, "process", "2026-08-20T09:01:00.000Z");
  const failed = transitionDataRequest(processing, "fail", "2026-08-20T09:02:00.000Z", "SERIALIZATION_FAILED");
  const retried = transitionDataRequest(failed, "retry", "2026-08-20T09:03:00.000Z");
  const ready = transitionDataRequest(transitionDataRequest(retried, "process", "2026-08-20T09:04:00.000Z"), "complete", "2026-08-20T09:05:00.000Z");
  assert.equal(ready.state, "ready");
  assert.equal(ready.attempt, 2);
  assert.equal(ready.failureCode, undefined);

  const deletion = createDataRequest("req-delete", "delete", createdAt);
  const cancelled = transitionDataRequest(deletion, "cancel", "2026-08-20T09:01:00.000Z");
  assert.equal(cancelled.state, "cancelled");
  const confirmed = transitionDataRequest(createDataRequest("req-delete-2", "delete", createdAt), "confirm", "2026-08-20T09:01:00.000Z");
  assert.equal(confirmed.state, "confirmed");
  const completed = transitionDataRequest(transitionDataRequest(confirmed, "process", "2026-08-20T09:02:00.000Z"), "complete", "2026-08-20T09:03:00.000Z");
  assert.equal(completed.state, "completed");
});

test("invalid data-request transitions fail closed", () => {
  const request = createDataRequest("req", "delete", "2026-08-20T09:00:00.000Z");
  assert.throws(() => transitionDataRequest(request, "retry", "2026-08-20T09:01:00.000Z"), /INVALID_REQUEST_TRANSITION/);
  assert.throws(() => transitionDataRequest(request, "complete", "2026-08-20T09:01:00.000Z"), /INVALID_REQUEST_TRANSITION/);
});
