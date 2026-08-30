import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { CatalogQueryError, parseCatalogSearchParams, suggestCatalogWords } from "@/lib/content/catalog-search";
import { formalWordAudioAssetIds } from "@/lib/content/level-status";

export async function GET(request: Request) {
  try {
    const params = parseCatalogSearchParams(new URL(request.url));
    if (!params.q) return NextResponse.json({ suggestions: [] });
    const db = getCloudflareContext().env.LEARNING_DB;
    const rows = await suggestCatalogWords(db, {
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
    }, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch (error) {
    if (error instanceof CatalogQueryError) {
      return NextResponse.json({ suggestions: [] }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    console.error("dictionary_suggestions_failed", error);
    return NextResponse.json({ suggestions: [] }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
