import { getPublishedBlogPost } from "@/lib/blog/repository";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ slug: string }> };
export async function GET(_request: Request, context: Context) {
  const post = await getPublishedBlogPost((await context.params).slug);
  return post
    ? Response.json({ post }, { headers: { "cache-control": "private, no-store" } })
    : Response.json({ error: "BLOG_NOT_FOUND" }, { status: 404, headers: { "cache-control": "private, no-store" } });
}
