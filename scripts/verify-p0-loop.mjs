import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/app/page.tsx',
    label: 'homepage primary CTA starts today practice',
    includes: 'Start Today’s HSK 1 Practice',
  },
  {
    file: 'src/app/page.tsx',
    label: 'homepage shows 6-step daily loop',
    includes: 'Today’s 10-Minute HSK 1 Loop',
  },
  {
    file: 'src/app/components/practice-test.tsx',
    label: 'practice results save progress locally',
    includes: 'hskkit.practice.progress',
  },
  {
    file: 'src/app/components/practice-test.tsx',
    label: 'practice results show save progress message',
    includes: 'Save your progress later',
  },
  {
    file: 'src/app/hsk-1-reading-practice/story-card.tsx',
    label: 'reading page can mark a story complete',
    includes: 'Mark story complete',
  },
  {
    file: 'src/app/tools/chinese-character-practice-sheet-generator/worksheet-tool.tsx',
    label: 'worksheet tool tracks daily soft limit',
    includes: 'hskkit.worksheet.daily',
  },
];

let failed = 0;
for (const check of checks) {
  const text = readFileSync(check.file, 'utf8');
  if (!text.includes(check.includes)) {
    failed += 1;
    console.error(`FAIL ${check.label}: missing ${JSON.stringify(check.includes)} in ${check.file}`);
  } else {
    console.log(`PASS ${check.label}`);
  }
}

if (failed > 0) {
  process.exit(1);
}
