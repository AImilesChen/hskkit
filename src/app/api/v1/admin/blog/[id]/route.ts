import { blogError, readBlogJson, requireBlogAdmin, requireSameOrigin } from "@/lib/blog/access";
import { getAdminBlogPost, updateBlogPost } from "@/lib/blog/repository";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    await requireBlogAdmin();
    const post = await getAdminBlogPost((await context.params).id);
    if (!post) return Response.json({ error: "BLOG_NOT_FOUND" }, { status: 404 });
    return Response.json({ post }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return blogError(error); }
}

export async function PATCH(request: Request, context: Context) {
  try {
    requireSameOrigin(request);
    const admin = await requireBlogAdmin();
    const post = await updateBlogPost((await context.params).id, await readBlogJson(request), admin.account.userId, admin.email);
    return Response.json({ post }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return blogError(error); }
}
