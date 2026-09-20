import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  BLOG_PUBLIC_REVALIDATE_SECONDS,
  BLOG_PUBLIC_LIST_TAG,
  blogPostTag,
  publicBlogInvalidationTags,
} from "../src/lib/blog/cache-policy.ts";

const root = new URL("../", import.meta.url);
const source = (path: string) => readFileSync(new URL(path, root), "utf8");

test("public Blog cache policy is short, versioned by tags, and invalidates only publication changes", () => {
  assert.equal(BLOG_PUBLIC_REVALIDATE_SECONDS, 120);
  assert.equal(BLOG_PUBLIC_LIST_TAG, "blog:public:list");
  assert.equal(blogPostTag("guide-one"), "blog:public:post:guide-one");
  assert.deepEqual(publicBlogInvalidationTags("publish", "guide-one"), [BLOG_PUBLIC_LIST_TAG, blogPostTag("guide-one")]);
  assert.deepEqual(publicBlogInvalidationTags("schedule", "guide-one"), [BLOG_PUBLIC_LIST_TAG, blogPostTag("guide-one")]);
  assert.deepEqual(publicBlogInvalidationTags("withdraw", "guide-one"), [BLOG_PUBLIC_LIST_TAG, blogPostTag("guide-one")]);
  assert.deepEqual(publicBlogInvalidationTags("save", "guide-one"), []);
  assert.deepEqual(publicBlogInvalidationTags("autosave", "guide-one"), []);
});

test("public list, detail, related, feed and sitemap reads use tagged short-lived data caches", () => {
  const cache = source("src/lib/blog/cache.ts");
  for (const marker of [
    "listCachedPublishedBlogPosts",
    "getCachedPublishedBlogPostBySlug",
    "listCachedRelatedBlogPosts",
    "listCachedPublishedBlogFeed",
    "listCachedPublishedBlogSlugs",
  ]) assert.match(cache, new RegExp(marker));
  assert.match(cache, /unstable_cache/);
  assert.match(cache, /revalidate:\s*BLOG_PUBLIC_REVALIDATE_SECONDS/);
  assert.match(cache, /BLOG_PUBLIC_LIST_TAG/);
  assert.match(cache, /blogPostTag\(slug\)/);

  const index = source("src/app/blog/page.tsx");
  const detail = source("src/app/blog/[slug]/page.tsx");
  const rss = source("src/app/blog/rss.xml/route.ts");
  const sitemap = source("src/app/sitemap.ts");
  assert.match(index, /listCachedPublishedBlogPosts/);
  assert.doesNotMatch(index, /listPublishedBlogPosts/);
  assert.match(detail, /getCachedPublishedBlogPostBySlug/);
  assert.match(detail, /listCachedRelatedBlogPosts/);
  assert.match(rss, /listCachedPublishedBlogFeed/);
  assert.match(sitemap, /listCachedPublishedBlogSlugs/);
  assert.doesNotMatch(sitemap, /content\/blog\/manifest\.json/);
  assert.match(sitemap, /export const dynamic = "force-dynamic"/);
  assert.match(sitemap, /export default async function sitemap/);
});

test("successful publish, schedule and withdraw mutations invalidate list and exact slug tags", () => {
  const route = source("src/app/api/v1/admin/blog/[id]/route.ts");
  assert.match(route, /publicBlogInvalidationTags\(intent,\s*post\.slug\)/);
  assert.match(route, /unstable_expireTag\(\.\.\.tags\)/);
  assert.match(route, /await saveBlogPost[\s\S]*publicBlogInvalidationTags/);
});

test("OpenNext enables the infrastructure required for tag and time-based revalidation", () => {
  const config = source("open-next.config.ts");
  const wrangler = source("wrangler.jsonc");

  assert.match(config, /d1NextTagCache/);
  assert.match(config, /doQueue/);
  assert.match(config, /tagCache:\s*d1NextTagCache/);
  assert.match(config, /queue:\s*doQueue/);
  assert.match(wrangler, /"binding":\s*"NEXT_TAG_CACHE_D1"/);
  assert.match(wrangler, /"binding":\s*"WORKER_SELF_REFERENCE"/);
  assert.match(wrangler, /"name":\s*"NEXT_CACHE_DO_QUEUE"/);
});

test("Admin, draft, preview and version surfaces remain private and no-store", () => {
  const files = [
    "src/app/api/v1/admin/blog/route.ts",
    "src/app/api/v1/admin/blog/[id]/route.ts",
    "src/app/api/v1/admin/blog/[id]/versions/route.ts",
    "src/app/api/v1/admin/blog/media/route.ts",
    "src/app/api/v1/admin/blog/access/route.ts",
  ];
  for (const file of files) assert.match(source(file), /private, no-store/);
  assert.match(source("src/app/admin/blog/page.tsx"), /dynamic="force-dynamic"/);
  assert.match(source("src/app/admin/blog/page.tsx"), /nocache:true/);
});

test("phase four preserves Blog SEO, canonical, schema, RSS and published-version CMS contracts", () => {
  const detail = source("src/app/blog/[slug]/page.tsx");
  const rss = source("src/app/blog/rss.xml/route.ts");
  const sitemap = source("src/app/sitemap.ts");
  const repository = source("src/lib/blog/repository.ts");
  assert.match(detail, /alternates:\s*\{ canonical:/);
  assert.match(detail, /BlogPosting/);
  assert.match(detail, /FAQPage/);
  assert.match(rss, /application\/rss\+xml/);
  assert.match(sitemap, /listCachedPublishedBlogSlugs/);
  assert.match(repository, /listPublishedBlogSlugs[\s\S]*JOIN blog_post_versions[\s\S]*published_version_number/);
  assert.match(repository, /published_version_number/);
  assert.match(repository, /p\.status='published'/);
});
