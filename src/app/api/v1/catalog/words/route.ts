import { getCloudflareContext } from "@opennextjs/cloudflare";
import { handleCatalogWordsRequest } from "@/lib/content/catalog-route";

export async function GET(request: Request) {
  const { env, ctx } = getCloudflareContext();
  const cacheable = new URL(request.url).searchParams.get("mode") !== "flashcards";
  const cloudflareCaches = typeof caches !== "undefined"
    ? caches as CacheStorage & { default: Cache }
    : null;
  const edgeCache = cacheable ? cloudflareCaches?.default ?? null : null;
  if (edgeCache) {
    const cached = await edgeCache.match(request);
    if (cached) return cached;
  }

  const response = await handleCatalogWordsRequest(request, env.LEARNING_DB);
  if (edgeCache && response.ok) ctx.waitUntil(edgeCache.put(request, response.clone()));
  return response;
}
