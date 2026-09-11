import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("..", import.meta.url);
const libraryPath = new URL("src/lib/learning/reading-library.json", root);
const modulePath = new URL("../src/lib/learning/reading-library.ts", import.meta.url);
type RawQuestion = { prompt: string; options: Record<string, string>; correctAnswer: string; explanation: string; questionType: string };
type RawPassage = {
  id: string; slug: string; level: number; levelBand: string; title: string; passage: string; translation: string;
  vocabulary: Array<{ hanzi: string; pinyin: string; meaning: string }>;
  sourceRef: string; sourceLicense: string; authorizationStatus: string; qaStatus: string; lifecycleStatus: string;
  questions: RawQuestion[];
};

test("reading library publishes the approved V2 passage scale for every HSK 1–9 level", () => {
  assert.equal(existsSync(libraryPath), true, "reading-library.json must exist");
  const bank = JSON.parse(readFileSync(libraryPath, "utf8")) as {
    version: string;
    passages: RawPassage[];
  };
  assert.equal(bank.version, "hskkit-reading-library-v2");
  assert.equal(bank.passages.length, 180);
  assert.equal(new Set(bank.passages.map((passage) => passage.id)).size, 180);
  assert.equal(new Set(bank.passages.map((passage) => passage.slug)).size, 180);
  for (let level = 1; level <= 9; level += 1) {
    const passages = bank.passages.filter((passage) => passage.level === level);
    const expectedPassages = level <= 6 ? 24 : 12;
    assert.equal(passages.length, expectedPassages, `HSK ${level} passage count`);
    assert.equal(new Set(passages.map((passage) => passage.title)).size, expectedPassages, `HSK ${level} independent title count`);
    assert.equal(new Set(passages.map((passage) => passage.translation)).size, expectedPassages, `HSK ${level} independent translation count`);
    assert.equal(passages.flatMap((passage) => passage.questions).length, expectedPassages * 3, `HSK ${level} question count`);
    assert.ok(passages.every((passage) => passage.levelBand === (level >= 7 ? "7-9" : String(level))));
  }
});

test("every reading item has stable publication metadata and internally consistent answer truth", () => {
  assert.equal(existsSync(libraryPath), true, "reading-library.json must exist");
  const bank = JSON.parse(readFileSync(libraryPath, "utf8")) as { passages: RawPassage[] };
  const exerciseIds = new Set<string>();
  for (const passage of bank.passages) {
    assert.match(passage.id, /^reading-library-v2-hsk[1-9]-\d{2}$/);
    assert.match(passage.slug, /^hsk[1-9]-reading-\d{2}$/);
    assert.ok(passage.title.length >= 4);
    assert.ok(passage.passage.length >= 12);
    assert.ok(passage.translation.length >= 12);
    assert.ok(passage.vocabulary.length >= 3);
    assert.equal(passage.sourceRef, "HSKKit-original-editorial-reading-v2");
    assert.equal(passage.sourceLicense, "HSKKit-original-editorial-v2");
    assert.equal(passage.authorizationStatus, "authorized");
    assert.equal(passage.qaStatus, "approved");
    assert.equal(passage.lifecycleStatus, "published");
    assert.equal(passage.questions.length, 3);
    assert.ok(new Set(passage.questions.map((question) => question.questionType)).size >= 2);
    for (let index = 0; index < passage.questions.length; index += 1) {
      const question = passage.questions[index];
      const id = `${passage.id}-q${index + 1}`;
      assert.equal(exerciseIds.has(id), false, id);
      exerciseIds.add(id);
      assert.deepEqual(Object.keys(question.options), ["A", "B", "C"]);
      assert.equal(Object.hasOwn(question.options, question.correctAnswer), true);
      assert.ok(question.prompt.length >= 8);
      assert.ok(question.explanation.includes(question.options[question.correctAnswer]), `${passage.slug} q${index + 1}`);
    }
  }
  assert.equal(exerciseIds.size, 540);
});

test("10/20 reading sessions are deterministic, unique and stay inside the selected level", async () => {
  assert.equal(existsSync(modulePath), true, "reading-library.ts must exist");
  const readingLibrary = await import(modulePath.href) as typeof import("../src/lib/learning/reading-library.ts");
  for (const level of [1, 2, 7, 8, 9]) {
    for (const size of [10, 20] as const) {
      const session = readingLibrary.readingSession(level, size, "qa-seed");
      assert.equal(session.questions.length, size);
      assert.equal(new Set(session.questions.map((question) => question.id)).size, size);
      assert.ok(session.questions.every((question) => question.level === level));
      assert.deepEqual(readingLibrary.readingSession(level, size, "qa-seed").questions.map((question) => question.id), session.questions.map((question) => question.id));
      for (let index = 0; index < size; index += 1) {
        assert.equal(readingLibrary.readingSessionNext(session, index)?.level, index === size - 1 ? undefined : level);
      }
    }
  }
});

test("reading UI exposes dual modes, HSK 1–9 routes, 10/20 quick starts, article progress and results", () => {
  const index = readFileSync(new URL("src/app/reading/page.tsx", root), "utf8");
  const experience = readFileSync(new URL("src/app/components/reading-library-experience.tsx", root), "utf8");
  const articleReader = readFileSync(new URL("src/app/components/reading-article-reader.tsx", root), "utf8");
  const levelLibrary = readFileSync(new URL("src/app/components/reading-level-library.tsx", root), "utf8");
  const sessionPage = readFileSync(new URL("src/app/reading/session/[slug]/page.tsx", root), "utf8");
  const start = readFileSync(new URL("src/app/reading/start/route.ts", root), "utf8");
  const results = readFileSync(new URL("src/app/reading/results/page.tsx", root), "utf8");
  const resultState = readFileSync(new URL("src/app/components/reading-session-state.tsx", root), "utf8");
  assert.match(experience, />Articles</);
  assert.match(experience, /Quick Practice/);
  assert.match(experience, /count=10/);
  assert.match(experience, /count=20/);
  assert.match(experience, /Continue/);
  assert.match(experience, /Recommended next/);
  assert.match(articleReader, /Mark article complete/);
  assert.match(articleReader, /Evidence:/);
  assert.match(levelLibrary, /\/reading\/article\//);
  assert.match(index, /ReadingLibraryExperience/);
  assert.match(start, /readingSession/);
  assert.match(sessionPage, /Reading · HSK.*of/);
  assert.match(sessionPage, /Continue HSK/);
  assert.match(sessionPage, /\/reading\/results/);
  assert.doesNotMatch(sessionPage, /Continue to listening/);
  assert.match(results, /completed.*reading questions/i);
  assert.match(results, /Start a new mix/);
  assert.match(resultState, /Accuracy/);
});

test("answer feedback is immediate while persistence has bounded timeout and explicit retry recovery", () => {
  const client = readFileSync(new URL("src/app/components/step7-exercise.tsx", root), "utf8");
  assert.match(client, /ANSWER_SAVE_TIMEOUT_MS/);
  assert.match(client, /AbortController/);
  assert.match(client, /Retry saving/);
  assert.match(client, /Saving progress/);
  assert.match(client, /Progress saved/);
  assert.match(client, /Save timed out/);
  assert.match(client, /conflict/i);
  assert.match(client, /service is temporarily unavailable/i);
  assert.match(client, /offline/i);
  assert.match(client, /hskkit:attempt:/);
  assert.match(client, /setAnswer\(value\).*void persistAnswer/s);
  assert.doesNotMatch(client, /for \(let attempt = 0; attempt < 3/);
});
