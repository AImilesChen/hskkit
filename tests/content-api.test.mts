import assert from "node:assert/strict";
import test from "node:test";

import { handleCatalogWordsRequest } from "../src/lib/content/catalog-route.ts";
import { toPublicCatalogResponse } from "../src/lib/content/public-catalog.ts";
import type { CatalogResult } from "../src/lib/content/repository.ts";

function request(query: string): Request {
  return new Request(`https://hskkit.com/api/v1/catalog/words${query}`);
}

test("catalog API defaults to paged HSK 3.0 data without returning the full catalog", async () => {
  const response = await handleCatalogWordsRequest(request(""));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.standard, "hsk3");
  assert.equal(body.releaseId, "hsk3-hsk123-2025-v7");
  assert.equal(body.availability, "ready");
  assert.equal(body.contentAssets.length, 50);
  assert.deepEqual(body.pagination, { page: 1, pageSize: 50, total: 9_847, totalPages: 197, hasPrevious: false, hasNext: true });
});

test("catalog API maps Levels 7–9 to one advanced shard and combines keyword and POS filters", async () => {
  const response = await handleCatalogWordsRequest(request("?q=jia&level=9&pos=N&field=pinyin&pageSize=10"));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.query.level, 9);
  assert.equal(body.query.partOfSpeech, "N");
  assert.equal(body.query.field, "pinyin");
  assert.ok(body.contentAssets.length > 0);
  assert.ok(body.contentAssets.every((word: { levelBand: string; payload: { pinyin: string; partOfSpeech: string } }) =>
    word.levelBand === "7-9" && word.payload.pinyin.normalize("NFD").replace(/\p{Mark}/gu, "").replace(/\s/g, "").toLowerCase().includes("jia") && word.payload.partOfSpeech.split("/").includes("N"),
  ));
});

test("catalog API does not publish an HSK 2.0 foundation release", async () => {
  const response = await handleCatalogWordsRequest(request("?standard=hsk2&level=1"));
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.error, "CATALOG_UNAVAILABLE");
});

test("catalog API rejects unsupported standards, levels and oversized pages", async () => {
  const invalidStandard = await handleCatalogWordsRequest(request("?standard=hsk4"));
  const invalidLevel = await handleCatalogWordsRequest(request("?level=10"));
  const invalidPageSize = await handleCatalogWordsRequest(request("?pageSize=101"));
  const outOfRangePage = await handleCatalogWordsRequest(request("?page=223&pageSize=50"));
  assert.equal(invalidStandard.status, 400);
  assert.equal(invalidLevel.status, 400);
  assert.equal(invalidPageSize.status, 400);
  assert.equal(outOfRangePage.status, 400);
});

test("catalog API remains available when the legacy D1 argument is unavailable", async () => {
  const unavailableD1 = { prepare() { throw new Error("simulated D1 outage"); } };
  const response = await handleCatalogWordsRequest(request("?q=learn"), unavailableD1);
  assert.equal(response.status, 200);
  assert.ok((await response.json()).contentAssets.length > 0);
});

test("public catalog DTO never exposes storage keys or authorization metadata", () => {
  const internal: CatalogResult = {
    standard: "hsk3",
    releaseId: "hsk3-v1",
    releaseVersion: 1,
    availability: "ready",
    level: { standard: "hsk3", level: 1, title: "HSK 3.0 Level 1" },
    contentAssets: [{
      id: "word-v1",
      logicalId: "word",
      standard: "hsk3",
      level: 1,
      kind: "word",
      version: 1,
      payload: {
        hanzi: "你",
        authorization: { evidenceUrl: "https://secret.example/evidence" },
        storageKey: "private/nested.mp3",
      } as never,
      source: { name: "editorial", url: "https://example.com/word" },
      authorization: { status: "authorized", license: "owned", evidenceUrl: "https://example.com/evidence/word" },
      qaStatus: "approved",
    }],
    audioAssets: [{
      id: "audio-v1",
      logicalId: "audio-word",
      contentAssetId: "word-v1",
      standard: "hsk3",
      level: 1,
      version: 1,
      storageKey: "private/audio.mp3",
      checksumSha256: "a".repeat(64),
      locale: "zh-CN",
      voice: "speaker-1",
      speed: 1,
      audioKind: "word",
      publishedAt: "2026-08-22T00:00:00.000Z",
      issueReportPath: "/api/v1/content/audio/report",
      usageRights: { streaming: true, caching: true, offlineRedistribution: false },
      source: { name: "studio", url: "https://example.com/audio" },
      authorization: { status: "authorized", license: "owned", evidenceUrl: "https://example.com/evidence/audio" },
      qaStatus: "approved",
    }],
  };

  const serialized = JSON.stringify(toPublicCatalogResponse(internal));
  assert.doesNotMatch(serialized, /storageKey|authorization|evidenceUrl|checksumSha256|secret\.example/);
});
