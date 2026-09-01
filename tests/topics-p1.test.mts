import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  learningTopics,
  filterPublishedTopics,
  relatedTopicsFor,
} from "../src/lib/topics/catalog.ts";
import {
  computeTopicProgress,
  latestTopicVisit,
  nextTopicAssetId,
  recordTopicVisit,
  topicWordProgressFromState,
} from "../src/lib/topics/progress.ts";
import { addWordToReview, emptyLearningState } from "../src/lib/learning/domain.ts";

const root = new URL("../", import.meta.url);
const source = async (path: string) => readFile(new URL(path, root), "utf8");

test("P1 topic metadata includes filters and original contextual learning content", () => {
  assert.equal(learningTopics.length, 9);
  for (const topic of learningTopics) {
    assert.ok(["starter", "developing", "stretch"].includes(topic.difficulty));
    assert.ok(topic.expressions.length >= 3, `${topic.slug} expressions`);
    assert.ok(topic.dialogue.length >= 4, `${topic.slug} dialogue`);
    assert.ok(topic.dialogue.some((turn) => turn.speaker === "A"));
    assert.ok(topic.dialogue.some((turn) => turn.speaker === "B"));
    assert.ok(topic.cultureNote.length >= 40, `${topic.slug} culture note`);
    assert.ok(topic.relatedTopicSlugs.length >= 2, `${topic.slug} related topics`);
    assert.ok(topic.expressions.every((item) => item.hanzi && item.pinyin && item.meaning));
    assert.ok(topic.dialogue.every((turn) => turn.hanzi && turn.pinyin && turn.meaning));
  }
});

test("HSK, difficulty and time filters compose without leaking unpublished topics", () => {
  const filtered = filterPublishedTopics({ level: "1", difficulty: "starter", duration: "quick" });
  assert.ok(filtered.length > 0);
  assert.ok(filtered.every((topic) => topic.status === "published"));
  assert.ok(filtered.every((topic) => topic.levelBands.includes("1")));
  assert.ok(filtered.every((topic) => topic.difficulty === "starter"));
  assert.ok(filtered.every((topic) => topic.estimatedMinutes <= 12));
  assert.equal(filterPublishedTopics({ level: "all", difficulty: "all", duration: "all" }).length, 9);
});

test("topic progress uses verified learned word state and never invents completion", () => {
  const topic = learningTopics[0];
  const progress = computeTopicProgress(topic, {
    [topic.wordAssetIds[0]]: { learned: true },
    [topic.wordAssetIds[1]]: { learned: false },
  });
  assert.deepEqual(progress, { learned: 1, total: topic.wordAssetIds.length, percent: Math.round(100 / topic.wordAssetIds.length) });
  assert.equal(nextTopicAssetId(topic, { [topic.wordAssetIds[0]]: { learned: true } }), topic.wordAssetIds[1]);
  assert.equal(nextTopicAssetId(topic, Object.fromEntries(topic.wordAssetIds.map((id) => [id, { learned: true }]))), undefined);
});

test("administrative bulk Review enrollment does not count as learned", () => {
  const topic = learningTopics[0];
  const assetId = topic.wordAssetIds[0];
  const state = addWordToReview(emptyLearningState(), {
    observedAt: "2026-09-01T08:00:00.000Z",
    word: {
      assetId,
      contentId: `word:${assetId}`,
      contentVersion: `${topic.sourceReleaseId}:test-v1`,
      level: 1,
      levelBand: "1",
      hanzi: "学习",
      traditional: "學習",
      pinyin: "xuéxí",
      meaning: "to study",
    },
  });
  assert.equal(topicWordProgressFromState(state, assetId).learned, false);
  assert.equal(computeTopicProgress(topic, { [assetId]: topicWordProgressFromState(state, assetId) }).learned, 0);
});

test("continue learning uses the latest persisted account topic visit", () => {
  const first = learningTopics[0];
  const second = learningTopics[1];
  let state = { attempts: [], cards: [], mistakes: [], dailySessions: [] };
  state = recordTopicVisit(state, { topicSlug: first.slug, lastAssetId: first.wordAssetIds[2], visitedAt: "2026-09-01T08:00:00.000Z" });
  state = recordTopicVisit(state, { topicSlug: second.slug, lastAssetId: second.wordAssetIds[1], visitedAt: "2026-09-01T09:00:00.000Z" });
  assert.equal(latestTopicVisit(state.topicVisits)?.topicSlug, second.slug);
  assert.equal(state.topicVisits?.length, 2);
});

test("related recommendations are explicit, published and exclude the current topic", () => {
  for (const topic of learningTopics) {
    const related = relatedTopicsFor(topic);
    assert.ok(related.length >= 2);
    assert.ok(related.every((item) => item.status === "published" && item.id !== topic.id));
  }
});

test("P1 UI exposes filters, signed-in truth states, resume and atomic bulk actions", async () => {
  const [browser, panel, detail, route, topicServer] = await Promise.all([
    source("src/app/topics/topics-browser.tsx"),
    source("src/app/topics/topic-learning-panel.tsx"),
    source("src/app/topics/[slug]/page.tsx"),
    source("src/app/api/v1/learning/route.ts"),
    source("src/lib/topics/server.ts"),
  ]);
  assert.match(browser, /HSK level/);
  assert.match(browser, /Difficulty/);
  assert.match(browser, /Study time/);
  assert.match(browser, /Continue last topic/);
  assert.match(browser, /Signed-in progress/);
  assert.match(panel, /Add all to Today/);
  assert.match(panel, /Add all to Review/);
  assert.match(panel, /topic_batch_today/);
  assert.match(panel, /topic_batch_review/);
  assert.match(panel, /Progress unavailable/);
  assert.match(detail, /Useful expressions/);
  assert.match(detail, /Scene dialogue/);
  assert.match(detail, /Culture tip/);
  assert.match(route, /touch_topic/);
  assert.match(route, /topic_batch_today/);
  assert.match(route, /topic_batch_review/);
  assert.match(route, /identity\.account/);
  assert.match(route, /getVerifiedTopicForMutation/);
  assert.match(route, /topicProgress/);
  assert.match(topicServer, /snapshot\.status !== "ready"/);
  assert.match(panel, /body\.error === "REVISION_CONFLICT"/);
});
