import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

const page = read("src/app/word/[slug]/practice/page.tsx");
const client = read("src/app/word/[slug]/practice/word-practice-client.tsx");

test("word practice header does not reveal the answer before the exercise", () => {
  assert.doesNotMatch(page, /context\.current\.pinyin/);
  assert.doesNotMatch(page, /context\.current\.meaning/);
  assert.doesNotMatch(page, /bg-slate-950/);
  assert.doesNotMatch(page, /Each answer is saved to your learning history/);
  assert.match(page, /Complete a question to add it to Review\./);
});

test("word practice uses compact horizontal mode tabs above one focused question card", () => {
  assert.doesNotMatch(client, /lg:grid-cols-\[240px_minmax\(0,1fr\)\]/);
  assert.match(client, /role="tablist"/);
  assert.match(client, /grid-cols-3/);
  assert.match(client, /mx-auto[^\"]*max-w-3xl/);
  assert.match(client, /"Meaning"/);
  assert.match(client, /"Pinyin"/);
  assert.match(client, /"Listening"/);
});

test("word practice reveals the complete word only in submitted feedback", () => {
  assert.match(client, /feedback[^?]*\?/s);
  assert.match(client, /word\.hanzi.*word\.pinyin.*word\.meaning/s);
  assert.match(client, /Correct answer/);
  assert.match(client, /This attempt is now connected to Review\./);
  assert.match(client, /"Check answer"/);
});
