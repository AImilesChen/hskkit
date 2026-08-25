import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const home = read("../src/app/page.tsx");
const nextStep = read("../src/app/components/home-next-step.tsx");
const footer = read("../src/app/site-footer.tsx");
const styles = read("../src/app/homepage.css");

function expectInOrder(source: string, markers: string[]) {
  let cursor = -1;
  for (const marker of markers) {
    const next = source.indexOf(marker);
    assert.ok(next > cursor, `${marker} must appear after the previous homepage section`);
    cursor = next;
  }
}

test("homepage leads with the approved result-first copy and authentic learning-loop proof", () => {
  assert.match(home, /Find your HSK 3\.0 level\./);
  assert.match(home, /Study the next useful task\./);
  assert.match(home, /A connected daily path/);
  assert.match(home, /Review due items/);
  assert.match(home, /Learn focused content/);
  assert.match(home, /Listen or practise/);
  assert.match(home, /See the daily summary/);
  assert.match(home, /getHsk3LevelPreview\(1, 1\)/);
  assert.doesNotMatch(home, /aria-hidden="true" className="relative mx-auto h-\[300px\]/);
});

test("homepage CTA vocabulary is unified without changing dynamic return-user behavior", () => {
  assert.match(nextStep, /Find my starting level/);
  assert.match(nextStep, /Browse HSK 3\.0 levels/);
  assert.match(nextStep, /Continue today’s study/);
  assert.doesNotMatch(nextStep, /Start placement|Explore HSK 3\.0 levels|Continue today"/);
  assert.match(home, /Find my starting level/);
});

test("homepage tells one learning-loop story before compact levels and grouped tools", () => {
  expectInOrder(home, [
    "Find your HSK 3.0 level.",
    "One connected path from level check to daily review.",
    "Explore the published HSK 3.0 catalog.",
    "Choose a tool for the task in front of you.",
    "Current public scope",
    "Start with the right level.",
  ]);
  for (const group of ["Core study", "Skills", "Tests", "Reference"]) assert.match(home, new RegExp(group));
  assert.doesNotMatch(home, /const quickTools|status: "Live"|>LIVE<|START HERE|Published, source-locked HSK 3\.0 content for this level/);
  assert.match(home, /Unified advanced band/);
});

test("P1 gives the hero one framed action zone with explicit CTA hierarchy", () => {
  assert.match(nextStep, /home-cta-panel/);
  assert.match(nextStep, /home-cta-primary/);
  assert.match(nextStep, /home-cta-secondary/);
  assert.match(nextStep, /Start as a guest/);
  assert.match(nextStep, /Placement is a learning suggestion/);
  assert.match(nextStep, /Sign in later to sync/);
  assert.match(nextStep, /HomeIcon/);
  assert.match(styles, /\.home-cta-panel/);
  assert.match(styles, /\.home-cta-primary/);
  assert.match(styles, /\.home-cta-secondary/);
});

test("P1 turns the learning loop into an icon-led connected path with task-specific actions", () => {
  assert.match(home, /home-learning-path/);
  assert.match(home, /home-flow-icon/);
  assert.match(home, /home-flow-connector/);
  for (const action of ["Start level check", "Open Today", "Practise skills", "Review mistakes"]) {
    assert.match(home, new RegExp(action));
  }
  assert.doesNotMatch(home, /Open step/);
});

test("P2 uses one local inline icon system, stronger tool controls, and truthful level density bars", () => {
  assert.match(home, /HomeIcon/);
  assert.match(home, /home-tool-icon/);
  assert.match(home, /home-tool-arrow/);
  assert.match(home, /home-tool-card-core/);
  assert.match(home, /home-level-density/);
  assert.match(home, /aria-label={`Word-list size/);
  assert.match(styles, /\.home-tool-arrow/);
  assert.match(styles, /\.home-level-density/);
});

test("homepage polish is scoped, consistent and motion-safe", () => {
  for (const className of ["home-hero", "home-product-card", "home-flow-card", "home-level-card", "home-tool-card"]) {
    assert.match(styles, new RegExp(`\\.${className}`));
  }
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /focus-visible/);
  assert.match(footer, /py-8/);
});
