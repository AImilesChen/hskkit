import { blogError, readBlogJson, requireBlogAdmin, requireSameOrigin } from "@/lib/blog/access";
import { createBlogPost, listAdminBlogPosts } from "@/lib/blog/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireBlogAdmin();
    return Response.json({ posts: await listAdminBlogPosts() }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return blogError(error); }
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const admin = await requireBlogAdmin();
    const post = await createBlogPost(await readBlogJson(request), admin.account.userId, admin.email);
    return Response.json({ post }, { status: 201, headers: { "cache-control": "private, no-store" } });
  } catch (error) { return blogError(error); }
}
