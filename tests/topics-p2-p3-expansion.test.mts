import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { learningTopics } from "../src/lib/topics/catalog.ts";

const root = new URL("../", import.meta.url);
const catalog = JSON.parse(readFileSync(new URL("src/lib/content/catalog.json", root), "utf8"));
const active = catalog.releases.find((release: { id: string }) => release.id === catalog.activeReleaseByStandard.hsk3);
const releasedAudio = new Set(active.audioAssetIds);
const audioByContent = new Map(catalog.audioAssets.map((asset: { contentAssetId: string; id: string }) => [asset.contentAssetId, asset.id]));

const p2Groups = {
  "Food Moments": ["restaurant-basics", "cooking-at-home"],
  "Daily Life": ["morning-routine", "time-and-plans", "weather-and-seasons"],
  "Travel Essentials": ["departure-and-arrival", "getting-around-town", "hotel-stay"],
} as const;

for (const [group, slugs] of Object.entries(p2Groups)) {
  test(`${group} topics are complete three-lesson samples in the active catalog`, () => {
    for (const slug of slugs) {
      const topic = learningTopics.find((item) => item.slug === slug);
      assert.ok(topic, `${slug} missing`);
      assert.equal(topic.lessons?.length, 3, `${slug} must have exactly three lessons`);
      assert.ok(topic.wordAssetIds.length >= 24 && topic.wordAssetIds.length <= 34, `${slug} word count out of range`);
      assert.equal(new Set(topic.wordAssetIds).size, topic.wordAssetIds.length, `${slug} repeats words`);
      assert.deepEqual(topic.lessons?.flatMap((lesson) => lesson.wordAssetIds), topic.wordAssetIds, `${slug} lesson words must partition the topic`);
      for (const lesson of topic.lessons ?? []) {
        assert.ok(lesson.expressions.length >= 3, `${lesson.id} needs useful collocations`);
        assert.ok(lesson.dialogue.length >= 4, `${lesson.id} needs a complete dialogue`);
        assert.ok(lesson.task.successCriteria.length >= 3, `${lesson.id} needs a real task`);
      }
      for (const wordId of topic.wordAssetIds) {
        assert.ok(active.contentAssetIds.includes(wordId), `${slug} has an unpublished word ${wordId}`);
        const audioId = audioByContent.get(wordId);
        if (audioId) assert.ok(releasedAudio.has(audioId), `${slug} references unreleased audio for ${wordId}`);
      }
      assert.match(topic.contentVersion, /p2/);
    }
  });
}

test("P3 exposes listening discovery and continuous topic audio controls", () => {
  const nav = readFileSync(new URL("src/app/site-navigation.ts", root), "utf8");
  const card = readFileSync(new URL("src/app/topics/topic-card.tsx", root), "utf8");
  const detail = readFileSync(new URL("src/app/topics/[slug]/page.tsx", root), "utf8");
  const player = readFileSync(new URL("src/app/topics/topic-lesson-audio-player.tsx", root), "utf8");
  assert.match(nav, /Listening library/);
  assert.match(nav, /Build listening momentum/);
  assert.match(card, /audio coverage/i);
  assert.match(card, /Audio complete/);
  assert.match(detail, /TopicLessonAudioPlayer/);
  assert.match(detail, /Next mini-lesson/);
  assert.match(detail, /Continue listening practice/);
  assert.match(player, /Play lesson/);
  assert.match(player, /playbackRate/);
  assert.match(player, /Auto-play/);
  assert.match(player, /0\.75/);
  assert.match(player, /1\.25/);
});

test("P3 adds one verified follow-on topic per established category only after the experience upgrade", () => {
  for (const slug of ["home-chores", "cafe-and-drinks", "travel-problems"]) {
    const topic = learningTopics.find((item) => item.slug === slug);
    assert.ok(topic, `${slug} missing`);
    assert.equal(topic.lessons?.length, 3, `${slug} lesson count`);
    assert.equal(topic.wordAssetIds.length, 24, `${slug} word count`);
    assert.equal(new Set(topic.wordAssetIds).size, 24, `${slug} unique words`);
    assert.deepEqual(topic.lessons?.flatMap((lesson) => lesson.wordAssetIds), topic.wordAssetIds);
    for (const wordId of topic.wordAssetIds) {
      assert.ok(active.contentAssetIds.includes(wordId), `${slug} has an unpublished word ${wordId}`);
      const audioId = audioByContent.get(wordId);
      if (audioId) assert.ok(releasedAudio.has(audioId), `${slug} references unreleased audio for ${wordId}`);
    }
  }
});
