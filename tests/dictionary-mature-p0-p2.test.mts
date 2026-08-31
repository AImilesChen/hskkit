import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

test("the published HSK character index is complete, licensed and reproducible", async () => {
  const source = JSON.parse(read("content/sources/unihan-17.0-hsk-characters.json"));
  const index = JSON.parse(read("src/lib/dictionary/character-index.json"));
  assert.equal(source.provenance.unicodeVersion, "17.0.0");
  assert.equal(source.provenance.license, "Unicode License v3");
  assert.equal(source.provenance.archiveSha256, "f7a48b2b545acfaa77b2d607ae28747404ce02baefee16396c5d2d7a8ef34b5e");
  assert.equal(index.releaseId, "hsk3-content-truth-v5");
  assert.equal(index.characters.length, 2971);
  assert.ok(index.characters.every((item: Record<string, unknown>) => item.hanzi && item.radical && item.strokes && Array.isArray(item.pinyin) && item.pinyin.length));
  assert.equal(new Set(index.characters.map((item: { hanzi: string }) => item.hanzi)).size, 2971);
  const study = index.characters.find((item: { hanzi: string }) => item.hanzi === "学");
  assert.equal(study.radical, "子");
  assert.equal(study.strokes, 8);
  assert.ok(study.pinyin.includes("xué"));
  assert.ok(study.levels.includes(1));
});

test("character browse exposes real radical, stroke, HSK and pinyin directories", async () => {
  const system = await import("../src/lib/dictionary/character-index.ts");
  assert.ok(system.characterIndexFacets.radicals.length >= 180);
  assert.ok(system.characterIndexFacets.strokes.length >= 20);
  assert.ok(system.characterIndexFacets.initials.includes("x"));
  assert.ok(system.characterIndexFacets.finals.includes("ue"));
  assert.ok(system.characterIndexFacets.tones.includes(2));
  const result = system.searchCharacterIndex({ radical: "子", strokes: 8, initial: "x", final: "ue", tone: 2, level: 1, page: 1, pageSize: 48 });
  assert.ok(result.characters.some((item: { hanzi: string }) => item.hanzi === "学"));
  assert.ok(result.pagination.total >= 1);
  const numericTone = system.searchCharacterIndex({ q: "xue2", page: 1, pageSize: 48 });
  assert.ok(numericTone.characters.some((item: { hanzi: string }) => item.hanzi === "学"));
  assert.equal(system.getIndexedCharacter("不存在"), undefined);
});

test("character endpoint validates bounded URL state and serves paginated results", () => {
  const route = read("src/app/api/v1/dictionary/characters/route.ts");
  const system = read("src/lib/dictionary/character-index.ts");
  assert.match(route, /parseCharacterSearchParams/);
  assert.match(route, /searchCharacterIndex/);
  assert.match(system, /pageSize must be between 1 and 96/);
  assert.match(system, /level must be between 1 and 9/);
  assert.match(system, /radical/);
  assert.match(system, /strokes/);
  assert.match(system, /initial/);
  assert.match(system, /final/);
  assert.match(system, /tone/);
});

test("dictionary uses explicit Words, Characters and Pinyin task modes", () => {
  const page = read("src/app/dictionary/page.tsx");
  const client = read("src/app/components/dictionary-search.tsx");
  assert.match(page, /2,971 HSK characters/);
  assert.match(client, /words: \{ label: "Words"/);
  assert.match(client, /characters: \{ label: "Characters"/);
  assert.match(client, /pinyin: \{ label: "Pinyin"/);
  assert.match(client, /mode/);
  assert.match(client, /\/api\/v1\/dictionary\/characters/);
  assert.match(client, /Browse by radical/);
  assert.match(client, /Browse by stroke count/);
  assert.match(client, /Browse by pinyin/);
});

test("word results use one honest whole-row link and no duplicate quick preview", () => {
  const client = read("src/app/components/dictionary-search.tsx");
  assert.match(client, /data-dictionary-word-link/);
  assert.match(client, /focus-visible:ring/);
  assert.match(client, /active:bg-blue-50/);
  assert.doesNotMatch(client, /Quick preview/);
  assert.doesNotMatch(client, /previewId/);
  assert.doesNotMatch(client, /aria-pressed=\{previewId/);
});

test("dense character results explain strokes, radicals and the unified advanced band", () => {
  const client = read("src/app/components/dictionary-search.tsx");
  assert.match(client, /data-dictionary-character-link/);
  assert.match(client, /\{item\.strokes\} \{item\.strokes === 1 \? "stroke" : "strokes"\}/);
  assert.match(client, /Radical: 「\{item\.radical\}」/);
  assert.match(client, /value: "7".*label: "HSK 7–9"/s);
  assert.doesNotMatch(client, /Array\.from\(\{ length: 9 \}/);
  assert.doesNotMatch(client, /min-h-(?:8|10)/, "project spacing tokens make min-h-8/min-h-10 oversized; use explicit pixel control heights");
  assert.match(client, /sm:sr-only/);
  assert.match(client, /lg:grid-cols-4 xl:grid-cols-5/);
});

test("mobile dictionary keeps the primary task and browse controls dense", () => {
  const page = read("src/app/dictionary/page.tsx");
  const client = read("src/app/components/dictionary-search.tsx");
  assert.match(page, /px-4 py-5/);
  assert.match(page, /mb-4.*pb-4/s);
  assert.match(client, /action: "Search words"/);
  assert.match(client, /action: "Search characters"/);
  assert.match(client, /action: "Search pinyin"/);
  assert.match(client, /modeCopy\[applied\.mode\]\.action/);
  assert.match(client, /flex gap-2 sm:flex-row/);
  assert.match(client, /grid grid-cols-2 gap-3/);
});

test("character details resolve every indexed character and real containing words", () => {
  const page = read("src/app/character/[hanzi]/page.tsx");
  const runtime = read("src/lib/dictionary/runtime-character.ts");
  const catalog = read("src/lib/content/catalog-search.ts");
  assert.match(page, /getPublishedCharacterByHanzi/);
  assert.match(page, /wordsContainingCharacter/);
  assert.match(page, /Same radical/);
  assert.match(page, /Same pinyin/);
  assert.match(page, /Traditional/);
  assert.match(page, /<h1 className="text-7xl font-bold leading-none text-white md:text-8xl">/);
  assert.match(page, /min-h-\[200px\].*md:min-h-\[360px\]/);
  assert.match(page, /min-h-11 items-center rounded-full/);
  assert.doesNotMatch(page, /min-h-64/);
  assert.doesNotMatch(page, /Stroke order/);
  assert.match(runtime, /getIndexedCharacter/);
  assert.match(catalog, /findActiveCatalogWordsContainingCharacter/);
  assert.match(catalog, /instr\(i\.hanzi, \?\) > 0/);
});

test("word details prioritise definitions, learning actions and indexed character breakdown", () => {
  const page = read("src/app/word/[slug]/page.tsx");
  const toggle = read("src/app/components/word-script-toggle.tsx");
  const actions = read("src/app/components/dictionary-word-actions.tsx");
  const runtime = read("src/lib/dictionary/runtime-word.ts");
  assert.match(page, /Definitions/);
  assert.match(page, /DictionaryWordActions/);
  assert.match(page, /Character breakdown/);
  assert.match(page, /getIndexedCharacter/);
  assert.match(page, /partOfSpeechLabel/);
  assert.match(page, /V: "Verb"/);
  assert.match(page, /grid gap-4 p-4/);
  assert.match(toggle, /min-h-11/);
  assert.match(toggle, /my-2.*text-6xl/);
  assert.ok(toggle.indexOf("<h1") < toggle.indexOf('role="group"'), "word form must precede the script controls");
  assert.match(actions, /grid grid-cols-3/);
  assert.match(actions, /hidden text-sm.*sm:block/);
  assert.match(actions, /min-h-\[20px\]/);
  assert.doesNotMatch(actions, /min-h-5/);
  assert.match(page, /xl:grid-cols-3/);
  assert.match(runtime, /splitDictionaryMeanings/);
  assert.doesNotMatch(page, /releaseStatus|qaStatus|sourceVersion/);
});

test("character rebuild is wired into prebuild and fails on catalog drift", () => {
  const pkg = JSON.parse(read("package.json"));
  const script = read("scripts/content/build-character-index.py");
  assert.match(pkg.scripts.prebuild, /build-character-index\.py/);
  assert.match(script, /Unapproved HSK character count drift/);
  assert.match(script, /2971/);
});
