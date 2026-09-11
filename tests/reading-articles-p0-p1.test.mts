import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("..", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

test("reading center separates complete articles from 10/20-question quick practice", () => {
  const page = read("src/app/reading/page.tsx");
  const experience = read("src/app/components/reading-library-experience.tsx");
  assert.match(page, /ReadingLibraryExperience/);
  assert.match(experience, />Articles</);
  assert.match(experience, />Quick Practice</);
  assert.match(experience, /complete graded articles/);
  assert.match(experience, /\/practice\?mode=reading&count=10/);
  assert.match(experience, /\/practice\?mode=reading&count=20/);
  assert.match(experience, /not full articles/);
});

test("article library has twenty independently addressed first-pass-reviewed articles for every HSK level", () => {
  const path = new URL("src/lib/learning/reading-articles.json", root);
  assert.equal(existsSync(path), true);
  const bank = JSON.parse(readFileSync(path, "utf8")) as { articles: Array<{ level: number; slug: string; title: string; wordCount: number; difficulty: string; paragraphs: string[]; pinyin: string[]; translation: string[]; vocabulary: Array<{hanzi:string}>; grammar: unknown[]; audioSrc: string; questions: Array<{evidence:string}>; reviewStatus: string }> };
  assert.equal(bank.articles.length, 180);
  assert.equal(new Set(bank.articles.map((article) => article.slug)).size, 180);
  for (let level = 1; level <= 9; level += 1) {
    const articles = bank.articles.filter((article) => article.level === level);
    assert.equal(articles.length, 20, `HSK ${level}`);
    assert.equal(new Set(articles.map((article) => article.title)).size, 20);
    assert.ok(articles.every((article) => article.pinyin.length === article.paragraphs.length));
    assert.ok(articles.every((article) => article.translation.length === article.paragraphs.length));
    assert.ok(articles.every((article) => article.wordCount > 0 && article.grammar.length > 0));
    assert.ok(articles.every((article) => article.vocabulary.every((word) => article.paragraphs.join("").includes(word.hanzi))));
    assert.ok(articles.every((article) => article.questions.length === 3 && article.questions.every((question) => article.paragraphs.join("").includes(question.evidence))));
    assert.ok(articles.every((article) => article.reviewStatus === "first-pass-reviewed"));
  }
});

test("canonical article and level routes are implemented", () => {
  const articlePage = read("src/app/reading/article/[slug]/page.tsx");
  const levelPage = read("src/app/reading/level/[level]/page.tsx");
  const legacyPage = read("src/app/reading/articles/[slug]/page.tsx");
  assert.match(articlePage, /ReadingArticleReader/);
  assert.match(articlePage, /generateStaticParams/);
  assert.match(levelPage, /ReadingLevelLibrary/);
  assert.match(levelPage, /generateStaticParams/);
  assert.match(legacyPage, /redirect\(`\/reading\/article\//);
});

test("article detail supports narration, pinyin, translation, vocabulary, grammar, trusted feedback and completion", () => {
  const reader = read("src/app/components/reading-article-reader.tsx");
  assert.match(reader, /Article narration/);
  assert.match(reader, /Pinyin/);
  assert.match(reader, /paragraph translations/);
  assert.match(reader, /Key vocabulary/);
  assert.match(reader, /Core grammar/);
  assert.match(reader, /Check answer/);
  assert.match(reader, /Evidence:/);
  assert.match(reader, /Mark article complete/);
  assert.match(reader, /Review vocabulary/);
  assert.match(reader, /Open mistakes/);
});

test("article answers use trusted server content and become reading review/mistake records", () => {
  const reader = read("src/app/components/reading-article-reader.tsx");
  const api = read("src/app/api/v1/learning/route.ts");
  assert.match(reader, /action:\s*"reading_article_attempt"/);
  assert.match(reader, /payload:\s*\{\s*idempotencyKey:\s*crypto\.randomUUID\(\),\s*articleSlug:/);
  assert.doesNotMatch(reader, /action:\s*"reading_article_attempt",\s*idempotencyKey:/);
  assert.match(api, /action === "reading_article_attempt"/);
  assert.match(api, /articleQuestion\(articleSlug, questionId\)/);
  assert.match(api, /contentId:\s*`reading-article:/);
  assert.match(api, /skillLabel:\s*"Reading · article"/);
  assert.match(api, /readingArticleProgress/);
  assert.match(api, /needsReview/);
});

test("guest progress persists locally, syncs to the account and merges on login", () => {
  const progress = read("src/lib/learning/reading-progress-client.ts");
  const library = read("src/app/components/reading-library-experience.tsx");
  const level = read("src/app/components/reading-level-library.tsx");
  assert.match(progress, /localStorage/);
  assert.match(progress, /mergeReadingProgress/);
  assert.match(progress, /data\.scope === "account"/);
  assert.match(progress, /reading_article_progress/);
  assert.match(progress, /payload:\s*\{\s*idempotencyKey:\s*crypto\.randomUUID\(\),\s*\.\.\.payload\s*\}/);
  assert.doesNotMatch(progress, /\{\s*action,\s*idempotencyKey:/);
  assert.match(library, /Continue/);
  assert.match(library, /Recommended next/);
  assert.match(level, /Continue article/);
});
