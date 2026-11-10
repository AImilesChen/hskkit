import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const home = read("../src/app/page.tsx");
const learningScene = read("../src/app/components/home-learning-scene.tsx");
const nextStep = read("../src/app/components/home-next-step.tsx");
const footer = read("../src/app/site-footer.tsx");
const styles = read("../src/app/homepage.css");
const runtimeIndex = JSON.parse(read("../src/lib/content/runtime-content-index.json")) as {
  runtimeWords: Record<string, Array<{ id: string }>>;
  publishedAudioAssets: Array<{ contentAssetId: string; audioKind: string; qaStatus: string; storageKey: string }>;
};

function expectInOrder(source: string, markers: string[]) {
  let cursor = -1;
  for (const marker of markers) {
    const next = source.indexOf(marker);
    assert.ok(next > cursor, `${marker} must appear after the previous homepage section`);
    cursor = next;
  }
}

test("homepage leads with a concise result and a learning-tools scene distinct from the flashcard demo", () => {
  assert.match(home, /Build your HSK vocabulary\. Remember what you learn\./);
  assert.match(home, /Free HSK learning platform/);
  assert.match(home, /home-title-primary/);
  assert.match(home, /home-title-secondary/);
  assert.equal((home.match(/home-title-line/g) ?? []).length, 4, "hero title must use four intentional semantic lines");
  assert.match(styles, /\.home-title-line\s*\{[^}]*display:\s*block/s);
  assert.match(styles, /\.home-title-primary\s*\{[^}]*color:\s*var\(--home-blue\)/s);
  assert.match(styles, /\.home-title-secondary\s*\{[^}]*color:\s*var\(--home-ink\)/s);
  assert.match(home, /\{publishedWordCount\.toLocaleString\("en-US"\)\} HSK words\. Build vocabulary, train your ear and practise writing/);
  assert.match(home, /Not every published word has audio/);
  assert.match(home, /<HomeLearningScene\s*\/>/);
  assert.match(learningScene, /See it\. Hear it\. Write it\./);
  assert.match(learningScene, /Stroke order/);
  assert.match(learningScene, /Build vocabulary/);
  assert.doesNotMatch(home, /Live study preview|HSK 1 · Today|About 4 min/);
  assert.match(home, /Learn focused vocabulary/);
  assert.match(home, /Practise listening/);
  assert.match(home, /Complete today’s review/);
  assert.match(home, /getHsk3LevelPreview\(1, 120\)/);
  assert.doesNotMatch(home, /home-study-card|home-product-word/);
  assert.doesNotMatch(home, /<audio/);
  assert.doesNotMatch(home, /home-product-route|home-product-options|Which meaning matches this word\?|home-word-card/);
  assert.doesNotMatch(styles, /\.home-word-card\s*\{[^}]*position:\s*absolute/s);
});

test("homepage demo resolves exactly five real published HSK 1 words", () => {
  assert.ok(runtimeIndex.runtimeWords["1"]?.length >= 5);
  assert.match(home, /levelOnePreviewWords\.slice\(0, 5\)/);
  assert.match(home, /<HomeQuickFlashcards cards=\{demoCards\}/);
});

test("homepage CTA uses one learning label and the server-side learning dispatcher", () => {
  assert.match(nextStep, /Start learning free/);
  assert.match(nextStep, /Preview five flashcards/);
  assert.match(nextStep, /href="\/start"/);
  assert.doesNotMatch(nextStep, /action\.href|returningAccount|\/api\/v1\/learning/);
  assert.doesNotMatch(nextStep, /home-cta-explanation/);
  assert.doesNotMatch(nextStep, /Start my free Pro trial/);
  assert.doesNotMatch(nextStep, /Continue today’s study/);
  assert.doesNotMatch(nextStep, /Review due items/);
  assert.match(nextStep, /home-cta-primary/);
  assert.match(nextStep, /home-cta-secondary/);
  assert.match(nextStep, /No card required/);
  assert.match(nextStep, /Free daily practice/);
  assert.match(nextStep, /Start without an account/);
  assert.doesNotMatch(nextStep, /7-day Pro trial/);
  assert.match(home, /7-day Pro trial requires no card and returns to Free automatically/);
  assert.doesNotMatch(nextStep, /home-cta-free/);
  assert.match(home, /Free includes the published catalog, core practice, 10 new items and 20 successful SRS ratings daily\./);
  assert.doesNotMatch(nextStep, /home-cta-panel/);
});

test("homepage tells one learning story before compact catalog, trust, FAQ and final action", () => {
  expectInOrder(home, [
    "Build your HSK vocabulary.",
    "<HomeQuickFlashcards cards={demoCards}",
    "<HomeTools/>",
    "Find your starting point.",
    "<HomeSkills/>",
    "Learn words you can put to use.",
    "<HomeGuides/>",
    "home-trust-note",
    "Frequently asked questions",
    "Start with the right level.",
  ]);
  for (const lowFrequencyTool of ["Basic Mock", "Advanced Mock", "Reading"]) assert.doesNotMatch(home, new RegExp(`title: \"${lowFrequencyTool}\"`));
  assert.match(home, /Unified advanced band/);
});

test("everyday learning scenes use optimized local illustrations with real topic destinations", async () => {
  for (const asset of ["daily-life", "food-drink", "travel-transport"]) {
    assert.match(home, new RegExp(`/topics/${asset}`));
    const file = new URL(`../public/illustrations/${asset}.webp`, import.meta.url);
    const metadata = await sharp(fileURLToPath(file)).metadata();
    assert.equal(metadata.width, 768);
    assert.equal(metadata.height, 512);
    assert.equal(metadata.format, "webp");
    assert.ok(fs.statSync(file).size < 150_000);
  }
  assert.doesNotMatch(home, /Rated \d|pass rate|testimonials/i);
});

test("homepage FAQ has six concise truthful questions and FAQ structured data", () => {
  assert.match(home, /"@type": "FAQPage"/);
  assert.match(home, /Frequently asked questions/);
  const questions = [
    "Which version of HSK does HSKKit use?",
    "Is Placement an official HSK result?",
    "What is included in Free and Pro?",
    "Can I start without signing in?",
    "How much of the catalog has audio?",
    "How do subscriptions, cancellation and refunds work?",
  ];
  for (const question of questions) assert.match(home, new RegExp(question.replace(/[?.]/g, "\\$&")));
  assert.equal((home.match(/question:/g) ?? []).length, 6);
  assert.match(home, /<details/);
  assert.match(home, /<summary/);
  assert.match(home, /href: "\/pricing"/);
  assert.match(home, /Not every published word has audio/);
  assert.match(home, /href: "\/hsk-3-0"/);
  assert.match(home, /href: "\/refund-policy"/);
});

test("content disclosures stay available without a repeated marketing band", () => {
  assert.match(home, /home-trust-note/);
  assert.match(home, /Content &amp; audio sources/);
  assert.match(home, /href="\/content-license"/);
  assert.match(home, /entry\.wordCount\.toLocaleString/);
  assert.match(home, /advancedLevel\.wordCount\.toLocaleString/);
  assert.match(home, /total \+ entry\.wordCount/);
  assert.doesNotMatch(home, /home-transparency|home-tool-grid|Published\. Clear/);
});

test("visual system is scoped, responsive, accessible and motion-safe", () => {
  for (const className of ["home-hero", "home-product-shell", "home-scene-grid", "home-faq-list", "home-flow-card", "home-level-row"]) {
    assert.match(styles, new RegExp(`\\.${className}`));
  }
  assert.match(styles, /@media \(max-width: 639px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /focus-visible/);
  assert.match(styles, /overflow-wrap/);
  assert.match(styles, /\.home-faq-list summary\s*\{[^}]*font-size:\s*18px/s);
  assert.match(styles, /@media \(max-width: 639px\)[\s\S]*\.home-faq-list summary\s*\{[^}]*font-size:\s*17px/s);
  assert.match(footer, /resource-footer-inner/);
  assert.match(footer, /resource-footer-mobile/);
});
