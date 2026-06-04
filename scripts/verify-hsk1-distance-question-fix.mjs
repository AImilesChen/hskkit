import { readFileSync } from 'node:fs';

const files = [
  'src/lib/data/hsk1.json',
  'docs/content/questions/hsk1.json',
];

const expected = {
  question_cn: '我家______学校很近。',
  question_en: 'My home is very close to school.',
  correct_answer: 'C',
};

let failed = 0;
for (const file of files) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const question = data.find((item) => item.id === 'hsk1_033');
  if (!question) {
    console.error(`FAIL ${file}: missing hsk1_033`);
    failed += 1;
    continue;
  }

  for (const [field, value] of Object.entries(expected)) {
    if (question[field] !== value) {
      console.error(`FAIL ${file}: ${field} expected ${JSON.stringify(value)}, got ${JSON.stringify(question[field])}`);
      failed += 1;
    } else {
      console.log(`PASS ${file}: ${field}`);
    }
  }

  if (!question.options?.C?.includes('离')) {
    console.error(`FAIL ${file}: option C should be 离`);
    failed += 1;
  } else {
    console.log(`PASS ${file}: option C`);
  }

  if (!String(question.explanation ?? '').includes('我家离学校很近')) {
    console.error(`FAIL ${file}: explanation must contain completed sentence`);
    failed += 1;
  } else {
    console.log(`PASS ${file}: explanation`);
  }

  if (String(question.question_cn).includes('我______家______学校')) {
    console.error(`FAIL ${file}: old malformed two-blank wording still present`);
    failed += 1;
  } else {
    console.log(`PASS ${file}: old wording absent`);
  }
}

if (failed) process.exit(1);
