import { getCloudflareContext } from "@opennextjs/cloudflare";
import { handleCatalogWordsRequest } from "@/lib/content/catalog-route";
import { buildCatalogWordsCacheKey } from "@/lib/content/catalog-edge-cache";

export async function GET(request: Request) {
  const cacheKey = buildCatalogWordsCacheKey(new URL(request.url));
  const cloudflareCaches = typeof caches !== "undefined"
    ? caches as CacheStorage & { default: Cache }
    : null;
  const edgeCache = cacheKey ? cloudflareCaches?.default ?? null : null;
  if (edgeCache && cacheKey) {
    const cached = await edgeCache.match(cacheKey);
    if (cached) return cached;
  }

  const response = await handleCatalogWordsRequest(request);
  if (edgeCache && cacheKey && response.ok) {
    const { ctx } = getCloudflareContext();
    ctx.waitUntil(edgeCache.put(cacheKey, response.clone()));
  }
  return response;
}
