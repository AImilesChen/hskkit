import { NextResponse } from "next/server.js";

import catalog from "../../../../../lib/content/catalog.json" with { type: "json" };
import {
  queryCatalog,
  type ContentRepository,
  type HskStandard,
} from "../../../../../lib/content/repository.ts";
import { toPublicCatalogResponse } from "../../../../../lib/content/public-catalog.ts";

const repository = catalog as ContentRepository;
const VALID_STANDARDS = new Set<HskStandard>(["hsk2", "hsk3"]);

function errorResponse(status: number, error: string, message: string) {
  return NextResponse.json({ error, message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const standardParam = url.searchParams.get("standard") ?? "hsk3";
  const levelParam = url.searchParams.get("level");
  if (!VALID_STANDARDS.has(standardParam as HskStandard)) {
    return errorResponse(400, "INVALID_CATALOG_QUERY", "standard must be hsk2 or hsk3");
  }
  const level = Number(levelParam);
  if (!levelParam || !Number.isInteger(level)) {
    return errorResponse(400, "INVALID_CATALOG_QUERY", "level must be an integer");
  }

  try {
    const result = queryCatalog(repository, { standard: standardParam as HskStandard, level });
    return NextResponse.json(toPublicCatalogResponse(result), {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Catalog unavailable";
    if (/invalid .* level/i.test(message)) {
      return errorResponse(400, "INVALID_CATALOG_QUERY", message);
    }
    return errorResponse(503, "CATALOG_UNAVAILABLE", message);
  }
}
