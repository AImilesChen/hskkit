import { CharacterQueryError, parseCharacterSearchParams, searchCharacterIndex } from "@/lib/dictionary/character-index";

export async function GET(request: Request) {
  try {
    const params = parseCharacterSearchParams(new URL(request.url));
    return Response.json(searchCharacterIndex(params), {
      headers: { "cache-control": "public, max-age=300, s-maxage=3600" },
    });
  } catch (error) {
    if (error instanceof CharacterQueryError) {
      return Response.json({ code: "INVALID_CHARACTER_QUERY", message: error.message }, { status: 400 });
    }
    return Response.json({ code: "CHARACTER_INDEX_UNAVAILABLE", message: "Character index is temporarily unavailable." }, { status: 503 });
  }
}
