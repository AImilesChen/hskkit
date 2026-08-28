import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const page = source("../src/app/practice/[level]/[skill]/page.tsx");
const client = source("../src/app/practice/[level]/[skill]/practice-client.tsx");
const selector = source("../src/app/practice/practice-selector-client.tsx");

test("the shared overview contract covers all 28 published Practice destinations", () => {
  assert.match(page, /level < 1 \|\| level > 7/);
  for (const skill of ["vocabulary", "grammar", "reading", "listening"]) {
    assert.match(page, new RegExp(`"${skill}"`));
    assert.match(client, new RegExp(`${skill}:\\s*\\{`));
  }
});

test("selector cards describe navigation to an overview instead of claiming to start a session", () => {
  assert.match(selector, /aria-label=\{`View HSK \$\{level\.display\} \$\{item\.label\} practice`\}/);
  assert.match(selector, /View HSK \{level\.display\} \{item\.label\}/);
  assert.doesNotMatch(selector, /Start HSK \{level\.display\} \{item\.label\}/);
});

test("new-session overview uses skill-specific learner copy and task facts", () => {
  assert.match(client, /const SKILL_OVERVIEWS/);
  assert.match(client, /Match English meanings with the correct Chinese words/);
  assert.match(client, /Identify natural Chinese word order/);
  assert.match(client, /Read short level-appropriate passages/);
  assert.match(client, /Listen to approved practice audio/);
  assert.match(client, /8 questions/);
  assert.match(client, /Immediate feedback/);
  assert.match(client, /Progress autosaved/);
  assert.match(client, /Mistakes added to Review/);
  assert.match(client, /How it works/);
});

test("new-session overview has one unmistakable, task-named primary action", () => {
  assert.match(client, /Start 8-question practice/);
  assert.match(client, /Starting…/);
  assert.match(client, /min-h-\[48px\][^"\n]*bg-blue-600[^"\n]*text-white/);
  assert.match(client, /w-full[^"\n]*sm:w-auto/);
  assert.match(client, />Change level or skill<\/Link>/);
  assert.doesNotMatch(client, />Start practice<\/button>/);
  assert.doesNotMatch(client, />Choose another level or skill<\/Link>/);
});

test("mobile overview keeps the task CTA inside a compact first-screen hierarchy", () => {
  assert.match(client, /max-w-3xl px-4 py-4[^"\n]*sm:py-14/);
  assert.match(client, /mt-3 rounded-3xl[^"\n]*p-4[^"\n]*sm:p-8/);
  assert.match(client, /text-3xl[^"\n]*sm:text-5xl/);
  assert.match(client, /mt-4 grid grid-cols-2[^"\n]*sm:grid-cols-4/);
  assert.match(client, /min-h-\[56px\][^"\n]*sm:min-h-\[64px\]/);
  assert.match(client, /mt-5 flex flex-col[^"\n]*sm:flex-row/);
});

test("technical publication details are retained but demoted behind disclosure", () => {
  const overviewState = client.slice(client.indexOf("if (!session)"), client.indexOf("if (session.status === \"expired\")"));
  assert.match(overviewState, /<details/);
  assert.match(overviewState, /<summary[^>]*>About this question set<\/summary>/);
  assert.match(overviewState, /version-locked/);
  assert.match(overviewState, /source, QA, answer, explanation and lifecycle records/);
  assert.doesNotMatch(overviewState, /border-emerald-200 bg-emerald-50/);
});
