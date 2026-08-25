import assert from "node:assert/strict";
import test from "node:test";

import { handleCatalogWordsRequest } from "../src/lib/content/catalog-route.ts";
import type { CatalogSearchDatabase, CatalogSearchRow } from "../src/lib/content/catalog-search.ts";
import { toPublicCatalogResponse } from "../src/lib/content/public-catalog.ts";
import type { CatalogResult } from "../src/lib/content/repository.ts";

function request(query: string): Request {
  return new Request(`https://hskkit.com/api/v1/catalog/words${query}`);
}

function fakeCatalogDb(options: { fail?: boolean } = {}) {
  const rows: CatalogSearchRow[] = Array.from({ length: 51 }, (_, index) => ({
    id: `word-${index + 1}.v1`, release_id: "hsk3-content-truth-v5", standard_version: "GF0025-2021",
    content_version: "2026.08.21-batch1", level_band: index < 20 ? "1" : "7-9", hanzi: index === 0 ? "学习" : `词${index + 1}`,
    traditional: index === 0 ? "學習" : `詞${index + 1}`, pinyin: index === 0 ? "xuéxí" : `cí ${index + 1}`,
    meaning: index === 0 ? "to learn; to study" : `word ${index + 1}`, part_of_speech: index === 0 ? "V/N" : "N",
  }));
  const calls: Array<{ sql: string; bindings: Array<string | number> }> = [];
  const db: CatalogSearchDatabase = {
    prepare(sql: string) {
      let bindings: Array<string | number> = [];
      return {
        bind(...values: Array<string | number>) { bindings = values; calls.push({ sql, bindings }); return this; },
        async first<T>() {
          if (options.fail) throw new Error("simulated D1 outage");
          if (sql.includes("catalog_search_releases")) return { id: "hsk3-content-truth-v5", version: 5, published_at: "2026-08-25T03:05:24.000Z", word_count: 11092 } as T;
          return { total: 51 } as T;
        },
        async all<T>() {
          if (options.fail) throw new Error("simulated D1 outage");
          return { success: true, results: rows as T[] };
        },
      };
    },
  };
  return { db, calls };
}

test("catalog API defaults to paged HSK 3.0 data without returning the full catalog", async () => {
  const { db } = fakeCatalogDb();
  const response = await handleCatalogWordsRequest(request(""), db);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.standard, "hsk3");
  assert.equal(body.releaseId, "hsk3-content-truth-v5");
  assert.equal(body.availability, "ready");
  assert.equal(body.contentAssets.length, 50);
  assert.deepEqual(body.pagination, { page: 1, pageSize: 50, total: 51, totalPages: 2, hasPrevious: false, hasNext: true });
});

test("catalog API maps Levels 7–9 to one advanced shard and combines keyword and POS filters", async () => {
  const { db, calls } = fakeCatalogDb();
  const response = await handleCatalogWordsRequest(request("?q=xue%20xi&level=9&pos=N&field=pinyin&pageSize=10"), db);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.query.level, 9);
  assert.equal(body.query.partOfSpeech, "N");
  assert.equal(body.query.field, "pinyin");
  const dataCall = calls.find((call) => call.sql.includes("LIMIT ? OFFSET ?"));
  assert.ok(dataCall);
  assert.ok(dataCall.bindings.includes("7-9"));
  assert.ok(dataCall.bindings.includes("%xuexi%"));
  assert.ok(dataCall.bindings.includes(11));
});

test("catalog API does not publish an HSK 2.0 foundation release", async () => {
  const { db } = fakeCatalogDb();
  const response = await handleCatalogWordsRequest(request("?standard=hsk2&level=1"), db);
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.error, "CATALOG_UNAVAILABLE");
});

test("catalog API rejects unsupported standards, levels and oversized pages", async () => {
  const { db } = fakeCatalogDb();
  const invalidStandard = await handleCatalogWordsRequest(request("?standard=hsk4"), db);
  const invalidLevel = await handleCatalogWordsRequest(request("?level=10"), db);
  const invalidPageSize = await handleCatalogWordsRequest(request("?pageSize=101"), db);
  const outOfRangePage = await handleCatalogWordsRequest(request("?page=3&pageSize=50"), db);
  assert.equal(invalidStandard.status, 400);
  assert.equal(invalidLevel.status, 400);
  assert.equal(invalidPageSize.status, 400);
  assert.equal(outOfRangePage.status, 400);
});

test("catalog API returns a retryable bounded error when indexed storage is unavailable", async () => {
  const { db } = fakeCatalogDb({ fail: true });
  const response = await handleCatalogWordsRequest(request("?q=learn"), db);
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.error, "CATALOG_UNAVAILABLE");
  assert.match(body.message, /try again/i);
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
