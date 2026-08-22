import assert from "node:assert/strict";
import test from "node:test";

import {
  publishRelease,
  queryCatalog,
  rollbackRelease,
  validateRepository,
  withdrawRelease,
  type ContentRepository,
} from "../src/lib/content/repository.ts";

function repositoryFixture(): ContentRepository {
  return {
    schemaVersion: "1.0.0",
    levels: [
      { standard: "hsk2", level: 1, title: "HSK 2.0 Level 1" },
      ...Array.from({ length: 9 }, (_, index) => ({
        standard: "hsk3" as const,
        level: index + 1,
        title: `HSK 3.0 Level ${index + 1}`,
      })),
    ],
    contentAssets: [
      {
        id: "legacy-word",
        logicalId: "legacy-word",
        standard: "hsk2",
        level: 1,
        kind: "word",
        version: 1,
        payload: { hanzi: "旧" },
        source: { name: "legacy", url: "https://example.com/legacy" },
        authorization: {
          status: "authorized",
          license: "internal",
          evidenceUrl: "https://example.com/evidence/legacy",
        },
        qaStatus: "approved",
      },
      {
        id: "modern-word-v1",
        logicalId: "modern-word",
        standard: "hsk3",
        level: 1,
        kind: "word",
        version: 1,
        payload: { hanzi: "新" },
        source: { name: "editorial", url: "https://example.com/modern" },
        authorization: {
          status: "authorized",
          license: "internal",
          evidenceUrl: "https://example.com/evidence/modern",
        },
        qaStatus: "approved",
      },
      {
        id: "modern-word-v2",
        logicalId: "modern-word",
        standard: "hsk3",
        level: 1,
        kind: "word",
        version: 2,
        payload: { hanzi: "新版" },
        source: { name: "editorial", url: "https://example.com/modern-v2" },
        authorization: {
          status: "authorized",
          license: "internal",
          evidenceUrl: "https://example.com/evidence/modern-v2",
        },
        qaStatus: "approved",
      },
    ],
    audioAssets: [
      {
        id: "audio-approved",
        logicalId: "audio-modern-word",
        contentAssetId: "modern-word-v1",
        standard: "hsk3",
        level: 1,
        version: 1,
        storageKey: "audio/hsk3/l1/approved.mp3",
        checksumSha256: "a".repeat(64),
        locale: "zh-CN",
        voice: "studio-speaker-1",
        speed: 1,
        audioKind: "word",
        publishedAt: "2026-08-22T00:00:00.000Z",
        issueReportPath: "/api/v1/content/audio/report",
        usageRights: { streaming: true, caching: true, offlineRedistribution: false },
        source: { name: "studio", url: "https://example.com/audio" },
        authorization: {
          status: "authorized",
          license: "owned",
          evidenceUrl: "https://example.com/evidence/audio",
        },
        qaStatus: "approved",
      },
      {
        id: "audio-unlicensed",
        logicalId: "audio-modern-word",
        contentAssetId: "modern-word-v2",
        standard: "hsk3",
        level: 1,
        version: 2,
        storageKey: "audio/hsk3/l1/unlicensed.mp3",
        checksumSha256: "b".repeat(64),
        locale: "zh-CN",
        voice: "unknown",
        speed: 1,
        audioKind: "word",
        publishedAt: "2026-08-22T00:00:00.000Z",
        issueReportPath: "/api/v1/content/audio/report",
        usageRights: { streaming: false, caching: false, offlineRedistribution: false },
        source: { name: "unknown", url: "https://example.com/unlicensed" },
        authorization: {
          status: "pending",
          license: "unknown",
          evidenceUrl: "https://example.com/evidence/pending",
        },
        qaStatus: "approved",
      },
    ],
    releases: [
      {
        id: "hsk2-v1",
        standard: "hsk2",
        version: 1,
        status: "published",
        contentAssetIds: ["legacy-word"],
        audioAssetIds: [],
        publishedAt: "2026-08-20T00:00:00.000Z",
      },
      {
        id: "hsk3-v1",
        standard: "hsk3",
        version: 1,
        status: "published",
        contentAssetIds: ["modern-word-v1"],
        audioAssetIds: ["audio-approved"],
        publishedAt: "2026-08-20T00:00:00.000Z",
      },
      {
        id: "hsk3-v2",
        standard: "hsk3",
        version: 2,
        status: "draft",
        contentAssetIds: ["modern-word-v2"],
        audioAssetIds: ["audio-unlicensed"],
      },
    ],
    releaseEvents: [
      { action: "publish", releaseId: "hsk2-v1", standard: "hsk2", at: "2026-08-20T00:00:00.000Z" },
      { action: "publish", releaseId: "hsk3-v1", standard: "hsk3", at: "2026-08-20T00:00:00.000Z" },
    ],
    activeReleaseByStandard: { hsk2: "hsk2-v1", hsk3: "hsk3-v1" },
  };
}

function approveSecondAudio(repository: ContentRepository): void {
  repository.audioAssets[1].authorization = {
    status: "authorized",
    license: "owned",
    evidenceUrl: "https://example.com/evidence/audio-v2",
  };
  repository.audioAssets[1].usageRights.streaming = true;
}

test("default queries use HSK 3.0 and never mix HSK 2.0 assets", () => {
  const result = queryCatalog(repositoryFixture(), { level: 1 });
  assert.equal(result.standard, "hsk3");
  assert.deepEqual(result.contentAssets.map((asset) => asset.id), ["modern-word-v1"]);
  assert.equal(result.contentAssets.some((asset) => asset.standard === "hsk2"), false);
});

test("HSK 2.0 data is available only through an explicit standard query", () => {
  const result = queryCatalog(repositoryFixture(), { standard: "hsk2", level: 1 });
  assert.deepEqual(result.contentAssets.map((asset) => asset.id), ["legacy-word"]);
});

test("HSK 3.0 levels 1 through 9 are queryable", () => {
  const repository = repositoryFixture();
  assert.deepEqual(
    Array.from({ length: 9 }, (_, index) => queryCatalog(repository, { level: index + 1 }).level.level),
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
  );
});

test("a release with audio awaiting authorization cannot be published", () => {
  assert.throws(
    () => publishRelease(repositoryFixture(), "hsk3-v2", "2026-08-20T00:00:00.000Z"),
    /audio-unlicensed.*authorization/i,
  );
});

test("a release with audio that has not passed QA cannot be published", () => {
  const repository = repositoryFixture();
  approveSecondAudio(repository);
  repository.audioAssets[1].qaStatus = "pending";
  assert.throws(
    () => publishRelease(repository, "hsk3-v2", "2026-08-20T00:00:00.000Z"),
    /audio-unlicensed.*QA/i,
  );
});

test("revoking audio authorization after publication makes the active release unavailable", () => {
  const repository = repositoryFixture();
  repository.audioAssets[0].authorization.status = "revoked";
  assert.throws(() => queryCatalog(repository, { level: 1 }), /audio-approved.*authorization/i);
});

test("an invalid active release can still be withdrawn or rolled back to safety", () => {
  const revoked = repositoryFixture();
  revoked.audioAssets[0].authorization.status = "revoked";
  const withdrawn = withdrawRelease(revoked, "hsk3-v1", "2026-08-20T00:02:00.000Z");
  assert.equal(withdrawn.activeReleaseByStandard.hsk3, undefined);

  const repository = repositoryFixture();
  approveSecondAudio(repository);
  const published = publishRelease(repository, "hsk3-v2", "2026-08-20T00:01:00.000Z");
  published.audioAssets[1].authorization.status = "revoked";
  const rolledBack = rollbackRelease(published, "hsk3-v1", "2026-08-20T00:02:00.000Z");
  assert.equal(rolledBack.activeReleaseByStandard.hsk3, "hsk3-v1");
});

test("publishing switches only the matching standard active release", () => {
  const repository = repositoryFixture();
  approveSecondAudio(repository);
  const published = publishRelease(repository, "hsk3-v2", "2026-08-20T00:01:00.000Z");
  assert.equal(published.activeReleaseByStandard.hsk3, "hsk3-v2");
  assert.equal(published.activeReleaseByStandard.hsk2, "hsk2-v1");
  assert.equal(published.releases.find((release) => release.id === "hsk3-v2")?.status, "published");
  assert.equal(published.releaseEvents.at(-1)?.action, "publish");
});

test("withdrawing an active release makes its assets unavailable", () => {
  const withdrawn = withdrawRelease(repositoryFixture(), "hsk3-v1", "2026-08-20T00:02:00.000Z");
  assert.equal(withdrawn.activeReleaseByStandard.hsk3, undefined);
  assert.throws(() => queryCatalog(withdrawn, { level: 1 }), /no active HSK 3.0 release/i);
  assert.equal(withdrawn.releaseEvents.at(-1)?.action, "withdraw");
});

test("rollback activates a previous published version without mutating either version", () => {
  const repository = repositoryFixture();
  approveSecondAudio(repository);
  const published = publishRelease(repository, "hsk3-v2", "2026-08-20T00:01:00.000Z");
  const rolledBack = rollbackRelease(published, "hsk3-v1", "2026-08-20T00:05:00.000Z");
  assert.equal(rolledBack.activeReleaseByStandard.hsk3, "hsk3-v1");
  assert.equal(rolledBack.releases.find((release) => release.id === "hsk3-v2")?.status, "published");
  assert.equal(rolledBack.releases.find((release) => release.id === "hsk3-v1")?.status, "published");
  assert.deepEqual(queryCatalog(rolledBack, { level: 1 }).contentAssets.map((asset) => asset.id), ["modern-word-v1"]);
  assert.deepEqual(rolledBack.releaseEvents.at(-1), {
    action: "rollback",
    releaseId: "hsk3-v1",
    standard: "hsk3",
    at: "2026-08-20T00:05:00.000Z",
    previousActiveReleaseId: "hsk3-v2",
  });
});

test("repository validation rejects HSK 3.0 catalogs missing any level from 1 to 9", () => {
  const repository = repositoryFixture();
  repository.levels = repository.levels.filter((level) => !(level.standard === "hsk3" && level.level === 9));
  assert.throws(() => validateRepository(repository), /HSK 3.0 levels must be exactly 1 through 9/i);
});

test("repository validation rejects unknown QA and authorization states", () => {
  const repository = repositoryFixture();
  repository.audioAssets[0].qaStatus = "unchecked" as never;
  assert.throws(() => validateRepository(repository), /QA status/i);

  const second = repositoryFixture();
  second.audioAssets[0].authorization.status = "claimed" as never;
  assert.throws(() => validateRepository(second), /authorization status/i);
});

test("repository validation rejects audio without explicit streaming rights", () => {
  const repository = repositoryFixture();
  repository.audioAssets[0].usageRights.streaming = false;
  assert.throws(() => validateRepository(repository), /streaming right/i);
});

test("repository validation rejects malformed asset objects with a stable error", () => {
  const repository = repositoryFixture();
  repository.contentAssets = [null as never];
  assert.throws(() => validateRepository(repository), /ContentAsset must be an object/i);
});

test("repository validation rejects malformed release timestamps", () => {
  const repository = repositoryFixture();
  repository.releases[1].publishedAt = "not-a-time";
  assert.throws(() => validateRepository(repository), /publishedAt/i);
});

test("repository validation enforces continuous versions and one lineage per release", () => {
  const gap = repositoryFixture();
  gap.contentAssets[2].version = 3;
  assert.throws(() => validateRepository(gap), /continuous.*version/i);

  const duplicateLineage = repositoryFixture();
  duplicateLineage.releases[2].contentAssetIds = ["modern-word-v1", "modern-word-v2"];
  assert.throws(() => validateRepository(duplicateLineage), /multiple versions.*logicalId/i);
});

test("repository validation rejects release events that cannot be replayed", () => {
  const repository = repositoryFixture();
  repository.releaseEvents[1].previousActiveReleaseId = "hsk2-v1";
  assert.throws(() => validateRepository(repository), /previous active release/i);
});
