import { writeFile } from 'node:fs/promises';
import { GRAMMAR_CURRICULUM, READING_LESSONS } from '../../src/lib/learning/step7-content.ts';

// Word pages need recommendation metadata, not the training engines or exercises.
const data = {
  grammar: GRAMMAR_CURRICULUM.map(({ slug, level, title, pattern }) => ({ slug, level, title, pattern })),
  readings: READING_LESSONS.map(({ slug, level, title, text, vocabulary }) => ({
    slug, level, title, text, vocabulary: vocabulary.map(({ word }) => ({ word })),
  })),
};
await writeFile(new URL('../../src/lib/dictionary/word-detail-recommendations.json', import.meta.url), JSON.stringify(data) + '\n');
console.log(`Word recommendation metadata: ${data.grammar.length} grammar lessons, ${data.readings.length} readings`);
