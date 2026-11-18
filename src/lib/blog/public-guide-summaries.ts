export type PublicGuideSummary = { lookupSlug: string; slug: string; title: string; excerpt: string };
type Stamp = { id: string; slug: string; published_at: string; updated_at: string; published_version_number: number };
type SummaryRow = Stamp & { snapshot_slug: string | null; title: string | null; excerpt: string | null };
type PublicDatabase = {
  prepare(sql: string): { bind(...values: unknown[]): { all<T>(): Promise<{ results: T[] }> } };
};

// One bounded public snapshot per binding, not one entry per request or user.
// Every read checks the database publication state first: no TTL staleness,
// invalidation queues, R2 objects, or cached private/draft content.
const snapshots = new WeakMap<PublicDatabase, { key: string; posts: PublicGuideSummary[] }>();
const columns = 'p.id,p.slug,p.published_at,p.updated_at,p.published_version_number';
function keyFor(slugs: string[], rows: Stamp[]) {
  return JSON.stringify([slugs, rows.map(row => [row.id, row.slug, row.published_at, row.updated_at, row.published_version_number])]);
}

export async function getPublicGuideSummaries(database: PublicDatabase, requestedSlugs: readonly string[], now = new Date()): Promise<PublicGuideSummary[]> {
  const slugs = [...new Set(requestedSlugs)].sort();
  if (slugs.length === 0) return [];
  if (slugs.length > 32) throw new Error('Public guide summary budget exceeded');
  const from = ` FROM blog_posts p JOIN blog_post_versions v ON v.post_id=p.id AND v.version_number=p.published_version_number
    WHERE p.status='published' AND p.published_at<=? AND p.published_version_number IS NOT NULL
    AND p.slug IN (${slugs.map(() => '?').join(',')}) ORDER BY p.slug,p.id`;
  const bindings = [now.toISOString(), ...slugs];
  const stamps = await database.prepare(`SELECT ${columns}${from}`).bind(...bindings).all<Stamp>();
  const cached = snapshots.get(database);
  if (cached?.key === keyFor(slugs, stamps.results)) return cached.posts.map(post => ({ ...post }));

  // Select only what /learn actually renders. The database never sends the
  // article bodies to the Worker, and unpublished edits keep their old snapshot.
  const rows = await database.prepare(`SELECT ${columns},json_extract(v.snapshot_json,'$.slug') snapshot_slug,
    json_extract(v.snapshot_json,'$.title') title,json_extract(v.snapshot_json,'$.excerpt') excerpt${from}`)
    .bind(...bindings).all<SummaryRow>();
  const posts = rows.results.map(row => ({ lookupSlug: row.slug, slug: row.snapshot_slug || row.slug,
    title: String(row.title || 'Untitled article'), excerpt: String(row.excerpt || '') }));
  // Stamp the actual content query, so a publish/withdraw racing the first query
  // cannot store old content under a newer publication version.
  snapshots.set(database, { key: keyFor(slugs, rows.results), posts });
  return posts.map(post => ({ ...post }));
}
