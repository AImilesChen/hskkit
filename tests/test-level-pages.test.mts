import test from "node:test";
import assert from "node:assert/strict";
import { TEST_LEVELS, testLevelHref, testRunnerHref, findTestLevel } from "../src/lib/tests/test-levels.ts";
import { testLevelContent } from "../src/lib/tests/test-level-content.ts";
import { parseMockLevel, mockAttemptLevel, mockAttemptMatches, mockAttemptStorageKey } from "../src/lib/tests/mock-entry.ts";
import { BASIC_MOCK_DURATION_SECONDS, ADVANCED_MOCK_DURATION_SECONDS, startMock, saveMockAnswer, submitMock, publicMockSession } from "../src/lib/mock/domain.ts";
import { grammarLessonBySlug, readingLessonBySlug } from "../src/lib/learning/step7-content.ts";
import { siteNavigation, isNavigationGroup, isNavigationItemActive } from "../src/app/site-navigation.ts";

test("seven public level introductions lead to an explicit matching runner", () => {
  assert.equal(TEST_LEVELS.length, 7);
  for (const level of TEST_LEVELS) {
    assert.equal(findTestLevel(level.slug), level);
    assert.equal(testLevelHref(level), `/hsk-test-prep/${level.slug}`);
    const target = new URL(testRunnerHref(level), "https://hskkit.com");
    assert.equal(target.pathname, level.level === 7 ? "/mock/advanced" : "/mock/basic");
    assert.equal(target.searchParams.get("from"), "level-page");
    if (level.level !== 7) assert.equal(target.searchParams.get("level"), String(level.level));
    assert.equal(level.minutes * 60, level.level === 7 ? ADVANCED_MOCK_DURATION_SECONDS : BASIC_MOCK_DURATION_SECONDS);
  }
  assert.equal(findTestLevel("hsk-8"), undefined);
  assert.equal(findTestLevel("made-up-level"), undefined);
});

test("each introduction has distinct published examples, valid answers and real study destinations", () => {
  const ids = new Set<string>();
  for (const level of TEST_LEVELS) {
    const content = testLevelContent(level);
    assert.equal(content.grammar.level, level.level);
    assert.equal(content.reading.level, level.level);
    assert.ok(grammarLessonBySlug(content.grammar.slug));
    assert.ok(readingLessonBySlug(content.reading.slug));
    assert.equal(content.samples.length, 2);
    for (const sample of content.samples) {
      assert.ok(!ids.has(sample.exercise.id)); ids.add(sample.exercise.id);
      assert.ok(sample.exercise.prompt && sample.exercise.explanation);
      assert.ok(sample.exercise.options?.[sample.exercise.correctAnswer]);
      if (sample.skill === "Reading") assert.equal(sample.context, content.reading.text);
    }
    assert.ok(content.resources.some(resource => resource.href === `/vocabulary/${level.level}`));
    assert.ok(content.resources.some(resource => resource.href === `/practice/${level.level}/listening`));
  }
  assert.equal(ids.size, 14);
});

test("invalid level parameters cannot silently become an arbitrary grade", () => {
  for (const value of [undefined, null, ["2"], "7", "0", "-1", "2.0", "2x", "02", "<script>", " 2"]) assert.equal(parseMockLevel(value), undefined);
  for (let level = 1; level <= 6; level++) assert.equal(parseMockLevel(String(level)), level);
});

test("saved HSK 3 cannot override a requested HSK 2 and each level keeps its own pointer", () => {
  const saved = { band: "basic", questions: [{ level: 3 }, { level: 3 }] };
  assert.equal(mockAttemptLevel(saved), 3);
  assert.equal(mockAttemptMatches(saved, "basic", 2), false);
  assert.equal(mockAttemptMatches(saved, "basic", 3), true);
  assert.equal(mockAttemptMatches(saved, "advanced", 7), false);
  assert.equal(mockAttemptLevel({ band: "basic", questions: [{ level: 2 }, { level: 3 }] }), undefined);
  assert.equal(mockAttemptLevel({ band: "basic", questions: [] }), undefined);
  assert.equal(new Set(TEST_LEVELS.map(level => mockAttemptStorageKey(level.level === 7 ? "advanced" : "basic", level.level))).size, 7);
});

test("all seven choices preserve actual level, timer, saved progress, scoring and safe public questions", () => {
  const now = "2026-11-04T16:00:00.000Z";
  for (const level of TEST_LEVELS) {
    const band = level.level === 7 ? "advanced" : "basic";
    let session = startMock({ ownerId: "local-contract-test", band, targetLevel: level.level, now, idempotencyKey: `intro-${level.slug}` });
    assert.ok(mockAttemptMatches(session, band, level.level));
    assert.equal(session.questions.length, 15);
    assert.equal(Date.parse(session.deadlineAt) - Date.parse(now), level.minutes * 60_000);
    assert.ok(publicMockSession(session).questions.every(question => !("correctAnswer" in question) && !("explanation" in question)));
    for (const question of session.questions) session = saveMockAnswer(session, { questionId: question.id, answer: question.correctAnswer, idempotencyKey: `answer-${question.id}`, now });
    const restored = JSON.parse(JSON.stringify(session));
    assert.equal(restored.answers.length, 15);
    const submitted = submitMock(restored, { idempotencyKey: `submit-${level.slug}`, now });
    assert.equal(submitted.result.correctCount, 15);
    assert.equal(submitted.result.percentage, 100);
    assert.equal(submitMock(submitted.session, { idempotencyKey: `submit-${level.slug}`, now }).result.id, submitted.result.id);
    assert.equal(submitted.result.dimensionEvidence.reading.total, 5);
  }
});

test("Tests menu separates grade practice from adaptive placement", () => {
  const tests = siteNavigation.find(item => item.label === "Tests");
  assert.ok(tests && isNavigationGroup(tests));
  assert.deepEqual(tests.items.map(item => item.label), ["HSK Practice Tests", "Find My HSK Level", "HSK 3.0 Exam Guide"]);
  const practice = tests.items[0];
  assert.ok(isNavigationItemActive("/hsk-test-prep/hsk-2", practice));
  assert.ok(isNavigationItemActive("/mock/basic", practice));
  assert.equal(isNavigationItemActive("/hsk-placement-test", practice), false);
});
