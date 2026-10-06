import assert from "node:assert/strict";
import test from "node:test";
import {
  BASIC_MOCK_DURATION_SECONDS,
  ADVANCED_MOCK_DURATION_SECONDS,
  MOCK_QUESTION_SET_VERSION,
  evaluateMockGate,
  mockBank,
  publicMockSession,
  saveMockAnswer,
  selectMockQuestions,
  startMock,
  submitMock,
  type MockQuestion,
} from "../src/lib/mock/domain.ts";

const now = "2026-08-23T03:00:00.000Z";

test("Each level has an approved three-skill diagnostic pool", () => {
  for (const level of [1, 2, 3, 4, 5, 6]) {
    const pool = mockBank("basic", level);
    assert.ok(pool.length >= 15);
    assert.ok(pool.every((question) => question.level === level));
    assert.deepEqual(evaluateMockGate("basic", pool, level), { ready: true, reason: null });
  }
  const basic = mockBank("basic", 3);
  const advanced = mockBank("advanced");
  assert.ok(advanced.length >= 15);
  assert.ok(advanced.every((question) => question.sourceGroupId !== "reading-library-v2-hsk9-09"));
  assert.deepEqual([...new Set(basic.map((q) => q.level))], [3]);
  assert.deepEqual([...new Set(advanced.map((q) => q.dimension))].sort(), ["grammar", "listening", "reading"]);
  assert.ok([...basic, ...advanced].every((q) => q.approval === "approved" && q.authorization === "authorized" && q.lifecycle === "published"));
  assert.deepEqual(evaluateMockGate("basic", basic), { ready: true, reason: null });
  assert.deepEqual(evaluateMockGate("advanced", advanced), { ready: true, reason: null });
});

test("Mock gate fails closed for count, authorization, withdrawal, level and skill coverage", () => {
  const basic = mockBank("basic");
  assert.equal(evaluateMockGate("basic", basic.slice(0, 14)).ready, false);
  assert.equal(evaluateMockGate("basic", basic.map((q, i) => i ? q : { ...q, authorization: "missing" as const })).ready, false);
  assert.equal(evaluateMockGate("basic", basic.map((q, i) => i ? q : { ...q, lifecycle: "withdrawn" as const })).ready, false);
  assert.equal(evaluateMockGate("basic", basic, 2).ready, false);
  const advanced = mockBank("advanced");
  assert.equal(evaluateMockGate("advanced", advanced.filter((q) => q.dimension !== "grammar")).ready, false);
});

test("Selection is balanced, avoids repeated materials and favors unseen questions", () => {
  const pool = mockBank("basic", 3);
  const first = selectMockQuestions(pool, "first-attempt");
  const second = selectMockQuestions(pool, "second-attempt", first.map((question) => question.id), first.map((question) => question.sourceGroupId ?? question.id));
  assert.equal(first.length, 15);
  assert.deepEqual([...new Set(first.map((question) => question.dimension))].sort(), ["grammar", "listening", "reading"]);
  assert.ok(["grammar", "reading", "listening"].every((skill) => first.filter((question) => question.dimension === skill).length === 5));
  assert.equal(new Set(first.map((question) => question.sourceGroupId)).size, 15);
  assert.equal(second.filter((question) => first.some((prior) => prior.id === question.id)).length, 0);
  assert.deepEqual(selectMockQuestions(pool, "first-attempt").map((question) => question.id), first.map((question) => question.id));
  const advanced = selectMockQuestions(mockBank("advanced"), "advanced-attempt");
  assert.ok(["grammar", "reading", "listening"].every((skill) => [7, 8, 9].every((level) => advanced.some((question) => question.dimension === skill && question.sourceLevel === level))));
});

test("A learner-selected Basic level stays within that level", () => {
  const session = startMock({ band: "basic", targetLevel: 6, ownerId: "guest-level-6", idempotencyKey: "level-6", now });
  assert.equal(session.questions.length, 15);
  assert.ok(session.questions.every((question) => question.level === 6 && question.levelBand === "6"));
});

test("Basic Mock persists timer, autosave, refresh-safe revision and idempotency", () => {
  const session = startMock({ band: "basic", ownerId: "guest-1", idempotencyKey: "start-1", now });
  assert.equal(session.questionSetVersion, MOCK_QUESTION_SET_VERSION);
  assert.equal(Date.parse(session.deadlineAt) - Date.parse(now), BASIC_MOCK_DURATION_SECONDS * 1000);
  const publicBefore = publicMockSession(session);
  assert.equal(JSON.stringify(publicBefore).includes("correctAnswer"), false);
  assert.equal(JSON.stringify(publicBefore).includes("explanation"), false);
  const q = session.questions[0];
  const saved = saveMockAnswer(session, { questionId: q.id, answer: Object.keys(q.options)[0], idempotencyKey: "answer-1", now: "2026-08-23T03:01:00.000Z" });
  assert.equal(saved.revision, 1);
  assert.equal(saved.answers.length, 1);
  assert.equal(saveMockAnswer(saved, { questionId: q.id, answer: Object.keys(q.options)[0], idempotencyKey: "answer-1", now: "2026-08-23T03:01:01.000Z" }), saved);
  assert.throws(() => saveMockAnswer(saved, { questionId: q.id, answer: Object.keys(q.options)[1], idempotencyKey: "answer-1", now }), /IDEMPOTENCY_KEY_REUSED/);
});

test("Basic submit scores locked snapshots and exposes explanations plus learning-loop routes", () => {
  let session = startMock({ band: "basic", ownerId: "guest-2", idempotencyKey: "start-2", now });
  for (const [index, question] of session.questions.entries()) {
    const wrong = question.options ? Object.keys(question.options).find((value) => value !== question.correctAnswer)! : "incorrect";
    session = saveMockAnswer(session, { questionId: question.id, answer: index === 0 ? wrong : question.correctAnswer, idempotencyKey: `a-${index}`, now });
  }
  const submitted = submitMock(session, { idempotencyKey: "submit-2", now: "2026-08-23T03:10:00.000Z" });
  assert.equal(submitted.session.status, "submitted");
  assert.equal(submitted.result.correctCount, 14);
  assert.equal(submitted.result.totalCount, 15);
  assert.equal(submitted.result.items.length, 15);
  assert.ok(submitted.result.items.every((item) => item.explanation.length > 0));
  assert.deepEqual(submitted.result.nextRoutes, ["/mistakes", "/review", "/planner"]);
  assert.equal(submitMock(submitted.session, { idempotencyKey: "submit-2", now }).result.id, submitted.result.id);
});

test("Advanced submit reports skill evidence without fabricating an ability level", () => {
  let session = startMock({ band: "advanced", ownerId: "guest-3", idempotencyKey: "start-3", now });
  assert.equal(Date.parse(session.deadlineAt) - Date.parse(now), ADVANCED_MOCK_DURATION_SECONDS * 1000);
  for (const [index, question] of session.questions.entries()) {
    const wrong = question.options ? Object.keys(question.options).find((value) => value !== question.correctAnswer)! : "incorrect";
    session = saveMockAnswer(session, { questionId: question.id, answer: index < 3 ? question.correctAnswer : wrong, idempotencyKey: `adv-${index}`, now });
  }
  const { result } = submitMock(session, { idempotencyKey: "submit-3", now: "2026-08-23T03:10:00.000Z" });
  assert.equal(result.abilityInterval, undefined);
  assert.equal("recommendedLevel" in result, false);
  assert.equal("officialScore" in result, false);
  assert.ok(result.dimensionEvidence.reading);
  assert.ok(result.dimensionEvidence.listening);
  assert.ok(result.dimensionEvidence.grammar);
  assert.match(result.disclaimer, /or a reliable estimate/);
  assert.deepEqual(result.nextRoutes, ["/planner"]);
});

test("historical Mock result remains traceable after a current question is withdrawn", () => {
  let session = startMock({ band: "advanced", ownerId: "guest-4", idempotencyKey: "start-4", now });
  const issued: MockQuestion = session.questions[0];
  session = saveMockAnswer(session, { questionId: issued.id, answer: issued.correctAnswer, idempotencyKey: "trace-answer", now });
  const { result } = submitMock(session, { idempotencyKey: "trace-submit", now });
  assert.equal(result.questionSetVersion, MOCK_QUESTION_SET_VERSION);
  assert.equal(result.questionSnapshots[0].contentVersion, issued.contentVersion);
  assert.equal(result.questionSnapshots[0].sourceReleaseId, issued.sourceReleaseId);
  const withdrawn = mockBank("advanced").map((q) => q.id === issued.id ? { ...q, lifecycle: "withdrawn" as const } : q);
  assert.equal(evaluateMockGate("advanced", withdrawn).ready, false);
  assert.equal(result.questionSnapshots[0].id, issued.id);
});
