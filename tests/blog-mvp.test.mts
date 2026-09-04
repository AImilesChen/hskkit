import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import {
  isBlogPublicEnabled,
  isEmailAllowed,
  isSameOriginRequest,
  markdownToSafeHtml,
  normalizeBlogInput,
  safeMediaKey,
} from "../src/lib/blog/domain.ts";

const root = new URL("../", import.meta.url);
const source = (path: string) => readFileSync(new URL(path, root), "utf8");

test("Blog stays publicly closed unless explicitly enabled", () => {
  assert.equal(isBlogPublicEnabled(undefined), false);
  assert.equal(isBlogPublicEnabled("false"), false);
  assert.equal(isBlogPublicEnabled("true"), true);
});

test("admin allowlist is exact, normalized, and fail-closed", () => {
  assert.equal(isEmailAllowed("Owner@Example.com", "owner@example.com,publisher@example.com"), true);
  assert.equal(isEmailAllowed("owner@example.com.evil", "owner@example.com"), false);
  assert.equal(isEmailAllowed("owner@example.com", undefined), false);
});

test("same-origin writes use the public Host and reject cross-site requests", () => {
  assert.equal(isSameOriginRequest(new Request("http://localhost/internal", {
    headers: { host: "127.0.0.1:3101", origin: "http://127.0.0.1:3101", "sec-fetch-site": "same-origin" },
  })), true);
  assert.equal(isSameOriginRequest(new Request("https://hskkit.com/internal", {
    headers: { host: "hskkit.com", origin: "https://evil.example", "sec-fetch-site": "cross-site" },
  })), false);
});

test("article input is bounded and slugged safely", () => {
  const value = normalizeBlogInput({
    title: "  How to Review HSK Vocabulary  ",
    excerpt: "A practical routine for spaced review.",
    slug: "How to Review HSK Vocabulary!",
    contentMarkdown: "## Build a small daily habit\n\nReview what is due.",
  });
  assert.equal(value.slug, "how-to-review-hsk-vocabulary");
  assert.equal(value.title, "How to Review HSK Vocabulary");
  assert.throws(() => normalizeBlogInput({ title: "x", excerpt: "short", slug: "x", contentMarkdown: "tiny" }), /INVALID_/);
});

test("Markdown renderer escapes raw HTML and unsafe links", () => {
  const html = markdownToSafeHtml("# Safe\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))\n\n**Useful**");
  assert.match(html, /<h1>Safe<\/h1>/);
  assert.doesNotMatch(html, /<script/i);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /href="javascript:/i);
  assert.match(html, /<strong>Useful<\/strong>/);
  assert.doesNotMatch(markdownToSafeHtml("![tracking](https://tracker.example/pixel.png)"), /<img/);
  assert.match(markdownToSafeHtml("![lesson](/api/v1/blog/media/blog/2026/lesson.png)"), /<img/);
});

test("media keys reject traversal and preserve only managed keys", () => {
  assert.equal(safeMediaKey("blog/2026/asset.webp"), "blog/2026/asset.webp");
  assert.equal(safeMediaKey("../secret"), undefined);
  assert.equal(safeMediaKey("commercial/file.pdf"), undefined);
});

test("migration stores posts, immutable versions and audit events", () => {
  const sql = source("migrations/0020_blog_mvp.sql");
  const immutableSql = source("migrations/0021_blog_version_immutability.sql");
  for (const table of ["blog_posts", "blog_post_versions", "blog_audit_logs"]) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  }
  assert.match(sql, /UNIQUE\(slug\)/);
  assert.match(sql, /CHECK\(status IN \('draft','published','withdrawn'\)\)/);
  const database = new DatabaseSync(":memory:");
  database.exec("PRAGMA foreign_keys=ON;");
  database.exec(sql);
  database.exec(immutableSql);
  database.exec("INSERT INTO blog_posts(id,slug,title,excerpt,content_markdown,status,revision,author_user_id,created_at,updated_at) VALUES('p1','guide','Guide title','A sufficiently long excerpt','A sufficiently long article body for the migration test','draft',1,'u1','2026-01-01','2026-01-01')");
  database.exec("INSERT INTO blog_post_versions(id,post_id,version_number,snapshot_json,created_by_user_id,created_at) VALUES('v1','p1',1,'{}','u1','2026-01-01')");
  assert.throws(() => database.exec("UPDATE blog_post_versions SET snapshot_json='{}' WHERE id='v1'"), /BLOG_VERSION_IMMUTABLE/);
  assert.throws(() => database.exec("DELETE FROM blog_post_versions WHERE id='v1'"), /BLOG_VERSION_IMMUTABLE/);
  database.close();
});

test("every admin write route requires Google allowlist and same-origin validation", () => {
  const collection = source("src/app/api/v1/admin/blog/route.ts");
  const item = source("src/app/api/v1/admin/blog/[id]/route.ts");
  const media = source("src/app/api/v1/admin/blog/media/route.ts");
  for (const route of [collection, item, media]) {
    assert.match(route, /requireBlogAdmin/);
    assert.match(route, /requireSameOrigin/);
  }
});

test("admin page is noindex and public surfaces include SEO feeds", () => {
  assert.match(source("src/app/admin/blog/page.tsx"), /index:\s*false/);
  assert.match(source("src/app/admin/blog/page.tsx"), /follow:\s*false/);
  assert.match(source("src/app/blog/[slug]/page.tsx"), /BlogPosting/);
  assert.match(source("src/app/blog/[slug]/page.tsx"), /BreadcrumbList/);
  assert.match(source("src/app/rss.xml/route.ts"), /application\/rss\+xml/);
  assert.match(source("src/app/sitemap.ts"), /listPublishedBlogPosts/);
  assert.match(source("src/app/sitemap.ts"), /blogEnabled \? \["\/blog"/);
});

test("public Blog surfaces fail closed, avoid shared caching and expose only public DTOs", () => {
  const listRoute = source("src/app/api/v1/blog/route.ts");
  const itemRoute = source("src/app/api/v1/blog/[slug]/route.ts");
  const feedRoute = source("src/app/rss.xml/route.ts");
  const page = source("src/app/blog/page.tsx");
  const repository = source("src/lib/blog/repository.ts");
  for (const route of [listRoute, itemRoute, feedRoute]) {
    assert.match(route, /no-store/);
    assert.doesNotMatch(route, /public, max-age/);
  }
  assert.match(listRoute, /blogPublicEnabled\(\).*404/s);
  assert.match(feedRoute, /blogPublicEnabled\(\).*404/s);
  assert.match(page, /if \(!enabled\) notFound\(\)/);
  assert.match(repository, /SELECT slug,title,excerpt,featured_image_key,featured_image_alt,published_at,updated_at FROM blog_posts WHERE status='published'/);
  assert.match(repository, /export type PublicBlogPostSummary/);
  assert.doesNotMatch(repository.match(/export type PublicBlogPostSummary[\s\S]*?};/)?.[0] || "", /authorUserId/);
});

test("admin editing and image upload fail closed on conflicts and unsafe payloads", () => {
  const repository = source("src/lib/blog/repository.ts");
  const access = source("src/lib/blog/access.ts");
  const mediaRoute = source("src/app/api/v1/admin/blog/media/route.ts");
  assert.match(repository, /results\[0\]\?\.meta\?\.changes/);
  assert.match(repository, /const expectedRevision = Number\(raw\.revision\)/);
  assert.match(repository, /current\.revision !== expectedRevision/);
  assert.match(repository, /WHERE id=\? AND revision=\?/);
  assert.match(repository, /BLOG_EDIT_CONFLICT/);
  assert.match(access, /"BLOG_EDIT_CONFLICT"/);
  assert.match(mediaRoute, /!lengthHeader/);
  assert.match(repository, /2 \* 1024 \* 1024/);
  assert.match(repository, /16_000_000/);
  assert.match(repository, /BLOG_MEDIA_R2\.delete\(key\)/);
  assert.doesNotMatch(repository, /"image\/gif"|"image\/webp"/);
});
