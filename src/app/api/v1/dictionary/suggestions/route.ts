import { NextResponse } from "next/server";
import { CatalogQueryError, parseCatalogSearchParams } from "@/lib/content/catalog-search";
import { suggestPublicCatalogWords } from "@/lib/content/public-catalog-index";
import { formalWordAudioAssetIds } from "@/lib/content/level-status";

export async function GET(request: Request) {
  try {
    const params = parseCatalogSearchParams(new URL(request.url));
    if (!params.q) return NextResponse.json({ suggestions: [] }, { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } });
    const rows = suggestPublicCatalogWords({
      q: params.q,
      level: params.level,
      partOfSpeech: params.partOfSpeech || undefined,
      formalAudioIds: params.audio === "formal" ? formalWordAudioAssetIds : undefined,
      limit: 4,
    });
    return NextResponse.json({
      suggestions: rows.map((row) => ({
        slug: row.id,
        hanzi: row.hanzi,
        pinyin: row.pinyin,
        meaning: row.meaning,
      })),
    }, { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } });
  } catch (error) {
    if (error instanceof CatalogQueryError) {
      return NextResponse.json({ suggestions: [] }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    console.error("dictionary_suggestions_failed", error);
    return NextResponse.json({ suggestions: [] }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
