import test from "node:test";
import assert from "node:assert/strict";
import { learningTopics, topicsSourceReleaseId } from "../src/lib/topics/catalog.ts";
import { findPublicCatalogWordsByIds, publicCatalogReleaseId } from "../src/lib/content/public-catalog-index.ts";
import { buildTopicPracticeQuestions } from "../src/lib/topics/practice.ts";

test("every published topic uses current vocabulary and has usable practice", () => {
  assert.equal(topicsSourceReleaseId, publicCatalogReleaseId);
  for (const topic of learningTopics.filter((item) => item.status === "published")) {
    const rows = findPublicCatalogWordsByIds(topic.wordAssetIds);
    assert.equal(rows.length, topic.wordAssetIds.length, `${topic.slug}: missing words`);
    assert.ok(rows.every((row) => row.release_id === publicCatalogReleaseId), `${topic.slug}: retired word`);
    assert.deepEqual([...new Set(rows.map((row) => row.level_band))].sort(), [...topic.levelBands].sort(), `${topic.slug}: level labels`);
    assert.ok(topic.featuredWordAssetIds.every((id) => topic.wordAssetIds.includes(id)), `${topic.slug}: featured word outside topic`);
    const questions = buildTopicPracticeQuestions(topic, rows.map((row) => ({
      assetId: row.id,
      contentId: `word:${row.id}`,
      contentVersion: `${row.release_id}:${row.content_version}`,
      level: row.level_band === "7-9" ? 7 : Number(row.level_band),
      levelBand: row.level_band,
      hanzi: row.hanzi,
      pinyin: row.pinyin,
      meaning: row.meaning,
    })));
    assert.ok(questions.length >= 4, `${topic.slug}: practice unavailable`);
  }
});
