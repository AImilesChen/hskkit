import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const home = read("../src/app/page.tsx");
const nextStep = read("../src/app/components/home-next-step.tsx");
const footer = read("../src/app/site-footer.tsx");
const styles = read("../src/app/homepage.css");
const topicCatalog = read("../src/lib/topics/catalog.ts");
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

test("homepage leads with a concise result and one authentic learning-path proof", () => {
  assert.match(home, /Find your HSK level\./);
  assert.match(home, /Know what to study next\./);
  assert.match(home, /Example learning path/);
  assert.match(home, /Review due items/);
  assert.match(home, /Learn focused vocabulary/);
  assert.match(home, /Practise listening/);
  assert.match(home, /Complete today’s review/);
  assert.match(home, /getHsk3LevelPreview\(1, 120\)/);
  assert.match(home, /formalWordAudioUrlByContentId/);
  assert.match(home, /find\(\(word\) => formalWordAudioUrlByContentId\.has\(word\.id\)\)/);
  assert.match(home, /<audio/);
  assert.match(home, /Try this practice/);
  assert.doesNotMatch(home, /home-word-card/);
  assert.doesNotMatch(styles, /\.home-word-card\s*\{[^}]*position:\s*absolute/s);
});

test("homepage hero resolves an approved readable audio asset and practice route", () => {
  const approvedWordAudio = new Map(runtimeIndex.publishedAudioAssets
    .filter((asset) => asset.audioKind === "word" && asset.qaStatus === "approved")
    .map((asset) => [asset.contentAssetId, asset]));
  const previewWord = runtimeIndex.runtimeWords["1"]?.slice(0, 120).find((word) => approvedWordAudio.has(word.id));
  assert.ok(previewWord, "the Level 1 preview window must contain an approved word-audio item");
  const audio = approvedWordAudio.get(previewWord.id);
  assert.ok(audio);
  assert.ok(fs.statSync(new URL(`../public/${audio.storageKey}`, import.meta.url)).size > 0, "the approved audio file must be readable");
  assert.ok(fs.existsSync(new URL("../src/app/word/[slug]/practice/page.tsx", import.meta.url)), "the preview practice route must exist");
});

test("homepage CTA has one primary action while preserving dynamic return-user behavior", () => {
  assert.match(nextStep, /Find my starting level/);
  assert.match(nextStep, /Browse HSK 3\.0 levels/);
  assert.match(nextStep, /Continue today’s study/);
  assert.match(nextStep, /Review due items/);
  assert.match(nextStep, /home-cta-primary/);
  assert.match(nextStep, /home-cta-secondary/);
  assert.match(nextStep, /Start as a guest/);
  assert.match(nextStep, /Placement is a learning suggestion/);
  assert.match(nextStep, /Sign in later to sync/);
  assert.doesNotMatch(nextStep, /home-cta-panel/);
  assert.match(home, /Find my starting level/);
});

test("homepage tells one learning story before compact catalog, tools, FAQ and final action", () => {
  expectInOrder(home, [
    "Find your HSK level.",
    "One connected path from level check to daily review.",
    "Study fits the rhythm of real life.",
    "Explore the published HSK 3.0 catalog.",
    "Choose a tool for the task in front of you.",
    "Published and transparent",
    "Frequently asked questions",
    "Start with the right level.",
  ]);
  for (const group of ["Start", "Learn", "Practise", "Reference"]) assert.match(home, new RegExp(`title: \"${group}\"`));
  assert.match(home, /Unified advanced band/);
});

test("learning atmosphere uses three responsive optimized local scene assets and does not invent proof", async () => {
  for (const asset of ["desk-practice", "mobile-listening", "tablet-review"]) {
    assert.match(home, new RegExp(asset));
  }
  assert.match(home, /<picture>/);
  assert.match(home, /type="image\/avif"/);
  assert.match(home, /type="image\/webp"/);
  assert.match(home, /-640\.avif/);
  assert.match(home, /-1200\.webp/);
  assert.match(home, /Desktop practice/);
  assert.match(home, /Listening practice/);
  assert.match(home, /Today’s queue/);
  assert.match(home, /\/topics\/grocery-shopping\/practice/);
  assert.ok(fs.existsSync(new URL("../src/app/topics/[slug]/practice/page.tsx", import.meta.url)), "the topic practice route must exist");
  const groceryStart = topicCatalog.indexOf('slug: "grocery-shopping"');
  const groceryEnd = topicCatalog.indexOf("\n  },", groceryStart);
  assert.ok(groceryStart >= 0 && groceryEnd > groceryStart);
  assert.match(topicCatalog.slice(groceryStart, groceryEnd), /status: "published"/);
  assert.match(styles, /object-fit: contain/);
  assert.doesNotMatch(styles, /\.home-scene-1 picture\s*\{[^}]*min-height/s);
  assert.match(home, /\(min-width: 1024px\) 52vw/);
  assert.match(home, /\(min-width: 1024px\) 30vw/);
  for (const asset of ["desk-practice", "mobile-listening", "tablet-review"]) {
    for (const width of [640, 1200]) {
      for (const extension of ["avif", "webp"]) {
        const file = new URL(`../public/home/${asset}-${width}.${extension}`, import.meta.url);
        assert.ok(fs.statSync(file).size > 5_000, `${asset}-${width}.${extension} must be a real optimized image`);
        const metadata = await sharp(fileURLToPath(file)).metadata();
        assert.equal(metadata.width, width);
        assert.equal(metadata.height, width * 9 / 16);
        assert.equal(metadata.format, extension === "avif" ? "heif" : extension);
        if (extension === "avif") assert.ok(fs.readFileSync(file).subarray(0, 32).includes(Buffer.from("avif")));
      }
    }
  }
  assert.doesNotMatch(home, /learners|pass rate|five-star|testimonial/i);
});

test("homepage FAQ has eight truthful questions and FAQ structured data", () => {
  assert.match(home, /"@type": "FAQPage"/);
  assert.match(home, /Frequently asked questions/);
  const questions = [
    "What is HSK 3.0?",
    "How does the starting-level check work?",
    "Is the placement result an official HSK score?",
    "What can I use for free?",
    "What does Pro include?",
    "Does every published word have audio?",
    "Why are Levels 7–9 shown as one advanced band?",
    "Can I start as a guest and sync later?",
  ];
  for (const question of questions) assert.match(home, new RegExp(question.replace(/[?.]/g, "\\$&")));
  assert.match(home, /<details/);
  assert.match(home, /<summary/);
  assert.match(home, /href: "\/pricing"/);
  assert.match(home, /No\. Not every word in the published catalog has audio\./);
  assert.match(home, /href: "\/hsk-3-0"/);
  assert.match(home, /href="\/refund-policy"/);
});

test("visual system is scoped, responsive, accessible and motion-safe", () => {
  for (const className of ["home-hero", "home-product-shell", "home-scene-grid", "home-faq-list", "home-flow-card", "home-level-card", "home-tool-card"]) {
    assert.match(styles, new RegExp(`\\.${className}`));
  }
  assert.match(styles, /@media \(max-width: 639px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /focus-visible/);
  assert.match(styles, /overflow-wrap/);
  assert.match(footer, /footer-density-shell/);
  assert.match(footer, /pb-\[32px\]/);
});
