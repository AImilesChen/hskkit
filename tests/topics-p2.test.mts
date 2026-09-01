import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { emptyLearningState } from "../src/lib/learning/domain.ts";
import { learningTopics } from "../src/lib/topics/catalog.ts";
import {
  answerTopicPracticeQuestion,
  buildTopicPracticeQuestions,
  publicTopicPracticeQuestion,
  type TopicPracticeWord,
} from "../src/lib/topics/practice.ts";

const root = new URL("../", import.meta.url);
const source = async (path: string) => readFile(new URL(path, root), "utf8");
const topic = learningTopics[0];
const words: TopicPracticeWord[] = topic.wordAssetIds.map((assetId, index) => ({
  assetId,
  contentId: `word:${assetId}`,
  contentVersion: `${topic.sourceReleaseId}:1`,
  level: index < 4 ? 1 : 2,
  levelBand: index < 4 ? "1" : "2",
  hanzi: ["起床", "早饭", "出门", "工作", "学校", "今天", "每天", "时间"][index],
  pinyin: ["qǐchuáng", "zǎofàn", "chūmén", "gōngzuò", "xuéxiào", "jīntiān", "měitiān", "shíjiān"][index],
  meaning: ["get up", "breakfast", "leave home", "work", "school", "today", "every day", "time"][index],
  formalAudioUrl: index < 3 ? `/audio/topic-${index}.mp3` : undefined,
}));

test("P2 builds one continuous verified topic set with meaning, pinyin, listening and scene questions", () => {
  const questions = buildTopicPracticeQuestions(topic, words);
  assert.equal(questions.length, 8);
  assert.deepEqual(new Set(questions.map((question) => question.mode)), new Set(["meaning", "pinyin", "listening", "scene"]));
  assert.equal(questions.filter((question) => question.mode === "listening").every((question) => Boolean(question.audioSrc && question.audioText)), true);
  assert.equal(questions.every((question) => question.topicSlug === topic.slug && question.options.length === 4), true);
  assert.equal(new Set(questions.map((question) => question.id)).size, questions.length);
});

test("P2 public questions never expose trusted answers or internal review payload", () => {
  const trusted = buildTopicPracticeQuestions(topic, words)[0];
  const publicQuestion = publicTopicPracticeQuestion(trusted);
  assert.equal(Object.hasOwn(publicQuestion, "correctAnswer"), false);
  assert.equal(Object.hasOwn(publicQuestion, "reviewSnapshot"), false);
  assert.equal(Object.hasOwn(publicQuestion, "contentId"), false);
  assert.equal(Object.hasOwn(publicQuestion, "contentVersion"), false);
  assert.equal(Object.hasOwn(publicQuestion, "dimension"), false);
  assert.equal(Object.hasOwn(publicQuestion, "audioText"), false);
  assert.equal(Object.hasOwn(publicQuestion, "explanation"), false);
});

test("P2 server grading ignores client claims and records Attempt, SRS, Review and Mistakes", () => {
  const question = buildTopicPracticeQuestions(topic, words)[0];
  const wrong = question.options.find((option) => option.key !== question.correctAnswer)!.key;
  const result = answerTopicPracticeQuestion(emptyLearningState(), question, {
    answer: wrong,
    idempotencyKey: "topic-p2-wrong-1",
    observedAt: "2026-09-01T10:00:00.000Z",
  });
  assert.equal(result.feedback.correct, false);
  assert.equal(result.state.attempts.length, 1);
  assert.equal(result.state.cards.length, 1);
  assert.equal(result.state.mistakes.length, 1);
  assert.equal(result.state.cards[0].dueAt, "2026-09-01T10:00:00.000Z");
  assert.equal(result.state.attempts[0].reviewSnapshot?.topic, topic.title);
});

test("P2 meaning and pinyin attempts reuse the existing word card instead of creating duplicate review cards", () => {
  const questions = buildTopicPracticeQuestions(topic, words);
  const meaning = questions.find((question) => question.mode === "meaning")!;
  const pinyin = questions.find((question) => question.mode === "pinyin" && question.contentId === meaning.contentId)!;
  const first = answerTopicPracticeQuestion(emptyLearningState(), meaning, {
    answer: meaning.correctAnswer,
    idempotencyKey: "topic-p2-meaning",
    observedAt: "2026-09-01T10:00:00.000Z",
  });
  const second = answerTopicPracticeQuestion(first.state, pinyin, {
    answer: pinyin.correctAnswer,
    idempotencyKey: "topic-p2-pinyin",
    observedAt: "2026-09-01T10:01:00.000Z",
  });
  assert.equal(second.state.attempts.length, 2);
  assert.equal(second.state.cards.length, 1);
  assert.equal(second.state.cards[0].contentId, meaning.contentId);
});

test("P2 rejects an answer key that is not part of the server-generated question", () => {
  const question = buildTopicPracticeQuestions(topic, words)[0];
  assert.throws(() => answerTopicPracticeQuestion(emptyLearningState(), question, {
    answer: "forged",
    idempotencyKey: "topic-p2-forged",
    observedAt: "2026-09-01T10:00:00.000Z",
  }), /INVALID_TOPIC_PRACTICE_ANSWER/);
});

test("P2 route and UI contracts keep topic practice bounded and server-authoritative", async () => {
  const [page, client, route, learningRoute, topicServer, practiceSource, detail] = await Promise.all([
    source("src/app/topics/[slug]/practice/page.tsx"),
    source("src/app/topics/[slug]/practice/topic-practice-client.tsx"),
    source("src/app/api/v1/topics/[slug]/practice/route.ts"),
    source("src/app/api/v1/learning/route.ts"),
    source("src/lib/topics/server.ts"),
    source("src/lib/topics/practice.ts"),
    source("src/app/topics/[slug]/page.tsx"),
  ]);
  assert.match(page, /Continuous topic practice/);
  assert.match(page, /md:py-\[32px\]/);
  assert.match(page, /lg:px-\[40px\]/);
  assert.doesNotMatch(page, /md:py-10|lg:px-10/);
  assert.match(client, /sm:p-\[32px\]/);
  assert.doesNotMatch(client, /sm:p-8/);
  assert.match(client, /Meaning|Word meaning/);
  assert.match(client, /Pinyin/);
  assert.match(client, /Listening/);
  assert.match(client, /Scene/);
  assert.match(client, /Question .* of/);
  assert.match(client, /Open Review/);
  assert.match(client, /Review mistakes/);
  assert.match(route, /getTrustedTopicPracticeQuestions/);
  assert.match(topicServer, /getVerifiedTopicWords/);
  assert.match(topicServer, /buildTopicPracticeQuestions/);
  assert.match(learningRoute, /topic_practice_attempt/);
  assert.match(learningRoute, /answerTopicPracticeQuestion/);
  assert.match(learningRoute, /consumeStep7PlaybackTicket/);
  assert.match(practiceSource, /input\.contentVersion/);
  assert.match(learningRoute, /saveState/);
  assert.doesNotMatch(learningRoute, /correctAnswer\s*:\s*body/);
  assert.match(detail, /\/topics\/\$\{topic\.slug\}\/practice/);
});
