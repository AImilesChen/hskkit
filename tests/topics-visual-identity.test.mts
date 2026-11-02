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
  assert.doesNotMatch(index, /<TopicHeroScene/);
  assert.match(index, /topics-category-card/);
  assert.match(card, /TopicScene/);
  assert.match(detail, /<TopicHeroScene/);
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
  assert.match(panel, /Continue next word/);
  assert.match(panel, /Review practice/);
});

test("mobile Topics keeps browsing and the primary practice action inside a compact first screen", async () => {
  const [index, detail] = await Promise.all([
    source("src/app/topics/page.tsx"),
    source("src/app/topics/[slug]/page.tsx"),
  ]);
  assert.match(index, /topics-page/);
  assert.match(index, /topics-index-hero/);
  assert.match(detail, /Start practice/);
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

test("category cards separate illustration, label and count without competing for title width", async () => {
  const [visuals, index] = await Promise.all([
    source("src/app/topics/topic-visuals.tsx"),
    source("src/app/topics/page.tsx"),
  ]);
  assert.match(visuals, /topics-category-art/);
  assert.doesNotMatch(visuals, /absolute bottom-3 left-4[^\n]*visual\.label/);
  assert.match(index, /items-center justify-between[^\n]*category\.titleZh[^\n]*\{count\} topics/);
  assert.doesNotMatch(index, /items-start justify-between[^\n]*category\.title[^\n]*\{count\} topics/);
});

test("shared topic detail uses a compact brand-blue hero and gives Chinese equal learning weight", async () => {
  const [detail, visuals] = await Promise.all([
    source("src/app/topics/[slug]/page.tsx"),
    source("src/app/topics/topic-visuals.tsx"),
  ]);
  assert.match(await source("src/app/topics/topics.css"), /#f3f0f8/);
  assert.match(detail, /topics-hero/);
  assert.doesNotMatch(detail, /bg-slate-950 text-white/);
  assert.match(detail, /topics-chinese[^\n]*lang="zh-Hans"/);
  assert.match(visuals, /topics-hero-art/);
});

test("topic word cards use contextual display meanings and one dominant practice action", async () => {
  const [detail, presentation] = await Promise.all([
    source("src/app/topics/[slug]/page.tsx"),
    import("../src/lib/topics/presentation.ts"),
  ]);
  assert.equal(presentation.topicMeaningForCard("to wash; to develop photographs; to shuffle cards"), "to wash");
  assert.equal(presentation.topicMeaningForCard("to leave home"), "to leave home");
  assert.equal(presentation.topicContextMeaning("morning-routine", "hsk2025.word.l2.0307.v1", "to cover"), "bag");
  assert.equal(presentation.topicContextMeaning("another-topic", "hsk2025.word.l2.0307.v1", "to cover"), "to cover");
  assert.match(detail, /topicMeaningForCard\(word\.meaning\)/);
  assert.match(detail, />Word details →<\/Link>/);
  assert.match(detail, />Practice<\/Link>/);
  assert.doesNotMatch(detail, /Practise word/);
  assert.doesNotMatch(detail, /grid grid-cols-2 gap-2[^\n]*Word details/);
});

test("detail support content is lighter, naturally sized and uses a consistent practice vocabulary", async () => {
  const detail = await source("src/app/topics/[slug]/page.tsx");
  assert.match(detail, /Choose a lesson/);
  assert.match(detail, /divide-y divide-slate-100/);
  assert.doesNotMatch(detail, /topic\.expressions[^\n]*rounded-xl bg-slate-50 p-4/);
  assert.match(detail, /grid size-7 shrink-0/);
  assert.match(detail, /border-slate-200 bg-slate-50\/80[^\n]*Culture tip/);
  assert.doesNotMatch(detail, /Continuous topic practice/);
  assert.match(detail, /Practice topic/);
});

test("recommended topic cards keep metadata compact instead of repeating a heavy three-cell table", async () => {
  const card = await source("src/app/topics/topic-card.tsx");
  assert.match(card, /flex flex-wrap items-center gap-x-4 gap-y-2/);
  assert.doesNotMatch(card, /grid grid-cols-3 gap-2 border-y/);
});
