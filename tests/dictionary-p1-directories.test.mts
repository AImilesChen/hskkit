import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  characterIndexMetadata,
  radicalDirectory,
  strokeDirectory,
} from "../src/lib/dictionary/character-index.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

test("dictionary UI exposes four primary browse modes and complete character directories", () => {
  const client = read("src/app/components/dictionary-search.tsx");
  assert.match(client, /type DictionaryMode = "words" \| "levels" \| "characters" \| "pinyin"/);
  assert.match(client, /levels: \{ label: "HSK levels"/);
  assert.match(client, /grid-cols-4/);
  assert.match(client, /Browse by radical/);
  assert.match(client, /Browse by stroke count/);
  assert.match(client, /Initial/);
  assert.match(client, /Final/);
  assert.match(client, /Tone/);
});

test("the radical directory exposes all 214 Kangxi radicals with learner metadata, provenance and honest HSK counts", () => {
  assert.equal(characterIndexMetadata.characterCount, 2_971);
  assert.match(characterIndexMetadata.source.radicalDirectory.characterNames, /UCD \d+\.\d+\.\d+/);
  assert.match(characterIndexMetadata.source.radicalDirectory.strokeGrouping, /Kangxi Radicals chart/);
  assert.equal(radicalDirectory.length, 214);
  assert.deepEqual(radicalDirectory.map((item) => item.number), Array.from({ length: 214 }, (_, index) => index + 1));
  const child = radicalDirectory.find((item) => item.number === 39);
  assert.deepEqual(child, {
    number: 39,
    radical: "子",
    name: "child",
    strokes: 3,
    characterCount: child?.characterCount,
  });
  assert.ok((child?.characterCount ?? 0) > 0);
  assert.equal(radicalDirectory.reduce((sum, item) => sum + item.characterCount, 0), characterIndexMetadata.characterCount);
});

test("the stroke directory is complete for the frozen 2,971-character index", () => {
  assert.equal(strokeDirectory[0]?.strokes, 1);
  assert.equal(strokeDirectory.at(-1)?.strokes, 23);
  assert.equal(strokeDirectory.reduce((sum, item) => sum + item.characterCount, 0), characterIndexMetadata.characterCount);
  assert.ok(strokeDirectory.every((item) => item.characterCount > 0));
});

test("radical and stroke directories are first-class routes with count-preserving links", () => {
  const radicalPage = read("src/app/dictionary/radicals/page.tsx");
  const strokePage = read("src/app/dictionary/strokes/page.tsx");
  const dictionaryPage = read("src/app/dictionary/page.tsx");
  assert.match(radicalPage, /214 Kangxi radicals/);
  assert.match(radicalPage, /radicalDirectory/);
  assert.match(radicalPage, /characterCount/);
  assert.match(radicalPage, /mode=characters&radical=/);
  assert.match(strokePage, /strokeDirectory/);
  assert.match(strokePage, /characterCount/);
  assert.match(strokePage, /mode=characters&strokes=/);
  assert.match(dictionaryPage, /\/dictionary\/radicals/);
  assert.match(dictionaryPage, /\/dictionary\/strokes/);
});
