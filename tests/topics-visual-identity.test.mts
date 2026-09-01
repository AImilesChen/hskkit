import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const source = async (path: string) => readFile(new URL(path, root), "utf8");

const expectedTopicIcons: Record<string, string> = {
  "morning-routine": "sunrise",
  "time-and-plans": "calendar-clock",
  "weather-and-seasons": "sun-cloud",
  "restaurant-basics": "menu-bowl",
  "grocery-shopping": "shopping-basket",
  "cooking-at-home": "cooking-pan",
  "departure-and-arrival": "departure-ticket",
  "getting-around-town": "transit-route",
  "hotel-stay": "hotel-key",
};

test("topic visual identity defines three restrained semantic category palettes and nine distinct icons", async () => {
  const visuals = await import("../src/lib/topics/visuals.ts");
  assert.deepEqual(Object.keys(visuals.topicCategoryVisuals), ["daily-life", "food-drink", "travel-transport"]);
  assert.deepEqual(visuals.topicIconNames, expectedTopicIcons);
  assert.equal(new Set(Object.values(visuals.topicIconNames)).size, 9);
  assert.deepEqual(
    Object.values(visuals.topicCategoryVisuals).map((item: { accentName: string }) => item.accentName),
    ["morning", "table", "journey"],
  );
});

test("topic visual tokens are included in the Tailwind scan so category identity reaches production CSS", async () => {
  const [tailwind, visuals] = await Promise.all([
    source("tailwind.config.js"),
    source("src/lib/topics/visuals.ts"),
  ]);
  assert.match(tailwind, /src\/lib\/topics\/visuals\.ts/);
  assert.match(visuals, /from-cyan-100/);
  assert.match(visuals, /border-cyan-300/);
});

test("one outlined SVG icon system and small contextual scenes are shared across Topics surfaces", async () => {
  const [visuals, index, card, detail, practice, client] = await Promise.all([
    source("src/app/topics/topic-visuals.tsx"),
    source("src/app/topics/page.tsx"),
    source("src/app/topics/topic-card.tsx"),
    source("src/app/topics/[slug]/page.tsx"),
    source("src/app/topics/[slug]/practice/page.tsx"),
    source("src/app/topics/[slug]/practice/topic-practice-client.tsx"),
  ]);
  assert.match(visuals, /fill="none"/);
  assert.match(visuals, /stroke="currentColor"/);
  assert.match(visuals, /strokeLinecap="round"/);
  assert.match(visuals, /strokeLinejoin="round"/);
  assert.match(visuals, /TopicIcon/);
  assert.match(visuals, /TopicScene/);
  assert.match(visuals, /TopicHeroScene/);
  assert.doesNotMatch(visuals, /[\u{1F300}-\u{1FAFF}]/u);
  assert.match(index, /TopicHeroScene/);
  assert.match(index, /CategoryVisual/);
  assert.match(card, /TopicScene/);
  assert.match(detail, /TopicHeroScene/);
  assert.match(practice, /TopicIcon/);
  assert.match(client, /TopicIcon/);
});

test("topic cards and detail panel expose truthful state-aware CTA labels without changing destinations", async () => {
  const [card, panel] = await Promise.all([
    source("src/app/topics/topic-card.tsx"),
    source("src/app/topics/topic-learning-panel.tsx"),
  ]);
  assert.match(card, /Explore topic/);
  assert.match(card, /Continue topic/);
  assert.match(card, /Review topic/);
  assert.match(card, /href=\{`\/topics\/\$\{topic\.slug\}`\}/);
  assert.match(card, /progress\.learned === progress\.total/);
  assert.match(card, /progress\.learned > 0/);
  assert.doesNotMatch(card, />\s*View topic\s*</);
  assert.match(panel, /Start first word/);
  assert.match(panel, /Continue where you left off/);
  assert.match(panel, /Review topic practice/);
});

test("mobile Topics keeps browsing and the primary practice action inside a compact first screen", async () => {
  const [index, detail] = await Promise.all([
    source("src/app/topics/page.tsx"),
    source("src/app/topics/[slug]/page.tsx"),
  ]);
  assert.match(index, /py-4[^\n]*md:py-12/);
  assert.match(index, /hidden sm:block/);
  assert.match(detail, /Start topic practice/);
  assert.match(detail, /href=\{`\/topics\/\$\{topic\.slug\}\/practice`\}/);
});

test("practice inherits topic identity subtly and completion keeps learning actions dominant", async () => {
  const [page, client] = await Promise.all([
    source("src/app/topics/[slug]/practice/page.tsx"),
    source("src/app/topics/[slug]/practice/topic-practice-client.tsx"),
  ]);
  assert.match(page, /topicVisualFor/);
  assert.match(page, /visualKey=\{topic\.slug\}/);
  assert.match(client, /visualKey: string/);
  assert.match(client, /Session complete/);
  assert.match(client, /Open Review/);
  assert.doesNotMatch(client, /<TopicHeroScene/);
});
