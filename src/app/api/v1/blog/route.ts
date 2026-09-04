import { blogPublicEnabled, listPublishedBlogPosts } from "@/lib/blog/repository";

export const dynamic = "force-dynamic";
export async function GET() {
  if (!blogPublicEnabled()) return Response.json({ error: "BLOG_NOT_FOUND" }, { status: 404, headers: { "cache-control": "private, no-store" } });
  return Response.json({ posts: await listPublishedBlogPosts() }, { headers: { "cache-control": "private, no-store" } });
}
