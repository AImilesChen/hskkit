import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const client = fs.readFileSync(
  new URL("../src/app/practice/[level]/[skill]/practice-client.tsx", import.meta.url),
  "utf8",
);

const activeQuestion = client.slice(
  client.indexOf("const question = session.questions[index]"),
  client.indexOf("function State"),
);

test("practice selection stays local until Check answer submits it", () => {
  assert.match(client, /const \[selectedAnswer, setSelectedAnswer\] = useState\(""\)/);
  assert.match(activeQuestion, /onClick=\{\(\) => setSelectedAnswer\(key\)\}/);
  assert.doesNotMatch(activeQuestion, /onClick=\{\(\) => void answer\(key\)\}/);
  assert.match(client, /answer: selectedAnswer/);
  assert.match(activeQuestion, />\{busy \? "Checking…" : "Check answer"\}<\/button>/);
  assert.match(activeQuestion, /disabled=\{busy \|\| !selectedAnswer\}/);
});

test("practice actions use the existing framed primary and secondary button classes", () => {
  assert.match(activeQuestion, /className="btn btn-secondary[^\"]*"/);
  assert.match(activeQuestion, /className="btn btn-primary[^\"]*"/);
  assert.match(activeQuestion, /type="button">Back<\/button>/);
  assert.match(activeQuestion, />\{busy \? "Checking…" : "Check answer"\}<\/button>/);
  assert.match(activeQuestion, /type="button">Next question<\/button>/);
});

test("moving between questions clears only the unsaved local selection", () => {
  assert.match(activeQuestion, /setSelectedAnswer\(""\);\s*setIndex\(\(value\) => value - 1\)/);
  assert.match(activeQuestion, /setSelectedAnswer\(""\);\s*setIndex\(\(value\) => value \+ 1\)/);
});
