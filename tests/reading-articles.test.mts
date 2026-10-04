import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { READING_ARTICLES, chineseCharacterCount } from "../src/lib/learning/reading-articles.ts";
import { publishableReadingTranslation } from "../src/lib/learning/reading-translation.ts";

test("complete reading collection covers nine distinct levels with increasing sustained-text depth", () => {
  assert.deepEqual(READING_ARTICLES.map((article) => article.level), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(new Set(READING_ARTICLES.map((article) => article.slug)).size, 9);
  assert.equal(new Set(READING_ARTICLES.map((article) => article.topic)).size, 9);
  const minimumCharacters = [70, 110, 160, 220, 280, 350, 400, 450, 550];
  READING_ARTICLES.forEach((article, index) => {
    assert.ok(chineseCharacterCount(article.paragraphs) >= minimumCharacters[index], `HSK ${article.level} has enough text for sustained reading`);
    assert.ok(article.paragraphs.length >= 2);
    assert.ok(article.englishSummary.length > 40 && !/\p{Script=Han}/u.test(article.englishSummary));
    assert.equal(article.questions.length, 3);
    article.questions.forEach((question) => {
      assert.equal(new Set(question.options).size, 3);
      assert.ok(question.options[question.answer]);
      assert.ok(question.explanation.length >= 8);
    });
  });
});

test("unfinished mixed-language translations are suppressed in legacy short drills", () => {
  const bank = JSON.parse(readFileSync(new URL("../src/lib/learning/reading-library.json", import.meta.url), "utf8")) as { passages: { translation: string }[] };
  assert.equal(bank.passages.length, 180);
  assert.ok(bank.passages.every((passage) => publishableReadingTranslation(passage.translation) === null));
  assert.equal(publishableReadingTranslation("The reader visits the library."), "The reader visits the library.");
  const sessionPage = readFileSync(new URL("../src/app/reading/session/[slug]/page.tsx", import.meta.url), "utf8");
  const exercise = readFileSync(new URL("../src/app/components/step7-exercise.tsx", import.meta.url), "utf8");
  assert.match(sessionPage, /publishableReadingTranslation\(lesson\.translation\)/);
  assert.doesNotMatch(exercise, /<AudioPlaybackControl asset=\{undefined\}/);
});
