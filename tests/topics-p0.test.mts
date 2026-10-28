import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { findCatalogWordsByIds, getUniqueActiveCatalogSearchRelease } from "../src/lib/content/catalog-search.ts";

const file = (path: string) => new URL(path, import.meta.url);
const read = (path: string) => fs.readFileSync(file(path), "utf8");

function activeReleaseDb(rows: Array<{ id: string; version: number; published_at: string; word_count: number }>) {
  return {
    prepare(sql: string) {
      assert.match(sql, /WHERE active=1/);
      assert.match(sql, /LIMIT 2/);
      return {
        bind() { return this; },
        async first() { return null; },
        async all() { return { success: true, results: rows }; },
      };
    },
  };
}

const requiredFiles = [
  "../src/lib/topics/catalog.ts",
  "../src/lib/topics/server.ts",
  "../src/app/topics/page.tsx",
  "../src/app/topics/[slug]/page.tsx",
];

test("P0 topic runtime accepts exactly one active content release and rejects zero or multiple", async () => {
  const release = { id: "hsk3-content-truth-v5", version: 5, published_at: "2026-08-01", word_count: 11092 };
  assert.equal(await getUniqueActiveCatalogSearchRelease(activeReleaseDb([])), null);
  assert.deepEqual(await getUniqueActiveCatalogSearchRelease(activeReleaseDb([release])), release);
  assert.equal(await getUniqueActiveCatalogSearchRelease(activeReleaseDb([release, { ...release, id: "ambiguous-v6", version: 6 }])), null);
});

test("P0 topic word lookup is bound to the uniquely verified release", async () => {
  const assetId = "hsk3.word.l1.0459.v1";
  let sql = "";
  let bindings: Array<string | number> = [];
  const row = {
    id: assetId,
    release_id: "hsk3-content-truth-v5",
    standard_version: "3.0",
    content_version: "1",
    level_band: "1",
    hanzi: "起床",
    traditional: "起床",
    pinyin: "qǐ chuáng",
    meaning: "get up",
    part_of_speech: "verb",
    search_pinyin: "qichuang",
    sort_level: 1,
  };
  const db = {
    prepare(value: string) {
      sql = value;
      return {
        bind(...values: Array<string | number>) { bindings = values; return this; },
        async first() { return null; },
        async all() { return { success: true, results: [row] }; },
      };
    },
  };
  const rows = await findCatalogWordsByIds(db, [assetId], row.release_id);
  assert.match(sql, /WHERE i\.release_id = \?/);
  assert.doesNotMatch(sql, /r\.active/);
  assert.deepEqual(bindings, [row.release_id, assetId]);
  assert.equal(rows[0]?.id, assetId);
});

test("P0 topic browsing has a versioned catalog plus index and detail routes", () => {
  for (const path of requiredFiles) {
    assert.equal(fs.existsSync(file(path)), true, `${path} must exist`);
  }
});

test("P0 topic catalog uses original published collections backed by active HSK word assets", async () => {
  const { topicCategories, learningTopics, publishedTopicRoutesForVerifiedAssets, topicsSourceReleaseId } = await import("../src/lib/topics/catalog.ts");
  assert.deepEqual(topicCategories.map((category) => category.slug), ["daily-life", "food-drink", "travel-transport"]);
  assert.equal(learningTopics.length, 12);
  assert.equal(learningTopics.every((topic) => topic.status === "published"), true);
  const p2Slugs = new Set(["restaurant-basics", "cooking-at-home", "morning-routine", "time-and-plans", "weather-and-seasons", "departure-and-arrival", "getting-around-town", "hotel-stay"]);
  const p3Slugs = new Set(["home-chores", "cafe-and-drinks", "travel-problems"]);
  assert.equal(learningTopics.every((topic) => topic.contentVersion === (topic.slug === "grocery-shopping" ? "2026.09-grocery-sample-p1" : p2Slugs.has(topic.slug) ? "2026.09-topics-p2" : p3Slugs.has(topic.slug) ? "2026.09-topics-p3" : "2026.09-topics-p0")), true);
  assert.equal(learningTopics.every((topic) => topic.sourceReleaseId === topicsSourceReleaseId), true);
  assert.equal(learningTopics.every((topic) => topic.wordAssetIds.length >= 8), true);
  assert.equal(new Set(learningTopics.map((topic) => topic.slug)).size, learningTopics.length);
  assert.equal(learningTopics.some((topic) => /hsklord/i.test(`${topic.title} ${topic.description}`)), false);

  const catalog = JSON.parse(read("../src/lib/content/catalog.json"));
  const activeReleaseId = catalog.activeReleaseByStandard.hsk3;
  const release = catalog.releases.find((entry: { id: string }) => entry.id === activeReleaseId);
  const activeIds = new Set<string>(release.contentAssetIds);
  for (const topic of learningTopics) {
    assert.equal(new Set(topic.wordAssetIds).size, topic.wordAssetIds.length, `${topic.slug} must not repeat a word`);
    for (const assetId of topic.wordAssetIds) {
      assert.match(assetId, /^hsk3\.word\.l[1-7]\.\d{4}\.v\d+$/);
      assert.equal(activeIds.has(assetId), true, `${assetId} must belong to the active release`);
    }
  }
  const expectedRoutes = [
    "/topics",
    "/topics/daily-life",
    "/topics/food-drink",
    "/topics/travel-transport",
    ...learningTopics.map((topic) => `/topics/${topic.slug}`),
  ];
  assert.deepEqual(publishedTopicRoutesForVerifiedAssets(null, activeIds), []);
  assert.deepEqual(publishedTopicRoutesForVerifiedAssets("withdrawn-release", activeIds), []);
  const incompleteIds = new Set(activeIds);
  incompleteIds.delete(learningTopics[0].wordAssetIds[0]);
  assert.deepEqual(publishedTopicRoutesForVerifiedAssets(topicsSourceReleaseId, incompleteIds), []);
  assert.deepEqual(publishedTopicRoutesForVerifiedAssets(topicsSourceReleaseId, activeIds), expectedRoutes);
});

test("P0 topic pages expose SEO, breadcrumbs, readable production cards, real word detail, formal audio truth and practice paths", () => {
  const index = read("../src/app/topics/page.tsx");
  const card = read("../src/app/topics/topic-card.tsx");
  const detail = read("../src/app/topics/[slug]/page.tsx");
  const sitemap = read("../src/app/sitemap.ts");
  assert.match(index, /canonical:\s*"\/topics"/);
  assert.match(index, /Learn Chinese through real-life topics/);
  assert.match(index, /href=\{`\/topics\/\$\{visibleCategories\[0\]\.slug\}`\}/);
  assert.match(index, /Start with \{visibleCategories\[0\]\.title\}/);
  assert.match(index, /bg-gradient-to-br[^\n]*from-blue-50/);
  assert.match(index, /<h1 className="[^"]*text-slate-950[^"]*">Learn Chinese through real-life topics<\/h1>/);
  assert.doesNotMatch(card, /<dd className="[^"]*truncate[^"]*"[^>]*>\{topic\.levelBands/);
  assert.match(index, /revalidate\s*=\s*86_400/);
  assert.doesNotMatch(index, /force-dynamic/);
  assert.match(index, /robots:\s*ready/);
  assert.match(index, /LearningResource/);
  assert.match(detail, /<h1 className="[^"]*text-white[^"]*">\{topic\.title\}<\/h1>/);
  assert.match(detail, /href=\{`\/topics\/\$\{topics\[0\]\.slug\}`\}/);
  assert.match(detail, /Start recommended topic/);
  assert.ok((detail.match(/href="\/" className="inline-flex min-h-11[^\n]*px-1/g) ?? []).length >= 2);
  assert.match(detail, /generateMetadata/);
  assert.match(detail, /BreadcrumbList/);
  assert.match(detail, /getVerifiedTopicWords/);
  assert.match(detail, /robots:\s*ready\s*\?\s*undefined\s*:\s*\{\s*index:\s*false/);
  assert.match(detail, /audioAsset/);
  assert.match(detail, /AudioPlaybackControl/);
  assert.match(index, /href="\/" className="inline-flex min-h-11 items-center/);
  assert.ok((detail.match(/href="\/" className="inline-flex min-h-11 items-center/g) ?? []).length >= 2);
  assert.ok((detail.match(/href="\/topics" className="inline-flex min-h-11 items-center/g) ?? []).length >= 2);
  assert.match(detail, /\/word\/\$\{encodeURIComponent\(word\.assetId\)\}/);
  assert.match(detail, /\/word\/\$\{encodeURIComponent\(word\.assetId\)\}\/practice/);
  assert.match(sitemap, /publishedTopicRoutesForVerifiedAssets/);
  assert.match(sitemap, /topicsSourceReleaseId/);
  assert.doesNotMatch(sitemap, /force-dynamic|getCloudflareContext|LEARNING_DB/);
  assert.doesNotMatch(sitemap, /lastModified:\s*new Date\(\)/);
});

test("P0 Learn navigation places Topics between Vocabulary and Grammar", async () => {
  const { siteNavigation } = await import("../src/app/site-navigation.ts");
  assert.deepEqual(siteNavigation[0].items?.map((item) => item.label), [
    "Today", "Planner", "Levels", "Vocabulary", "Flashcards", "Topics", "Grammar", "Reading", "Listening library",
  ]);
  assert.equal(siteNavigation[0].items?.find((item) => item.label === "Topics")?.href, "/topics");
});
