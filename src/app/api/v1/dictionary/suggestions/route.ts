import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { CatalogQueryError, parseCatalogSearchParams } from "@/lib/content/catalog-search";
import {
  buildDictionarySuggestionsCacheKey,
  PUBLIC_DICTIONARY_CACHE_CONTROL,
} from "@/lib/content/catalog-edge-cache";
import { suggestPublicCatalogWords } from "@/lib/content/public-catalog-index";
import { formalWordAudioAssetIds } from "@/lib/content/level-status";

async function buildSuggestionsResponse(request: Request) {
  try {
    const params = parseCatalogSearchParams(new URL(request.url));
    const cacheControl = params.mode === "flashcards" ? "no-store" : PUBLIC_DICTIONARY_CACHE_CONTROL;
    if (!params.q) return NextResponse.json({ suggestions: [] }, { headers: { "Cache-Control": cacheControl } });
    const rows = suggestPublicCatalogWords({
      q: params.q,
      level: params.level,
      partOfSpeech: params.partOfSpeech || undefined,
      formalAudioIds: params.audio === "formal" ? formalWordAudioAssetIds : undefined,
      limit: 4,
    });
    return NextResponse.json({
      suggestions: rows.map((row) => ({
        id: row.id,
        slug: row.id,
        hanzi: row.hanzi,
        pinyin: row.pinyin,
        meaning: row.meaning,
      })),
    }, { headers: { "Cache-Control": cacheControl } });
  } catch (error) {
    if (error instanceof CatalogQueryError) {
      return NextResponse.json({ suggestions: [] }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    console.error("dictionary_suggestions_failed", error);
    return NextResponse.json({ suggestions: [] }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function GET(request: Request) {
  const cacheKey = buildDictionarySuggestionsCacheKey(new URL(request.url));
  const cloudflareCaches = typeof caches !== "undefined"
    ? caches as CacheStorage & { default: Cache }
    : null;
  const edgeCache = cacheKey ? cloudflareCaches?.default ?? null : null;
  if (edgeCache && cacheKey) {
    const cached = await edgeCache.match(cacheKey);
    if (cached) return cached;
  }

  const response = await buildSuggestionsResponse(request);
  if (edgeCache && cacheKey && response.ok) {
    const { ctx } = getCloudflareContext();
    ctx.waitUntil(edgeCache.put(cacheKey, response.clone()));
  }
  return response;
}
