import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

function readOrBlank(url: URL) { return existsSync(url) ? readFileSync(url, "utf8") : ""; }
const page = readFileSync(new URL("../src/app/reading/page.tsx", import.meta.url), "utf8");
const pageStyles = readOrBlank(new URL("../src/app/reading/reading-page.module.css", import.meta.url));
const experience = readFileSync(new URL("../src/app/components/reading-library-experience.tsx", import.meta.url), "utf8");
const levelLibrary = readFileSync(new URL("../src/app/components/reading-level-library.tsx", import.meta.url), "utf8");
const styles = readOrBlank(new URL("../src/app/components/reading-library-experience.module.css", import.meta.url));
const reader = readFileSync(new URL("../src/app/components/reading-article-reader.tsx", import.meta.url), "utf8");
const library = JSON.parse(readFileSync(new URL("../src/lib/learning/reading-library.json", import.meta.url), "utf8"));
const articles = JSON.parse(readFileSync(new URL("../src/lib/learning/reading-articles.json", import.meta.url), "utf8"));

test("reading index presents two explicit modes before level choices", () => {
  assert.match(page, /<ReadingLibraryExperience/);
  assert.match(experience, /aria-label="Choose a reading mode"/);
  assert.match(experience, />Articles</);
  assert.match(experience, />Quick Practice</);
  assert.match(experience, /Array\.from\(\{ length: 9 \}/);
  assert.match(experience, /20 articles per level/);
});

test("level directory has the required list metadata, progress and filters", () => {
  assert.match(levelLibrary, /Topic/);
  assert.match(levelLibrary, /Reading time/);
  assert.match(levelLibrary, /Progress/);
  assert.match(levelLibrary, /Audio/);
  assert.match(levelLibrary, /Order/);
  assert.match(levelLibrary, /wordCount/);
  assert.match(levelLibrary, /3 questions/);
  assert.match(levelLibrary, /Continue article/);
  assert.match(levelLibrary, /Clear filters/);
});

test("article reader exposes the approved reading hierarchy and learning-loop destinations", () => {
  assert.match(reader, /<audio[^>]*preload="metadata"/);
  assert.match(reader, /Pinyin/);
  assert.match(reader, /paragraph translations/);
  assert.match(reader, /Tap a word for meaning and Review/);
  assert.match(reader, /Core grammar/);
  assert.match(reader, /Check answer/);
  assert.match(reader, /Article summary/);
  assert.match(reader, /reading_article_attempt/);
  assert.match(reader, /href="\/review"/);
  assert.match(reader, /href="\/mistakes"/);
});

test("quick practice retains the original short-passage bank and explicit 10/20 starts", () => {
  assert.match(experience, /two-to-three-sentence materials/);
  assert.match(experience, /count=10/);
  assert.match(experience, /count=20/);
  for (let level = 1; level <= 9; level += 1) {
    const passages = library.passages.filter((passage: {level:number}) => passage.level === level);
    assert.equal(passages.length, level <= 6 ? 24 : 12);
  }
});

test("article bank and responsive UI satisfy the P0/P1 structural scale", () => {
  assert.equal(articles.articles.length, 180);
  for (let level = 1; level <= 9; level += 1) assert.equal(articles.articles.filter((article: {level:number}) => article.level === level).length, 20);
  assert.match(page, /className=\{pageStyles\.page\}/);
  assert.match(pageStyles, /max-width:\s*1200px/);
  assert.match(styles, /min-height:\s*44px/);
  assert.match(styles, /@media\(max-width:760px\)/);
  assert.match(styles, /@media\(max-width:420px\)/);
  assert.doesNotMatch(styles, /word-break:\s*break-all/);
});

test("secondary learning tools remain below the reading task", () => {
  assert.match(page, /Your learning/);
  assert.ok(page.indexOf("<ReadingLibraryExperience") < page.indexOf("Your learning"));
  assert.match(page, /Coverage boundary/);
});
