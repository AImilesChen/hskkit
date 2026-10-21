import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { applyDailyItemAction, assertCurrentDailySession, assertTodayLearnItemMatches, buildDailySession, emptyLearningState, gradeReview, recordAttempt } from "../src/lib/learning/domain.ts";
import { selectTodayContent, todayContentByAssetId, todayContentByContentId, todayMeaningCheck } from "../src/lib/learning/today-content.ts";
import { completionProofNeedsSync, isTodayBudgetMinutes, isTodayFocus, isTodayNewWordCount, parseTodayCompletionProof, recommendTodayMinutes, recommendTodayNewWordCount, resolveTodayCelebration, todayCompletionProof, todayJourneyProgress, todaySummaryStats, TODAY_BUDGET_OPTIONS, TODAY_FOCUS_OPTIONS, TODAY_NEW_WORD_OPTIONS } from "../src/lib/learning/today-plan.ts";
import { answerPracticeQuestion, createPracticeSession } from "../src/lib/practice/domain.ts";
import { trustedPracticeQuestionVersion } from "../src/lib/practice/questions.ts";

const root = new URL("../", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");
const now = "2026-09-09T09:00:00.000Z";

test("Today keeps the completed review as one stable journey phase and advances to phase two of five", () => {
  const route = [
    { id: "review-1", kind: "review", status: "completed" },
    { id: "review-2", kind: "review", status: "completed" },
    { id: "review-3", kind: "review", status: "completed" },
    { id: "learn", kind: "learn", status: "pending" },
    { id: "audio", kind: "listen", status: "pending" },
    { id: "context", kind: "listen", status: "pending" },
    { id: "practice", kind: "practice", status: "pending" },
  ] as const;
  assert.deepEqual(todayJourneyProgress(route), { currentPhase: 2, totalPhases: 5, completedPhases: 1 });
});

test("Today groups three words into one Learn phase and keeps listening and context as stable phases", () => {
  const route = [
    { id: "review-1", kind: "review", status: "completed" },
    ...Array.from({ length: 3 }, (_, index) => ({ id: `learn-${index}`, kind: "learn" as const, status: "completed" as const })),
    ...Array.from({ length: 3 }, (_, index) => ({ id: `audio-${index}`, kind: "listen" as const, dimension: "audio" as const, status: "completed" as const })),
    ...Array.from({ length: 3 }, (_, index) => ({ id: `context-${index}`, kind: "listen" as const, dimension: "context_audio" as const, status: "completed" as const })),
    { id: "practice", kind: "practice", status: "pending" },
  ] as const;
  assert.deepEqual(todayJourneyProgress(route), { currentPhase: 5, totalPhases: 5, completedPhases: 4 });
});

test("Today derives a useful default word count from the selected time budget", () => {
  assert.deepEqual(TODAY_NEW_WORD_OPTIONS, [1, 2, 3, 5]);
  assert.equal(recommendTodayNewWordCount(5), 1);
  assert.equal(recommendTodayNewWordCount(10), 2);
  assert.equal(recommendTodayNewWordCount(15), 3);
  assert.equal(recommendTodayNewWordCount(20), 3);
  assert.equal(recommendTodayNewWordCount(30), 5);
});

test("Today gives every planned word a stable four-choice meaning check", () => {
  const plan = selectTodayContent(2, 3);
  assert.equal(plan.status, "ready");
  if (plan.status !== "ready") return;
  for (const item of plan.items) {
    const first = todayMeaningCheck(item);
    const second = todayMeaningCheck(item);
    assert.deepEqual(first, second);
    assert.equal(first?.options.length, 4);
    assert.equal(new Set(first?.options.map((option) => option.text)).size, 4);
    assert.equal(first?.options.find((option) => option.key === first.correctAnswer)?.text, item.meaning);
  }
});

test("Today stores the verified Learn memory check with the completed item", () => {
  const plan = selectTodayContent(1, 1);
  const built = buildDailySession(emptyLearningState(), {
    ownerId: "verified-learn",
    localDay: "2026-09-09",
    ruleVersion: "today-v10",
    now,
    dailyContent: plan,
    budgetMinutes: 20,
    newWordCount: 1,
  });
  const learn = built.session.items.find((item) => item.kind === "learn")!;
  const completed = applyDailyItemAction(built.state, {
    sessionId: built.session.id,
    itemId: learn.id,
    action: "complete",
    idempotencyKey: "complete-verified-learn",
    observedAt: now,
    learnCheck: { mode: "meaning", attempts: 2, firstTryCorrect: false, verifiedAt: now },
  });
  assert.equal(completed.item.status, "completed");
  assert.deepEqual(completed.item.learnCheck, { mode: "meaning", attempts: 2, firstTryCorrect: false, verifiedAt: now });
});

test("a 20 minute plan contains three distinct words and only their available listening", () => {
  const plan = selectTodayContent(2, 3);
  assert.equal(plan.status, "ready");
  const built = buildDailySession(emptyLearningState(), {
    ownerId: "today-three-words",
    localDay: "2026-09-09",
    ruleVersion: "today-v9",
    now: "2026-09-09T08:00:00.000Z",
    dailyContent: plan,
    budgetMinutes: 20,
    newWordCount: 3,
    listeningEnabled: true,
    focus: "balanced",
  });
  const active = built.session.items.filter((item) => !item.deferred && item.kind !== "summary");
  assert.equal(active.filter((item) => item.kind === "learn").length, 3);
  assert.equal(active.filter((item) => item.kind === "listen").length, 4);
  assert.equal(active.filter((item) => item.kind === "practice").length, 1);
  assert.deepEqual(active.slice(0, 8).map((item) => item.kind === "listen" ? `${item.kind}:${item.dimension}` : item.kind), [
    "learn", "learn", "learn",
    "listen:audio", "listen:audio", "listen:audio",
    "listen:context_audio", "practice",
  ]);
});

test("Today uses the wider approved word pool and reports the real planned count", () => {
  const plan = selectTodayContent(1, 3);
  assert.equal(plan.status, "ready");
  if (plan.status !== "ready") return;
  assert.equal(plan.items.length, 3);
  assert.equal(new Set(plan.items.map((item) => item.contentId)).size, 3);
  const built = buildDailySession(emptyLearningState(), {
    ownerId: "learner-l1",
    localDay: "2026-09-09",
    ruleVersion: "today-v9",
    now: "2026-09-09T10:00:00.000Z",
    dailyContent: plan,
    budgetMinutes: 20,
    newWordCount: 3,
    listeningEnabled: true,
    focus: "balanced",
  });
  assert.equal(built.session.newWordCount, 3);
  assert.equal(built.session.plannedNewWordCount, 3);
});

test("mistakes created inside Today are saved for review without re-locking the frozen session", () => {
  const plan = selectTodayContent(1, 3);
  const built = buildDailySession(emptyLearningState(), {
    ownerId: "today-frozen-session",
    localDay: "2026-09-09",
    ruleVersion: "today-v9",
    now,
    dailyContent: plan,
    budgetMinutes: 20,
    newWordCount: 3,
  });
  const attempted = recordAttempt(built.state, {
    idempotencyKey: "today-practice-mistake",
    contentId: "practice:question-1",
    contentVersion: "practice-v1",
    dimension: "reading",
    answer: "a",
    correctAnswer: "b",
    observedAt: now,
    mode: "practice",
    dailySessionId: built.session.id,
    dailyItemId: built.session.items.find((item) => item.kind === "practice")?.id,
  });
  const session = attempted.state.dailySessions.find((item) => item.id === built.session.id)!;
  const addedReview = session.items.find((item) => item.kind === "review");
  assert.equal(addedReview?.status, "pending");
  assert.equal(addedReview?.deferred, true);
});

test("finishing a Today Practice with mistakes unlocks Summary immediately and keeps new reviews deferred", () => {
  const ownerId = "today-practice-summary";
  const built = buildDailySession(emptyLearningState(), {
    ownerId,
    localDay: "2026-09-09",
    ruleVersion: "today-v9",
    now,
    dailyContent: selectTodayContent(1, 3),
    budgetMinutes: 20,
    newWordCount: 3,
  });
  const practiceItem = built.session.items.find((item) => item.kind === "practice")!;
  const readyState = {
    ...built.state,
    dailySessions: built.state.dailySessions.map((session) => session.id === built.session.id
      ? { ...session, items: session.items.map((item) => item.kind !== "practice" && item.kind !== "summary" ? { ...item, status: "completed" as const } : item) }
      : session),
  };
  const skill = practiceItem.contentId.split(":").at(-1)!;
  const created = createPracticeSession(readyState, {
    ownerId,
    level: 1,
    skill,
    idempotencyKey: "today-practice-session",
    now,
    dailySessionId: built.session.id,
    dailyItemId: practiceItem.id,
  });
  let state = created.state;
  for (const [index, questionId] of created.session.questionIds.entries()) {
    const question = trustedPracticeQuestionVersion(questionId, created.session.questionVersion)!;
    const wrongAnswer = Object.keys(question.options).find((answer) => answer !== question.correctAnswer)!;
    state = answerPracticeQuestion(state, {
      ownerId,
      sessionId: created.session.id,
      questionId,
      answer: wrongAnswer,
      idempotencyKey: `today-practice-answer-${index}`,
      now: new Date(Date.parse(now) + index * 1000).toISOString(),
    }).state;
  }
  const completed = state.dailySessions.find((session) => session.id === built.session.id)!;
  assert.equal(completed.items.find((item) => item.kind === "practice")?.status, "completed");
  assert.equal(completed.items.find((item) => item.kind === "summary")?.status, "completed");
  assert.equal(completed.items.filter((item) => item.kind === "review" && !(built.session.reviewItemIds ?? []).includes(item.id)).every((item) => item.deferred), true);
});

test("Today completion proof holds the server revision and blocks stale locked rendering", () => {
  const encoded = todayCompletionProof({ dailySessionId: "day-1", dailyItemId: "practice-1", revision: 12, summaryComplete: true });
  const proof = parseTodayCompletionProof(encoded);
  assert.deepEqual(proof, { dailySessionId: "day-1", dailyItemId: "practice-1", revision: 12, summaryComplete: true });
  assert.equal(completionProofNeedsSync(proof, { sessionId: "day-1", revision: 11, completedItemId: "practice-1", completedItem: false, summaryComplete: false }), true);
  assert.equal(completionProofNeedsSync(proof, { sessionId: "day-1", revision: 12, completedItemId: "practice-1", completedItem: true, summaryComplete: true }), false);
});

test("Today summary reports real completed work including archived review items", () => {
  const stats = todaySummaryStats([
    { id: "review-archived", kind: "review", status: "completed", estimatedMinutes: 0 },
    { id: "learn-1", kind: "learn", status: "completed" },
    { id: "learn-2", kind: "learn", status: "completed" },
    { id: "learn-3", kind: "learn", status: "completed" },
    { id: "audio-1", kind: "listen", dimension: "audio", status: "completed" },
    { id: "context-1", kind: "listen", dimension: "context_audio", status: "skipped" },
    { id: "practice", kind: "practice", status: "completed" },
    { id: "summary", kind: "summary", status: "completed" },
  ]);
  assert.deepEqual(stats, { completedTasks: 6, skippedTasks: 1, reviewsCompleted: 1, wordsLearned: 3, listeningCompleted: 1, practiceCompleted: 1 });
});

test("Today stage progress does not report skipped work as completed", () => {
  assert.deepEqual(todayJourneyProgress([
    { id: "review", kind: "review", status: "completed" },
    { id: "learn", kind: "learn", status: "skipped" },
    { id: "audio", kind: "listen", dimension: "audio", status: "pending" },
    { id: "context", kind: "listen", dimension: "context_audio", status: "pending" },
    { id: "practice", kind: "practice", status: "pending" },
  ]), { currentPhase: 3, totalPhases: 5, completedPhases: 1 });
});

test("Today renders the saved Learn word inline and completes it before unlocking listening", async () => {
  const [dashboard, route, content] = await Promise.all([
    source("src/app/components/learning-dashboard.tsx"),
    source("src/app/api/v1/learning/route.ts"),
    source("src/lib/learning/today-content.ts"),
  ]);
  for (const token of [
    "Today review",
    "Tasks completed",
    "learnContent",
    "Formal pronunciation",
    "Example translation",
    "completeLearn",
    "Start memory check",
    "Check answer and continue",
    "scrollIntoView",
  ]) assert.match(dashboard, new RegExp(token));
  assert.match(route, /learnContent/);
  assert.match(content, /audioSrc/);
  const travel = todayContentByAssetId("hsk3.word.l2.0368.v1");
  assert.equal(todayContentByContentId("catalog:hsk3.word.l2.0368")?.hanzi, "旅行");
  assert.deepEqual(travel && { hanzi: travel.hanzi, pinyin: travel.pinyin, meaning: travel.meaning, audio: Boolean(travel.audioSrc), example: travel.example?.hanzi }, {
    hanzi: "旅行",
    pinyin: "lǚxíng",
    meaning: "to travel; journey; trip",
    audio: true,
    example: "我们暑假去中国旅行。",
  });
});

test("Today Learn opens the exact planned word and removes the technical content-update notice", () => {
  const plan = selectTodayContent(1);
  assert.equal(plan.status, "ready");
  if (plan.status !== "ready") return;
  const first = buildDailySession(emptyLearningState(), {
    ownerId: "today-p0",
    localDay: "2026-09-09",
    ruleVersion: "today-v6",
    now,
    dailyContent: plan,
    budgetMinutes: 30,
  });
  const learn = first.session.items.find((item) => item.kind === "learn");
  assert.equal(learn?.href, `/word/${plan.item.studySlug}`);

  const replanned = buildDailySession(first.state, {
    ownerId: "today-p0",
    localDay: "2026-09-09",
    ruleVersion: "today-v6",
    now: "2026-09-09T10:00:00.000Z",
    dailyContent: selectTodayContent(2),
    budgetMinutes: 20,
  });
  assert.notEqual(replanned.session.notice?.code, "CONTENT_UPDATED");
});

test("Today has one dominant start action, explicit plan save feedback, progress, remaining time and plan-gap reason", async () => {
  const dashboard = await source("src/app/components/learning-dashboard.tsx");
  for (const token of [
    "Continue Today Session",
    "Current stage",
    "of {journeyProgress.totalPhases}",
    "Tasks completed",
    "min left",
    "Why this plan",
    "Save changes",
    "Plan updated",
    "Plan change is pending. Use Retry sync",
    "Recommended time",
    "Why today arranged this",
  ]) assert.match(dashboard, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(dashboard, /onChange=\{\(event\) => void configureToday/);
  assert.doesNotMatch(dashboard, /Open word list/);
  assert.doesNotMatch(dashboard, /Mark learned/);
});

test("Today budget is restricted to the approved presets and personalization uses score, mistakes, streak and mastery", () => {
  assert.deepEqual(TODAY_BUDGET_OPTIONS, [5, 10, 15, 20, 30]);
  for (const allowed of TODAY_BUDGET_OPTIONS) assert.equal(isTodayBudgetMinutes(allowed), true);
  for (const rejected of [6, 9, 45, 60, 180, 20.5, "20"]) assert.equal(isTodayBudgetMinutes(rejected), false);
  assert.equal(recommendTodayMinutes({ monthPoints: 0, openMistakes: 0, currentStreak: 0, mastery: { reading: 0, audio: 0, context_audio: 0 }, cardCount: 0 }), 15);
  assert.equal(recommendTodayMinutes({ monthPoints: 100, openMistakes: 0, currentStreak: 0, mastery: { reading: 4, audio: 4, context_audio: 4 }, cardCount: 4 }), 20);
  assert.equal(recommendTodayMinutes({ monthPoints: 0, openMistakes: 3, currentStreak: 0, mastery: { reading: 4, audio: 4, context_audio: 4 }, cardCount: 4 }), 30);
  assert.equal(recommendTodayMinutes({ monthPoints: 0, openMistakes: 0, currentStreak: 0, mastery: { reading: 5, audio: 1, context_audio: 5 }, cardCount: 6 }), 30);
});

test("Adjust Today exposes and validates every confirmed plan control in a responsive modal", async () => {
  assert.deepEqual(TODAY_NEW_WORD_OPTIONS, [1, 2, 3, 5]);
  assert.deepEqual(TODAY_FOCUS_OPTIONS, ["balanced", "review_first", "fix_mistakes", "listening_focus"]);
  for (const count of TODAY_NEW_WORD_OPTIONS) assert.equal(isTodayNewWordCount(count), true);
  for (const rejected of [0, 4, 1.5, "2"]) assert.equal(isTodayNewWordCount(rejected), false);
  for (const focus of TODAY_FOCUS_OPTIONS) assert.equal(isTodayFocus(focus), true);
  for (const rejected of ["review", "mistakes", "listen", 1]) assert.equal(isTodayFocus(rejected), false);
  const [dashboard, css, route] = await Promise.all([
    source("src/app/components/learning-dashboard.tsx"),
    source("src/app/globals.css"),
    source("src/app/api/v1/learning/route.ts"),
  ]);
  for (const token of ["Adjust today’s plan", "New words", "Include listening", "Balanced", "Review first", "Fix mistakes", "Listening focus", "Save changes", "Cancel"]) {
    assert.match(dashboard, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(dashboard, /role="dialog"/);
  assert.match(dashboard, /aria-modal="true"/);
  assert.match(dashboard, /event\.key === "Escape"/);
  assert.match(css, /\.today-plan-overlay/);
  assert.match(css, /@media \(min-width: 768px\)[\s\S]*\.today-plan-dialog[\s\S]*margin-left: auto/);
  assert.match(css, /@media \(max-width: 767px\)[\s\S]*\.today-plan-overlay[\s\S]*align-items: end/);
  assert.match(css, /padding-bottom: calc\([^;]*env\(safe-area-inset-bottom\)/);
  assert.match(route, /newWordCount/);
  assert.match(route, /listeningEnabled/);
  assert.match(route, /focus/);
});

test("Today plan preferences change the saved plan rather than acting as decorative controls", () => {
  const content = selectTodayContent(3, 3);
  assert.equal(content.status, "ready");
  if (content.status !== "ready") return;
  assert.ok(content.items.length >= 2 && content.items.length <= 3);
  const withoutListening = buildDailySession(emptyLearningState(), {
    ownerId: "today-controls",
    localDay: "2026-09-09",
    ruleVersion: "today-v7",
    now,
    dailyContent: content,
    budgetMinutes: 30,
    newWordCount: 3,
    listeningEnabled: false,
    focus: "fix_mistakes",
  });
  assert.equal(withoutListening.session.newWordCount, 3);
  assert.equal(withoutListening.session.listeningEnabled, false);
  assert.equal(withoutListening.session.focus, "fix_mistakes");
  assert.equal(withoutListening.session.items.some((item) => item.kind === "listen"), false);
  assert.ok(withoutListening.session.items.filter((item) => item.kind === "learn").length >= 2);
});

test("each Today priority changes the route order", () => {
  const content = selectTodayContent(1, 1);
  assert.equal(content.status, "ready");
  if (content.status !== "ready") return;
  const state = emptyLearningState();
  state.attempts = [{ id: "attempt-mistake", idempotencyKey: "attempt-mistake", contentId: "due-mistake", contentVersion: "v1", dimension: "reading", answer: "x", correctAnswer: "y", correct: false, observedAt: "2026-09-08T00:00:00.000Z" }];
  state.mistakes = [{ id: "mistake-1", contentId: "due-mistake", contentVersion: "v1", sourceAttemptId: "attempt-mistake", status: "open", createdAt: "2026-09-08T00:00:00.000Z" }];
  state.cards = [
    { id: "card-old", contentId: "due-old", contentVersion: "v1", dimension: "reading", dueAt: "2026-09-06T00:00:00.000Z", intervalDays: 1, ease: 2.5, revision: 1, reviewCount: 1, algorithmVersion: "hskkit-srs-v1", sourceAttemptId: "attempt-old", gradeKeys: [] },
    { id: "card-middle", contentId: "due-middle", contentVersion: "v1", dimension: "audio", dueAt: "2026-09-07T00:00:00.000Z", intervalDays: 1, ease: 2.5, revision: 1, reviewCount: 1, algorithmVersion: "hskkit-srs-v1", sourceAttemptId: "attempt-middle", gradeKeys: [] },
    { id: "card-mistake", contentId: "due-mistake", contentVersion: "v1", dimension: "reading", dueAt: "2026-09-08T00:00:00.000Z", intervalDays: 1, ease: 2.5, revision: 1, reviewCount: 1, algorithmVersion: "hskkit-srs-v1", sourceAttemptId: "attempt-mistake", gradeKeys: [] },
  ];
  const route = (focus: "balanced" | "review_first" | "fix_mistakes" | "listening_focus") => buildDailySession(state, { ownerId: `priority-${focus}`, localDay: "2026-09-09", ruleVersion: "today-v7", now, dailyContent: content, budgetMinutes: 30, newWordCount: 1, listeningEnabled: true, focus }).session.items.filter((item) => item.kind !== "summary");
  const balanced = route("balanced");
  const reviewFirst = route("review_first");
  const fixMistakes = route("fix_mistakes");
  const listeningFocus = route("listening_focus");
  assert.equal(balanced[2]?.kind, "learn");
  assert.equal(reviewFirst[2]?.kind, "review");
  assert.equal(fixMistakes[0]?.contentId, "due-mistake");
  assert.equal(listeningFocus[0]?.kind, "listen");
});

test("Today Learn completion is bound to the exact planned content and version", () => {
  const plan = selectTodayContent(1);
  assert.equal(plan.status, "ready");
  if (plan.status !== "ready") return;
  const built = buildDailySession(emptyLearningState(), { ownerId: "today-bind", localDay: "2026-09-09", ruleVersion: "today-v6", now, dailyContent: plan, budgetMinutes: 30 });
  const learn = built.session.items.find((item) => item.kind === "learn");
  assert.ok(learn?.contentVersion);
  assert.doesNotThrow(() => assertCurrentDailySession(built.session, built.session.id));
  assert.throws(() => assertCurrentDailySession(built.session, "day_from_yesterday"), /STALE_TODAY_SESSION/);
  assert.doesNotThrow(() => assertTodayLearnItemMatches(built.state, { sessionId: built.session.id, itemId: learn!.id, contentId: plan.item.contentId, contentVersion: plan.item.contentVersion }));
  assert.throws(() => assertTodayLearnItemMatches(built.state, { sessionId: built.session.id, itemId: learn!.id, contentId: "word:wrong", contentVersion: plan.item.contentVersion }), /TODAY_LEARN_WORD_MISMATCH/);
});

test("Today subpages preserve Today Session context and finish through the saved server item", async () => {
  const [wordPage, wordAction, audio, practice] = await Promise.all([
    source("src/app/word/[slug]/page.tsx"),
    source("src/app/components/today-word-completion.tsx"),
    source("src/app/components/audio-exercise.tsx"),
    source("src/app/practice/[level]/[skill]/practice-client.tsx"),
  ]);
  assert.match(wordPage, /TodayWordCompletion/);
  assert.match(wordAction, /action: "complete_item"/);
  assert.match(wordAction, /answer, attempts/);
  assert.match(wordAction, /sessionStorage\.getItem\(storageKey\)/);
  assert.match(wordAction, /completed=learn&completedSession=/);
  const learningRoute = await source("src/app/api/v1/learning/route.ts");
  const dashboard = await source("src/app/components/learning-dashboard.tsx");
  const practiceRoute = await source("src/app/api/v1/practice/route.ts");
  assert.match(learningRoute, /assertCurrentDailySession\(activeToday\.session, sessionId\)/);
  assert.match(learningRoute, /assertDailyAudioBinding\(state, dailySessionId, dailyItemId, exercise, activeToday\.session\.id\)/);
  assert.match(learningRoute, /TODAY_LEARN_CHECK_REQUIRED/);
  assert.match(dashboard, /Start memory check/);
  assert.match(dashboard, /Initial learning complete · memory check passed/);
  assert.match(practiceRoute, /assertCurrentDailyPracticeBinding/);
  assert.match(practiceRoute, /PRACTICE_DAILY_SESSION_STALE/);
  assert.match(audio, /tzOffset: new Date\(\)\.getTimezoneOffset\(\)/);
  assert.match(practice, /tzOffset: new Date\(\)\.getTimezoneOffset\(\)/);
  for (const content of [audio, practice]) {
    assert.match(content, /Today Session/);
    assert.match(content, /Continue Today Session/);
  }
});

test("completed Today renders truthful statistics, recovery, personalization and three next-step entries", async () => {
  const dashboard = await source("src/app/components/learning-dashboard.tsx");
  for (const token of [
    "Daily Summary",
    "Stage progress",
    "Completed tasks",
    "Skipped tasks",
    "open mistakes",
    "review questions completed",
    "new words learned",
    "listening checks completed",
    "practice questions completed",
    "Recommended focus",
    "Monthly learning score",
    "Explore HSK {data.session.startLevel ?? 1} words",
    "Review {open.length} open mistake",
    "Done for today",
    "Current streak",
  ]) assert.match(dashboard, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(dashboard, /Back to Today/);
});

test("Today return celebration is truthful and upgrades the final step to a whole-session celebration", () => {
  assert.equal(resolveTodayCelebration({ returnedKind: null, completedCount: 1, summaryComplete: false }), null);
  assert.equal(resolveTodayCelebration({ returnedKind: "listen", completedCount: 0, summaryComplete: false }), null);
  assert.deepEqual(resolveTodayCelebration({ returnedKind: "review", completedCount: 2, summaryComplete: false }), {
    kind: "step",
    icon: "review",
    eyebrow: "Step complete",
    title: "Review complete!",
    message: "2 review items saved. Your next Today step is ready.",
  });
  assert.deepEqual(resolveTodayCelebration({ returnedKind: "practice", completedCount: 1, summaryComplete: true }), {
    kind: "session",
    icon: "target",
    eyebrow: "Today complete",
    title: "Today’s session wrapped up!",
    message: "Completed work is saved, and any skipped steps remain visible to restore.",
  });
});

test("Today journey makes current, completed, locked and skipped states unmistakable with local actions", async () => {
  const [dashboard, todayPlan] = await Promise.all([
    source("src/app/components/learning-dashboard.tsx"),
    source("src/lib/learning/today-plan.ts"),
  ]);
  for (const token of [
    "HomeIcon",
    "TodayHeroArtwork",
    "TodayJourneyIcon",
    "Today’s plan",
    "Balanced",
    "Adjust",
    "Locked",
    "Complete the previous step to unlock",
    "Step complete",
    "Moved to tomorrow",
    "today-mobile-action",
    "Learning Points",
    "Conversion is not open yet",
    "subscription AI credits stay separate",
    "Correct open mistakes",
  ]) assert.match(dashboard, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(dashboard, /primaryTodayAction\(item,/);
  assert.match(dashboard, /min-h-\[72px\][\s\S]{0,500}Today’s plan/);
  assert.match(todayPlan, /Today’s session wrapped up!/);
  assert.match(dashboard, /event\.key === "Escape"/);
  assert.match(dashboard, /querySelectorAll<HTMLElement>/);
});

test("every Today-bound completion route returns a celebration signal without changing completion authority", async () => {
  const [wordAction, audio, practice, dashboard, practiceRoute] = await Promise.all([
    source("src/app/components/today-word-completion.tsx"),
    source("src/app/components/audio-exercise.tsx"),
    source("src/app/practice/[level]/[skill]/practice-client.tsx"),
    source("src/app/components/learning-dashboard.tsx"),
    source("src/app/api/v1/learning/route.ts"),
  ]);
  assert.match(wordAction, /completed=learn&completedSession=.*completedItem=/);
  assert.match(audio, /completed=listen&completedSession=.*completedItem=/);
  assert.match(practice, /completed=practice&completedSession=.*completedItem=/);
  assert.match(dashboard, /completed=review&completedSession=.*completedItem=/);
  assert.match(wordAction, /sessionStorage\.setItem\(todayCompletionProofKey\(dailySessionId, dailyItemId\), JSON\.stringify\([\s\S]*revision:[\s\S]*summaryComplete:[\s\S]*window\.location\.assign/);
  assert.match(audio, /if \(dailySessionId && dailyItemId\) sessionStorage\.setItem\(todayCompletionProofKey[\s\S]*JSON\.stringify/);
  assert.match(practice, /proof\?\.dailySessionId === dailySessionId[\s\S]*proof\.dailyItemId === dailyItemId[\s\S]*typeof proof\.revision === "number"[\s\S]*sessionStorage\.setItem\(todayCompletionProofKey/);
  assert.match(practiceRoute, /practice\.dailySessionId === session\.id[\s\S]*reduce\(\(count, practice\) => Math\.max\(count, practice\.answers\.length\)/);
  assert.doesNotMatch(practiceRoute, /practice\.dailySessionId === session\.id && practice\.status === "completed"/);
  assert.match(dashboard, /targetBefore\.reviewCardId === card\.id/);
  assert.match(dashboard, /targetBefore\.status === "pending"/);
  assert.match(dashboard, /targetAfter\?\.status === "completed"/);
  assert.match(dashboard, /sessionStorage\.setItem\(todayCompletionProofKey\(entryTodaySessionId, entryTodayItemId\), JSON\.stringify/);
  assert.match(dashboard, /returnedSessionId !== data\.session\.id \|\| !returnedItemId/);
  assert.match(dashboard, /completionProofNeedsSync/);
  assert.match(dashboard, /Syncing your completed session/);
  assert.match(dashboard, /sessionStorage\.removeItem\(completionProofKey\)/);
  assert.match(dashboard, /cleanUrl\.searchParams\.delete\("completedSession"\)/);
  assert.match(dashboard, /cleanUrl\.searchParams\.delete\("completedItem"\)/);
  assert.match(dashboard, /calc\(76px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(dashboard, /sessionStorage\.setItem\(celebrationKey/);
  assert.match(dashboard, /prefers-reduced-motion/);
});

function todayReviewState() {
  const state = emptyLearningState();
  const definitions = [
    { id: "one-v1", level: 1, prompt: "What does 你好 mean?", answer: "hello", version: "v1" },
    { id: "one-v2", level: 1, prompt: " What does 你好 mean? ", answer: "hello", version: "v2" },
    { id: "two", level: 1, prompt: "Which pinyin matches 班?", answer: "bān", version: "v1" },
    { id: "three", level: 1, prompt: "Which Chinese entry is pronounced běnzi?", answer: "本子", version: "v1" },
    { id: "four", level: 1, prompt: "What does 白天 mean?", answer: "daytime", version: "v1" },
    { id: "advanced", level: 8, prompt: "Advanced policy inference", answer: "qualification", version: "v1" },
  ];
  state.attempts = definitions.map((item, index) => ({
    id: `attempt-${item.id}`, idempotencyKey: `attempt-${item.id}`, contentId: `practice:level-${item.level}:${item.id}`, contentVersion: item.version,
    dimension: "reading" as const, answer: "x", correctAnswer: item.answer, correct: false, observedAt: `2026-09-08T00:00:0${index}.000Z`,
    reviewSnapshot: { level: item.level, levelBand: String(item.level), skillLabel: "Vocabulary", prompt: item.prompt, answerMode: "choice" as const, options: { a: "x", b: item.answer }, correctAnswer: "b", correctAnswerText: item.answer, explanation: "fixture" },
  }));
  state.cards = definitions.map((item, index) => ({
    id: `card-${item.id}`, contentId: `practice:level-${item.level}:${item.id}`, contentVersion: item.version, dimension: "reading" as const,
    dueAt: `2026-09-08T00:00:0${index}.000Z`, intervalDays: 1, ease: 2.5, revision: 0, reviewCount: 0, algorithmVersion: "hskkit-srs-v1", sourceAttemptId: `attempt-${item.id}`, gradeKeys: [],
  }));
  state.mistakes = definitions.map((item, index) => ({ id: `mistake-${item.id}`, contentId: `practice:level-${item.level}:${item.id}`, contentVersion: item.version, sourceAttemptId: `attempt-${item.id}`, status: "open" as const, createdAt: `2026-09-08T00:00:0${index}.000Z` }));
  return state;
}

test("Today freezes a deduplicated three-card review batch aligned to the selected HSK level", () => {
  const content = selectTodayContent(1, 1);
  assert.equal(content.status, "ready");
  if (content.status !== "ready") return;
  const first = buildDailySession(todayReviewState(), { ownerId: "batch", localDay: "2026-09-09", ruleVersion: "today-v8", now, dailyContent: content, budgetMinutes: 30, focus: "review_first" });
  const reviewItems = first.session.items.filter((item) => item.kind === "review");
  assert.equal(reviewItems.length, 3);
  assert.ok(first.session.reviewBatchId);
  assert.deepEqual(first.session.reviewCardIds, reviewItems.map((item) => item.reviewCardId));
  assert.equal(reviewItems.some((item) => item.contentId.includes("advanced")), false);
  assert.equal(reviewItems.filter((item) => item.contentId.includes("one-")).length, 1);

  const withNewDue = structuredClone(first.state);
  withNewDue.cards.push({ id: "card-late", contentId: "practice:level-1:late", contentVersion: "v1", dimension: "reading", dueAt: "2026-09-09T09:30:00.000Z", intervalDays: 1, ease: 2.5, revision: 0, reviewCount: 0, algorithmVersion: "hskkit-srs-v1", sourceAttemptId: "attempt-late", gradeKeys: [] });
  withNewDue.attempts.push({ id: "attempt-late", idempotencyKey: "attempt-late", contentId: "practice:level-1:late", contentVersion: "v1", dimension: "reading", answer: "x", correctAnswer: "y", correct: false, observedAt: "2026-09-09T09:30:00.000Z", reviewSnapshot: { level: 1, levelBand: "1", skillLabel: "Vocabulary", prompt: "Late due card", answerMode: "choice", options: { a: "x", b: "y" }, correctAnswer: "b", correctAnswerText: "y", explanation: "fixture" } });
  const resumed = buildDailySession(withNewDue, { ownerId: "batch", localDay: "2026-09-09", ruleVersion: "today-v8", now: "2026-09-09T10:00:00.000Z", dailyContent: content, budgetMinutes: 30, focus: "review_first" });
  assert.deepEqual(resumed.session.reviewCardIds, first.session.reviewCardIds);
  assert.equal(resumed.session.items.some((item) => item.reviewCardId === "card-late"), false);
});

test("three valid Today review submissions unlock Learn even when one answer is wrong and replay cannot double count", () => {
  const content = selectTodayContent(1, 1);
  assert.equal(content.status, "ready");
  if (content.status !== "ready") return;
  let built = buildDailySession(todayReviewState(), { ownerId: "unlock", localDay: "2026-09-09", ruleVersion: "today-v8", now, dailyContent: content, budgetMinutes: 30, focus: "review_first" });
  const ids = built.session.reviewCardIds ?? [];
  ids.forEach((cardId, index) => {
    const card = built.state.cards.find((candidate) => candidate.id === cardId)!;
    const key = `grade-${index}`;
    const graded = gradeReview(built.state, { cardId, grade: index === 0 ? "again" : "good", idempotencyKey: key, observedAt: `2026-09-09T09:0${index}:00.000Z`, clientRevision: card.revision });
    if (index === 0) {
      const replay = gradeReview(graded.state, { cardId, grade: "again", idempotencyKey: key, observedAt: `2026-09-09T09:0${index}:01.000Z`, clientRevision: card.revision });
      assert.equal(replay.state.cards.find((candidate) => candidate.id === cardId)?.reviewCount, 1);
    }
    built = { ...built, state: graded.state, session: graded.state.dailySessions.find((session) => session.id === built.session.id)! };
  });
  assert.equal(built.session.items.filter((item) => item.kind === "review").every((item) => item.status === "completed"), true);
  assert.equal(built.session.items.find((item) => item.kind === "learn")?.status, "pending");
  assert.equal(built.session.items.find((item) => !item.deferred && item.status === "pending")?.kind, "learn");
  assert.equal(built.state.mistakes.find((mistake) => mistake.sourceAttemptId === "attempt-one-v1")?.status, "open");
});

test("three correct Today reviews unlock Learn immediately after the third saved grade", () => {
  const content = selectTodayContent(1, 1);
  assert.equal(content.status, "ready");
  if (content.status !== "ready") return;
  let built = buildDailySession(todayReviewState(), { ownerId: "all-correct", localDay: "2026-09-09", ruleVersion: "today-v8", now, dailyContent: content, budgetMinutes: 30, focus: "review_first" });
  for (const [index, cardId] of (built.session.reviewCardIds ?? []).entries()) {
    const card = built.state.cards.find((candidate) => candidate.id === cardId)!;
    const graded = gradeReview(built.state, { cardId, grade: "good", idempotencyKey: `all-correct-${index}`, observedAt: `2026-09-09T09:1${index}:00.000Z`, clientRevision: card.revision });
    built = { ...built, state: graded.state, session: graded.state.dailySessions.find((session) => session.id === built.session.id)! };
  }
  assert.equal(built.session.items.find((item) => !item.deferred && item.status === "pending")?.kind, "learn");
});

test("Today review completion feedback is explicit and API failures cannot advance local review progress", async () => {
  const dashboard = await source("src/app/components/learning-dashboard.tsx");
  assert.match(dashboard, /Saved for later review/);
  assert.match(dashboard, /today’s step still counts/);
  assert.match(dashboard, /Continue Today —/);
  assert.match(dashboard, /reviewCardIds/);
  assert.match(dashboard, /if \(response\?\.ok\)/);
  assert.doesNotMatch(dashboard, /\["complete_item", "skip_item", "restore_item", "configure_today", "retry_review"\]/);
});
