import {
  CatalogQueryError,
  parseCatalogSearchParams,
} from "./catalog-search.ts";
import { searchPublicCatalogWords } from "./public-catalog-index.ts";
import { PUBLIC_DICTIONARY_CACHE_CONTROL } from "./catalog-edge-cache.ts";
import { formalWordAudioAssetIds, formalWordAudioUrlByContentId } from "./level-status.ts";

function errorResponse(status: number, error: string, message: string) {
  return Response.json({ error, message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function handleCatalogWordsRequest(request: Request, _legacyDatabase?: unknown) {
  const url = new URL(request.url);
  const standard = url.searchParams.get("standard") ?? "hsk3";
  if (standard !== "hsk3" && standard !== "hsk2") {
    return errorResponse(400, "INVALID_CATALOG_QUERY", "standard must be hsk2 or hsk3");
  }
  if (standard === "hsk2") {
    return errorResponse(503, "CATALOG_UNAVAILABLE", "No published HSK 2.0 catalog is available");
  }

  try {
    const params = parseCatalogSearchParams(url);
    const result = searchPublicCatalogWords(params, formalWordAudioAssetIds);
    const body = {
      ...result,
      contentAssets: result.contentAssets.map((asset) => ({
        ...asset,
        formalAudioUrl: formalWordAudioUrlByContentId.get(asset.id) ?? null,
      })),
    };
    return Response.json(body, {
      headers: {
        "Cache-Control": params.mode === "flashcards"
          ? "no-store"
          : PUBLIC_DICTIONARY_CACHE_CONTROL,
      },
    });
  } catch (error) {
    if (error instanceof CatalogQueryError) {
      return errorResponse(400, "INVALID_CATALOG_QUERY", error.message);
    }
    console.error("catalog_search_failed", error);
    return errorResponse(503, "CATALOG_UNAVAILABLE", "Catalog search is temporarily unavailable. Please try again.");
  }
}
