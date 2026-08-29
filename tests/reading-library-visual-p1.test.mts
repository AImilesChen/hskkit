import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../src/app/reading/page.tsx", import.meta.url), "utf8");
const experience = readFileSync(new URL("../src/app/components/reading-library-experience.tsx", import.meta.url), "utf8");
const library = JSON.parse(readFileSync(new URL("../src/lib/learning/reading-library.json", import.meta.url), "utf8"));

test("reading index uses one focused level experience instead of nine repeated level cards", () => {
  assert.match(page, /<ReadingLibraryExperience/);
  assert.doesNotMatch(page, /READING_LIBRARY_COUNTS\.byLevel\.map\(\(row\).*<article className="card flex flex-col"/s);
  assert.match(experience, /levels\.map/);
  assert.match(experience, /aria-pressed=\{selectedLevel === level\.level\}/);
  assert.match(experience, /grid-cols-3/);
  assert.match(experience, /Start 10 questions/);
  assert.match(experience, /Start 20 questions/);
});

test("reading hero and selected-level panel expose real product evidence", () => {
  for (const field of ["title", "passage", "prompt", "explanation"]) assert.match(experience, new RegExp(`example\\.${field}`));
  assert.match(experience, /Real practice preview/);
  assert.match(experience, /Example feedback/);
  assert.match(experience, /Open this passage/);
  assert.doesNotMatch(experience, /<Image|<img/);

  for (let level = 1; level <= 9; level += 1) {
    const passages = library.passages.filter((passage: { level: number }) => passage.level === level);
    assert.equal(passages.length, 10);
    assert.ok(passages.slice(0, 3).every((passage: { passage: string; questions: unknown[] }) => passage.passage.length > 0 && passage.questions.length === 3));
  }
});

test("reading index presents compact proof and demotes secondary learning tools", () => {
  assert.match(experience, /value: "90", label: "verified passages"/);
  assert.match(experience, /value: "270", label: "scored questions"/);
  assert.match(experience, /value: "9", label: "independent HSK levels"/);
  assert.match(experience, /value: "Immediate", label: "feedback & explanations"/);
  assert.match(page, /Your learning/);
  assert.ok(page.indexOf("<ReadingLibraryExperience") < page.indexOf("Your learning"));
  assert.match(experience, /aria-hidden="true"/);
  assert.match(experience, /focus-visible:/);
  assert.match(experience, /motion-reduce:/);
});

test("desktop and mobile visual contracts prevent crowded selectors and clipped proof text", () => {
  assert.match(experience, /grid grid-cols-3 gap-2/);
  assert.doesNotMatch(experience, /sm:grid-cols-9/);
  assert.match(experience, /min-w-0/);
  assert.match(experience, /break-normal/);
  assert.doesNotMatch(experience, /break-words/);
  assert.match(experience, /self-start/);
  assert.match(experience, /example\.options/);
  assert.match(page, /\[0, 10, 20\]/);
});
