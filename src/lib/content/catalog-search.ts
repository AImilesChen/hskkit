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

export function isCatalogWordAssetId(assetId: string): boolean {
  return /^hsk3\.word\.l[1-7]\.\d{4}\.v\d+$/.test(assetId);
}

export async function findActiveCatalogWordById(
  db: CatalogSearchDatabase,
  assetId: string,
): Promise<CatalogSearchRow | null> {
  if (!isCatalogWordAssetId(assetId)) return null;
  return db.prepare(
    `SELECT i.id,i.release_id,i.standard_version,i.content_version,i.level_band,i.hanzi,i.traditional,i.pinyin,i.meaning,i.part_of_speech
     FROM catalog_search_index i
     INNER JOIN catalog_search_releases r ON r.id = i.release_id
     WHERE i.id = ? AND r.active = 1
     LIMIT 1`,
  ).bind(assetId).first<CatalogSearchRow>();
}

export async function findActiveCatalogWordsContainingCharacter(
  db: CatalogSearchDatabase,
  hanzi: string,
  limit = 30,
): Promise<CatalogSearchRow[]> {
  if (!/^[\u3400-\u9fff]$/u.test(hanzi)) return [];
  const boundedLimit = Math.max(1, Math.min(60, Math.trunc(limit)));
  const result = await db.prepare(
    `SELECT i.id,i.release_id,i.standard_version,i.content_version,i.level_band,i.hanzi,i.traditional,i.pinyin,i.meaning,i.part_of_speech
     FROM catalog_search_index i
     INNER JOIN catalog_search_releases r ON r.id = i.release_id
     WHERE r.active = 1 AND instr(i.hanzi, ?) > 0
     ORDER BY i.sort_level,i.id
     LIMIT ?`,
  ).bind(hanzi, boundedLimit).all<CatalogSearchRow>();
  if (!result.success) throw new Error(result.error || "Character word lookup failed");
  return result.results;
}

interface CatalogLearningRow extends CatalogSearchRow {
  search_pinyin: string;
  sort_level: number;
}

const learningSelect = "i.id,i.release_id,i.standard_version,i.content_version,i.level_band,i.hanzi,i.traditional,i.pinyin,i.meaning,i.part_of_speech,i.search_pinyin,i.sort_level";

export async function findActiveCatalogWordsByIds(db: CatalogSearchDatabase, assetIds: string[]) {
  const ids = [...new Set(assetIds)].filter(isCatalogWordAssetId).slice(0, 100);
  if (!ids.length) return [];
  const result = await db.prepare(
    `SELECT ${learningSelect} FROM catalog_search_index i
     INNER JOIN catalog_search_releases r ON r.id = i.release_id
     WHERE r.active = 1 AND i.id IN (${ids.map(() => "?").join(",")})
     ORDER BY i.sort_level,i.id`,
  ).bind(...ids).all<CatalogLearningRow>();
  if (!result.success) throw new Error(result.error || "Catalog lookup failed");
  const byId = new Map(result.results.map((row) => [row.id, row]));
  return ids.flatMap((id) => byId.has(id) ? [byId.get(id)!] : []);
}

export async function findCatalogWordLearningContext(db: CatalogSearchDatabase, assetId: string) {
  if (!isCatalogWordAssetId(assetId)) return null;
  const current = await db.prepare(
    `SELECT ${learningSelect} FROM catalog_search_index i
     INNER JOIN catalog_search_releases r ON r.id = i.release_id
     WHERE i.id = ? AND r.active = 1 LIMIT 1`,
  ).bind(assetId).first<CatalogLearningRow>();
  if (!current) return null;

  const level_band = current.level_band;
  const search_pinyin = current.search_pinyin;
  const after = await db.prepare(
    `SELECT ${learningSelect} FROM catalog_search_index i
     WHERE i.release_id = ? AND i.level_band = ? AND i.id > ? ORDER BY i.sort_level,i.id LIMIT 8`,
  ).bind(current.release_id, level_band, current.id).all<CatalogLearningRow>();
  if (!after.success) throw new Error(after.error || "Catalog learning context failed");
  const before = after.results.length >= 8 ? { success: true, results: [] as CatalogLearningRow[] } : await db.prepare(
    `SELECT ${learningSelect} FROM catalog_search_index i
     WHERE i.release_id = ? AND i.level_band = ? AND i.id <> ? ORDER BY i.sort_level,i.id LIMIT ?`,
  ).bind(current.release_id, level_band, current.id, 8 - after.results.length).all<CatalogLearningRow>();
  if (!before.success) throw new Error(before.error || "Catalog learning context failed");
  const candidates = [...after.results, ...before.results].filter((row, index, rows) => rows.findIndex((candidate) => candidate.id === row.id) === index).slice(0, 8);

  const tones = await db.prepare(
    `SELECT ${learningSelect} FROM catalog_search_index i
     WHERE i.release_id = ? AND i.search_pinyin = ? AND i.id <> ? ORDER BY i.sort_level,i.id LIMIT 8`,
  ).bind(current.release_id, search_pinyin, current.id).all<CatalogLearningRow>();
  if (!tones.success) throw new Error(tones.error || "Catalog pronunciation comparison failed");
  return { current, candidates, nextWord: candidates[0] ?? null, toneComparisons: tones.results };
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

function boundedEditDistance(left: string, right: string): number {
  const a = left.slice(0, 120);
  const b = right.slice(0, 120);
  const row = Array.from({ length: a.length + 1 }, (_, index) => index);
  for (let column = 1; column <= b.length; column += 1) {
    let previous = row[0];
    row[0] = column;
    for (let index = 1; index <= a.length; index += 1) {
      const current = row[index];
      row[index] = a[index - 1] === b[column - 1]
        ? previous
        : Math.min(previous + 1, row[index] + 1, row[index - 1] + 1);
      previous = current;
    }
  }
  return row[a.length];
}

export async function suggestCatalogWords(
  db: CatalogSearchDatabase,
  input: { q: string; level?: number; partOfSpeech?: string; formalAudioIds?: readonly string[]; limit?: number },
): Promise<CatalogSearchRow[]> {
  const needle = normalizeCatalogQuery(input.q.trim()).slice(0, 100);
  if (!needle) return [];
  const release = await db.prepare(
    "SELECT id,version,published_at,word_count FROM catalog_search_releases WHERE active=1 ORDER BY published_at DESC LIMIT 1",
  ).first<ActiveCatalogSearchRelease>();
  if (!release) return [];

  const conditions = ["release_id = ?"];
  const bindings: Array<string | number> = [release.id];
  if (input.level !== undefined) {
    conditions.push("level_band = ?");
    bindings.push(input.level >= 7 ? "7-9" : String(input.level));
  }
  if (input.partOfSpeech) {
    conditions.push("('/' || lower(part_of_speech) || '/') LIKE ? ESCAPE '\\'");
    bindings.push(`%/${escapedLike(input.partOfSpeech.toLowerCase())}/%`);
  }
  if (input.formalAudioIds) {
    if (input.formalAudioIds.length === 0) return [];
    conditions.push(`id IN (${input.formalAudioIds.map(() => "?").join(",")})`);
    bindings.push(...input.formalAudioIds);
  }
  const firstCharacter = needle[0];
  conditions.push("(search_hanzi LIKE ? ESCAPE '\\' OR search_pinyin LIKE ? ESCAPE '\\' OR search_english LIKE ? ESCAPE '\\')");
  const broadMatch = `%${escapedLike(firstCharacter)}%`;
  bindings.push(broadMatch, broadMatch, broadMatch);

  const select = "id,release_id,standard_version,content_version,level_band,hanzi,traditional,pinyin,meaning,part_of_speech";
  const result = await db.prepare(
    `SELECT ${select} FROM catalog_search_index WHERE ${conditions.join(" AND ")} ORDER BY sort_level,id LIMIT 4000`,
  ).bind(...bindings).all<CatalogSearchRow>();
  if (!result.success) throw new Error(result.error || "Catalog suggestions failed");

  const limit = Math.max(1, Math.min(input.limit ?? 4, 10));
  return result.results.map((row) => {
    const forms = [row.hanzi, row.pinyin, row.meaning].map(normalizeCatalogQuery).filter(Boolean);
    const score = Math.min(...forms.map((form) => {
      if (form.includes(needle) || needle.includes(form)) return Math.abs(form.length - needle.length) * 0.2;
      return boundedEditDistance(needle, form) / Math.max(needle.length, Math.min(form.length, 120), 1);
    }));
    return { row, score };
  }).filter((entry) => entry.score <= 0.55)
    .sort((left, right) => left.score - right.score || left.row.id.localeCompare(right.row.id))
    .slice(0, limit)
    .map((entry) => entry.row);
}
