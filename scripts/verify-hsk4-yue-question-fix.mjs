import { readFileSync } from 'node:fs';

const files = [
  'src/lib/data/hsk4.json',
  'docs/content/questions/hsk4.json',
];

let failed = 0;
for (const file of files) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const question = data.find((item) => item.id === 'hsk4_014');
  if (!question) {
    console.error(`FAIL ${file}: missing hsk4_014`);
    failed += 1;
    continue;
  }
  const checks = [
    ['question_cn', '这个问题他______解释，大家______听越糊涂。'],
    ['question_en', 'The more he explained this problem, the more confused everyone got.'],
    ['explanation', '这个问题他越解释，大家越听越糊涂'],
    ['explanation', 'A表转折，B表递进，D表因果'],
  ];
  for (const [field, expected] of checks) {
    if (!String(question[field] ?? '').includes(expected)) {
      console.error(`FAIL ${file}: ${field} does not include ${expected}`);
      failed += 1;
    } else {
      console.log(`PASS ${file}: ${field} includes ${expected}`);
    }
  }
}

if (failed) process.exit(1);
