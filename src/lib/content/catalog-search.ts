export type CatalogSearchField = "all" | "hanzi" | "pinyin" | "english";

export interface CatalogSearchParams {
  q: string;
  level?: number;
  partOfSpeech: string;
  page: number;
  pageSize: number;
  field?: CatalogSearchField;
  audio?: "formal";
  sort?: "pinyin";
}

export interface CatalogSearchRow {
  id: string;
  release_id: string;
  standard_version: string;
  content_version: string;
  level_band: string;
  hanzi: string;
  traditional: string;
  pinyin: string;
  meaning: string;
  part_of_speech: string;
}

interface ActiveCatalogSearchRelease {
  id: string;
  version: number;
  published_at: string;
  word_count: number;
}

export class CatalogQueryError extends Error {}

function integerParam(value: string | null, fallback: number, label: string): number {
  if (value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new CatalogQueryError(`${label} must be an integer`);
  return parsed;
}

export function normalizeCatalogQuery(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s'’\-]+/g, "");
}

export function parseCatalogSearchParams(url: URL): CatalogSearchParams {
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (q.length > 100) throw new CatalogQueryError("q must be at most 100 characters");

  const page = integerParam(url.searchParams.get("page"), 1, "page");
  if (page < 1 || page > 10_000) throw new CatalogQueryError("page must be between 1 and 10000");

  const pageSize = integerParam(url.searchParams.get("pageSize"), 50, "pageSize");
  if (pageSize < 1 || pageSize > 100) throw new CatalogQueryError("pageSize must be between 1 and 100");

  const levelValue = url.searchParams.get("level");
  const level = levelValue === null || levelValue === "" ? undefined : integerParam(levelValue, 0, "level");
  if (level !== undefined && (level < 1 || level > 9)) {
    throw new CatalogQueryError("level must be between 1 and 9");
  }

  const partOfSpeech = url.searchParams.get("pos")?.trim() ?? "";
  if (partOfSpeech.length > 32 || /[^a-zA-Z/-]/.test(partOfSpeech)) {
    throw new CatalogQueryError("pos contains unsupported characters");
  }

  const rawField = url.searchParams.get("field") ?? "all";
  if (!["all", "hanzi", "pinyin", "english"].includes(rawField)) {
    throw new CatalogQueryError("field must be all, hanzi, pinyin or english");
  }
  const field = rawField as CatalogSearchField;

  const rawAudio = url.searchParams.get("audio") ?? "all";
  if (!["all", "formal"].includes(rawAudio)) {
    throw new CatalogQueryError("audio must be all or formal");
  }
  const rawSort = url.searchParams.get("sort") ?? "catalog";
  if (!["catalog", "pinyin"].includes(rawSort)) {
    throw new CatalogQueryError("sort must be catalog or pinyin");
  }

  return {
    q,
    level,
    partOfSpeech,
    page,
    pageSize,
    ...(field === "all" ? {} : { field }),
    ...(rawAudio === "formal" ? { audio: "formal" as const } : {}),
    ...(rawSort === "pinyin" ? { sort: "pinyin" as const } : {}),
  };
}

function escapedLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export function buildCatalogQuery(
  params: CatalogSearchParams,
  releaseId: string,
  formalAudioIds: readonly string[] = [],
) {
  const conditions = ["release_id = ?"];
  const filterBindings: Array<string | number> = [releaseId];

  if (params.level !== undefined) {
    conditions.push("level_band = ?");
    filterBindings.push(params.level >= 7 ? "7-9" : String(params.level));
  }
  if (params.partOfSpeech) {
    conditions.push("('/' || lower(part_of_speech) || '/') LIKE ? ESCAPE '\\'");
    filterBindings.push(`%/${escapedLike(params.partOfSpeech.toLowerCase())}/%`);
  }
  if (params.q) {
    const fieldColumn = params.field === "hanzi" ? "search_hanzi"
      : params.field === "pinyin" ? "search_pinyin"
      : params.field === "english" ? "search_english"
      : "search_text";
    conditions.push(`${fieldColumn} LIKE ? ESCAPE '\\'`);
    filterBindings.push(`%${escapedLike(normalizeCatalogQuery(params.q))}%`);
  }
  if (params.audio === "formal") {
    if (formalAudioIds.length === 0) conditions.push("1 = 0");
    else {
      conditions.push(`id IN (${formalAudioIds.map(() => "?").join(",")})`);
      filterBindings.push(...formalAudioIds);
    }
  }

  const where = conditions.join(" AND ");
  const select = "id,release_id,standard_version,content_version,level_band,hanzi,traditional,pinyin,meaning,part_of_speech";
  const offset = (params.page - 1) * params.pageSize;
  const orderBy = params.sort === "pinyin" ? "pinyin COLLATE NOCASE, id" : "sort_level, id";
  return {
    sql: `SELECT ${select} FROM catalog_search_index WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    bindings: [...filterBindings, params.pageSize + 1, offset],
    countSql: `SELECT COUNT(*) AS total FROM catalog_search_index WHERE ${where}`,
    countBindings: filterBindings,
  };
}

export function toCatalogWordResponse(input: {
  rows: CatalogSearchRow[];
  total: number;
  releaseId: string;
  releaseVersion?: number;
  params: CatalogSearchParams;
  formalAudioIds?: readonly string[];
}) {
  const rows = input.rows.slice(0, input.params.pageSize);
  const totalPages = input.total === 0 ? 0 : Math.ceil(input.total / input.params.pageSize);
  const formalAudioIds = input.formalAudioIds ?? [];
  return {
    standard: "hsk3" as const,
    releaseId: input.releaseId,
    releaseVersion: input.releaseVersion ?? 1,
    availability: "ready" as const,
    query: {
      q: input.params.q,
      level: input.params.level ?? null,
      partOfSpeech: input.params.partOfSpeech || null,
      field: input.params.field ?? "all",
      audio: input.params.audio ?? "all",
      sort: input.params.sort ?? "catalog",
    },
    pagination: {
      page: input.params.page,
      pageSize: input.params.pageSize,
      total: input.total,
      totalPages,
      hasPrevious: input.params.page > 1,
      hasNext: input.params.page < totalPages,
    },
    contentAssets: rows.map((row) => ({
      id: row.id,
      logicalId: row.id.replace(/\.v\d+$/, ""),
      level: row.level_band === "7-9" ? 7 : Number(row.level_band),
      levelBand: row.level_band,
      standard_version: row.standard_version,
      content_version: row.content_version,
      payload: {
        hanzi: row.hanzi,
        traditional: row.traditional,
        pinyin: row.pinyin,
        meaning: row.meaning,
        partOfSpeech: row.part_of_speech,
      },
      formalAudioAvailable: formalAudioIds.includes(row.id),
    })),
  };
}

interface CatalogDbStatement {
  bind(...values: Array<string | number>): CatalogDbStatement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ success: boolean; results: T[]; error?: string }>;
}

export interface CatalogSearchDatabase {
  prepare(sql: string): CatalogDbStatement;
}

export async function searchCatalogWords(
  db: CatalogSearchDatabase,
  params: CatalogSearchParams,
  formalAudioIds: readonly string[] = [],
) {
  const release = await db.prepare(
    "SELECT id,version,published_at,word_count FROM catalog_search_releases WHERE active=1 ORDER BY published_at DESC LIMIT 1",
  ).first<ActiveCatalogSearchRelease>();
  if (!release) throw new Error("No active catalog search release");

  const query = buildCatalogQuery(params, release.id, formalAudioIds);
  const count = await db.prepare(query.countSql).bind(...query.countBindings).first<{ total: number }>();
  const total = Number(count?.total ?? 0);
  const offset = (params.page - 1) * params.pageSize;
  if (params.page > 1 && (total === 0 || offset >= total)) {
    throw new CatalogQueryError("page exceeds the available result pages");
  }
  const result = await db.prepare(query.sql).bind(...query.bindings).all<CatalogSearchRow>();
  if (!result.success) throw new Error(result.error || "Catalog search failed");

  return toCatalogWordResponse({
    rows: result.results,
    total,
    releaseId: release.id,
    releaseVersion: release.version,
    params,
    formalAudioIds,
  });
}
