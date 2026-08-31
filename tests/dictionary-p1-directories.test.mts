import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  characterIndexMetadata,
  radicalDirectory,
  searchCharacterIndex,
  strokeDirectory,
} from "../src/lib/dictionary/character-index.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");
const structureSource = JSON.parse(read("content/sources/makemeahanzi-618dbab8-hsk-structures.json")) as {
  provenance: { commit: string; sourceSha256: string; license: string; licenseFile: string };
  characterCount: number;
  records: Array<{ hanzi: string; decomposition: string }>;
};

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

test("all 2,971 HSK characters expose traceable IDS source status without inventing missing data", () => {
  assert.match(characterIndexMetadata.source.structure.name, /Make Me a Hanzi/);
  assert.match(characterIndexMetadata.source.structure.license, /LGPL-3\.0/);
  assert.match(characterIndexMetadata.source.structure.commit, /^[0-9a-f]{40}$/);
  assert.match(characterIndexMetadata.source.structure.sourceSha256, /^[0-9a-f]{64}$/);
  assert.equal(characterIndexMetadata.structureDirectory.reduce((sum, item) => sum + item.characterCount, 0), 2_971);
  assert.ok(characterIndexMetadata.structureDirectory.every((item) => item.characterCount > 0));

  const all = searchCharacterIndex({ page: 1, pageSize: 2_971 });
  assert.equal(all.characters.length, 2_971);
  assert.ok(all.characters.every((item) => item.structure && item.decomposition && item.structureSourceId && item.decompositionStatus));
  assert.equal(all.characters.filter((item) => item.decompositionStatus === "unknown").length, 25);
  assert.ok(all.characters.filter((item) => item.decompositionStatus === "unknown").every((item) => item.structure === "unknown" && item.decomposition === "？"));
  assert.equal(all.characters.find((item) => item.hanzi === "学")?.structure, "top-bottom");
  assert.equal(all.characters.find((item) => item.hanzi === "明")?.structure, "left-right");
  assert.equal(all.characters.find((item) => item.hanzi === "国")?.structure, "enclosure");
  assert.equal(all.characters.find((item) => item.hanzi === "一")?.structure, "unknown");
});

test("character structure source coverage is frozen, licensed and publicly attributed", () => {
  assert.equal(structureSource.characterCount, 2_971);
  assert.equal(structureSource.records.length, 2_971);
  assert.ok(structureSource.records.every((item) => item.hanzi.length > 0 && item.decomposition.length > 0));
  assert.equal(structureSource.provenance.commit, "618dbab8a8ddefb958763c8b4afbaa741a4460de");
  assert.equal(structureSource.provenance.sourceSha256, "744bb05d5b0742e9ee35c37791f94d56a173349b3367569e7ca11e510364d203");
  assert.match(structureSource.provenance.license, /LGPL-3\.0/);
  assert.ok(fs.existsSync(path.join(root, structureSource.provenance.licenseFile)));
  const licensePage = read("src/app/content-license/page.tsx");
  assert.match(licensePage, /Make Me a Hanzi/);
  assert.match(licensePage, /LGPL 3\.0/);
  assert.match(licensePage, /618dbab8a8ddefb958763c8b4afbaa741a4460de/);
});

test("character structure is a validated count-preserving browse filter", () => {
  const structure = characterIndexMetadata.structureDirectory.find((item) => item.structure === "left-right");
  assert.ok(structure);
  const result = searchCharacterIndex({ structure: "left-right", page: 1, pageSize: 96 });
  assert.equal(result.pagination.total, structure?.characterCount);
  assert.ok(result.characters.every((item) => item.structure === "left-right"));
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
