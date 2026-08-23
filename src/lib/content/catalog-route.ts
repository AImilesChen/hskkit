import {
  CatalogQueryError,
  parseCatalogSearchParams,
  searchCatalogWords,
  type CatalogSearchDatabase,
} from "./catalog-search.ts";

function errorResponse(status: number, error: string, message: string) {
  return Response.json({ error, message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function handleCatalogWordsRequest(request: Request, db: CatalogSearchDatabase) {
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
    const body = await searchCatalogWords(db, params);
    return Response.json(body, {
      headers: { "Cache-Control": "public, max-age=30, s-maxage=120, stale-while-revalidate=300" },
    });
  } catch (error) {
    if (error instanceof CatalogQueryError) {
      return errorResponse(400, "INVALID_CATALOG_QUERY", error.message);
    }
    console.error("catalog_search_failed", error);
    return errorResponse(503, "CATALOG_UNAVAILABLE", "Catalog search is temporarily unavailable. Please try again.");
  }
}
