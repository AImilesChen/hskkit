import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

test("catalog overload migration adds targeted indexes and a maintained character lookup", () => {
  const migration = read("migrations/0037_catalog_d1_overload_hardening.sql");
  assert.match(migration, /CREATE INDEX IF NOT EXISTS idx_catalog_search_release_level_id/);
  assert.match(migration, /CREATE INDEX IF NOT EXISTS idx_catalog_search_release_pinyin_sort/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS catalog_character_words/);
  assert.match(migration, /CREATE TRIGGER catalog_character_words_after_insert/);
  assert.match(migration, /CREATE TRIGGER catalog_character_words_after_delete/);
});

test("catalog suggestions use bounded indexed candidates instead of scanning every catalog row", () => {
  const source = read("src/lib/content/catalog-search.ts");
  const migration = read("migrations/0038_catalog_suggestion_indexes.sql");
  assert.match(source, /catalog_character_words cw INDEXED BY idx_catalog_character_words_release_character_sort/);
  assert.match(source, /cw\.character = \?/);
  assert.match(source, /\["search_pinyin", "idx_catalog_search_release_pinyin_sort"\]/);
  assert.match(source, /\["search_english", "idx_catalog_search_release_english_sort"\]/);
  assert.match(source, /INDEXED BY \$\{index\}/);
  assert.doesNotMatch(source, /const broadMatch = `%\$\{escapedLike\(firstCharacter\)\}%`/);
  assert.match(migration, /idx_catalog_search_release_english_sort/);
  assert.match(migration, /idx_catalog_search_release_hanzi_sort/);
});

test("hot catalog lookups use release-scoped indexes and never scan hanzi with instr", () => {
  const source = read("src/lib/content/catalog-search.ts");
  assert.doesNotMatch(source, /instr\(i\.hanzi/);
  assert.match(source, /catalog_character_words cw/);
  assert.match(source, /i\.release_id = \(SELECT id FROM catalog_search_releases WHERE active = 1/);
  assert.doesNotMatch(source, /WHERE r\.active = 1 AND i\.id IN[\s\S]{0,160}ORDER BY i\.sort_level/);
  assert.doesNotMatch(source, /WHERE i\.release_id = \? AND i\.id IN[\s\S]{0,160}ORDER BY i\.sort_level/);
});

test("current housekeeping Top SQL has partial indexes for expiry and cleanup scans", () => {
  const migration = read("migrations/0040_current_top_sql_indexes.sql");
  assert.match(migration, /idx_commercial_export_jobs_expiry_cleanup[\s\S]*ON commercial_export_jobs\(expires_at\)[\s\S]*WHERE state IN \('queued','generating','ready','failed'\)/);
  assert.match(migration, /idx_commercial_export_jobs_object_cleanup[\s\S]*ON commercial_export_jobs\(updated_at\)[\s\S]*WHERE state IN \('expired','revoked'\) AND object_key IS NOT NULL/);
  assert.match(migration, /idx_digital_product_entitlements_active_expiry[\s\S]*ON digital_product_entitlements\(expires_at\)[\s\S]*WHERE status='active'/);
  assert.match(migration, /idx_pack_purchases_active_expiry[\s\S]*ON pack_purchases\(expires_at\)[\s\S]*WHERE status='active'/);
});

test("catalog retry is bounded to explicit D1 overload errors", async () => {
  const { withCatalogD1ReadRetry } = await import("../src/lib/content/catalog-retry.ts");
  let attempts = 0;
  const result = await withCatalogD1ReadRetry(async () => {
    attempts += 1;
    if (attempts < 3) throw new Error("D1_ERROR: 7429 Requests queued for too long");
    return "ok";
  }, { sleep: async () => undefined, random: () => 0 });
  assert.equal(result, "ok");
  assert.equal(attempts, 3);

  attempts = 0;
  await assert.rejects(() => withCatalogD1ReadRetry(async () => {
    attempts += 1;
    throw new Error("no such table: catalog_search_index");
  }, { sleep: async () => undefined, random: () => 0 }), /no such table/);
  assert.equal(attempts, 1);
});

test("catalog database wrapper also retries resolved D1 overload results", async () => {
  const { withCatalogD1ReadRetries } = await import("../src/lib/content/catalog-retry.ts");
  let attempts = 0;
  const db = {
    prepare() {
      const statement = {
        bind() { return statement; },
        async first<T>() { return null as T | null; },
        async all<T>() {
          attempts += 1;
          if (attempts < 3) return { success: false, results: [] as T[], error: "D1_ERROR: 7429: Requests queued for too long" };
          return { success: true, results: [{ id: "ready" }] as T[] };
        },
      };
      return statement;
    },
  };
  const result = await withCatalogD1ReadRetries(db).prepare("SELECT 1").all<{ id: string }>();
  assert.equal(attempts, 3);
  assert.equal(result.results[0]?.id, "ready");
});

test("dictionary filter failures cannot render data from the previous filter", () => {
  const source = read("src/app/components/dictionary-search.tsx");
  assert.match(source, /if \(!keepInitialVisible\) setWords\(null\)/);
  assert.match(source, /if \(signal\.aborted\) return/);
  assert.match(source, /setCharacters\(null\)/);
  assert.match(source, /error \? <StatePanel[\s\S]*: null/);
});

test("catalog GET responses use a canonical versioned Cloudflare edge key while flashcards stay private", () => {
  const route = read("src/app/api/v1/catalog/words/route.ts");
  assert.match(route, /buildCatalogWordsCacheKey/);
  assert.match(route, /edgeCache\.match\(cacheKey\)/);
  assert.match(route, /edgeCache\.put\(cacheKey, response\.clone\(\)\)/);
  assert.match(route, /cacheKey \?/);
  assert.doesNotMatch(route, /edgeCache\.match\(request\.url\)/);
});

test("session activity writes are throttled without changing authentication", () => {
  const source = read("src/lib/account/storage.ts");
  assert.match(source, /SESSION_TOUCH_INTERVAL_MS = 15 \* 60_000/);
  assert.match(source, /UPDATE account_sessions SET last_used_at=\? WHERE token_hash=\? AND \(last_used_at IS NULL OR last_used_at < \?\)/);
  assert.match(source, /UPDATE account_tokens SET last_used_at=\? WHERE token_hash=\? AND \(last_used_at IS NULL OR last_used_at < \?\)/);
});
