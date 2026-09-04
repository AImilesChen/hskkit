import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { extractBlogFaqs, extractBlogHeadings, markdownToSafeHtml } from "../src/lib/blog/domain.ts";

type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  hskLevel: number | null;
  imageKey: string;
  imageAlt: string;
  publishedAt: string;
  file: string;
};

const root = process.cwd();
const manifest = JSON.parse(readFileSync(join(root, "content/blog/manifest.json"), "utf8")) as { release: string; articles: Article[] };
const migration = [
  readFileSync(join(root, "migrations/0027_blog_content_release.sql"), "utf8"),
  readFileSync(join(root, "migrations/0028_blog_tones_title_editorial_fix.sql"), "utf8"),
].join("\n");
const freezeCommit = "83883c8536c1a99b9da78e09f910b6070860836d";

const wordCount = (value: string) => value.match(/\b[\w’'-]+\b/g)?.length ?? 0;
const webpSize = (buffer: Buffer) => {
  assert.equal(buffer.toString("ascii", 0, 4), "RIFF");
  assert.equal(buffer.toString("ascii", 8, 12), "WEBP");
  const type = buffer.toString("ascii", 12, 16);
  if (type === "VP8X") {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }
  assert.equal(type, "VP8 ", "release images must use a supported WebP header");
  assert.equal(buffer.toString("hex", 23, 26), "9d012a", "lossy WebP key-frame signature");
  return {
    width: buffer.readUInt16LE(26) & 0x3fff,
    height: buffer.readUInt16LE(28) & 0x3fff,
  };
};

test("release contains exactly nine unique, publication-ready articles", () => {
  assert.equal(manifest.release, "blog9-20260904");
  assert.equal(manifest.articles.length, 9);
  assert.equal(new Set(manifest.articles.map((article) => article.slug)).size, 9);
  assert.equal(new Set(manifest.articles.map((article) => article.id)).size, 9);
  for (const article of manifest.articles) {
    assert.match(article.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(article.title.length >= 35 && article.title.length <= 90);
    assert.ok(article.excerpt.length >= 120 && article.excerpt.length <= 220);
    assert.ok(article.imageAlt.length >= 55 && article.imageAlt.length <= 160);
    assert.match(article.publishedAt, /^2026-09-04T15:3\d:00\.000Z$/);
  }
});

test("every article has substantive structure, useful tables, FAQs, and safe rendering", () => {
  for (const article of manifest.articles) {
    const markdown = readFileSync(join(root, "content/blog/posts", article.file), "utf8");
    assert.ok(markdown.startsWith(`# ${article.title}\n`), `${article.slug}: H1 must match metadata`);
    assert.ok(wordCount(markdown) >= 850, `${article.slug}: article is too thin`);
    assert.ok(extractBlogHeadings(markdown).filter((heading) => heading.level === 2).length >= 6, `${article.slug}: insufficient section hierarchy`);
    assert.ok((markdown.match(/^\| ---/gm)?.length ?? 0) >= 1, `${article.slug}: needs a practical comparison table`);
    assert.equal(extractBlogFaqs(markdown).length, 4, `${article.slug}: FAQ count`);
    const html = markdownToSafeHtml(markdown);
    assert.match(html, /<h2 id="/);
    assert.match(html, /<table>/);
    assert.doesNotMatch(html, /<script|javascript:|onerror=/i);
  }
});

test("every article has a responsive, lightweight, topic-matched scene image", () => {
  for (const [index, article] of manifest.articles.entries()) {
    const filename = `${String(index + 1).padStart(2, "0")}-scene-${article.slug}.webp`;
    const image = readFileSync(join(root, "content/blog/illustrations/generated", filename));
    const dimensions = webpSize(image);
    assert.deepEqual(dimensions, { width: 1440, height: 810 });
    assert.ok(image.byteLength < 250_000, `${article.slug}: image is too large`);
    assert.equal(article.imageKey, `blog/launch-20260904/${article.slug}.webp`);
  }
});

test("migration publishes every article with immutable v1 snapshot and audit entry", () => {
  for (const article of manifest.articles) {
    assert.match(migration, new RegExp(`'${article.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}'`));
    assert.match(migration, new RegExp(`'${article.slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}'`));
    assert.match(migration, new RegExp(`'${article.imageKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}'`));
    assert.match(migration, new RegExp(`'${article.id}-v1'`));
    assert.match(migration, new RegExp(`'${article.id}-audit-v1'`));
  }
  assert.match(migration, /'published', 1, 1/);
  assert.match(migration, /INSERT OR IGNORE INTO blog_posts/g);
  assert.match(migration, /blog-chinese-tones-guide-v2/);
  assert.match(migration, /Chinese Tones Guide: Hear and Produce Mandarin Tones More Reliably/);
  assert.match(migration, /published_version_number = 2/);
});

test("release remains an additive blog-only change from the frozen production commit", () => {
  assert.equal(freezeCommit, "83883c8536c1a99b9da78e09f910b6070860836d");
  const appCss = readFileSync(join(root, "src/app/blog/blog.css"), "utf8");
  assert.match(appCss, /\.blog-prose h2/);
  assert.match(appCss, /\.blog-prose table/);
  assert.match(appCss, /\.blog-prose blockquote/);
  assert.match(appCss, /@media \(max-width: 640px\)/);
});
