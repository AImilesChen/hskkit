import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("public learning pages use shared incremental rendering without changing client learning state", () => {
  for (const path of [
    "../src/app/word/[slug]/page.tsx",
    "../src/app/word/[slug]/practice/page.tsx",
    "../src/app/character/[hanzi]/page.tsx",
    "../src/app/vocabulary/[level]/page.tsx",
    "../src/app/topics/page.tsx",
    "../src/app/topics/[slug]/page.tsx",
    "../src/app/topics/[slug]/practice/page.tsx",
  ]) {
    const source = read(path);
    assert.match(source, /revalidate\s*=\s*86_400/);
    assert.doesNotMatch(source, /force-dynamic/);
  }
  assert.match(read("../src/app/character/[hanzi]/page.tsx"), /generateStaticParams/);
  assert.match(read("../src/app/word/[slug]/practice/page.tsx"), /generateStaticParams/);
  assert.match(read("../src/app/components/today-word-completion.tsx"), /useSearchParams/);
  assert.match(read("../src/app/components/dictionary-word-actions.tsx"), /useEffect|fetch\(/);
});

test("catalog lookups avoid repeated whole-catalog scans and array copies", () => {
  const words = read("../src/lib/content/public-catalog-index.ts");
  const characters = read("../src/lib/dictionary/character-index.ts");
  assert.match(words, /wordsBySearchPinyin/);
  assert.match(words, /wordPositionWithinLevel/);
  assert.doesNotMatch(words, /\.set\([^\n]*\[\.\.\./);
  assert.match(characters, /charactersByRadical/);
  assert.match(characters, /charactersByPlainPinyin/);
});

test("OpenNext uses the existing R2 bucket for shared incremental cache", () => {
  assert.match(read("../open-next.config.ts"), /incrementalCache:\s*r2IncrementalCache/);
  const wrangler = read("../wrangler.jsonc");
  assert.match(wrangler, /"binding":\s*"NEXT_INC_CACHE_R2_BUCKET"/);
  assert.match(wrangler, /"NEXT_INC_CACHE_R2_PREFIX":\s*"system\/opennext-cache"/);
});
