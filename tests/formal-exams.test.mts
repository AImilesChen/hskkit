import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { EXAM_SECONDS, examPhase, formalView, mayOpenPaper, saveFormalAnswer, startFormal, studentPaper, submitFormal } from "../src/lib/formal-exams/domain.ts";
import type { ExamPaper, Form } from "../src/lib/formal-exams/types.ts";
const paper = (form: Form) => JSON.parse(readFileSync(`src/lib/formal-exams/data/${form}.json`, "utf8")) as ExamPaper;
const start = "2026-11-08T12:00:00.000Z";
const at = (seconds: number) => new Date(Date.parse(start) + seconds * 1000).toISOString();
test("formal papers preserve 40 scored questions and 8 unscored examples", () => {
  for (const form of ["a", "b", "c"] as const) {
    const p = paper(form); assert.equal(p.parts.length, 8);
    assert.equal(p.parts.flatMap(p => p.questions).length, 40);
    assert.equal(new Set(p.parts.flatMap(p => p.questions.map(q => q.id))).size, 40);
    p.parts.forEach(part => { assert.equal(part.questions.length, 5); assert.ok(part.example.answer); });
    const s = startFormal(p, "guest-test", "start", start);
    assert.equal(s.questions.length, 40); assert.equal(Date.parse(s.deadlineAt) - Date.parse(start), EXAM_SECONDS * 1000);
  }
});
test("student projection never reveals scored answers, scripts or explanations", () => {
  for (const form of ["a", "b", "c"] as const) {
    const p = studentPaper(paper(form));
    for (const part of p.parts) for (const q of part.questions) {
      assert.equal(Object.hasOwn(q, "answer"), false); assert.equal(Object.hasOwn(q, "audioScript"), false);
      assert.equal(Object.hasOwn(q, "explanation"), false); assert.equal(Object.hasOwn(q, "answerEvidence"), false);
    }
    assert.ok(p.parts.every(p => p.example.answer));
    const view = formalView(startFormal(paper(form), "guest-test", "start", start), paper(form), start);
    assert.equal(view.result, undefined); assert.equal(Object.hasOwn(view, "questions"), false);
    assert.ok(!JSON.stringify(view).includes('"correctAnswer"'));
  }
});
test("A is free and B/C require Pro including active trial capabilities", () => {
  assert.equal(mayOpenPaper("a", "free"), true);
  for (const form of ["b", "c"] as const) { assert.equal(mayOpenPaper(form, "free"), false); assert.equal(mayOpenPaper(form, "pro"), true); }
});
test("phase boundaries retain 12-minute listening, 3-minute transfer and 20-minute reading", () => {
  assert.equal(examPhase(start, at(719)), "listening"); assert.equal(examPhase(start, at(720)), "transfer");
  assert.equal(examPhase(start, at(899)), "transfer"); assert.equal(examPhase(start, at(900)), "reading");
  assert.equal(examPhase(start, at(2099)), "reading"); assert.equal(examPhase(start, at(2100)), "expired");
});
test("answer writes enforce sections, valid options and server expiry", () => {
  const p = paper("a"), s = startFormal(p, "guest", "k", start);
  assert.throws(() => saveFormalAnswer(s, { questionId: s.questions[20].id, answer: "A", idempotencyKey: "r", now: at(1) }), /SECTION_LOCKED/);
  assert.throws(() => saveFormalAnswer(s, { questionId: s.questions[0].id, answer: "A", idempotencyKey: "r", now: at(900) }), /SECTION_LOCKED/);
  assert.throws(() => saveFormalAnswer(s, { questionId: s.questions[0].id, answer: "Z", idempotencyKey: "r", now: at(1) }), /INVALID_ANSWER/);
  assert.throws(() => saveFormalAnswer(s, { questionId: s.questions[20].id, answer: "A", idempotencyKey: "r", now: at(2100) }), /EXAM_TIME_EXPIRED/);
  assert.equal(saveFormalAnswer(s, { questionId: s.questions[0].id, answer: "A", idempotencyKey: "r", now: at(750) }).answers.length, 1);
});
test("idempotent retries do not double-save; reused keys cannot change answers", () => {
  const s = startFormal(paper("a"), "guest", "k", start);
  const input = { questionId: s.questions[0].id, answer: "A", idempotencyKey: "answer-key", now: at(1) };
  const saved = saveFormalAnswer(s, input); assert.equal(saveFormalAnswer(saved, input), saved);
  assert.throws(() => saveFormalAnswer(saved, { ...input, answer: "B" }), /IDEMPOTENCY_KEY_REUSED/);
  const second = saveFormalAnswer(saved, { ...input, idempotencyKey: "new-key", answer: "B" });
  assert.equal(second.answers.length, 1); assert.equal(second.answers[0].answer, "B");
  assert.throws(() => saveFormalAnswer(second, input), /IDEMPOTENCY_KEY_REUSED/);
});
test("all three papers score 40/40 and separate listening/reading without scoring examples", () => {
  for (const form of ["a", "b", "c"] as const) {
    const p = paper(form); let s = startFormal(p, "guest", "k", start);
    for (const q of s.questions) s = saveFormalAnswer(s, { questionId: q.id, answer: q.correctAnswer, idempotencyKey: q.id, now: at(q.dimension === "listening" ? 30 : 1000) });
    s = submitFormal(s, "submit", at(1200));
    assert.equal(s.result?.correctCount, 40); assert.equal(s.result?.totalCount, 40);
    assert.equal(s.result?.dimensionEvidence.listening?.correct, 20); assert.equal(s.result?.dimensionEvidence.reading?.correct, 20);
    assert.equal(formalView(s, p, at(1200)).result?.items.length, 40);
    assert.equal(submitFormal(s, "retry-submit", at(1300)), s);
    assert.throws(() => saveFormalAnswer(s, { questionId: s.questions[0].id, answer: "A", idempotencyKey: "late", now: at(1200) }), /EXAM_ALREADY_SUBMITTED/);
  }
});
test("unanswered and incorrect choices score zero, including late submission", () => {
  const p = paper("b"); let s = startFormal(p, "user:test", "k", start);
  const q = s.questions[0]; const wrong = Object.keys(q.options!).find(a => a !== q.correctAnswer)!;
  s = saveFormalAnswer(s, { questionId: q.id, answer: wrong, idempotencyKey: "wrong", now: at(1) });
  const result = formalView(submitFormal(s, "submit", at(4000)), p, at(4000)).result!;
  assert.equal(result.correct, 0); assert.equal(result.items.filter(q => !q.answer).length, 39);
  assert.equal(result.items[0].correct, false); assert.ok(result.items[0].script.length);
});
test("every referenced runtime media file exists; full audio matches the accepted recording", () => {
  const provenance = JSON.parse(readFileSync("src/lib/formal-exams/data/provenance.json", "utf8"));
  for (const form of ["a", "b", "c"] as const) {
    const p = paper(form); const files = new Set(readdirSync(`public/formal-media/${p.id}`));
    assert.ok(files.has("listening-full.mp3"));
    for (const file of Object.values(p.images)) assert.ok(files.has(file));
    for (const part of p.parts) for (const q of [part.example, ...part.questions]) if (q.audioSrc) assert.ok(files.has(q.audioSrc.split("/").at(-1)!));
    const sha = createHash("sha256").update(readFileSync(`public/formal-media/${p.id}/listening-full.mp3`)).digest("hex");
    assert.equal(sha, provenance.find(p => p.form === form).audioSha256);
  }
});
test("legacy routes cannot read, answer or submit formal sessions", () => {
  const source = readFileSync("src/app/api/v1/mock/route.ts", "utf8");
  assert.equal(source.match(/session\.id\.startsWith\("formal_"\)/g)?.length, 2);
  assert.ok(source.includes('prior?.id.startsWith("formal_")'));
});
test("direct media URLs are blocked before public asset delivery", () => {
  const middleware = readFileSync("src/middleware.ts", "utf8");
  assert.ok(middleware.includes('path.startsWith("/formal-media/")'));
  const config = readFileSync("wrangler.jsonc", "utf8");
  assert.match(config, /"run_worker_first"\s*:\s*\[\s*"\/formal-media\/\*"\s*\]/);
  const api = readFileSync("src/app/api/v1/formal-exams/media/[form]/[filename]/route.ts", "utf8");
  assert.ok(api.indexOf("requirePaperAccess(form") < api.indexOf("env.ASSETS.fetch"));
  assert.ok(api.includes('"private, no-store"'));
});
