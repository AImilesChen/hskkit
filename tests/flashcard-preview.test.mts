import assert from "node:assert/strict";
import test from "node:test";
import { createPreviewSession, ratePreview, repeatUncertain, shufflePreview } from "../src/lib/learning/flashcard-preview.ts";

test("a known-only preview completes after five decisions, without a retry round", () => {
  let session = createPreviewSession(5);
  for (let index = 0; index < 5; index += 1) session = ratePreview(session, "known");
  assert.equal(session.complete, true);
  assert.equal(session.round, 1);
  assert.equal(Object.values(session.ratings).filter((rating) => rating === "known").length, 5);
});

test("only uncertain words return, retaining the first round's decisions", () => {
  let session = createPreviewSession(5);
  for (const rating of ["retry", "known", "retry", "known", "known"] as const) session = ratePreview(session, rating);
  assert.equal(session.complete, false);
  assert.equal(session.round, 2);
  assert.deepEqual(session.order, [0, 2]);
  session = ratePreview(session, "known");
  session = ratePreview(session, "retry");
  assert.equal(session.complete, true);
  assert.equal(Object.values(session.ratings).filter((rating) => rating === "known").length, 4);
  const repeated = repeatUncertain(session);
  assert.deepEqual(repeated.order, [2]);
  assert.equal(repeated.complete, false);
  assert.equal(ratePreview(repeated, "known").complete, true);
});

test("repeated uncertainty ends the bounded preview rather than silently looping forever", () => {
  let session = createPreviewSession(5);
  for (let index = 0; index < 10; index += 1) session = ratePreview(session, "retry");
  assert.equal(session.complete, true);
  assert.equal(session.round, 2);
  assert.equal(Object.values(session.ratings).filter((rating) => rating === "known").length, 0);
  assert.equal(ratePreview(session, "known"), session);
});

test("shuffle preserves the visited prefix and the exact remaining word set", () => {
  const session = ratePreview(ratePreview(createPreviewSession(5), "known"), "retry");
  const shuffled = shufflePreview(session, () => 0);
  assert.deepEqual(shuffled.order.slice(0, session.cursor), session.order.slice(0, session.cursor));
  assert.deepEqual([...shuffled.order].sort(), [0, 1, 2, 3, 4]);
  assert.deepEqual(shuffled.ratings, session.ratings);
  assert.deepEqual(session.order, [0, 1, 2, 3, 4]);
});
