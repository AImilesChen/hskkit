import { readFileSync } from 'node:fs';

const files = [
  'src/lib/data/hsk4.json',
  'docs/content/questions/hsk4.json',
];

let failed = 0;
for (const file of files) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const question = data.find((item) => item.id === 'hsk4_016');
  if (!question) {
    console.error(`FAIL ${file}: missing hsk4_016`);
    failed += 1;
    continue;
  }
  const checks = [
    ['question_cn', '______你来了，我______能告诉你。'],
    ['question_en', 'Only if you come can I tell you.'],
    ['explanation', "只有你来了，我才能告诉你"],
  ];
  for (const [field, expected] of checks) {
    if (!String(question[field] ?? '').includes(expected)) {
      console.error(`FAIL ${file}: ${field} does not include ${expected}`);
      failed += 1;
    } else {
      console.log(`PASS ${file}: ${field}`);
    }
  }
}

if (failed) process.exit(1);
