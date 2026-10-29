import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";

import { buildCatalogQuery, parseCatalogSearchParams } from "../src/lib/content/catalog-search.ts";

const pageSource = fs.readFileSync(new URL("../src/app/vocabulary/[level]/page.tsx", import.meta.url), "utf8");
const navigationSource = fs.readFileSync(new URL("../src/app/vocabulary/[level]/vocabulary-level-navigation.tsx", import.meta.url), "utf8");
const clientSource = fs.readFileSync(new URL("../src/app/vocabulary/[level]/vocabulary-catalog.tsx", import.meta.url), "utf8");
const audioButtonSource = fs.readFileSync(new URL("../src/app/components/audio-button.tsx", import.meta.url), "utf8");
const routeSource = fs.readFileSync(new URL("../src/lib/content/catalog-route.ts", import.meta.url), "utf8");
const runtimeIndex = JSON.parse(fs.readFileSync(new URL("../src/lib/content/runtime-content-index.json", import.meta.url), "utf8")) as { levels: Array<{ level: number; contentCount: number; wordCount: number }> };

test("vocabulary route exposes a task-first HSK 1-6 and unified HSK 7-9 level switcher", () => {
  assert.match(pageSource, /\{levelLabel\} Vocabulary/);
  assert.match(pageSource, /HSK 7–9/);
  assert.match(pageSource, /VocabularyCatalog/);
  assert.match(navigationSource, /aria-current/);
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
  assert.deepEqual(runtimeIndex.levels.map((item) => item.wordCount), [300, 200, 500, 1000, 1071, 1140, 5636, 5636, 5636]);
  assert.ok(runtimeIndex.levels.every((item) => item.wordCount <= item.contentCount));
  assert.match(pageSource, /status\.wordCount/);
  assert.doesNotMatch(pageSource, /status\.contentCount/);
});

test("published pronunciation controls render only for words with real audio", () => {
  assert.match(routeSource, /formalAudioUrl: formalWordAudioUrlByContentId\.get\(asset\.id\) \?\? null/);
  assert.match(clientSource, /src=\{word\.formalAudioUrl\}/);
  assert.match(clientSource, /label=\{`Play pronunciation for \$\{word\.payload\.hanzi\}`\}/);
  assert.match(clientSource, /variant="icon"/);
  assert.doesNotMatch(clientSource, /<AudioButton[^>]+unavailable/);
  assert.match(clientSource, />Words with audio</);
  assert.doesNotMatch(clientSource, /Published synthesized audio only|Play synthesized pronunciation/);

  assert.match(audioButtonSource, /type AudioPhase = "idle" \| "loading" \| "playing" \| "error"/);
  assert.match(audioButtonSource, /Audio not available yet/);
  assert.match(audioButtonSource, /Audio failed for .*Try again/);
  assert.match(audioButtonSource, /animate-spin/);
  assert.match(audioButtonSource, /animate-pulse/);
  assert.match(audioButtonSource, /Pause pronunciation for/);
  assert.match(audioButtonSource, /const disabled = unavailable \|\| supported !== true;/);
  assert.match(audioButtonSource, /aria-busy/);
  assert.match(audioButtonSource, /aria-hidden="true"/);
  assert.match(audioButtonSource, /min-h-11 min-w-11/);
});

test("mobile vocabulary rows keep the compact audio action beside the hanzi", () => {
  assert.match(clientSource, /justify-between gap-3 lg:block/);
  assert.match(clientSource, /lg:hidden[\s\S]*?<AudioButton/);
  assert.match(clientSource, /hidden items-center justify-end lg:flex/);
});

test("catalog API validates formal-audio and pinyin-sort filters", () => {
  const parsed = parseCatalogSearchParams(new URL("https://hskkit.com/api/v1/catalog/words?level=1&audio=formal&sort=pinyin"));
  assert.equal(parsed.audio, "formal");
  assert.equal(parsed.sort, "pinyin");
  const audioIds = Array.from({ length: 248 }, (_, index) => `hsk3.word.l1.${String(index + 1).padStart(4, "0")}.v1`);
  const query = buildCatalogQuery(parsed, "release", audioIds);
  assert.match(query.sql, /id IN \(SELECT value FROM json_each\(\?\)\)/);
  assert.match(query.sql, /ORDER BY pinyin COLLATE NOCASE, id/);
  assert.ok(query.bindings.includes(JSON.stringify(audioIds)));
  assert.ok(query.bindings.length <= 5, "formal-audio filtering must stay below D1 binding limits");

  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE catalog_search_index (id TEXT PRIMARY KEY, release_id TEXT, level_band TEXT)");
  const insert = db.prepare("INSERT INTO catalog_search_index VALUES (?, 'release', '1')");
  insert.run(audioIds[0]);
  insert.run(audioIds[247]);
  insert.run("hsk3.word.l1.without-audio.v1");
  const count = db.prepare(query.countSql).get(...query.countBindings) as { total: number };
  assert.equal(count.total, 2, "JSON expansion must return only approved audio-backed words");

  assert.throws(
    () => parseCatalogSearchParams(new URL("https://hskkit.com/api/v1/catalog/words?audio=synthetic")),
    /audio must be all or formal/,
  );
  assert.throws(
    () => parseCatalogSearchParams(new URL("https://hskkit.com/api/v1/catalog/words?sort=random")),
    /sort must be catalog or pinyin/,
  );
});
