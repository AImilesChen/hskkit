import publicCatalog from "./public-catalog-index.json" with { type: "json" };
import { normalizeCatalogQuery, parseCatalogSearchParams, type CatalogSearchParams } from "./catalog-search.ts";

export const PUBLIC_DICTIONARY_CACHE_CONTROL = "public, max-age=30, s-maxage=120, stale-while-revalidate=300";

const catalogVersion = `${publicCatalog.releaseId}:${publicCatalog.releaseVersion}`;
const cacheOrigin = "https://hskkit.com";

function catalogWordsParams(params: CatalogSearchParams) {
  const canonical = new URLSearchParams();
  canonical.set("catalog", catalogVersion);
  canonical.set("standard", "hsk3");
  canonical.set("q", params.q);
  if (params.level !== undefined) canonical.set("level", String(params.level));
  canonical.set("pos", params.partOfSpeech);
  canonical.set("page", String(params.page));
  canonical.set("pageSize", String(params.pageSize));
  canonical.set("field", params.field ?? "all");
  canonical.set("audio", params.audio ?? "all");
  canonical.set("sort", params.sort ?? "catalog");
  return canonical;
}

export function buildCatalogWordsCacheKey(url: URL): string | null {
  if ((url.searchParams.get("standard") ?? "hsk3") !== "hsk3") return null;
  try {
    const params = parseCatalogSearchParams(url);
    if (params.mode === "flashcards") return null;
    return `${cacheOrigin}/__edge-cache/dictionary/words?${catalogWordsParams(params).toString()}`;
  } catch {
    return null;
  }
}

export function buildDictionarySuggestionsCacheKey(url: URL): string | null {
  try {
    const params = parseCatalogSearchParams(url);
    if (params.mode === "flashcards") return null;
    const canonical = new URLSearchParams();
    canonical.set("catalog", catalogVersion);
    canonical.set("q", normalizeCatalogQuery(params.q));
    if (params.level !== undefined) canonical.set("level", String(params.level));
    canonical.set("pos", params.partOfSpeech.toLowerCase());
    canonical.set("audio", params.audio ?? "all");
    return `${cacheOrigin}/__edge-cache/dictionary/suggestions?${canonical.toString()}`;
  } catch {
    return null;
  }
}
