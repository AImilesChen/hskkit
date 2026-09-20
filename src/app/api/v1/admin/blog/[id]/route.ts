import { unstable_expireTag } from "next/cache";
import { blogError, readBlogJson, requireBlogAdmin, requireSameOrigin } from "@/lib/blog/access";
import { publicBlogInvalidationTags, type BlogPublicationIntent } from "@/lib/blog/cache-policy";
import { getAdminBlogPost, saveBlogPost } from "@/lib/blog/repository";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
const PRIVATE_HEADERS = { "cache-control": "private, no-store" };

export async function GET(_request: Request, context: Context) {
  try {
    await requireBlogAdmin();
    const post = await getAdminBlogPost((await context.params).id);
    if (!post) return Response.json({ error: "BLOG_NOT_FOUND" }, { status: 404, headers: PRIVATE_HEADERS });
    return Response.json({ post }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    return blogError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    requireSameOrigin(request);
    const admin = await requireBlogAdmin();
    const body = await readBlogJson(request);
    const intent = String(body.intent) as BlogPublicationIntent;
    if (!["save", "autosave", "publish", "schedule", "withdraw"].includes(intent)) throw new Error("INVALID_INTENT");
    const post = await saveBlogPost((await context.params).id, body, intent, admin.account.userId, admin.email);
    const tags = publicBlogInvalidationTags(intent, post.slug);
    if (tags.length > 0) unstable_expireTag(...tags);
    return Response.json({ post }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    return blogError(error);
  }
}
