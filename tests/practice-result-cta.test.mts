import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const client = fs.readFileSync(new URL("../src/app/practice/[level]/[skill]/practice-client.tsx", import.meta.url), "utf8");
const completedStart = client.indexOf('if (session.status === "completed")');
const completed = client.slice(completedStart, client.indexOf("const question = session.questions[index]", completedStart));

test("completed Practice derives an understandable score and state without changing persisted result data", () => {
  assert.match(completed, /const correctCount = session\.result\?\.correctCount \?\? session\.feedback\.filter\(\(entry\) => entry\.correct\)\.length/);
  assert.match(completed, /const totalCount = session\.result\?\.totalCount \?\? session\.questions\.length/);
  assert.match(completed, /const wrongCount = Math\.max\(totalCount - correctCount, 0\)/);
  assert.match(completed, /const percentage = totalCount > 0 \? Math\.round\(\(correctCount \/ totalCount\) \* 100\) : 0/);
  assert.match(completed, /\{correctCount\} \/ \{totalCount\} correct/);
  assert.match(completed, /· \{percentage\}%/);
});

test("mistake state makes review the single primary action and demotes adjacent destinations", () => {
  assert.match(completed, /const hasMistakes = wrongCount > 0/);
  assert.match(completed, /\{wrongCount\} \{wrongCount === 1 \? "missed item was" : "missed items were"\} saved to Mistakes and added to Review/);
  assert.match(completed, /Focus area: HSK 3\.0 Level \{levelDisplay\} \{skillLabel\}/);
  assert.match(completed, /href="\/review"[^>]*>Review \{wrongCount\} \{wrongCount === 1 \? "mistake" : "mistakes"\} now<\/Link>/s);
  assert.match(completed, /min-h-\[48px\][^"\n]*bg-blue-600[^"\n]*text-white/);
  assert.match(completed, /<button[^>]*onClick=\{start\}[^>]*>Practice again<\/button>/s);
  assert.match(completed, /href="\/mistakes"[^>]*>View mistakes<\/Link>/s);
  assert.match(completed, />Update learning plan<\/Link>/);
  assert.match(completed, /href="\/today"[^>]*>Continue today<\/Link>/s);
});

test("perfect state recommends continuing and does not invent mistakes", () => {
  assert.match(completed, /hasMistakes \? [\s\S]*Review \{wrongCount\}[\s\S]*: [\s\S]*href="\/today"[^>]*>Continue today<\/Link>/);
  assert.match(completed, /href="\/practice"[^>]*>Practice another skill<\/Link>/s);
  assert.match(completed, /No wrong answers in this session/);
  assert.match(completed, /Perfect score — keep the momentum going/);
});

test("result actions are responsive and old system-oriented CTA copy is removed", () => {
  assert.match(completed, /flex flex-col[^"\n]*sm:flex-row/);
  assert.match(completed, /w-full[^"\n]*sm:w-auto/);
  assert.doesNotMatch(completed, /Open Review\/SRS|Open Mistakes|Create or update learning plan|Weakness:/);
});
