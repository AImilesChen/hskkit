import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { buildCatalogQuery, parseCatalogSearchParams } from "../src/lib/content/catalog-search.ts";
import { handleCatalogWordsRequest } from "../src/lib/content/catalog-route.ts";
import { flashcardSummary, splitFlashcardForms } from "../src/lib/learning/flashcards.ts";

const catalogSource = fs.readFileSync(new URL("../src/app/vocabulary/[level]/vocabulary-catalog.tsx", import.meta.url), "utf8");
const quickSource = fs.readFileSync(new URL("../src/app/vocabulary/[level]/quick-flashcards.tsx", import.meta.url), "utf8");
const routeSource = fs.readFileSync(new URL("../src/lib/content/catalog-route.ts", import.meta.url), "utf8");

test("flashcard catalog mode validates a bounded request and executes a stable unique sample", () => {
  const parsed = parseCatalogSearchParams(new URL("https://hskkit.com/api/v1/catalog/words?level=2&mode=flashcards&seed=90210&pageSize=20"));
  assert.equal(parsed.level, 2);
  assert.equal(parsed.mode, "flashcards");
  assert.equal(parsed.seed, 90210);
  assert.equal(parsed.pageSize, 20);

  const query = buildCatalogQuery(parsed, "release");
  assert.match(query.sql, /ORDER BY \(\(\(\(CAST\(substr\(id, -7, 4\) AS INTEGER\) \+ \?\) \* 1103515245 \+ 12345\) & 2147483647\)\), id/);
  assert.equal(query.bindings.at(-2), 90210);
  assert.equal(query.bindings.at(-1), 21);

  assert.throws(
    () => parseCatalogSearchParams(new URL("https://hskkit.com/api/v1/catalog/words?level=1&mode=flashcards&seed=-1&pageSize=20")),
    /seed must be between 0 and 2147483647/,
  );
  assert.throws(
    () => parseCatalogSearchParams(new URL("https://hskkit.com/api/v1/catalog/words?level=1&mode=flashcards&seed=1&page=2&pageSize=20")),
    /page must be 1 for flashcards mode/,
  );
  assert.throws(
    () => parseCatalogSearchParams(new URL("https://hskkit.com/api/v1/catalog/words?mode=flashcards&seed=1&pageSize=20")),
    /level is required/,
  );
  assert.throws(
    () => parseCatalogSearchParams(new URL("https://hskkit.com/api/v1/catalog/words?level=1&mode=flashcards&pageSize=20")),
    /seed is required/,
  );
  assert.throws(
    () => parseCatalogSearchParams(new URL("https://hskkit.com/api/v1/catalog/words?level=1&mode=flashcards&seed=1&pageSize=25")),
    /10, 20, or 50/,
  );
  assert.throws(
    () => parseCatalogSearchParams(new URL("https://hskkit.com/api/v1/catalog/words?level=1&mode=flashcards&seed=1&pageSize=20&q=home")),
    /not valid/,
  );

  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE catalog_search_index (
    id TEXT PRIMARY KEY,
    release_id TEXT,
    standard_version TEXT,
    content_version TEXT,
    level_band TEXT,
    hanzi TEXT,
    traditional TEXT,
    pinyin TEXT,
    meaning TEXT,
    part_of_speech TEXT,
    sort_level INTEGER
  )`);
  const insert = db.prepare("INSERT INTO catalog_search_index VALUES (?, 'release', 'GF0025-2021', 'v1', '1', ?, '', ?, ?, 'noun', ?)");
  for (let index = 1; index <= 100; index += 1) {
    const padded = String(index).padStart(4, "0");
    insert.run(`hsk3.word.l1.${padded}.v1`, `词${index}`, `ci${index}`, `word ${index}`, index);
  }
  const execute = (seed: number) => {
    const built = buildCatalogQuery({ q: "", page: 1, pageSize: 20, level: 1, mode: "flashcards", seed }, "release");
    return db.prepare(built.sql).all(...built.bindings).slice(0, 20).map((row) => String(row.id));
  };
  const first = execute(90210);
  assert.deepEqual(execute(90210), first);
  assert.notDeepEqual(execute(90211), first);
  assert.equal(new Set(first).size, 20);
  db.close();

  assert.match(routeSource, /params\.mode === "flashcards"[\s\S]*?"no-store"/);
});

test("flashcard responses are no-store while invalid random requests fail before D1", async () => {
  let prepareCalls = 0;
  const db = {
    prepare(sql: string) {
      prepareCalls += 1;
      const statement = {
        bind: (..._values: unknown[]) => statement,
        first: async () => sql.includes("catalog_search_releases")
          ? { id: "release", version: 1, published_at: "2026-01-01", word_count: 100 }
          : { total: 0 },
        all: async () => ({ success: true, results: [] }),
      };
      return statement;
    },
  };
  const response = await handleCatalogWordsRequest(
    new Request("https://hskkit.com/api/v1/catalog/words?level=1&mode=flashcards&seed=90210&pageSize=20"),
    db as never,
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");

  const beforeInvalid = prepareCalls;
  const invalid = await handleCatalogWordsRequest(
    new Request("https://hskkit.com/api/v1/catalog/words?mode=flashcards&seed=90210&pageSize=20"),
    db as never,
  );
  assert.equal(invalid.status, 400);
  assert.equal(prepareCalls, beforeInvalid);
});

test("level vocabulary keeps Browse vocabulary and Quick Flashcards as separate modes", () => {
  assert.match(catalogSource, /role="group"/);
  assert.match(catalogSource, /aria-pressed=\{mode === "browse"\}/);
  assert.match(catalogSource, /aria-pressed=\{mode === "flashcards"\}/);
  assert.match(catalogSource, />Browse vocabulary</);
  assert.match(catalogSource, />Quick Flashcards</);
  assert.match(catalogSource, /<QuickFlashcards/);
  assert.match(catalogSource, /mode === "browse"/);
  assert.doesNotMatch(catalogSource, /hsk1_vocab\.json/);
});

test("quick flashcards load only the selected published HSK 3.0 level and support 10, 20, or 50 cards", () => {
  assert.match(quickSource, /\/api\/v1\/catalog\/words/);
  assert.match(quickSource, /level: String\(level\)/);
  assert.match(quickSource, /mode: "flashcards"/);
  assert.match(quickSource, /seed: String\(seed\)/);
  assert.match(quickSource, /const sessionSizes = \[10, 20, 50\] as const/);
  assert.match(quickSource, /pageSize: String\(sessionSize\)/);
  assert.match(quickSource, /New random set/);
});

test("quick cards reveal published pinyin, meaning and part of speech without inventing examples or SRS", () => {
  assert.match(quickSource, /Show answer/);
  assert.match(quickSource, /Hide answer for/);
  assert.match(quickSource, /currentWord\?\.payload\.pinyin/);
  assert.match(quickSource, /currentWord\.payload\.meaning/);
  assert.match(quickSource, /currentWord\?\.payload\.partOfSpeech/);
  assert.match(quickSource, /formalAudioUrl/);
  assert.match(quickSource, /variant="icon"/);
  assert.match(quickSource, /View word details/);
  assert.match(quickSource, /splitFlashcardForms/);
  assert.match(quickSource, /text-white sm:text-3xl/);
  assert.doesNotMatch(quickSource, /example_cn|example_en|>(Again|Hard|Good|Easy)</i);
});

test("quick cards expose progress, self-check controls, missed-word replay and mobile-safe touch targets", () => {
  assert.match(quickSource, /Card \{currentIndex \+ 1\} of \{words\.length\}/);
  assert.match(quickSource, />Previous</);
  assert.match(quickSource, /rate\("retry"\)/);
  assert.match(quickSource, /rate\("known"\)/);
  assert.match(quickSource, /reviewUncertain/);
  assert.match(quickSource, /Review \{retryWords\.length\} \{retryWords\.length === 1/);
  assert.match(quickSource, /Start another set/);
  assert.match(quickSource, /Try again/);
  assert.match(quickSource, /min-h-11/);
  assert.match(quickSource, /min-w-11/);
  assert.match(quickSource, /aria-live="polite"/);
  assert.match(quickSource, /max-w-\[720px\]/);
});

test("flashcard self-check repeats only missed or skipped words and keeps alternate forms readable", () => {
  assert.deepEqual(splitFlashcardForms("有时候|有时|有时"), ["有时候", "有时"]);
  assert.deepEqual(splitFlashcardForms(" yǒushíhou | yǒushí "), ["yǒushíhou", "yǒushí"]);
  const words = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const summary = flashcardSummary(words, { a: "known", b: "retry" });
  assert.equal(summary.known, 1);
  assert.equal(summary.markedForPractice, 1);
  assert.equal(summary.skipped, 1);
  assert.deepEqual(summary.retryWords.map((word) => word.id), ["b", "c"]);
});
