import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { TONE_CONTRASTS, TONE_GUIDES } from '../src/lib/tones/learning.ts';
import { TONE_ITEMS } from '../src/lib/tones/domain.ts';
import { publishedContentAudioAsset } from '../src/lib/audio/assets.ts';

test('four visual guides resolve to trusted published examples of the labelled tone', () => {
  assert.deepEqual(TONE_GUIDES.map(g => g.tone), [1,2,3,4]);
  for (const guide of TONE_GUIDES) {
    assert.deepEqual(guide.item.tones,[guide.tone]);
    assert.equal(guide.item.mode,'single');
    assert.ok(guide.hint.length > 20);
    const published=publishedContentAudioAsset(guide.item.id,guide.item.hanzi);
    assert.ok(published);
    assert.equal(published.src,guide.item.audioSrc);
    assert.equal(published.qa.content,'approved');
  }
});

test('A/B pairs hold the syllable constant and reuse different trusted recordings', () => {
  const syllable=(pinyin:string) => pinyin.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
  assert.equal(TONE_CONTRASTS.length,3);
  for(const pair of TONE_CONTRASTS){
    assert.notEqual(pair.items[0].id,pair.items[1].id);
    assert.notEqual(pair.tones[0],pair.tones[1]);
    assert.equal(syllable(pair.items[0].pinyin),syllable(pair.items[1].pinyin));
    pair.items.forEach((item,index) => {
      assert.equal(item.mode,'single');
      assert.deepEqual(item.tones,[pair.tones[index]]);
      assert.ok(TONE_ITEMS.some(i=>i.id===item.id && i.audioSrc===item.audioSrc));
      assert.ok(fs.statSync('public'+item.audioSrc).size>1000);
    });
  }
});

test('unscored learning panel does not create, persist or merge scored sessions', () => {
  const source=fs.readFileSync(new URL('../src/app/tools/chinese-tone-trainer/tone-learning.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(source,/createToneSession|answerToneSession|localStorage|fetch\(|trackEvent/);
  assert.match(source,/unscored/);
  assert.match(source,/\.tone-page audio/);
});
