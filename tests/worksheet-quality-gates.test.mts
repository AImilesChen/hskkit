import assert from 'node:assert/strict';
import test from 'node:test';
import {selectPackAssets} from '../src/lib/commercial/catalog.ts';
import {buildWorksheetLevel} from '../src/lib/commercial/worksheet-pack.ts';

for (const level of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
  test(`Level ${level} tasks use distinct answerable operations and do not leak keyed answers`, () => {
    const plan = buildWorksheetLevel(selectPackAssets(level));
    const questions = plan.modules.flatMap(module => module.questions);
    assert.ok(questions.length >= 10);
    assert.equal(new Set(questions.map(q => q.id)).size, questions.length);
    for (const q of questions) {
      assert.ok(q.answer.length > 0 && q.explanation.length > 0, q.id);
      assert.ok(q.prompt.length > 20 && q.responseLines >= 1, q.id);
      assert.doesNotMatch(q.prompt, /means [“"].*?[”"]|表示[“"].*?[”"].*最准确的词|词典.*界定为[“"]/u, `${q.id}: supplied answer`);
      assert.doesNotMatch(q.prompt, /\[source setting\]|\[claim using|\[evidence\]|\[result\]/, `${q.id}: placeholder instead of exercise`);
    }
    assert.ok(questions.some(q => /\b[A-C]\b/.test(q.prompt)), `Level ${level}: real decisions`);
    assert.ok(questions.some(q => /引用|依据|根据|哪一处|cite|evidence/i.test(q.prompt)), `Level ${level}: evidence check`);
    const review = plan.modules.find(m => m.kind === 'review-test');
    assert.ok(review);
    assert.ok(review.questions.every(q => !/先查到|词典.*界定|并说明它表示/u.test(q.prompt)), 'closed-book review cannot print definitions');
  });
}
