import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { practiceHubExamples } from "../src/lib/practice/hub-examples.ts";
import { PRACTICE_SKILLS, practiceQuestionSet } from "../src/lib/practice/questions.ts";

test("all 28 hub previews match a currently published question and stay compact", () => {
  const examples = practiceHubExamples();
  assert.equal(Object.keys(examples).length, 7);
  for (let level = 1; level <= 7; level++) {
    assert.deepEqual(Object.keys(examples[level]), [...PRACTICE_SKILLS]);
    for (const skill of PRACTICE_SKILLS) {
      const preview = examples[level][skill];
      const source = practiceQuestionSet(level, skill).find(q => q.id === preview.id);
      assert.ok(source);
      assert.equal(preview.prompt, source.prompt);
      assert.equal(preview.excerpt, source.context ?? source.audioText ?? source.options[source.correctAnswer]);
      assert.equal(preview.answer, source.options[source.correctAnswer]);
      assert.equal(preview.audioSrc, source.audioSrc);
      assert.equal(preview.explanation, source.explanation);
      assert.doesNotMatch(preview.id, /retired/);
    }
  }
  assert.ok(Buffer.byteLength(JSON.stringify(examples)) < 32_000, "Do not ship the entire question bank to the browser");
});

test("only the public hub becomes indexable; answer sessions retain noindex", () => {
  const read = (file: string) => fs.readFileSync(new URL(file, import.meta.url), "utf8");
  const hub = read("../src/app/practice/page.tsx");
  assert.match(hub, /robots: \{ index: true, follow: true \}/);
  assert.match(hub, /canonical: "\/practice"/);
  assert.match(hub, /dynamic = "force-static"/);
  assert.match(read("../src/app/sitemap.ts"), /"\/practice",/);
  assert.match(read("../src/app/practice/[level]/[skill]/page.tsx"), /index: false, follow: false/);
  assert.match(read("../src/app/practice/practice-selector-client.tsx"), /import type \{ PracticeHubExamples \}/);
  assert.doesNotMatch(read("../src/app/practice/practice-selector-client.tsx"), /from ["'].*questions/);
});
