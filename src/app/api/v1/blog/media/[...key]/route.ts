import { getCloudflareContext } from "@opennextjs/cloudflare";
import { safeMediaKey } from "@/lib/blog/domain";
import { getBlogMedia } from "@/lib/blog/repository";
import { requireBlogAdmin } from "@/lib/blog/access";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ key: string[] }> };

function publicCacheControl(allowAdmin: boolean) {
  return allowAdmin
    ? "private, no-store"
    : "public, max-age=86400, s-maxage=31536000, immutable";
}

export async function GET(request: Request, context: Context) {
  const key = safeMediaKey((await context.params).key.join("/"));
  if (!key) return new Response("Not found", { status: 404 });

  let allowAdmin = false;
  try {
    await requireBlogAdmin();
    allowAdmin = true;
  } catch {}

  const object = await getBlogMedia(key, allowAdmin);
  if (!object) return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const requestedWidth = Number(url.searchParams.get("w"));
  const width = Number.isFinite(requestedWidth)
    ? Math.min(960, Math.max(320, Math.round(requestedWidth)))
    : 0;

  if (!allowAdmin && width > 0) {
    const requestedQuality = Number(url.searchParams.get("q"));
    const quality = Number.isFinite(requestedQuality)
      ? Math.min(85, Math.max(60, Math.round(requestedQuality)))
      : 75;
    const env = (await getCloudflareContext({ async: true })).env;
    const transformed = await env.IMAGES
      .input(object.body)
      .transform({ width, fit: "scale-down", dpr: 1 })
      .output({ format: "image/webp", quality });
    const response = transformed.response();
    const headers = new Headers(response.headers);
    headers.set("etag", object.httpEtag);
    headers.set("x-content-type-options", "nosniff");
    headers.set("cache-control", publicCacheControl(false));
    return new Response(response.body, { status: response.status, headers });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("x-content-type-options", "nosniff");
  headers.set("cache-control", publicCacheControl(allowAdmin));
  return new Response(object.body, { headers });
}
