import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const sitemapSource = fs.readFileSync(new URL("../src/app/sitemap.ts", import.meta.url), "utf8");

test("sitemap uses the shared short-lived Blog cache instead of uncached repository reads", () => {
  assert.doesNotMatch(sitemapSource, /getVerifiedTopicsSnapshot|listPublishedBlogSlugs/);
  assert.match(sitemapSource, /dynamic\s*=\s*["']force-dynamic["']/);
  assert.match(sitemapSource, /listCachedPublishedBlogSlugs/);
  assert.doesNotMatch(sitemapSource, /content\/blog\/manifest\.json/);
  assert.match(sitemapSource, /publishedTopicRoutesForVerifiedAssets/);
});
