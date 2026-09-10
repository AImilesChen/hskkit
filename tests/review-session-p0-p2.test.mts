import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");

test("review queue prioritizes mistakes, preserves mixed skills, and respects a session cap", async () => {
  const { buildReviewQueue } = await import("../src/lib/learning/review-session.ts");
  const cards = [
    { id: "reading-due", isMistake: false, dimension: "reading", dueAt: "2026-01-01T00:00:00.000Z" },
    { id: "audio-mistake", isMistake: true, dimension: "audio", dueAt: "2026-01-03T00:00:00.000Z" },
    { id: "context-due", isMistake: false, dimension: "context_audio", dueAt: "2026-01-02T00:00:00.000Z" },
  ];
  assert.deepEqual(buildReviewQueue(cards, 2).map((card: { id: string }) => card.id), ["audio-mistake", "reading-due"]);
  assert.deepEqual(buildReviewQueue(cards, 20).map((card: { id: string }) => card.id), ["audio-mistake", "reading-due", "context-due"]);

  const { buildIntentReviewQueue, reviewEntryIntent } = await import("../src/lib/learning/review-session.ts");
  const cardsWithContent = cards.map((card) => ({ ...card, contentId: card.id }));
  const intent = reviewEntryIntent("?source=today&cap=2&cards=context-due%2Creading-due");
  assert.deepEqual(buildIntentReviewQueue(cardsWithContent, intent, 2).map((card: { id: string }) => card.id), ["context-due", "reading-due"]);
});

test("review session advances through its frozen card IDs and stops at the real queue length", async () => {
  const { activeReviewCardId } = await import("../src/lib/learning/review-session.ts");
  const reviewIds = ["card-1", "card-2", "card-3"];
  assert.equal(activeReviewCardId(reviewIds, 0), "card-1");
  assert.equal(activeReviewCardId(reviewIds, 1), "card-2");
  assert.equal(activeReviewCardId(reviewIds, 2), "card-3");
  assert.equal(activeReviewCardId(reviewIds, 3), undefined);
  assert.equal(activeReviewCardId(["only-card"], 0), "only-card");
  assert.equal(activeReviewCardId(["only-card"], 1), undefined);
  assert.equal(activeReviewCardId(reviewIds, 1 - 1), "card-1");

  const client = await source("src/app/components/learning-dashboard.tsx");
  assert.match(client, /entryIntent\.kind === "today"[\s\S]*activeTodayReviewCardId\(reviewIds, todayCompletedReviewIds\)[\s\S]*activeReviewCardId\(reviewIds, reviewedCount\)/);
  assert.doesNotMatch(client, /plannedCards\[0\]/);
});

test("Today review restores the first unfinished card regardless of queue order", async () => {
  const { activeTodayReviewCardId } = await import("../src/lib/learning/review-session.ts");
  const reviewIds = ["card-a", "card-b"];

  assert.equal(activeTodayReviewCardId(reviewIds, new Set(["card-b"])), "card-a");
  assert.equal(activeTodayReviewCardId(reviewIds, new Set(["card-a"])), "card-b");
  assert.equal(activeTodayReviewCardId(reviewIds, new Set(["card-a", "card-b"])), undefined);
  assert.equal(activeTodayReviewCardId(null, new Set()), undefined);
});

test("Today review refreshes stale state instead of submitting an already completed card", async () => {
  const client = await source("src/app/components/learning-dashboard.tsx");
  const staleGuard = /if \(entryIntent\.kind === "today" && activeTodayReviewCardId\(reviewIds, todayCompletedReviewIds\) !== card\.id\) \{[\s\S]*?await load\(true\);[\s\S]*?return;[\s\S]*?\}/g;
  assert.equal(client.match(staleGuard)?.length, 2);
});

test("rating copy explains memory outcome and interval without unexplained SRS jargon", async () => {
  const { reviewGradeOptions } = await import("../src/lib/learning/review-session.ts");
  assert.deepEqual(reviewGradeOptions(2.5, 1).map((option: { label: string; hint: string }) => [option.label, option.hint]), [
    ["Forgot", "Review again in 10 min"],
    ["Difficult", "Review tomorrow"],
    ["Remembered", "Review in 3 days"],
    ["Easy", "Review in 4 days"],
  ]);
});

test("review API exposes practice context for real mistake retry and transparent review reasons", async () => {
  const route = await source("src/app/api/v1/learning/route.ts");
  for (const token of ["isMistake", "choices", "level", "skill", "reviewReason", "priorAnswerLabel"]) assert.match(route, new RegExp(token));
  assert.match(route, /Answer from your earlier practice/);
});

test("review is a single-card session with setup, progress, retry, summary, and undo", async () => {
  const client = await source("src/app/components/learning-dashboard.tsx");
  const surface = client + await source("src/lib/learning/review-session.ts") + await source("src/app/api/v1/learning/route.ts");
  for (const token of [
    "Review setup", "[5, 10, 20]", "Start review", "Review progress",
    "Why this is here", "Choose an answer", "Check answer", "Your answer this time",
    "Answer from your earlier practice", "Forgot", "Difficult", "Remembered", "Easy",
    "Undo last rating", "Session complete", "Back to Today", "Continue practice",
  ]) assert.match(surface, new RegExp(token));
  assert.match(client, /activeCard/);
  assert.doesNotMatch(client, /due\.map\(\(card\)/);
  assert.doesNotMatch(client, />again<|>hard<|>good<|>easy</);
});

test("review layout stays task-first, responsive, and avoids dashboard-card sprawl", async () => {
  const client = await source("src/app/components/learning-dashboard.tsx");
  assert.match(client, /max-w-\[880px\]/);
  assert.match(client, /min-h-\[48px\]/);
  assert.match(client, /aria-live="polite"/);
  assert.match(client, /focus-visible:ring/);
  assert.match(client, /sm:grid-cols-4/);
});

test("Today presents one truthful review entry with due count, time, level, and skill mix", async () => {
  const client = await source("src/app/components/learning-dashboard.tsx");
  for (const token of ["dueForToday", "total due", "selectedReviewCards", "firstReviewIndex", "orderedTodayItems"]) {
    assert.match(client, new RegExp(token));
  }
  assert.match(client, /if \(item\.kind === "review" && index !== firstReviewIndex\) return null/);
});

test("revealed catalog review content uses published vocabulary details and only formal audio URLs", async () => {
  const route = await source("src/app/api/v1/learning/route.ts");
  const audio = await source("src/lib/learning/audio.ts");
  const client = await source("src/app/components/learning-dashboard.tsx");
  for (const token of ["pinyin", "meaning", "example", "formalAudioSrc"]) assert.match(route, new RegExp(token));
  for (const token of ["Pinyin", "Meaning", "Example", "Example translation", "Formal recording"]) assert.match(client, new RegExp(token));
  assert.match(route, /audio\?\.word\.audio\.status === "formal"/);
  assert.match(audio, /formalWordAudioUrlByContentId\.get\(item\.assetId\)/);
  assert.match(client, /<audio[^>]+controls[^>]+src=\{activeCard\.formalAudioSrc\}/);
});

test("Today starts its due queue directly while Mistakes targets the selected mistake", async () => {
  const { reviewEntryIntent, buildIntentReviewQueue } = await import("../src/lib/learning/review-session.ts");
  const cards = [
    { id: "due-1", contentId: "word:one", isMistake: false, dimension: "reading", dueAt: "2026-01-01T00:00:00.000Z" },
    { id: "mistake-1", contentId: "question:target", isMistake: true, dimension: "reading", dueAt: "2026-01-02T00:00:00.000Z" },
    { id: "mistake-2", contentId: "question:other", isMistake: true, dimension: "audio", dueAt: "2026-01-03T00:00:00.000Z" },
  ];
  assert.deepEqual(reviewEntryIntent("?source=today"), { kind: "today" });
  assert.deepEqual(reviewEntryIntent("?source=mistakes&contentId=question%3Atarget"), { kind: "mistake", contentId: "question:target" });
  assert.equal(reviewEntryIntent("").kind, "setup");
  assert.deepEqual(buildIntentReviewQueue(cards, { kind: "today" }, 10).map((card: { id: string }) => card.id), ["mistake-1", "mistake-2", "due-1"]);
  assert.deepEqual(buildIntentReviewQueue(cards, { kind: "mistake", contentId: "question:target" }, 10).map((card: { id: string }) => card.id), ["mistake-1"]);
});

test("review entry links preserve Today and selected-mistake context", async () => {
  const client = await source("src/app/components/learning-dashboard.tsx");
  assert.match(client, /`\/review\?source=today&dailySessionId=/);
  assert.match(client, /`\/review\?source=mistakes&contentId=\$\{encodeURIComponent\(mistake\.contentId\)\}\$\{mistake\.cardId/);
});

test("mistake retry and self-recall use distinct truthful interactions", async () => {
  const client = await source("src/app/components/learning-dashboard.tsx");
  const route = await source("src/app/api/v1/learning/route.ts");
  for (const token of ["Mistake retry", "Memory review", "Your answer this time", "Think of the answer before revealing it", "Earlier attempt", "Why the answer fits"]) {
    assert.match(client, new RegExp(token));
  }
  assert.doesNotMatch(route, /say the answer once before continuing/);
  assert.doesNotMatch(client, /Your current answer/);
});

test("loading and sync-error states keep the full learning workspace and footer below it", async () => {
  const client = await source("src/app/components/learning-dashboard.tsx");
  for (const token of ["LearningStatePage", "Preparing your review", "Loading due items and restoring progress", "min-h-\\[70vh\\]", "aria-busy"]) {
    assert.match(client, new RegExp(token));
  }
  assert.doesNotMatch(client, /if \\(!data\\) return <State/);
  assert.doesNotMatch(client, /if \\(error\\) return <State/);
});

test("review snapshots restore original question context, answer mode, real level and learner labels", async () => {
  const { reviewSnapshotForAttempt } = await import("../src/lib/learning/review-content.ts");
  const base = { id: "a", idempotencyKey: "k", contentVersion: "2026.08.22-batch13", dimension: "reading", answer: "A", correctAnswer: "B", correct: false, observedAt: "2026-01-01T00:00:00.000Z" } as const;
  const advanced = reviewSnapshotForAttempt({ ...base, contentId: "grammar:advanced-concession-guran", skill: "mock:pragmatics" });
  assert.equal(advanced?.level, 7);
  assert.equal(advanced?.levelBand, "7–9");
  assert.equal(advanced?.skillLabel, "Grammar");
  assert.equal(advanced?.answerMode, "choice");
  assert.equal(advanced?.options?.B, "It introduces the decisive qualification");
  assert.doesNotMatch(advanced?.skillLabel ?? "", /mock:/);

  const reading = reviewSnapshotForAttempt({ ...base, contentId: "reading:evidence-and-policy-evaluation" });
  assert.match(reading?.context ?? "", /试点报告/);
  assert.equal(reading?.levelBand, "7–9");
});

test("practice and mock attempts persist immutable review snapshots", async () => {
  const domain = await source("src/lib/learning/domain.ts");
  const practice = await source("src/lib/practice/domain.ts");
  const mock = await source("src/lib/mock/learning.ts");
  assert.match(domain, /reviewSnapshot\?: ReviewSnapshot/);
  assert.match(practice, /reviewSnapshot:/);
  assert.match(mock, /reviewSnapshot:/);
});

test("mistake retries are system-checked and only a correct retry can resolve the mistake", async () => {
  const { checkReviewAnswer } = await import("../src/lib/learning/review-content.ts");
  const choice = { answerMode: "choice", correctAnswer: "B", correctAnswerText: "答案", prompt: "题目", skillLabel: "Grammar", level: 3, levelBand: "3", explanation: "解释", options: { A: "错", B: "答案" } } as const;
  assert.equal(checkReviewAnswer(choice, "A"), false);
  assert.equal(checkReviewAnswer(choice, "B"), true);
  const typed = { ...choice, answerMode: "text", options: undefined, correctAnswer: "试点固然取得了进展" } as const;
  assert.equal(checkReviewAnswer(typed, "  试点 固然，取得了进展。 "), true);
  const route = await source("src/app/api/v1/learning/route.ts");
  assert.match(route, /action === "retry_review"/);
  assert.match(route, /checkReviewAnswer/);
  assert.match(route, /grade: correct \? "good" : "again"/);
});

test("review UI separates mistake submission from no-input self-recall memory review", async () => {
  const client = await source("src/app/components/learning-dashboard.tsx");
  for (const token of ["Check answer", "Type your answer", "Think of the answer before revealing", "There is no answer field", "older saved item"]) assert.match(client, new RegExp(token));
  assert.match(client, /reviewDraft\.trim\(\)/);
  assert.match(client, /setAudioError\(""\)/);
});

test("mistake links target an exact review card when content IDs repeat", async () => {
  const { reviewEntryIntent, buildIntentReviewQueue } = await import("../src/lib/learning/review-session.ts");
  const intent = reviewEntryIntent("?source=mistakes&contentId=shared&cardId=card-b");
  assert.deepEqual(intent, { kind: "mistake", contentId: "shared", cardId: "card-b" });
  const cards = [
    { id: "card-a", contentId: "shared", isMistake: true, dueAt: "2026-01-01T00:00:00.000Z", dimension: "reading" as const },
    { id: "card-b", contentId: "shared", isMistake: true, dueAt: "2026-01-01T00:00:00.000Z", dimension: "audio" as const },
  ];
  assert.deepEqual(buildIntentReviewQueue(cards, intent, 10).map((card) => card.id), ["card-b"]);
  const client = await source("src/app/components/learning-dashboard.tsx");
  assert.match(client, /cardId=\$\{encodeURIComponent\(mistake\.cardId\)\}/);
});

test("review retry identity, replay feedback and audio gating are enforced server-side", async () => {
  const route = await source("src/app/api/v1/learning/route.ts");
  const domain = await source("src/lib/learning/domain.ts");
  assert.match(route, /mistake\.contentId === card\.contentId && mistake\.contentVersion === card\.contentVersion/);
  assert.match(route, /sourceAttempt\?\.dimension === card\.dimension/);
  assert.match(route, /action === "retry_review"[\s\S]*gradeKeys\.includes\(key\)[\s\S]*correctAnswerText/);
  assert.match(route, /playbackRequired = card\.dimension !== "reading" && Boolean\(formalAudioSrc && formalAudioText\)/);
  assert.match(domain, /requireAudioPlayback\?: boolean/);
  assert.match(domain, /const sameDimension = \(sourceAttempt\?\.dimension \?\? "reading"\) === old\.dimension/);
});

test("grammar contexts use a real newline and choice retries expose a named fieldset", async () => {
  const review = await source("src/lib/learning/review-content.ts");
  const mock = await source("src/lib/mock/domain.ts");
  const client = await source("src/app/components/learning-dashboard.tsx");
  assert.doesNotMatch(review, /pattern}\\\\n/);
  assert.doesNotMatch(mock, /pattern}\\\\n/);
  assert.match(client, /<fieldset><legend[^>]*>Choose an answer<\/legend>/);
});

test("ordinary memory grades cannot resolve an open mistake and grade replay stores its original result", async () => {
  const { gradeReview } = await import("../src/lib/learning/domain.ts");
  const observedAt = "2026-08-30T00:00:00.000Z";
  const state = {
    attempts: [{ id: "attempt-1", idempotencyKey: "attempt-key", contentId: "shared", contentVersion: "v1", dimension: "reading", answer: "a", correctAnswer: "b", correct: false, observedAt }],
    cards: [{ id: "card-1", contentId: "shared", contentVersion: "v1", dimension: "reading", dueAt: observedAt, intervalDays: 0, ease: 2.5, revision: 0, reviewCount: 0, algorithmVersion: "hskkit-srs-v1", sourceAttemptId: "attempt-1", gradeKeys: [] }],
    mistakes: [{ id: "mistake-1", contentId: "shared", contentVersion: "v1", sourceAttemptId: "attempt-1", status: "open", createdAt: observedAt }],
    dailySessions: [],
  } as const;
  const graded = gradeReview(state as never, { cardId: "card-1", grade: "good", idempotencyKey: "grade-key", observedAt, clientRevision: 0, resolveMistakes: false });
  assert.equal(graded.state.mistakes[0].status, "open");
  assert.equal(graded.card.gradeResults?.["grade-key"], "good");
});

test("formal listening snapshots retain private playback text without exposing it in public question payloads", async () => {
  const [practiceQuestions, practiceDomain, mockDomain, mockLearning, route] = await Promise.all([
    source("src/lib/practice/questions.ts"),
    source("src/lib/practice/domain.ts"),
    source("src/lib/mock/domain.ts"),
    source("src/lib/mock/learning.ts"),
    source("src/app/api/v1/learning/route.ts"),
  ]);
  assert.match(practiceQuestions, /audioText: skill === "listening" \? seed\.text : undefined/);
  assert.match(practiceDomain, /audioText: question\.audioText/);
  assert.match(mockDomain, /audioText: listening\.voiceText/);
  assert.match(mockLearning, /audioText: question\.audioText/);
  assert.match(mockDomain, /audioText: _audioText/);
  assert.match(route, /Boolean\(formalAudioSrc && formalAudioText\)/);
  assert.match(route, /replayCard\.gradeResults\?\.\[key\]/);
  assert.match(route, /resolveMistakes: !hasOpenMistake/);
});
