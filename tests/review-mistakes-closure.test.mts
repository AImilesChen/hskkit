import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  gradeReview,
  masterySnapshot,
  recordAttempt,
  undoLastReview,
  type LearningState,
} from "../src/lib/learning/domain.ts";

const source = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const emptyState = (): LearningState => ({ attempts: [], cards: [], mistakes: [], dailySessions: [] });
const observedAt = "2026-09-08T09:00:00.000Z";

function wrongReadingAttempt() {
  return recordAttempt(emptyState(), {
    idempotencyKey: "closure-wrong",
    contentId: "question:closure",
    contentVersion: "v1",
    dimension: "reading",
    answer: "A",
    correctAnswer: "B",
    observedAt,
  }).state;
}

test("wrong answer immediately creates an open mistake and a due review without inflating mastery", () => {
  const state = wrongReadingAttempt();
  assert.equal(state.mistakes[0]?.status, "open");
  assert.equal(state.cards[0]?.dueAt, observedAt);
  assert.deepEqual(masterySnapshot(state), { reading: 0, audio: 0, context_audio: 0 });
});

test("only a successful real review updates mastery, resolves the mistake and schedules the next review", () => {
  const state = wrongReadingAttempt();
  const failed = gradeReview(state, {
    cardId: state.cards[0].id,
    grade: "again",
    idempotencyKey: "closure-retry-wrong",
    observedAt: "2026-09-08T09:01:00.000Z",
    clientRevision: 0,
    resolveMistakes: true,
  });
  assert.equal(failed.state.mistakes[0].status, "open");
  assert.deepEqual(masterySnapshot(failed.state), { reading: 0, audio: 0, context_audio: 0 });

  const corrected = gradeReview(failed.state, {
    cardId: failed.card.id,
    grade: "good",
    idempotencyKey: "closure-retry-correct",
    observedAt: "2026-09-08T09:02:00.000Z",
    clientRevision: 1,
    resolveMistakes: true,
  });
  assert.equal(corrected.state.mistakes[0].status, "resolved");
  assert.ok(corrected.state.mistakes[0].resolvedAt);
  assert.ok(new Date(corrected.card.dueAt).getTime() > new Date("2026-09-08T09:02:00.000Z").getTime());
  assert.deepEqual(masterySnapshot(corrected.state), { reading: 1, audio: 0, context_audio: 0 });

  const undone = undoLastReview(corrected.state, { cardId: corrected.card.id, idempotencyKey: "closure-undo" });
  assert.equal(undone.mistakes[0].status, "open");
  assert.deepEqual(masterySnapshot(undone), { reading: 0, audio: 0, context_audio: 0 });
});

test("Review and Mistakes are workspaces for early review and corrected history, not dead-end links", async () => {
  const dashboard = await source("src/app/components/learning-dashboard.tsx");
  for (const token of [
    "Upcoming reviews",
    "Corrected mistakes",
    "Corrected ",
    "Mastered after successful review",
  ]) assert.match(dashboard, new RegExp(token));
  assert.match(dashboard, /data\.mistakes\s*\.filter\(\(mistake\) => mistake\.status === "resolved"\)/);
});

test("account learning state remains server-backed for refresh, re-login and another device", async () => {
  const [route, storage] = await Promise.all([
    source("src/app/api/v1/learning/route.ts"),
    source("src/lib/learning/storage.ts"),
  ]);
  assert.match(route, /user:\$\{identity\.account\.userId\}/);
  assert.match(storage, /learning_states/);
  assert.match(storage, /JSON\.stringify\(state\)/);
  assert.match(storage, /JSON\.parse\(row\.state_json\)/);
});
