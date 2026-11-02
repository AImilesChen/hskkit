import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const home = read("../src/app/page.tsx");
const nextStep = read("../src/app/components/home-next-step.tsx");
const styles = read("../src/app/homepage.css");
const vocabularyPage = read("../src/app/vocabulary/[level]/page.tsx");
const vocabularyCatalog = read("../src/app/vocabulary/[level]/vocabulary-catalog.tsx");

test("homepage gives guests a five-word preview and a free learning entry", () => {
  const demo = read("../src/app/components/home-quick-flashcards.tsx");
  assert.match(home, /Build your HSK vocabulary/);
  assert.match(nextStep, /Start learning free/);
  assert.match(nextStep, /href="\/start"/);
  assert.match(nextStep, /Start without an account/);
  assert.match(nextStep, /href="#quick-flashcards-demo"/);
  assert.match(demo, /No sign-up needed/);
  assert.match(demo, /answer for/);
  assert.match(demo, /Remembered/);
  assert.match(demo, /Practice again/);
  assert.match(demo, /Keep learning free/);
  assert.match(demo, /\/vocabulary\/1\?mode=flashcards#vocabulary-activities/);
  assert.doesNotMatch(demo, /fetch\(/, "the homepage demo must use server-supplied published words");
});

test("hero product preview is a motion-safe learning scene rather than an isolated word", () => {
  assert.match(home, /A word worth remembering/);
  assert.match(home, /HSK 1 · Example/);
  assert.doesNotMatch(home, /Live study preview|HSK 1 · Today|About 4 min/);
  assert.match(home, /Learn it. Use it. Remember it./);
  assert.match(home, /home-study-scene/);
  assert.match(home, /One word at a time/);
  assert.match(home, /Example flashcard/);
  assert.match(home, /Audio where available/);
  assert.match(styles, /@keyframes home-answer-in/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("vocabulary page gives flashcards a clear action area and supports deep linking", () => {
  assert.match(vocabularyPage, /Quick Flashcards/);
  assert.match(vocabularyPage, /A few words. A little progress\./);
  assert.match(vocabularyPage, /Start quick review/);
  assert.match(vocabularyPage, /No sign-in required/);
  assert.match(vocabularyCatalog, /Browse vocabulary/);
  assert.match(vocabularyCatalog, /searchParams\.get\("mode"\) === "flashcards"/);
});
