import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const sitemapSource = fs.readFileSync(new URL("../src/app/sitemap.ts", import.meta.url), "utf8");

test("sitemap generation stays off D1 so crawlers cannot exhaust the database queue", () => {
  assert.doesNotMatch(sitemapSource, /getVerifiedTopicsSnapshot|listPublishedBlogSlugs/);
  assert.doesNotMatch(sitemapSource, /dynamic\s*=\s*["']force-dynamic["']/);
  assert.match(sitemapSource, /content\/blog\/manifest\.json/);
  assert.match(sitemapSource, /publishedTopicRoutesForVerifiedAssets/);
});
