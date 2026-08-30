import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const source = async (path: string) => readFile(new URL(path, root), "utf8");

test("Mock exam exposes a clear task hierarchy and labelled timer", async () => {
  const client = await source("src/app/components/mock-exam.tsx");
  assert.match(client, /Question \{index \+ 1\} of \{session\.questions\.length\}/);
  assert.match(client, /Listening|current\.dimension/);
  assert.match(client, /aria-label=\{`Time remaining:/);
  assert.match(client, /\{answered\} answers saved/);
});

test("Mock exam presents Previous, Save answer and Next as one accessible action system", async () => {
  const client = await source("src/app/components/mock-exam.tsx");
  assert.match(client, /className="mock-exam-actions/);
  assert.match(client, /className="btn btn-secondary mock-exam-action/);
  assert.match(client, /className="btn btn-primary mock-exam-action/);
  assert.match(client, /data-loading=\{busy \? "true" : undefined\}/);
  assert.match(client, /\{busy \? "Saving…" : "Save answer"\}/);
  assert.match(client, /aria-busy=\{busy\}/);
  assert.match(client, /Next<span aria-hidden="true">→<\/span>/);
});

test("Mock action controls define complete visual states and mobile-safe layout", async () => {
  const css = await source("src/app/globals.css");
  for (const selector of [
    ".mock-exam-action:hover:not(:disabled)",
    ".mock-exam-action:active:not(:disabled)",
    ".mock-exam-action:focus-visible",
    ".mock-exam-action:disabled",
    ".mock-exam-action[data-loading=\"true\"]",
  ]) assert.ok(css.includes(selector), selector);
  assert.match(css, /@media \(max-width: 639px\)[\s\S]*\.mock-exam-actions/);
  assert.match(css, /position: fixed/);
  assert.match(css, /bottom: max\(12px, env\(safe-area-inset-bottom\)\)/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1\.15fr\) minmax\(0, 1fr\)/);
  assert.match(css, /grid-template-areas: "previous save next"/);
});

test("Mock production UI hides internal question-set, scoring and revision metadata", async () => {
  const client = await source("src/app/components/mock-exam.tsx");
  assert.doesNotMatch(client, />Question set \{session\.questionSetVersion\}/);
  assert.doesNotMatch(client, /autosave revision \{session\.revision\}/);
  assert.doesNotMatch(client, />Trace: \{session\.questionSetVersion\}/);
  assert.doesNotMatch(client, />The question set and scoring rules are versioned\./);
});

test("Mock visual revision preserves core exam behavior tokens", async () => {
  const client = await source("src/app/components/mock-exam.tsx");
  for (const token of [
    "current.audioSrc",
    'action: "answer"',
    'action: "submit"',
    "setInterval",
    "setIndex((value) => Math.max(0, value - 1))",
    "setIndex((value) => Math.min(session.questions.length - 1, value + 1))",
  ]) assert.ok(client.includes(token), token);
});
