import { blogPublicEnabled, listPublishedBlogPosts } from "@/lib/blog/repository";

export const dynamic = "force-dynamic";
const xml = (value: string) => value.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[char]!));

export async function GET() {
  if (!blogPublicEnabled()) return new Response("Not found", { status: 404, headers: { "cache-control": "private, no-store" } });
  const posts = await listPublishedBlogPosts(50);
  const items = posts.map((post) => `<item><title>${xml(post.title)}</title><link>https://hskkit.com/blog/${xml(post.slug)}</link><guid isPermaLink="true">https://hskkit.com/blog/${xml(post.slug)}</guid><description>${xml(post.excerpt)}</description><pubDate>${new Date(post.publishedAt || post.updatedAt).toUTCString()}</pubDate></item>`).join("");
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>HSKKit Blog</title><link>https://hskkit.com/blog</link><description>Practical HSK 3.0 study guides and learning advice.</description><language>en</language>${items}</channel></rss>`;
  return new Response(body, { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
}
