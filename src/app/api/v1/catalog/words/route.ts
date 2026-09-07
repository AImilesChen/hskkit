import { getCloudflareContext } from "@opennextjs/cloudflare";
import { handleCatalogWordsRequest } from "@/lib/content/catalog-route";

export async function GET(request: Request) {
  const { ctx } = getCloudflareContext();
  const cacheable = new URL(request.url).searchParams.get("mode") !== "flashcards";
  const cloudflareCaches = typeof caches !== "undefined"
    ? caches as CacheStorage & { default: Cache }
    : null;
  const edgeCache = cacheable ? cloudflareCaches?.default ?? null : null;
  if (edgeCache) {
    const cached = await edgeCache.match(request.url);
    if (cached) return cached;
  }

  const response = await handleCatalogWordsRequest(request);
  if (edgeCache && response.ok) ctx.waitUntil(edgeCache.put(request.url, response.clone()));
  return response;
}
