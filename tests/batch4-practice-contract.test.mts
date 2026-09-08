import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { emptyLearningState, type PracticeSession } from "../src/lib/learning/domain.ts";
import { answerPracticeQuestion, createPracticeSession, publicPracticeSession, resumePracticeSession } from "../src/lib/practice/domain.ts";
import { PRACTICE_QUESTIONS, WITHDRAWN_PRACTICE_QUESTION_ID, practiceQuestionLifecycle, practiceQuestionSet } from "../src/lib/practice/questions.ts";

const source = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const createdAt = "2026-08-21T00:00:00.000Z";

function start(ownerId = "batch4-guest") {
  return createPracticeSession(emptyLearningState(), {
    ownerId,
    level: 1,
    skill: "vocabulary",
    idempotencyKey: `${ownerId}-start`,
    now: createdAt,
  });
}

test("Practice Session freezes the question version, exposes an expiry, and resumes only while active", () => {
  const created = start();
  assert.equal(created.session.questionVersion, PRACTICE_QUESTIONS[0].setVersion);
  assert.equal(typeof created.session.expiresAt, "string");
  assert.equal(resumePracticeSession(created.state, "batch4-guest", "2026-08-21T12:00:00.000Z")?.id, created.session.id);
  assert.equal(resumePracticeSession(created.state, "batch4-guest", "2026-08-22T00:00:01.000Z"), undefined);
  assert.throws(() => answerPracticeQuestion(created.state, {
    ownerId: "batch4-guest",
    sessionId: created.session.id,
    questionId: created.session.questionIds[0],
    answer: "a",
    idempotencyKey: "late-answer",
    now: "2026-08-22T00:00:01.000Z",
  }), /PRACTICE_SESSION_EXPIRED/);
  assert.equal(created.state.attempts.length, 0);
});

test("withdrawn questions remain addressable for audit but cannot enter or continue a Practice Session", () => {
  assert.equal(practiceQuestionSet(1, "vocabulary").some((question) => question.id === WITHDRAWN_PRACTICE_QUESTION_ID), false);
  assert.equal(practiceQuestionLifecycle(WITHDRAWN_PRACTICE_QUESTION_ID), "withdrawn");
  const created = start("batch4-withdrawn");
  const frozen = {
    ...created.session,
    questionIds: [WITHDRAWN_PRACTICE_QUESTION_ID],
  } satisfies PracticeSession;
  assert.throws(() => publicPracticeSession(frozen, "2026-08-21T01:00:00.000Z"), /PRACTICE_QUESTION_WITHDRAWN/);
  assert.throws(() => answerPracticeQuestion({ ...created.state, practiceSessions: [frozen] }, {
    ownerId: "batch4-withdrawn",
    sessionId: frozen.id,
    questionId: WITHDRAWN_PRACTICE_QUESTION_ID,
    answer: "a",
    idempotencyKey: "withdrawn-answer",
    now: "2026-08-21T01:00:00.000Z",
  }), /PRACTICE_QUESTION_WITHDRAWN/);
});

test("invalid answers are rejected before Attempt, Mistake, or SRS state changes", () => {
  const created = start("batch4-invalid");
  assert.throws(() => answerPracticeQuestion(created.state, {
    ownerId: "batch4-invalid",
    sessionId: created.session.id,
    questionId: created.session.questionIds[0],
    answer: "not-an-option",
    idempotencyKey: "invalid-answer",
    now: "2026-08-21T01:00:00.000Z",
  }), /INVALID_PRACTICE_ANSWER/);
  assert.equal(created.state.attempts.length, 0);
  assert.equal(created.state.mistakes.length, 0);
  assert.equal(created.state.cards.length, 0);
});

test("batch 4 exposes level then skill selection and keeps legacy HSK 1-5 practice routes", () => {
  const selector = source("../src/app/practice/page.tsx") + source("../src/app/practice/practice-selector-client.tsx");
  const home = source("../src/app/page.tsx");
  const client = source("../src/app/practice/[level]/[skill]/practice-client.tsx");
  const route = source("../src/app/api/v1/practice/route.ts");
  const nextConfig = source("../next.config.ts");

  assert.match(selector, /Choose a level/);
  assert.match(selector, /Choose a skill/);
  assert.match(selector, /href=\{`\/practice\/\$\{selectedLevel\}\/\$\{item\.slug\}`\}/);
  assert.match(home, /href: "\/practice"/);
  assert.match(client, /PRACTICE_SESSION_EXPIRED/);
  assert.match(client, /PRACTICE_QUESTION_WITHDRAWN/);
  assert.match(route, /PRACTICE_SESSION_EXPIRED/);
  assert.match(route, /PRACTICE_QUESTION_WITHDRAWN/);
  assert.match(route, /410/);
  for (let level = 1; level <= 5; level += 1) {
    assert.equal(fs.existsSync(new URL(`../src/app/hsk-${level}-practice-test/page.tsx`, import.meta.url)), true);
    assert.doesNotMatch(nextConfig, new RegExp(`hsk-${level}-practice-test`));
  }
});

test("batch 4 keeps the new Practice contract in versioned server state without rewriting legacy question components", () => {
  const storage = source("../src/lib/learning/storage.ts");
  const legacy = source("../src/app/components/practice-test.tsx");
  const practiceRoute = source("../src/app/api/v1/practice/route.ts");

  assert.match(storage, /learning_states/);
  assert.match(storage, /revision/);
  assert.match(practiceRoute, /saveState/);
  assert.match(practiceRoute, /idempotencyKey/);
  assert.match(legacy, /export default function PracticeTest/);
});
