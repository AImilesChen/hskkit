import { listCachedPublishedBlogFeed } from "@/lib/blog/cache";

export const dynamic = "force-dynamic";
const escapeXml = (value: string) => value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[character]!));

export async function GET() {
  const posts = await listCachedPublishedBlogFeed(100);
  const items = posts.map((post) => `<item>
<title>${escapeXml(post.title)}</title>
<link>https://hskkit.com/blog/${encodeURIComponent(post.slug)}</link>
<guid isPermaLink="true">https://hskkit.com/blog/${encodeURIComponent(post.slug)}</guid>
<description>${escapeXml(post.excerpt)}</description>
<category>${escapeXml(post.category)}</category>
<pubDate>${new Date(post.publishedAt || post.updatedAt).toUTCString()}</pubDate>
</item>`).join("\n");
  const latest = posts[0]?.publishedAt || posts[0]?.updatedAt;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>HSKKit Blog</title>
<link>https://hskkit.com/blog</link>
<description>Practical HSK 3.0 study guides connected to vocabulary, practice, review, and learning resources.</description>
<language>en</language>
<atom:link href="https://hskkit.com/blog/rss.xml" rel="self" type="application/rss+xml" />
${latest ? `<lastBuildDate>${new Date(latest).toUTCString()}</lastBuildDate>` : ""}
${items}
</channel></rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=300, s-maxage=900", "x-content-type-options": "nosniff" } });
}
