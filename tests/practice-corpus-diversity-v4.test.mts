import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PRACTICE_QUESTIONS, PRACTICE_VERSION, practiceQuestionSet, trustedPracticeQuestion } from "../src/lib/practice/questions.ts";

const root = new URL("..", import.meta.url);
const reading = JSON.parse(readFileSync(new URL("src/lib/learning/reading-library.json", root), "utf8"));
const listening = JSON.parse(readFileSync(new URL("src/lib/learning/listening-library.json", root), "utf8"));

function similarity(a: string, b: string) {
  const left = [...a.replace(/[\s“”‘’。，！？；：、]/g, "")];
  const right = [...b.replace(/[\s“”‘’。，！？；：、]/g, "")];
  const previous = new Array(right.length + 1).fill(0);
  for (const char of left) {
    let diagonal = 0;
    for (let index = 1; index <= right.length; index += 1) {
      const saved = previous[index];
      previous[index] = char === right[index - 1] ? diagonal + 1 : Math.max(previous[index], previous[index - 1]);
      diagonal = saved;
    }
  }
  return (2 * previous[right.length]) / Math.max(1, left.length + right.length);
}

function maxPairSimilarity(values: string[]) {
  let max = 0;
  for (let left = 0; left < values.length; left += 1) {
    for (let right = left + 1; right < values.length; right += 1) max = Math.max(max, similarity(values[left], values[right]));
  }
  return max;
}

function repeatedNgramShare(values: string[], width = 8) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const normalized = value.replace(/[\s“”‘’。，！？；：、]/g, "");
    const seen = new Set(Array.from({ length: Math.max(0, normalized.length - width + 1) }, (_, index) => normalized.slice(index, index + width)));
    for (const gram of seen) counts.set(gram, (counts.get(gram) ?? 0) + 1);
  }
  return Math.max(0, ...counts.values()) / values.length;
}

test("reading V2 contains the approved independent-passage scale without repeated shells", () => {
  assert.equal(reading.version, "hskkit-reading-library-v2");
  assert.equal(reading.passages.length, 180);
  for (let level = 1; level <= 9; level += 1) {
    const passages = reading.passages.filter((item: any) => item.level === level);
    assert.equal(passages.length, level <= 6 ? 24 : 12, `HSK ${level} passage count`);
    assert.equal(new Set(passages.map((item: any) => item.title)).size, passages.length, `HSK ${level} independent title count`);
    assert.equal(new Set(passages.map((item: any) => item.passage)).size, passages.length);
    assert.equal(new Set(passages.map((item: any) => item.translation)).size, passages.length, `HSK ${level} independent translation count`);
    assert.ok(maxPairSimilarity(passages.map((item: any) => item.passage)) < 0.82, `HSK ${level} has a near-copy passage`);
    const shellLimit = level <= 6 ? 0.30 : 0.34;
    assert.ok(repeatedNgramShare(passages.map((item: any) => item.passage)) <= shellLimit, `HSK ${level} repeats a passage shell`);
    assert.ok(new Set(passages.flatMap((item: any) => item.questions.map((question: any) => question.questionType))).size >= 3, `HSK ${level} question-type diversity`);
  }
});

test("listening V2 keeps approved assets while replacing keyword shells with varied real tasks", () => {
  assert.equal(listening.version, "hskkit-listening-library-v2");
  for (let level = 1; level <= 9; level += 1) {
    const groups = listening.groups.filter((item: any) => item.level === level);
    assert.equal(new Set(groups.map((item: any) => item.voiceText)).size, groups.length);
    assert.ok(maxPairSimilarity(groups.map((item: any) => item.voiceText)) < 0.82, `HSK ${level} has a near-copy transcript`);
    const kinds = new Set(groups.flatMap((item: any) => item.questions.map((question: any) => question.kind)));
    assert.ok(kinds.size >= (level <= 2 ? 4 : 5), `HSK ${level} listening task diversity`);
    assert.ok(groups.every((group: any) => group.audioSrc.startsWith("/audio/listening-library/v2/")));
    assert.ok(groups.every((group: any) => group.questions.every((question: any) => Object.values(question.options).every((option) => typeof option === "string" && option.trim().length > 0))));
  }
});

test("practice V4 has authentic grammar distractors and at least four vocabulary task families", () => {
  assert.equal(PRACTICE_VERSION, "hskkit-practice-authored-v4");
  for (let level = 1; level <= 7; level += 1) {
    const grammar = practiceQuestionSet(level, "grammar");
    assert.ok(grammar.length >= 24, `HSK band ${level} grammar count`);
    assert.ok(grammar.every((question) => !question.sourceRef.includes("editorial:grammar")), `HSK band ${level} generated grammar remains`);
    assert.ok(new Set(grammar.map((question) => question.prompt)).size >= 4, `HSK band ${level} grammar prompt diversity`);
    const vocabulary = practiceQuestionSet(level, "vocabulary");
    assert.ok(new Set(vocabulary.map((question) => question.weaknessTag)).size >= 4, `HSK band ${level} vocabulary task diversity`);
  }
  assert.ok(PRACTICE_QUESTIONS.every((question) => question.contentVersion.includes("v4") || question.contentVersion.includes("library-v2")));
});

test("V4 publication preserves immutable V3 history for existing review and mistake records", () => {
  const old = trustedPracticeQuestion("practice-v3-level-1-vocabulary-RUosOkBLjQnpbF2a");
  assert.ok(old, "known V3 question must remain resolvable");
  assert.equal(old?.contentVersion.includes("v3"), true);
  assert.equal(old?.lifecycleStatus, "published");
  const oldListening = trustedPracticeQuestion("practice-v3-level-3-listening-listening-library-v1-hsk3-001-q1");
  assert.equal(oldListening?.audioSrc, "/audio/listening-library/hsk3-001.mp3");
  const currentListening = practiceQuestionSet(3, "listening")[0];
  assert.match(currentListening.audioSrc ?? "", /^\/audio\/listening-library\/v2\//);
  assert.notEqual(currentListening.audioSrc, oldListening?.audioSrc);
});
