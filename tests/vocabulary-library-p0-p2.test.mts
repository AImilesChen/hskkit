import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { buildCatalogQuery, parseCatalogSearchParams } from "../src/lib/content/catalog-search.ts";

const pageSource = fs.readFileSync(new URL("../src/app/vocabulary/[level]/page.tsx", import.meta.url), "utf8");
const clientSource = fs.readFileSync(new URL("../src/app/vocabulary/[level]/vocabulary-catalog.tsx", import.meta.url), "utf8");
const routeSource = fs.readFileSync(new URL("../src/lib/content/catalog-route.ts", import.meta.url), "utf8");
const runtimeIndex = JSON.parse(fs.readFileSync(new URL("../src/lib/content/runtime-content-index.json", import.meta.url), "utf8")) as { levels: Array<{ level: number; contentCount: number; wordCount: number }> };

test("vocabulary route exposes a task-first HSK 1-6 and unified HSK 7-9 level switcher", () => {
  assert.match(pageSource, /\{levelLabel\} Vocabulary/);
  assert.match(pageSource, /HSK 7–9/);
  assert.match(pageSource, /VocabularyCatalog/);
  assert.match(pageSource, /aria-current/);
  assert.doesNotMatch(pageSource, /hsk3-content-truth-v5|Formal audio assets|catalog API exposes|Published vocabulary preview/);
});

test("vocabulary catalog requests every level through searchable pages of 50", () => {
  assert.match(clientSource, /\/api\/v1\/catalog\/words/);
  assert.match(clientSource, /pageSize:\s*"50"/);
  assert.match(clientSource, /new URLSearchParams\(\{ level: String\(level\), page: String\(request\.page\), pageSize: "50" \}\)/);
  assert.match(clientSource, /params\.set\("q"/);
  assert.match(clientSource, /params\.set\("pos"/);
  assert.match(clientSource, /params\.set\("audio"/);
  assert.match(clientSource, /params\.set\("sort"/);
  assert.match(clientSource, /Showing.*of.*words/s);
  assert.match(clientSource, /Previous/);
  assert.match(clientSource, /Next/);
  assert.match(clientSource, /aria-label="Vocabulary result pages"/);
});

test("vocabulary totals count words rather than unrelated published grammar or reading assets", () => {
  assert.deepEqual(runtimeIndex.levels.map((item) => item.wordCount), [500, 772, 973, 1000, 1071, 1140, 5636, 5636, 5636]);
  assert.ok(runtimeIndex.levels.every((item) => item.wordCount <= item.contentCount));
  assert.match(pageSource, /status\.wordCount/);
  assert.doesNotMatch(pageSource, /status\.contentCount/);
});

test("formal audio controls only render for approved published word recordings", () => {
  assert.match(routeSource, /formalAudioUrl: formalWordAudioUrlByContentId\.get\(asset\.id\) \?\? null/);
  assert.match(clientSource, /src=\{word\.formalAudioUrl\}/);
  assert.match(clientSource, /Formal audio unavailable/);
  assert.doesNotMatch(clientSource, /label="Play preview"/);
});

test("catalog API validates formal-audio and pinyin-sort filters", () => {
  const parsed = parseCatalogSearchParams(new URL("https://hskkit.com/api/v1/catalog/words?level=1&audio=formal&sort=pinyin"));
  assert.equal(parsed.audio, "formal");
  assert.equal(parsed.sort, "pinyin");
  const query = buildCatalogQuery(parsed, "release", ["hsk3.word.l1.0228.v1"]);
  assert.match(query.sql, /id IN \(\?\)/);
  assert.match(query.sql, /ORDER BY pinyin COLLATE NOCASE, id/);
  assert.ok(query.bindings.includes("hsk3.word.l1.0228.v1"));

  assert.throws(
    () => parseCatalogSearchParams(new URL("https://hskkit.com/api/v1/catalog/words?audio=synthetic")),
    /audio must be all or formal/,
  );
  assert.throws(
    () => parseCatalogSearchParams(new URL("https://hskkit.com/api/v1/catalog/words?sort=random")),
    /sort must be catalog or pinyin/,
  );
});
