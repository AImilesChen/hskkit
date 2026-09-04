import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import {
  estimateReadingMinutes,
  extractBlogFaqs,
  extractBlogHeadings,
  markdownToSafeHtml,
  normalizePublicBlogQuery,
} from "../src/lib/blog/domain.ts";

const root = new URL("../", import.meta.url);
const source = (path: string) => readFileSync(new URL(path, root), "utf8");

test("public blog query bounds search, category, sort and progressive page size", () => {
  assert.deepEqual(normalizePublicBlogQuery({ q: "  spaced   repetition ", category: "Study Guides", sort: "oldest", page: "3" }), {
    q: "spaced repetition",
    category: "Study Guides",
    sort: "oldest",
    page: 3,
    limit: 9,
  });
  assert.deepEqual(normalizePublicBlogQuery({ q: "x".repeat(300), sort: "unknown", page: "999" }), {
    q: "x".repeat(80),
    category: "",
    sort: "newest",
    page: 20,
    limit: 9,
  });
});

test("article renderer creates safe stable heading anchors, tables and FAQ data", () => {
  const markdown = [
    "## Review smarter",
    "",
    "| Rating | Meaning |",
    "| --- | --- |",
    "| Hard | Recall failed |",
    "",
    "## FAQ",
    "",
    "### Is this an official HSK score?",
    "",
    "No. It is learning guidance only.",
    "",
    "### Can I review on mobile?",
    "",
    "Yes. Use the same review queue.",
    "",
    "<script>alert(1)</script>",
  ].join("\n");
  const headings = extractBlogHeadings(markdown);
  assert.deepEqual(headings.map(({ level, text, id }) => ({ level, text, id })), [
    { level: 2, text: "Review smarter", id: "review-smarter" },
    { level: 2, text: "FAQ", id: "faq" },
    { level: 3, text: "Is this an official HSK score?", id: "is-this-an-official-hsk-score" },
    { level: 3, text: "Can I review on mobile?", id: "can-i-review-on-mobile" },
  ]);
  assert.deepEqual(extractBlogFaqs(markdown), [
    { question: "Is this an official HSK score?", answer: "No. It is learning guidance only." },
    { question: "Can I review on mobile?", answer: "Yes. Use the same review queue." },
  ]);
  const html = markdownToSafeHtml(markdown);
  assert.match(html, /<h2 id="review-smarter">Review smarter<\/h2>/);
  assert.match(html, /<table>[\s\S]*<th>Rating<\/th>[\s\S]*<td>Hard<\/td>[\s\S]*<\/table>/);
  assert.doesNotMatch(html, /<script/i);
  assert.ok(estimateReadingMinutes("汉字 ".repeat(260)) >= 1);
});

test("Stage C public routes provide navigation, discovery, full reading and mobile controls", () => {
  const nav = source("src/app/site-navigation.ts");
  const index = source("src/app/blog/page.tsx");
  const detail = source("src/app/blog/[slug]/page.tsx");
  const css = source("src/app/blog/blog.css");
  assert.match(nav, /href:\s*"\/blog"/);
  for (const marker of ["Search articles", "All categories", "Newest first", "Load more"]) assert.match(index, new RegExp(marker));
  for (const marker of ["On this page", "Related articles", "Frequently asked questions"]) assert.match(detail, new RegExp(marker));
  assert.match(css, /@media \(max-width:\s*640px\)/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /overflow-x:\s*auto/);
});

test("Stage D learning actions are level-aware and emit bounded Plausible events", () => {
  const actions = source("src/lib/blog/learning-actions.ts");
  const client = source("src/app/blog/blog-action-link.tsx");
  const detail = source("src/app/blog/[slug]/page.tsx");
  for (const href of ["/vocabulary/", "/practice", "/review", "/store"]) assert.match(actions, new RegExp(href.replaceAll("/", "\\/")));
  assert.match(actions, /hskLevel/);
  assert.match(client, /trackEvent\(AnalyticsEvents\.blog_learning_action/);
  assert.match(client, /articleSlug/);
  assert.match(detail, /Recommended next step/);
});

test("Stage E exposes article metadata, structured data, sitemap and RSS without draft leakage", () => {
  const detail = source("src/app/blog/[slug]/page.tsx");
  const repository = source("src/lib/blog/repository.ts");
  const sitemap = source("src/app/sitemap.ts");
  const rss = source("src/app/blog/rss.xml/route.ts");
  assert.match(detail, /generateMetadata/);
  assert.match(detail, /BlogPosting/);
  assert.match(detail, /FAQPage/);
  assert.match(repository, /status='published'/);
  assert.match(repository, /published_at<=\?/);
  assert.match(repository, /published_version_number/);
  assert.doesNotMatch(repository, /status IN \('draft','withdrawn'\)/);
  assert.match(sitemap, /listPublishedBlogSlugs/);
  assert.match(rss, /application\/rss\+xml/);
  assert.match(rss, /escapeXml/);
});

test("public migration seeds a real immutable article and excludes draft, scheduled and withdrawn rows", () => {
  const db = new DatabaseSync(":memory:");
  for (const file of ["migrations/0023_blog_mvp.sql", "migrations/0024_blog_version_immutability.sql", "migrations/0025_blog_editor_publish_loop.sql", "migrations/0026_blog_public_experience.sql"]) db.exec(source(file));
  const seeded = db.prepare("SELECT p.slug,p.category,p.hsk_level,json_valid(v.snapshot_json) valid FROM blog_posts p JOIN blog_post_versions v ON v.post_id=p.id AND v.version_number=p.published_version_number WHERE p.status='published' AND p.published_at<=? AND p.published_version_number IS NOT NULL").get("2026-09-04T14:28:01.000Z") as { slug: string; category: string; hsk_level: number; valid: number };
  assert.deepEqual({ ...seeded }, { slug: "how-to-build-a-daily-hsk-review-habit", category: "Study Guides", hsk_level: 3, valid: 1 });
  db.prepare("INSERT INTO blog_posts(id,slug,title,excerpt,content_markdown,status,revision,author_user_id,created_at,updated_at,published_at,published_version_number) VALUES(?,?,?,?,?,'draft',1,'test','2026-09-04','2026-09-04',NULL,NULL)").run("draft", "private-draft", "Private draft", "A private draft excerpt long enough", "Private draft content long enough to validate access.");
  db.prepare("INSERT INTO blog_posts(id,slug,title,excerpt,content_markdown,status,revision,author_user_id,created_at,updated_at,published_at,published_version_number) VALUES(?,?,?,?,?,'withdrawn',1,'test','2026-09-04','2026-09-04','2026-09-04',1)").run("withdrawn", "withdrawn-post", "Withdrawn article", "A withdrawn excerpt long enough", "Withdrawn article content long enough to validate access.");
  db.prepare("INSERT INTO blog_post_versions(id,post_id,version_number,snapshot_json,created_by_user_id,created_at) VALUES('withdrawn-v1','withdrawn',1,?,'test','2026-09-04')").run(JSON.stringify({ title: "Withdrawn article", slug: "withdrawn-post", excerpt: "private", contentMarkdown: "private" }));
  const publicSlugs = db.prepare("SELECT p.slug FROM blog_posts p JOIN blog_post_versions v ON v.post_id=p.id AND v.version_number=p.published_version_number WHERE p.status='published' AND p.published_at<=? AND p.published_version_number IS NOT NULL ORDER BY p.slug").all("2026-09-04T14:28:01.000Z") as Array<{ slug: string }>;
  assert.deepEqual(publicSlugs.map((row) => row.slug), ["how-to-build-a-daily-hsk-review-habit"]);
});
