import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { emptyLearningState } from "../src/lib/learning/domain.ts";
import {
  answerPracticeQuestion,
  createPracticeSession,
  selectPracticeSession,
} from "../src/lib/practice/domain.ts";
import { trustedPracticeQuestion } from "../src/lib/practice/questions.ts";

const STARTED_AT = "2026-09-07T08:00:00.000Z";
const BEFORE_EXPIRY = "2026-09-08T07:59:59.999Z";
const AFTER_EXPIRY = "2026-09-08T08:00:00.001Z";
const source = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

function start(ownerId: string, idempotencyKey = "start-old") {
  return createPracticeSession(emptyLearningState(), {
    ownerId,
    level: 1,
    skill: "vocabulary",
    idempotencyKey,
    now: STARTED_AT,
  });
}

test("Practice restores a matching in-progress session before its 24-hour deadline", () => {
  const created = start("active-owner");
  const selected = selectPracticeSession(created.state, {
    ownerId: "active-owner",
    level: 1,
    skill: "vocabulary",
  }, BEFORE_EXPIRY);

  assert.equal(selected?.id, created.session.id);
});

test("Practice entry does not restore an expired session and preserves its learning history", () => {
  const created = start("expired-owner");
  const question = trustedPracticeQuestion(created.session.questionIds[0])!;
  const wrongAnswer = Object.keys(question.options).find((answer) => answer !== question.correctAnswer)!;
  const answered = answerPracticeQuestion(created.state, {
    ownerId: "expired-owner",
    sessionId: created.session.id,
    questionId: question.id,
    answer: wrongAnswer,
    idempotencyKey: "wrong-answer",
    now: "2026-09-07T08:01:00.000Z",
  });

  const selected = selectPracticeSession(answered.state, {
    ownerId: "expired-owner",
    level: 1,
    skill: "vocabulary",
  }, AFTER_EXPIRY);

  assert.equal(selected, undefined);
  assert.equal(answered.state.practiceSessions?.length, 1);
  assert.equal(answered.state.attempts.length, 1);
  assert.equal(answered.state.mistakes.length, 1);
  assert.equal(answered.state.cards.length, 1);
});

test("starting after expiry creates a fresh resumable session without deleting the old record", () => {
  const old = start("restart-owner");
  assert.equal(selectPracticeSession(old.state, {
    ownerId: "restart-owner",
    level: 1,
    skill: "vocabulary",
  }, AFTER_EXPIRY), undefined);

  const fresh = createPracticeSession(old.state, {
    ownerId: "restart-owner",
    level: 1,
    skill: "vocabulary",
    idempotencyKey: "start-fresh",
    now: AFTER_EXPIRY,
  });

  assert.notEqual(fresh.session.id, old.session.id);
  assert.equal(fresh.state.practiceSessions?.length, 2);
  assert.equal(selectPracticeSession(fresh.state, {
    ownerId: "restart-owner",
    level: 1,
    skill: "vocabulary",
  }, AFTER_EXPIRY)?.id, fresh.session.id);
});

test("a late answer is rejected without changing attempts, Mistakes, Review cards, or session history", () => {
  const created = start("late-answer-owner");
  const before = structuredClone(created.state);

  assert.throws(() => answerPracticeQuestion(created.state, {
    ownerId: "late-answer-owner",
    sessionId: created.session.id,
    questionId: created.session.questionIds[0],
    answer: "a",
    idempotencyKey: "late-answer",
    now: created.session.expiresAt,
  }), /PRACTICE_SESSION_EXPIRED/);

  assert.deepEqual(created.state, before);
  assert.equal(created.state.attempts.length, 0);
  assert.equal(created.state.mistakes.length, 0);
  assert.equal(created.state.cards.length, 0);
  assert.equal(created.state.practiceSessions?.length, 1);
});

test("completed Practice summaries remain selectable after their answer window", () => {
  let { state, session } = start("completed-owner");
  for (const [index, questionId] of session.questionIds.entries()) {
    const question = trustedPracticeQuestion(questionId)!;
    const answered = answerPracticeQuestion(state, {
      ownerId: "completed-owner",
      sessionId: session.id,
      questionId,
      answer: question.correctAnswer,
      idempotencyKey: `answer-${index}`,
      now: "2026-09-07T08:10:00.000Z",
    });
    state = answered.state;
    session = answered.session;
  }

  assert.equal(session.status, "completed");
  assert.equal(selectPracticeSession(state, {
    ownerId: "completed-owner",
    level: 1,
    skill: "vocabulary",
  }, AFTER_EXPIRY)?.id, session.id);
});

test("Practice route passes one server timestamp into selection and serialization", () => {
  const route = source("../src/app/api/v1/practice/route.ts");
  assert.match(route, /const now = new Date\(\)\.toISOString\(\);/);
  assert.match(route, /selectPracticeSession\(loaded\.state, \{[^;]+\}, now\);/);
  assert.match(route, /publicPracticeSession\(session, now\)/);
});

test("an in-page expiry becomes a compact actionable card with clear touch targets", () => {
  const client = source("../src/app/practice/[level]/[skill]/practice-client.tsx");
  const expired = client.slice(client.indexOf("if (session.status === \"expired\")"), client.indexOf("if (session.status === \"completed\")"));

  assert.match(client, /PRACTICE_SESSION_EXPIRED[\s\S]*?status:\s*"expired"/);
  assert.match(expired, /rounded-3xl border border-amber-200 bg-white/);
  assert.match(expired, /min-h-\[48px\][^"\n]*bg-blue-600[^"\n]*text-white/);
  assert.match(expired, /w-full[^"\n]*sm:w-auto/);
  assert.match(expired, />Start new session<\/button>/);
  assert.match(expired, />Change level or skill<\/Link>/);
});
