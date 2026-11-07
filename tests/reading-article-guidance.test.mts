import assert from 'node:assert/strict';
import test from 'node:test';
import { READING_ARTICLES } from '../src/lib/learning/reading-articles.ts';
import { findReadingEvidence, paragraphAnchor, readingGuidance, readingWordSegments } from '../src/lib/learning/reading-article-guidance.ts';

test('every published article has guidance grounded in its own unchanged source', () => {
  for (const article of READING_ARTICLES) {
    const original = structuredClone(article);
    const guide = readingGuidance(article);
    assert.ok(guide.goal.length > 30, article.slug);
    assert.equal(guide.patterns.length, 2);
    assert.equal(guide.questions.length, article.questions.length);
    for (const item of [...guide.words,...guide.patterns]) {
      assert.ok(article.paragraphs[item.example.paragraph].includes(item.example.quote),article.slug);
    }
    guide.questions.forEach((question,index) => {
      assert.ok(article.paragraphs[question.evidence.paragraph].includes(question.evidence.quote),`${article.slug} question ${index+1}`);
      assert.deepEqual(question.options,article.questions[index].options);
      assert.equal(question.answer,article.questions[index].answer);
      assert.equal(paragraphAnchor(question.evidence.paragraph),`reading-paragraph-${question.evidence.paragraph+1}`);
    });
    assert.equal(new Set(guide.words.map(word=>word.word)).size,guide.words.length);
    assert.deepEqual(article,original,'adding teaching guidance must not rewrite the story or answers');
  }
});

test('word help preserves text, repeats and longest overlapping word matches', () => {
  const words=[{word:'水果',pinyin:'shuǐguǒ',meaning:'fruit'},{word:'果',pinyin:'guǒ',meaning:'fruit'}];
  const text='买水果，洗水果。🍎';
  const segments=readingWordSegments(text,words);
  assert.equal(segments.map(segment=>segment.text).join(''),text);
  assert.deepEqual(segments.filter(segment=>segment.word).map(segment=>segment.text),['水果','水果']);
  assert.deepEqual(readingWordSegments('没有匹配。',words),[{text:'没有匹配。'}]);
  assert.deepEqual(readingWordSegments('',words),[]);
});

test('missing source phrases fail explicitly instead of linking unrelated evidence', () => {
  assert.throws(()=>findReadingEvidence(READING_ARTICLES[0],'一段不存在的原文'),/Missing reading source/);
});

test('the shopping-time answer cites both the day and the time of day', () => {
  const evidence=readingGuidance(READING_ARTICLES[0]).questions[0].evidence;
  assert.ok(evidence.quote.includes('星期六') && evidence.quote.includes('早上'));
  assert.equal(evidence.paragraph,0);
});
