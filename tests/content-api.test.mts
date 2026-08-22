import assert from "node:assert/strict";
import test from "node:test";

import { GET } from "../src/app/api/v1/catalog/words/route.ts";
import { toPublicCatalogResponse } from "../src/lib/content/public-catalog.ts";
import type { CatalogResult } from "../src/lib/content/repository.ts";

function request(query: string): Request {
  return new Request(`https://hskkit.com/api/v1/catalog/words${query}`);
}

test("catalog API defaults to isolated HSK 3.0 data", async () => {
  const response = await GET(request("?level=1"));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.standard, "hsk3");
  assert.equal(body.releaseId, "hsk3-gf0025-2021-v2");
  assert.equal(body.level.level, 1);
  assert.equal(body.availability, "ready");
  assert.equal(body.contentAssets.length, 500);
  assert.deepEqual(body.audioAssets, []);
});

test("catalog API exposes HSK 3.0 Level 1 through 9", async () => {
  for (let level = 1; level <= 9; level += 1) {
    const response = await GET(request(`?level=${level}`));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.standard, "hsk3");
    assert.equal(body.releaseId, "hsk3-gf0025-2021-v2");
    assert.equal(body.level.level, level);
    assert.equal(body.availability, level <= 7 ? "ready" : "gap");
    assert.equal(body.contentAssets.length > 0, level <= 7);
    assert.deepEqual(body.audioAssets, []);
  }
});

test("catalog API does not publish an HSK 2.0 foundation release", async () => {
  const response = await GET(request("?standard=hsk2&level=1"));
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.error, "CATALOG_UNAVAILABLE");
});

test("catalog API rejects unsupported standards and levels", async () => {
  const invalidStandard = await GET(request("?standard=hsk4&level=1"));
  const invalidLevel = await GET(request("?level=10"));
  assert.equal(invalidStandard.status, 400);
  assert.equal(invalidLevel.status, 400);
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
      usageRights: { streaming: true, caching: true, offlineRedistribution: false },
      source: { name: "studio", url: "https://example.com/audio" },
      authorization: { status: "authorized", license: "owned", evidenceUrl: "https://example.com/evidence/audio" },
      qaStatus: "approved",
    }],
  };

  const serialized = JSON.stringify(toPublicCatalogResponse(internal));
  assert.doesNotMatch(serialized, /storageKey|authorization|evidenceUrl|checksumSha256|secret\.example/);
});
