import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  buildCatalogWordsCacheKey,
  buildDictionarySuggestionsCacheKey,
  PUBLIC_DICTIONARY_CACHE_CONTROL,
} from "../src/lib/content/catalog-edge-cache.ts";
import publicCatalog from "../src/lib/content/public-catalog-index.json" with { type: "json" };

const root = new URL("../", import.meta.url);
const read = (path: string) => fs.readFileSync(new URL(path, root), "utf8");

test("deterministic word searches use one canonical versioned cache key", () => {
  const first = buildCatalogWordsCacheKey(new URL("https://hskkit.com/api/v1/catalog/words?q=xue%20xi&level=1&page=1&pageSize=20&field=pinyin"));
  const reordered = buildCatalogWordsCacheKey(new URL("https://hskkit.com/api/v1/catalog/words?field=pinyin&pageSize=20&page=1&level=1&q=xue%20xi&ignored=value&standard=hsk3"));
  assert.equal(first, reordered);
  assert.match(first ?? "", new RegExp(`catalog=${publicCatalog.releaseId}%3A${publicCatalog.releaseVersion}`));
  assert.match(first ?? "", /page=1/);
  assert.match(first ?? "", /pageSize=20/);
  assert.match(first ?? "", /field=pinyin/);
});

test("cache keys preserve response-visible query values while canonicalizing omitted defaults", () => {
  const omitted = buildCatalogWordsCacheKey(new URL("https://hskkit.com/api/v1/catalog/words?q=learn"));
  const explicit = buildCatalogWordsCacheKey(new URL("https://hskkit.com/api/v1/catalog/words?standard=hsk3&q=learn&page=1&pageSize=50&field=all&audio=all&sort=catalog"));
  assert.equal(omitted, explicit);
  assert.notEqual(
    buildCatalogWordsCacheKey(new URL("https://hskkit.com/api/v1/catalog/words?q=Learn")),
    buildCatalogWordsCacheKey(new URL("https://hskkit.com/api/v1/catalog/words?q=learn")),
  );
});

test("flashcards, invalid standards and invalid queries never receive a public edge key", () => {
  assert.equal(buildCatalogWordsCacheKey(new URL("https://hskkit.com/api/v1/catalog/words?mode=flashcards&level=1&seed=1&pageSize=10")), null);
  assert.equal(buildCatalogWordsCacheKey(new URL("https://hskkit.com/api/v1/catalog/words?standard=hsk2")), null);
  assert.equal(buildCatalogWordsCacheKey(new URL("https://hskkit.com/api/v1/catalog/words?page=0")), null);
});

test("suggestion keys are versioned and canonical across parameter order", () => {
  const first = buildDictionarySuggestionsCacheKey(new URL("https://hskkit.com/api/v1/dictionary/suggestions?q=xue&level=1&pos=verb"));
  const second = buildDictionarySuggestionsCacheKey(new URL("https://hskkit.com/api/v1/dictionary/suggestions?pos=verb&level=1&q=xue&unused=1"));
  assert.equal(first, second);
  assert.match(first ?? "", new RegExp(`catalog=${publicCatalog.releaseId}%3A${publicCatalog.releaseVersion}`));
  assert.equal(buildDictionarySuggestionsCacheKey(new URL("https://hskkit.com/api/v1/dictionary/suggestions?q=xue&mode=flashcards&level=1&seed=1&pageSize=10")), null);
});

test("only successful deterministic GET routes use the explicit edge cache", () => {
  const wordsRoute = read("src/app/api/v1/catalog/words/route.ts");
  const suggestionsRoute = read("src/app/api/v1/dictionary/suggestions/route.ts");
  const handler = read("src/lib/content/catalog-route.ts");
  assert.match(wordsRoute, /buildCatalogWordsCacheKey/);
  assert.match(suggestionsRoute, /buildDictionarySuggestionsCacheKey/);
  assert.match(wordsRoute, /edgeCache\.match\(cacheKey\)/);
  assert.match(suggestionsRoute, /edgeCache\.match\(cacheKey\)/);
  assert.match(wordsRoute, /response\.ok/);
  assert.match(suggestionsRoute, /response\.ok/);
  assert.doesNotMatch(wordsRoute, /edgeCache\.match\(request\.url\)/);
  assert.match(handler, /params\.mode === "flashcards"[\s\S]*?"no-store"/);
  assert.equal(PUBLIC_DICTIONARY_CACHE_CONTROL, "public, max-age=30, s-maxage=120, stale-while-revalidate=300");
});
