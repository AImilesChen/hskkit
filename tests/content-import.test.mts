import assert from "node:assert/strict";
import test from "node:test";

import { importBatch, type ContentImportBatch } from "../src/lib/content/importer.ts";
import type { ContentRepository } from "../src/lib/content/repository.ts";

function emptyRepository(): ContentRepository {
  return {
    schemaVersion: "1.0.0",
    levels: [
      ...Array.from({ length: 6 }, (_, index) => ({ standard: "hsk2" as const, level: index + 1, title: `HSK 2.0 Level ${index + 1}` })),
      ...Array.from({ length: 9 }, (_, index) => ({ standard: "hsk3" as const, level: index + 1, title: `HSK 3.0 Level ${index + 1}` })),
    ],
    contentAssets: [],
    audioAssets: [],
    releases: [],
    releaseEvents: [],
    activeReleaseByStandard: {},
  };
}

function importFixture(): ContentImportBatch {
  return {
    standard: "hsk3",
    release: {
      id: "hsk3-import-v1",
      standard: "hsk3",
      version: 1,
      status: "draft",
      contentAssetIds: ["word-1"],
      audioAssetIds: ["audio-1"],
    },
    contentAssets: [
      {
        id: "word-1",
        logicalId: "word-1",
        standard: "hsk3",
        level: 1,
        kind: "word",
        version: 1,
        payload: { hanzi: "你好" },
        source: { name: "licensed source", url: "https://example.com/word-1" },
        authorization: {
          status: "authorized",
          license: "CC-BY-4.0",
          evidenceUrl: "https://example.com/evidence/word-1",
        },
        qaStatus: "approved",
      },
    ],
    audioAssets: [
      {
        id: "audio-1",
        logicalId: "audio-word-1",
        contentAssetId: "word-1",
        standard: "hsk3",
        level: 1,
        version: 1,
        storageKey: "audio/hsk3/l1/word-1.mp3",
        checksumSha256: "c".repeat(64),
        locale: "zh-CN",
        voice: "studio-speaker-1",
        speed: 1,
        usageRights: { streaming: true, caching: true, offlineRedistribution: false },
        source: { name: "licensed studio", url: "https://example.com/audio-1" },
        authorization: {
          status: "authorized",
          license: "owned",
          evidenceUrl: "https://example.com/evidence/audio-1",
        },
        qaStatus: "approved",
      },
    ],
  };
}

test("an import appends a versioned draft release and keeps it inactive", () => {
  const imported = importBatch(emptyRepository(), importFixture());
  assert.equal(imported.releases[0].status, "draft");
  assert.equal(imported.activeReleaseByStandard.hsk3, undefined);
  assert.equal(imported.contentAssets[0].version, 1);
  assert.equal(imported.audioAssets[0].version, 1);
});

test("an HSK 3.0 import cannot contain HSK 2.0 assets", () => {
  const batch = importFixture();
  batch.contentAssets[0].standard = "hsk2";
  assert.throws(() => importBatch(emptyRepository(), batch), /batch standard.*word-1/i);
});

test("an import cannot overwrite an existing asset or release ID", () => {
  const repository = importBatch(emptyRepository(), importFixture());
  assert.throws(() => importBatch(repository, importFixture()), /already exists/i);
});

test("an import requires the next release and asset version in each lineage", () => {
  const repository = importBatch(emptyRepository(), importFixture());
  const batch = importFixture();
  batch.release.id = "hsk3-import-v3";
  batch.release.version = 3;
  batch.contentAssets[0].id = "word-1-v3";
  batch.contentAssets[0].version = 3;
  batch.audioAssets[0].id = "audio-1-v3";
  batch.audioAssets[0].contentAssetId = "word-1-v3";
  batch.audioAssets[0].version = 3;
  batch.release.contentAssetIds = ["word-1-v3"];
  batch.release.audioAssetIds = ["audio-1-v3"];
  assert.throws(() => importBatch(repository, batch), /next.*version.*2/i);
});
