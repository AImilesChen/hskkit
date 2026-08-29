import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

function readOrBlank(url: URL) {
  return existsSync(url) ? readFileSync(url, "utf8") : "";
}

const page = readFileSync(new URL("../src/app/reading/page.tsx", import.meta.url), "utf8");
const pageStyles = readOrBlank(new URL("../src/app/reading/reading-page.module.css", import.meta.url));
const experience = readFileSync(new URL("../src/app/components/reading-library-experience.tsx", import.meta.url), "utf8");
const styles = readOrBlank(new URL("../src/app/components/reading-library-experience.module.css", import.meta.url));
const library = JSON.parse(readFileSync(new URL("../src/lib/learning/reading-library.json", import.meta.url), "utf8"));

test("reading index uses one focused level experience instead of nine repeated level cards", () => {
  assert.match(page, /<ReadingLibraryExperience/);
  assert.doesNotMatch(page, /READING_LIBRARY_COUNTS\.byLevel\.map\(\(row\).*<article className="card flex flex-col"/s);
  assert.match(experience, /levels\.map/);
  assert.match(experience, /aria-pressed=\{selectedLevel === level\.level\}/);
  assert.match(experience, /Start 10 questions/);
  assert.match(experience, /Start 20 questions/);
});

test("reading hero is a single focused introduction before the task workspace", () => {
  assert.match(experience, /aria-labelledby="reading-hero-title"/);
  assert.match(experience, /Start reading practice/);
  assert.match(experience, /See a sample question/);
  assert.match(experience, /className=\{styles\.hero\}/);
  assert.match(experience, /className=\{styles\.workspace\}/);
  assert.ok(experience.indexOf("styles.hero") < experience.indexOf("styles.workspace"));
  assert.doesNotMatch(experience, /lg:grid-cols-\[0\.9fr_1\.1fr\]/);
  assert.doesNotMatch(experience, /sm:p-9|className="[^"]*p-7/);
  assert.match(styles, /\.hero\s*\{[^}]*padding:\s*clamp\(28px,[^;]+32px\)/s);
  assert.match(styles, /\.heroTitle\s*\{[^}]*max-width:\s*840px[^}]*font-size:\s*clamp\(44px,[^;]+56px\)/s);
});

test("reading workspace separates session setup from authentic product proof", () => {
  assert.match(experience, /Build your reading session/);
  assert.match(experience, /Session setup/);
  assert.match(experience, /Real practice preview/);
  assert.match(experience, /Sample question · 1 of 10/);
  assert.match(experience, /example\.title/);
  assert.match(experience, /example\.passage/);
  assert.match(experience, /example\.prompt/);
  assert.match(experience, /example\.explanation/);
  assert.match(experience, /example\.options/);
  assert.match(styles, /\.workspaceGrid\s*\{[^}]*grid-template-columns:\s*minmax\(280px,[^)]+\)\s+minmax\(0,\s*1\.7fr\)/s);
  assert.match(styles, /\.setupPanel\s*\{[^}]*padding:\s*32px/s);
  assert.doesNotMatch(experience, /self-start/);
});

test("reading level choice, proof, and actions stay truthful", () => {
  assert.match(experience, /value: "90", label: "verified passages"/);
  assert.match(experience, /value: "270", label: "scored questions"/);
  assert.match(experience, /value: "9", label: "independent HSK levels"/);
  assert.match(experience, /value: "Immediate", label: "feedback & explanations"/);
  assert.match(experience, /active\.passages/);
  assert.match(experience, /active\.questions/);
  assert.match(experience, /href=\{`\/reading\/start\?level=\$\{active\.level\}&size=10`\}/);
  assert.match(experience, /href=\{`\/reading\/start\?level=\$\{active\.level\}&size=20`\}/);
  assert.doesNotMatch(experience, /href=\{`\/reading\/\$\{(?:example|item)\.slug\}`\}/);

  for (let level = 1; level <= 9; level += 1) {
    const passages = library.passages.filter((passage: { level: number }) => passage.level === level);
    assert.equal(passages.length, 10);
    assert.ok(passages.every((passage: { passage: string; questions: unknown[] }) => passage.passage.length > 0 && passage.questions.length === 3));
  }
});

test("reading page explains the real session loop and keeps examples compact", () => {
  assert.match(experience, /How a reading session works/);
  assert.match(experience, /Read a level-matched passage/);
  assert.match(experience, /Answer 10 or 20 questions/);
  assert.match(experience, /Review the answer and explanation/);
  assert.match(experience, /Inside HSK \{active\.level\}/);
  assert.match(experience, /Question types/);
  assert.match(experience, /active\.questionTypes/);
  assert.match(experience, /Start this HSK \{active\.level\} session/);
  assert.match(experience, /className=\{styles\.exampleRow\}/);
  assert.doesNotMatch(experience, /Preview passage/);
  assert.doesNotMatch(experience, /Open this passage/);
});

test("desktop and exact mobile contracts prevent spacing-token collisions and overflow", () => {
  assert.match(page, /className=\{pageStyles\.page\}/);
  assert.doesNotMatch(page, /className="learn step7-page"/);
  assert.match(pageStyles, /max-width:\s*1200px/);
  assert.match(pageStyles, /padding:\s*48px 20px 96px/);
  assert.match(styles, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(styles, /min-height:\s*44px/);
  assert.match(styles, /@media\s*\(max-width:\s*760px\)/);
  assert.match(styles, /\.workspaceGrid\s*\{\s*grid-template-columns:\s*1fr/s);
  assert.match(styles, /overflow-wrap:\s*normal/);
  assert.doesNotMatch(styles, /word-break:\s*break-all/);
  assert.match(experience, /aria-hidden="true"/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
});

test("secondary learning tools remain below the reading task", () => {
  assert.match(page, /Your learning/);
  assert.ok(page.indexOf("<ReadingLibraryExperience") < page.indexOf("Your learning"));
  assert.match(page, /Coverage boundary/);
  assert.match(page, /Published single-passage collection/);
});
