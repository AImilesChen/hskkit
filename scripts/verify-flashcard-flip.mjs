import { readFileSync } from 'node:fs';

const file = 'src/app/hsk-1-vocabulary/hsk-1-vocabulary-client.tsx';
const text = readFileSync(file, 'utf8');
const required = [
  'aria-label={flashFlipped ? "Show hanzi front" : "Show pinyin, meaning, and example"}',
  'Show pinyin & example',
  'Show hanzi front',
  'Back of card',
  'flashcard_flip',
];
let failed = 0;
for (const needle of required) {
  if (!text.includes(needle)) {
    console.error(`FAIL missing ${JSON.stringify(needle)} in ${file}`);
    failed += 1;
  } else {
    console.log(`PASS found ${needle}`);
  }
}
if (failed) process.exit(1);
