import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { pinyinDisplaySegments } from "../src/lib/dictionary/pinyin-display.ts";

test("tone colour follows each syllable, including concatenated and neutral syllables", () => {
  for (const [text, expected] of [
    ["bāngzhù", [["bāng", 1], ["zhù", 4]]],
    ["xièxie", [["xiè", 4], ["xie", 0]]],
    ["xǐshǒujiān", [["xǐ", 3], ["shǒu", 3], ["jiān", 1]]],
    ["Běijīng", [["Běi", 3], ["jīng", 1]]],
    ["nǚ", [["nǚ", 3]]],
    ["nǎr", [["nǎr", 3]]],
  ] as const) {
    assert.deepEqual(pinyinDisplaySegments(text).map(({ text, tone }) => [text, tone]), expected, text);
  }
});

test("punctuation, whitespace, capital letters and Unicode tone marks stay intact", () => {
  for (const value of ["Wǒ ài wǒ de jiā.", "Xièxie nǐ de bāngzhù!", "nǚ'ér", "gèháng-gèyè", "Nǐ  hǎo！", "lu\u0308\u0300"]) {
    assert.equal(pinyinDisplaySegments(value).map((item) => item.text).join(""), value.normalize("NFC"));
  }
});

test("ambiguous spelling and non-pinyin text remain readable without guessed tones", () => {
  assert.deepEqual(pinyinDisplaySegments("xíngàn"), [{ text: "xíngàn", tone: null }]);
  assert.deepEqual(pinyinDisplaySegments("HSK"), [{ text: "HSK", tone: null }]);
  assert.deepEqual(pinyinDisplaySegments(""), []);
});

test("all published word pinyin can be rendered without dropping or rewriting text", () => {
  const catalog = JSON.parse(readFileSync(new URL("../src/lib/content/public-catalog-index.json", import.meta.url), "utf8")) as { words: string[][] };
  for (const word of catalog.words) {
    assert.equal(pinyinDisplaySegments(word[6]).map((item) => item.text).join(""), word[6].normalize("NFC"), word[0]);
  }
});
