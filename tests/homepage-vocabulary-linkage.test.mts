import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const home = read("../src/app/page.tsx");
const nextStep = read("../src/app/components/home-next-step.tsx");
const styles = read("../src/app/homepage.css");
const vocabularyPage = read("../src/app/vocabulary/[level]/page.tsx");
const vocabularyCatalog = read("../src/app/vocabulary/[level]/vocabulary-catalog.tsx");

test("homepage links the hero to a real five-card guest demo and full flashcards", () => {
  const demo = read("../src/app/components/home-quick-flashcards.tsx");
  assert.match(nextStep, /Try quick flashcards/);
  assert.match(nextStep, /href="#quick-flashcards-demo"/);
  assert.match(demo, /id="quick-flashcards-demo"/);
  assert.match(home, /<HomeQuickFlashcards/);
  assert.match(demo, /Try five real HSK 1 flashcards now\./);
  assert.match(demo, /Show answer/);
  assert.match(demo, /Next card/);
  assert.match(demo, /\/vocabulary\/1\?mode=flashcards#vocabulary-activities/);
  assert.doesNotMatch(demo, /fetch\(/, "the homepage demo must use server-supplied published words");
});

test("hero product preview is a motion-safe learning scene rather than an isolated word", () => {
  assert.match(home, /Study flow preview/);
  assert.match(home, /HSK 1 · Example/);
  assert.doesNotMatch(home, /Live study preview|HSK 1 · Today|About 4 min/);
  assert.match(home, /A complete learning moment/);
  assert.match(home, /home-study-scene/);
  assert.match(home, /Recognize the word/);
  assert.match(home, /Learn in context/);
  assert.match(home, /Approved audio when available/);
  assert.match(styles, /@keyframes home-study-float/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("vocabulary page gives flashcards a clear action area and supports deep linking", () => {
  assert.match(vocabularyPage, /searchParams\?: Promise<\{ mode\?: string \}>/);
  assert.match(vocabularyPage, /initialMode=\{initialMode\}/);
  assert.match(vocabularyPage, /Quick Flashcards/);
  assert.match(vocabularyPage, /Turn this level into a short review\./);
  assert.match(vocabularyPage, /Start quick review/);
  assert.match(vocabularyPage, /No sign-in required/);
  assert.match(vocabularyCatalog, /Browse vocabulary/);
  assert.match(vocabularyCatalog, /initialMode = "browse"/);
});
