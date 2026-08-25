import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildCatalogQuery,
  parseCatalogSearchParams,
  toCatalogWordResponse,
  type CatalogSearchRow,
} from "../src/lib/content/catalog-search.ts";

const sampleRows: CatalogSearchRow[] = Array.from({ length: 51 }, (_, index) => ({
  id: `word-${index + 1}`,
  release_id: "hsk3-content-truth-v5",
  standard_version: "GF0025-2021",
  content_version: "2026.08.21-batch1",
  level_band: index < 25 ? "1" : "7-9",
  hanzi: index === 0 ? "你好" : `词${index + 1}`,
  traditional: index === 0 ? "你好" : `詞${index + 1}`,
  pinyin: index === 0 ? "nǐ hǎo" : `cí ${index + 1}`,
  meaning: index === 0 ? "hello" : `word ${index + 1}`,
  part_of_speech: index === 0 ? "V/N" : "N",
}));

test("catalog query defaults to page size 50 and rejects values above 100", () => {
  const defaults = parseCatalogSearchParams(new URL("https://hskkit.com/api/v1/catalog/words"));
  assert.deepEqual(defaults, { q: "", level: undefined, partOfSpeech: "", page: 1, pageSize: 50 });

  const capped = parseCatalogSearchParams(new URL("https://hskkit.com/api/v1/catalog/words?pageSize=100"));
  assert.equal(capped.pageSize, 100);
  assert.throws(
    () => parseCatalogSearchParams(new URL("https://hskkit.com/api/v1/catalog/words?pageSize=101")),
    /pageSize must be between 1 and 100/,
  );
});

test("catalog query supports keyword, unified level and part-of-speech filters without selecting all rows", () => {
  const params = parseCatalogSearchParams(new URL("https://hskkit.com/api/v1/catalog/words?q=ni%20hao&level=9&pos=N&page=2&pageSize=25"));
  const query = buildCatalogQuery(params, "hsk3-content-truth-v5");
  assert.match(query.sql, /LIMIT \? OFFSET \?/);
  assert.match(query.sql, /level_band = \?/);
  assert.match(query.sql, /search_text LIKE \?/);
  assert.match(query.sql, /part_of_speech/);
  assert.ok(!query.sql.includes("SELECT *"));
  assert.ok(query.bindings.includes("7-9"));
  assert.ok(query.bindings.includes(26));
  assert.ok(query.bindings.includes(25));
});

test("catalog response is paginated, compact and does not expose internal authorization fields", () => {
  const body = toCatalogWordResponse({
    rows: sampleRows.slice(0, 50),
    total: 51,
    releaseId: "hsk3-content-truth-v5",
    params: { q: "", level: undefined, partOfSpeech: "", page: 1, pageSize: 50 },
  });
  assert.equal(body.contentAssets.length, 50);
  assert.equal(body.pagination.total, 51);
  assert.equal(body.pagination.hasNext, true);
  assert.equal(body.pagination.totalPages, 2);
  const serialized = JSON.stringify(body);
  assert.doesNotMatch(serialized, /authorization|source_ref|license_ref|qa_status|publish_status/);
});

test("Dictionary request path loads a shell and fetches paged data instead of importing the full catalog", () => {
  const page = fs.readFileSync(new URL("../src/app/dictionary/page.tsx", import.meta.url), "utf8");
  const client = fs.readFileSync(new URL("../src/app/components/dictionary-search.tsx", import.meta.url), "utf8");
  const route = fs.readFileSync(new URL("../src/app/api/v1/catalog/words/route.ts", import.meta.url), "utf8");

  assert.doesNotMatch(page, /listPublishedWords|STUDY_CHARACTERS|content\/catalog/);
  assert.match(client, /\/api\/v1\/catalog\/words/);
  assert.match(client, /part of speech/i);
  assert.match(client, /Try again|Retry/i);
  assert.match(client, /Previous/);
  assert.match(client, /Next/);
  assert.doesNotMatch(route, /content\/catalog\.json|queryCatalog|repository\s*=/);
});

test("Vocabulary and word detail routes use the bounded runtime snapshot instead of the full catalog", () => {
  const vocabulary = fs.readFileSync(new URL("../src/app/vocabulary/[level]/page.tsx", import.meta.url), "utf8");
  const word = fs.readFileSync(new URL("../src/app/word/[slug]/page.tsx", import.meta.url), "utf8");
  const levelStatus = fs.readFileSync(new URL("../src/lib/content/level-status.ts", import.meta.url), "utf8");
  const dictionaryCatalog = fs.readFileSync(new URL("../src/lib/dictionary/catalog.ts", import.meta.url), "utf8");
  assert.match(vocabulary, /getHsk3LevelPreview/);
  assert.match(word, /getWordBySlug/);
  assert.match(levelStatus, /runtime-content-index\.json/);
  assert.match(dictionaryCatalog, /runtime-content-index\.json/);
  assert.doesNotMatch(levelStatus, /catalog\.json|published-content/);
  assert.doesNotMatch(dictionaryCatalog, /catalog\.json|published-content/);
  assert.doesNotMatch(vocabulary, /published-content|catalog-search|catalog\/words/);
  assert.doesNotMatch(word, /catalog-search|catalog\/words/);
});

test("core anonymous routes do not initialize the full content repository", () => {
  const paths = [
    "../src/app/page.tsx",
    "../src/app/login/page.tsx",
    "../src/app/account/page.tsx",
    "../src/app/layout.tsx",
    "../src/app/levels/page.tsx",
    "../src/app/dictionary/page.tsx",
  ];
  for (const path of paths) {
    const source = fs.readFileSync(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(source, /catalog\.json|published-content|repository\.ts/, path);
  }

  const fullSize = fs.statSync(new URL("../src/lib/content/catalog.json", import.meta.url)).size;
  const runtimeSize = fs.statSync(new URL("../src/lib/content/runtime-content-index.json", import.meta.url)).size;
  assert.ok(runtimeSize < fullSize * 0.05, `runtime index ${runtimeSize} must stay below 5% of catalog ${fullSize}`);
});

test("no request-time module imports the 11K authoring catalog", () => {
  const sourceRoot = new URL("../src/", import.meta.url);
  const pending = [fileURLToPath(sourceRoot)];
  const offenders: string[] = [];
  while (pending.length) {
    const directory = pending.pop()!;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) pending.push(fullPath);
      else if (/\.(?:ts|tsx)$/.test(entry.name) && /catalog\.json/.test(fs.readFileSync(fullPath, "utf8"))) offenders.push(fullPath);
    }
  }
  assert.deepEqual(offenders, []);
});
