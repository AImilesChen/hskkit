import test from 'node:test';
import assert from 'node:assert/strict';
import runtime from '../src/lib/content/runtime-content-index.json' with { type: 'json' };
import legacy1 from '../src/lib/content/legacy-hsk1-audio.json' with { type: 'json' };
import legacy23 from '../src/lib/content/legacy-hsk23-audio.json' with { type: 'json' };
import legacy4 from '../src/lib/content/legacy-hsk4-audio.json' with { type: 'json' };
import legacy5 from '../src/lib/content/legacy-hsk5-audio.json' with { type: 'json' };
import recommendations from '../src/lib/dictionary/word-detail-recommendations.json' with { type: 'json' };
import { GRAMMAR_CURRICULUM, READING_LESSONS } from '../src/lib/learning/step7-content.ts';
import * as original from '../src/lib/audio/assets.ts';
import * as lightweight from '../src/lib/audio/word-assets.ts';

test('word audio preserves every current and retained audio record and public field', () => {
  const ids = new Set([...runtime.publishedAudioAssets.map(a => a.contentAssetId),
    ...[...legacy1.audio, ...legacy23.audio, ...legacy4.audio, ...legacy5.audio].map(a => a[0]), 'missing']);
  for (const id of ids) {
    const a = original.publishedContentAudioAsset(id, '学习');
    const b = lightweight.publishedContentAudioAsset(id, '学习');
    assert.deepEqual(b, a, id);
    assert.deepEqual(lightweight.publicAudioAsset(b), original.publicAudioAsset(a), id);
  }
});

test('generated word recommendation metadata is fresh and preserves order and matching fields', () => {
  assert.deepEqual(recommendations, {
    grammar: GRAMMAR_CURRICULUM.map(({ slug, level, title, pattern }) => ({ slug, level, title, pattern })),
    readings: READING_LESSONS.map(({ slug, level, title, text, vocabulary }) => ({
      slug, level, title, text, vocabulary: vocabulary.map(({ word }) => ({ word })),
    })),
  });
});
