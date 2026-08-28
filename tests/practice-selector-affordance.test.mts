import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const selector = fs.readFileSync(
  new URL("../src/app/practice/practice-selector-client.tsx", import.meta.url),
  "utf8",
);

test("Practice uses a compact, explicit level filter with immediate selected-state feedback", () => {
  assert.match(selector, /Choose your HSK level/);
  assert.match(selector, /aria-pressed=\{selectedLevel === item\.value\}/);
  assert.match(selector, /aria-live="polite"/);
  assert.match(selector, /HSK \{level\.display\} selected/);
  assert.match(selector, /lg:grid-cols-7/);
  assert.match(selector, /min-h-12/);
  assert.doesNotMatch(selector, /min-h-20/);
});

test("each Practice skill is one whole-card link for the selected level", () => {
  assert.match(selector, /SKILLS\.map\(\(item\) => <Link/);
  assert.match(selector, /href=\{`\/practice\/\$\{selectedLevel\}\/\$\{item\.slug\}`\}/);
  assert.match(selector, /aria-label=\{`Start HSK \$\{level\.display\} \$\{item\.label\} practice`\}/);
  assert.match(selector, /Start HSK \{level\.display\} \{item\.label\}/);
  assert.match(selector, /8 questions/);
  assert.doesNotMatch(selector, /selectedSkill/);
  assert.doesNotMatch(selector, />Ready</);
});

test("Practice keeps the approved four-skill order and direct task descriptions", () => {
  const ordered = ["Vocabulary", "Grammar", "Reading", "Listening"];
  let cursor = -1;
  for (const label of ordered) {
    const next = selector.indexOf(`label: "${label}"`);
    assert.ok(next > cursor, `${label} must remain in the approved order`);
    cursor = next;
  }
  assert.match(selector, /Meaning and word recognition/);
  assert.match(selector, /Natural Chinese word order/);
  assert.match(selector, /Passage comprehension/);
  assert.match(selector, /Audio comprehension/);
});
