import test from "node:test";
import assert from "node:assert/strict";
import { buildDailySession, emptyLearningState, gradeReview } from "../src/lib/learning/domain.ts";
import {
  answerPracticeQuestion,
  createPracticeSession,
  isPracticeSessionCurrent,
  publicPracticeSession,
  reportPracticeQuestion,
  resumePracticeSession,
  selectPracticeSession,
} from "../src/lib/practice/domain.ts";
import { PRACTICE_VERSION, WITHDRAWN_PRACTICE_QUESTION_ID, practiceQuestionSet, practiceSetContentVersion, trustedPracticeQuestion } from "../src/lib/practice/questions.ts";

const now = "2026-08-21T10:00:00.000Z";

test("practice creates one resumable versioned HSK 3.0 session", () => {
  const first = createPracticeSession(emptyLearningState(), {
    ownerId: "guest-1", level: 1, skill: "vocabulary", idempotencyKey: "create-1", now,
  });
  const replay = createPracticeSession(first.state, {
    ownerId: "guest-1", level: 1, skill: "vocabulary", idempotencyKey: "create-1", now,
  });
  assert.equal(replay.session.id, first.session.id);
  assert.equal(replay.state.practiceSessions?.length, 1);
  assert.equal(first.session.mode, "practice");
  assert.equal(first.session.standardVersion, "HSK 3.0");
  assert.match(first.session.questionVersion, /^hskkit-practice-/);
  assert.equal(resumePracticeSession(first.state, "guest-1", now)?.id, first.session.id);
});

test("Practice levels 2-6 use versioned questions derived from the active formal content release", () => {
  for (let level = 2; level <= 6; level += 1) {
    const questions = practiceQuestionSet(level, "vocabulary");
    assert.ok(questions.length >= 3);
    assert.ok(questions.every((question) => question.level === level));
    assert.ok(questions.every((question) => question.id.startsWith(`practice-catalog-l${level}-`)));
    assert.ok(questions.every((question) => question.contentVersion.startsWith("hsk3-gf0025-2021-v2:")));
    const created = createPracticeSession(emptyLearningState(), {
      ownerId: `guest-l${level}`, level, skill: "vocabulary", idempotencyKey: `create-l${level}`, now,
    });
    assert.equal(created.session.questionVersion, questions[0].contentVersion);
    assert.deepEqual(created.session.questionIds, questions.map((question) => question.id));
    assert.equal(JSON.stringify(publicPracticeSession(created.session)).includes("correctAnswer"), false);
  }
  const answerKeys = [2, 3, 4, 5, 6].flatMap((level) => practiceQuestionSet(level, "vocabulary").map((question) => question.correctAnswer));
  assert.ok(new Set(answerKeys).size >= 3);
  for (const level of [2, 3, 4, 5, 6]) {
    const keys = practiceQuestionSet(level, "vocabulary").map((question) => question.correctAnswer);
    const predictableRotation = Array.from({ length: keys.length }, (_, index) => (["a", "b", "c", "d"] as const)[(level + index) % 4]);
    assert.notDeepEqual(keys, predictableRotation);
  }
});

test("practice refuses levels without an approved bounded question set", () => {
  assert.throws(() => createPracticeSession(emptyLearningState(), {
    ownerId: "guest-1", level: 7, skill: "vocabulary", idempotencyKey: "create-7", now,
  }), /PRACTICE_NOT_READY/);
});

test("practice gives immediate feedback, records versioned attempt, mistake and SRS exactly once", () => {
  const created = createPracticeSession(emptyLearningState(), {
    ownerId: "guest-1", level: 1, skill: "vocabulary", idempotencyKey: "create-1", now,
  });
  const questionId = created.session.questionIds[0];
  const answered = answerPracticeQuestion(created.state, {
    ownerId: "guest-1", sessionId: created.session.id, questionId, answer: "b",
    idempotencyKey: "answer-1", now: "2026-08-21T10:01:00.000Z",
  });
  assert.equal(answered.feedback.correct, false);
  assert.ok(answered.feedback.correctAnswer);
  assert.equal(answered.state.attempts.length, 1);
  assert.equal(answered.state.attempts[0].mode, "practice");
  assert.equal(answered.state.attempts[0].skill, "vocabulary");
  assert.equal(answered.state.attempts[0].standardVersion, "HSK 3.0");
  assert.equal(answered.state.mistakes.length, 1);
  assert.equal(answered.state.cards.length, 1);
  const replay = answerPracticeQuestion(answered.state, {
    ownerId: "guest-1", sessionId: created.session.id, questionId, answer: "b",
    idempotencyKey: "answer-1", now: "2026-08-21T10:02:00.000Z",
  });
  assert.equal(replay.state.attempts.length, 1);
  assert.equal(replay.state.mistakes.length, 1);
  assert.equal(replay.state.cards.length, 1);
});

test("public session reveals answers only for questions already answered", () => {
  const created = createPracticeSession(emptyLearningState(), {
    ownerId: "guest-1", level: 1, skill: "vocabulary", idempotencyKey: "create-1", now,
  });
  const before = publicPracticeSession(created.session);
  assert.equal(JSON.stringify(before).includes("correctAnswer"), false);
  assert.equal(JSON.stringify(before).includes("idempotencyKey"), false);
  assert.equal(JSON.stringify(before).includes("attemptId"), false);
  assert.equal(JSON.stringify(before).includes("qaStatus"), false);
  const answered = answerPracticeQuestion(created.state, {
    ownerId: "guest-1", sessionId: created.session.id, questionId: created.session.questionIds[0],
    answer: "a", idempotencyKey: "answer-1", now,
  });
  const after = publicPracticeSession(answered.session);
  assert.equal(after.feedback.length, 1);
  assert.equal(after.questions.length, created.session.questionIds.length);
  assert.equal(Object.hasOwn(after.questions[1], "correctAnswer"), false);
});

test("practice completes after all answers and retains wrong attempt history", () => {
  let { state, session } = createPracticeSession(emptyLearningState(), {
    ownerId: "guest-1", level: 1, skill: "vocabulary", idempotencyKey: "create-1", now,
  });
  session.questionIds.forEach((questionId, index) => {
    const result = answerPracticeQuestion(state, {
      ownerId: "guest-1", sessionId: session.id, questionId, answer: index === 0 ? "b" : "a",
      idempotencyKey: `answer-${index}`, now: `2026-08-21T10:0${index + 1}:00.000Z`,
    });
    state = result.state;
    session = result.session;
  });
  assert.equal(session.status, "completed");
  assert.equal(session.result?.totalCount, session.questionIds.length);
  assert.equal(state.mistakes[0].status, "open");
});

test("the final Practice answer can be replayed after the session closes", () => {
  let { state, session } = createPracticeSession(emptyLearningState(), {
    ownerId: "guest-final-replay", level: 1, skill: "vocabulary", idempotencyKey: "final-start", now,
  });
  let finalInput: Parameters<typeof answerPracticeQuestion>[1] | undefined;
  for (const [index, questionId] of session.questionIds.entries()) {
    finalInput = {
      ownerId: "guest-final-replay", sessionId: session.id, questionId, answer: index === 0 ? "b" : "a",
      idempotencyKey: `final-answer-${index}`, now,
    };
    const answered = answerPracticeQuestion(state, finalInput);
    state = answered.state;
    session = answered.session;
  }
  assert.equal(session.status, "completed");
  const attempts = state.attempts.length;
  const mistakes = state.mistakes.length;
  const cards = state.cards.length;
  const replay = answerPracticeQuestion(state, finalInput!);
  assert.equal(replay.state, state);
  assert.equal(replay.state.attempts.length, attempts);
  assert.equal(replay.state.mistakes.length, mistakes);
  assert.equal(replay.state.cards.length, cards);
});

test("question report is idempotent and does not erase historical attempts", () => {
  const created = createPracticeSession(emptyLearningState(), {
    ownerId: "guest-1", level: 1, skill: "vocabulary", idempotencyKey: "create-1", now,
  });
  const first = reportPracticeQuestion(created.state, {
    ownerId: "guest-1", sessionId: created.session.id, questionId: created.session.questionIds[0],
    reason: "answer_or_explanation", idempotencyKey: "report-1", now,
  });
  const replay = reportPracticeQuestion(first.state, {
    ownerId: "guest-1", sessionId: created.session.id, questionId: created.session.questionIds[0],
    reason: "answer_or_explanation", idempotencyKey: "report-1", now,
  });
  assert.equal(replay.state.questionReports?.length, 1);
  assert.equal(replay.report.status, "open");
  assert.equal(replay.state.attempts.length, 0);
});

test("answer idempotency keys cannot be reused for a different question", () => {
  const created = createPracticeSession(emptyLearningState(), {
    ownerId: "guest-1", level: 1, skill: "vocabulary", idempotencyKey: "create-1", now,
  });
  const first = answerPracticeQuestion(created.state, {
    ownerId: "guest-1", sessionId: created.session.id, questionId: created.session.questionIds[0],
    answer: "a", idempotencyKey: "shared-key", now,
  });
  assert.throws(() => answerPracticeQuestion(first.state, {
    ownerId: "guest-1", sessionId: created.session.id, questionId: created.session.questionIds[1],
    answer: "a", idempotencyKey: "shared-key", now,
  }), /IDEMPOTENCY_KEY_REUSED/);
});

test("Today practice completes only after the whole session and inserts wrong answers into Review", () => {
  const daily = buildDailySession(emptyLearningState(), {
    ownerId: "guest:today-practice", localDay: "2026-08-21", ruleVersion: "today-v2", now,
  });
  daily.state.dailySessions[0].items = daily.state.dailySessions[0].items.map((item) =>
    item.kind === "learn" || item.kind === "listen" ? { ...item, status: "completed" as const } : item,
  );
  const started = createPracticeSession(daily.state, {
    ownerId: "guest:today-practice", level: 1, skill: "vocabulary", idempotencyKey: "today-start", now,
    dailySessionId: daily.session.id, dailyItemId: "practice:1:vocabulary",
  });
  let state = started.state;
  for (const [index, questionId] of started.session.questionIds.entries()) {
    state = answerPracticeQuestion(state, {
      ownerId: "guest:today-practice", sessionId: started.session.id, questionId,
      answer: index === 0 ? "b" : "a", idempotencyKey: `today-answer-${index}`, now,
    }).state;
    const practiceItem = state.dailySessions[0].items.find((item) => item.kind === "practice");
    assert.equal(practiceItem?.status, index === started.session.questionIds.length - 1 ? "completed" : "pending");
  }
  const review = state.dailySessions[0].items.find((item) => item.kind === "review");
  assert.equal(review?.status, "pending");
  assert.equal(state.dailySessions[0].items.at(-1)?.kind, "summary");
  assert.equal(state.dailySessions[0].items.at(-1)?.status, "pending");
  const graded = gradeReview(state, {
    cardId: state.cards[0].id, grade: "good", observedAt: "2026-08-21T10:10:00.000Z",
    clientRevision: state.cards[0].revision, idempotencyKey: "grade-1",
  });
  assert.equal(graded.state.mistakes[0].status, "resolved");
  assert.equal(graded.state.dailySessions[0].items.at(-1)?.status, "completed");
});

test("Today-bound Practice changes only its bound daily session", () => {
  const first = buildDailySession(emptyLearningState(), {
    ownerId: "guest:history", localDay: "2026-08-20", ruleVersion: "today-v2", now,
  });
  const second = buildDailySession(first.state, {
    ownerId: "guest:history", localDay: "2026-08-21", ruleVersion: "today-v2", now,
  });
  second.state.dailySessions = second.state.dailySessions.map((daily) => ({
    ...daily,
    items: daily.items.map((item) => item.kind === "learn" || item.kind === "listen" ? { ...item, status: "completed" as const } : item),
  }));
  const priorSnapshot = structuredClone(second.state.dailySessions[0]);
  const started = createPracticeSession(second.state, {
    ownerId: "guest:history", level: 1, skill: "vocabulary", idempotencyKey: "history-start", now,
    dailySessionId: second.session.id, dailyItemId: "practice:1:vocabulary",
  });
  let state = started.state;
  for (const [index, questionId] of started.session.questionIds.entries()) {
    state = answerPracticeQuestion(state, {
      ownerId: "guest:history", sessionId: started.session.id, questionId,
      answer: index === 0 ? "b" : "a", idempotencyKey: `history-answer-${index}`, now,
    }).state;
  }
  assert.deepEqual(state.dailySessions[0], priorSnapshot);
  assert.equal(state.dailySessions[1].items.find((item) => item.kind === "practice")?.status, "completed");
  assert.ok(state.dailySessions[1].items.some((item) => item.kind === "review"));
});

test("a new wrong attempt makes an existing SRS card due now with current source", () => {
  let first = createPracticeSession(emptyLearningState(), {
    ownerId: "guest:card", level: 1, skill: "vocabulary", idempotencyKey: "card-start-1", now,
  });
  let state = first.state;
  for (const [index, questionId] of first.session.questionIds.entries()) {
    state = answerPracticeQuestion(state, {
      ownerId: "guest:card", sessionId: first.session.id, questionId, answer: "a",
      idempotencyKey: `card-correct-${index}`, now,
    }).state;
  }
  const oldCard = state.cards[0];
  const second = createPracticeSession(state, {
    ownerId: "guest:card", level: 1, skill: "vocabulary", idempotencyKey: "card-start-2", now,
  });
  const wrongAt = "2026-08-21T11:00:00.000Z";
  const wrong = answerPracticeQuestion(second.state, {
    ownerId: "guest:card", sessionId: second.session.id, questionId: second.session.questionIds[0],
    answer: "b", idempotencyKey: "card-wrong", now: wrongAt,
  });
  const updated = wrong.state.cards.find((card) => card.id === oldCard.id)!;
  assert.equal(updated.dueAt, wrongAt);
  assert.equal(updated.intervalDays, 0);
  assert.equal(updated.revision, oldCard.revision + 1);
  assert.equal(updated.sourceAttemptId, wrong.state.attempts.at(-1)?.id);
});

test("answer idempotency keys cannot be reused across Practice sessions", () => {
  let first = createPracticeSession(emptyLearningState(), {
    ownerId: "guest:cross-key", level: 1, skill: "vocabulary", idempotencyKey: "cross-start-1", now,
  });
  let state = first.state;
  for (const [index, questionId] of first.session.questionIds.entries()) {
    state = answerPracticeQuestion(state, {
      ownerId: "guest:cross-key", sessionId: first.session.id, questionId, answer: "a",
      idempotencyKey: index === 0 ? "cross-answer" : `cross-answer-${index}`, now,
    }).state;
  }
  const second = createPracticeSession(state, {
    ownerId: "guest:cross-key", level: 1, skill: "vocabulary", idempotencyKey: "cross-start-2", now,
  });
  assert.throws(() => answerPracticeQuestion(second.state, {
    ownerId: "guest:cross-key", sessionId: second.session.id, questionId: second.session.questionIds[0],
    answer: "b", idempotencyKey: "cross-answer", now,
  }), /IDEMPOTENCY_KEY_REUSED/);
});

test("direct out-of-order Practice does not silently complete a later Today item", () => {
  const daily = buildDailySession(emptyLearningState(), {
    ownerId: "guest:ordered", localDay: "2026-08-21", ruleVersion: "today-v2", now,
  });
  let { state, session } = createPracticeSession(daily.state, {
    ownerId: "guest:ordered", level: 1, skill: "vocabulary", idempotencyKey: "ordered-start", now,
  });
  for (const [index, questionId] of session.questionIds.entries()) {
    const answered = answerPracticeQuestion(state, {
      ownerId: "guest:ordered", sessionId: session.id, questionId, answer: "a",
      idempotencyKey: `ordered-answer-${index}`, now,
    });
    state = answered.state;
    session = answered.session;
  }
  assert.equal(state.dailySessions[0].items.find((item) => item.kind === "practice")?.status, "pending");
});

test("an old Practice Session cannot complete a refreshed Daily item with a newer question version", () => {
  const daily = buildDailySession(emptyLearningState(), { ownerId: "guest:stale-daily", localDay: "2026-08-21", ruleVersion: "today-v2", now });
  daily.state.dailySessions[0].items = daily.state.dailySessions[0].items.map((item) => item.kind === "learn" || item.kind === "listen" ? { ...item, status: "completed" as const } : item);
  const started = createPracticeSession(daily.state, { ownerId: "guest:stale-daily", level: 1, skill: "vocabulary", idempotencyKey: "stale-start", now, dailySessionId: daily.session.id, dailyItemId: "practice:1:vocabulary" });
  let state = { ...started.state, dailySessions: started.state.dailySessions.map((session) => ({ ...session, items: session.items.map((item) => item.id === "practice:1:vocabulary" ? { ...item, contentVersion: "newer-release" } : item) })) };
  for (const [index, questionId] of started.session.questionIds.entries()) {
    const question = trustedPracticeQuestion(questionId)!;
    state = answerPracticeQuestion(state, { ownerId: "guest:stale-daily", sessionId: started.session.id, questionId, answer: question.correctAnswer, idempotencyKey: `stale-answer-${index}`, now }).state;
  }
  assert.equal(state.dailySessions[0].items.find((item) => item.id === "practice:1:vocabulary")?.status, "pending");
});

test("a withdrawn active Practice Session is not resumed when a fresh set is requested", () => {
  const state = emptyLearningState();
  state.practiceSessions = [{ id: "stale-session", ownerId: "guest:withdrawn-practice", idempotencyKey: "old-start", mode: "practice", standardVersion: "HSK 3.0", level: 1, skill: "vocabulary", questionVersion: PRACTICE_VERSION, questionIds: [WITHDRAWN_PRACTICE_QUESTION_ID], answers: [], status: "in_progress", createdAt: now, expiresAt: "2026-08-22T10:00:00.000Z" }];
  const restarted = createPracticeSession(state, { ownerId: "guest:withdrawn-practice", level: 1, skill: "vocabulary", idempotencyKey: "fresh-start", now });
  assert.notEqual(restarted.session.id, "stale-session");
  assert.equal(restarted.session.questionIds.includes(WITHDRAWN_PRACTICE_QUESTION_ID), false);
  assert.equal(restarted.state.practiceSessions?.length, 2);
  assert.equal(resumePracticeSession(state, "guest:withdrawn-practice", now), undefined);
  assert.equal(selectPracticeSession(state, { ownerId: "guest:withdrawn-practice", level: 1, skill: "vocabulary" }), undefined);
});

test("production restore selector rejects a stale version even when question IDs still exist", () => {
  const current = practiceQuestionSet(2, "vocabulary");
  const state = emptyLearningState();
  state.practiceSessions = [{ id: "stale-version-session", ownerId: "guest:stale-version", idempotencyKey: "stale-version-start", mode: "practice", standardVersion: "HSK 3.0", level: 2, skill: "vocabulary", questionVersion: "old-version", questionIds: current.map((question) => question.id), answers: [], status: "in_progress", createdAt: now, expiresAt: "2026-08-22T10:00:00.000Z" }];
  assert.equal(selectPracticeSession(state, { ownerId: "guest:stale-version", level: 2, skill: "vocabulary" }), undefined);
});

test("Practice set version changes when any prompt, answer or distractor source changes", () => {
  const sources = [
    { logicalId: "word-1", version: "v1" },
    { logicalId: "word-2", version: "v1" },
    { logicalId: "word-3", version: "v1" },
    { logicalId: "word-4", version: "v1" },
  ];
  const baseline = practiceSetContentVersion("release-1", sources);
  for (const index of sources.keys()) {
    const changed = sources.map((source, sourceIndex) => sourceIndex === index ? { ...source, version: "v2" } : source);
    assert.notEqual(practiceSetContentVersion("release-1", changed), baseline);
  }
  assert.notEqual(practiceSetContentVersion("release-2", sources), baseline);
});
