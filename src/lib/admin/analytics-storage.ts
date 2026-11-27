import { collectGa4, collectSearchConsole, googleReportingToken, providerConfigured, type AnalyticsCredentials } from "./analytics-providers.ts";
import { type DashboardAnalytics, type Provider, type Report, type ReportDays } from "./analytics-model.ts";

interface AnalyticsStatement {
  bind(...values: unknown[]): AnalyticsStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}
export type AnalyticsDb = { prepare(sql: string): AnalyticsStatement; batch(statements: AnalyticsStatement[]): Promise<unknown[]> };
export type AnalyticsEnv = AnalyticsCredentials & { LEARNING_DB: AnalyticsDb };
const providers: Provider[] = ["gsc", "ga4"];
type Stored = { provider: Provider; payload_json: string | null; synced_at: string | null; attempted_at: string; last_error: string | null };
const safeError = (error: unknown) => error instanceof Error && ["REPORT_ACCESS_DENIED", "REPORT_CREDENTIALS_INVALID", "INVALID_REPORT_DATA", "REPORT_NOT_CONFIGURED"].includes(error.message) ? error.message : "REPORT_PROVIDER_UNAVAILABLE";

// Only the fixed, additive analytics-cache schema. Called after admin authorization,
// or by the private scheduler; no deployment-token D1 permission is required.
export const ANALYTICS_SCHEMA = [
  "CREATE TABLE IF NOT EXISTS admin_analytics_snapshots (provider TEXT NOT NULL CHECK (provider IN ('gsc','ga4')),days INTEGER NOT NULL CHECK (days IN (7,28,90)),payload_json TEXT,synced_at TEXT,attempted_at TEXT NOT NULL,last_error TEXT,PRIMARY KEY (provider,days))",
  "CREATE TABLE IF NOT EXISTS admin_analytics_sync_lock (id INTEGER PRIMARY KEY CHECK (id=1),token TEXT NOT NULL,locked_until TEXT NOT NULL)",
  "INSERT OR IGNORE INTO admin_analytics_sync_lock(id,token,locked_until) VALUES(1,'','1970-01-01T00:00:00.000Z')",
];
async function initializeAnalyticsStorage(env: AnalyticsEnv) {
  await env.LEARNING_DB.batch(ANALYTICS_SCHEMA.map(sql => env.LEARNING_DB.prepare(sql)));
}
const missingAnalyticsTable = (error: unknown) => /no such table:\s*admin_analytics_(?:snapshots|sync_lock)/i.test(String(error));

export async function readAnalytics(env: AnalyticsEnv, days: ReportDays, now = new Date()): Promise<DashboardAnalytics> {
  let rows: Stored[] = [];
  const storageReady = true;
  const query = () => env.LEARNING_DB.prepare("SELECT provider,payload_json,synced_at,attempted_at,last_error FROM admin_analytics_snapshots WHERE days=?").bind(days).all<Stored>();
  try {
    const result = await query();
    rows = result.results;
  } catch (error) {
    if (!missingAnalyticsTable(error)) throw error;
    await initializeAnalyticsStorage(env);
    rows = (await query()).results;
  }
  return { days, storageReady, sources: providers.map(provider => {
    const row = rows.find(value => value.provider === provider);
    const report = row?.payload_json ? JSON.parse(row.payload_json) as Report : null;
    return { provider, configured: providerConfigured(provider, env), report, syncedAt: row?.synced_at || null, attemptedAt: row?.attempted_at || null, error: row?.last_error || null,
      stale: Boolean(row?.synced_at && now.getTime() - Date.parse(row.synced_at) > 36 * 3_600_000) };
  }) };
}

export async function syncAnalytics(env: AnalyticsEnv, days: ReportDays, now = new Date()) {
  const configured = providers.filter(provider => providerConfigured(provider, env));
  if (!configured.length) return { state: "not_configured" as const };
  const token = crypto.randomUUID();
  const acquire = () => env.LEARNING_DB.prepare("UPDATE admin_analytics_sync_lock SET token=?,locked_until=? WHERE id=1 AND locked_until<=? RETURNING id")
    .bind(token, new Date(now.getTime() + 180_000).toISOString(), now.toISOString()).first();
  let acquired;
  try { acquired = await acquire(); } catch (error) {
    if (!missingAnalyticsTable(error)) throw error;
    await initializeAnalyticsStorage(env);
    acquired = await acquire();
  }
  if (!acquired) return { state: "busy" as const };
  try {
    // Minimum 15 minutes between attempts, including failed attempts; no automatic
    // retry loops and no third-party API requests from dashboard GETs.
    const existing = await readAnalytics(env, days, now);
    const pending = configured.filter(provider => {
      const source = existing.sources.find(source => source.provider === provider)!;
      return !source.attemptedAt || now.getTime() - Date.parse(source.attemptedAt) >= 15 * 60_000;
    });
    if (!pending.length) return { state: "recent" as const };
    let accessToken: string | null = null;
    let authError: unknown;
    try { accessToken = await googleReportingToken(env); } catch (error) { authError = error; }
    await Promise.all(pending.map(async provider => {
      try {
        if (!accessToken) throw authError;
        const report = provider === "gsc" ? await collectSearchConsole(env.ADMIN_ANALYTICS_GSC_SITE!, accessToken, days, now) : await collectGa4(env.ADMIN_ANALYTICS_GA4_PROPERTY_ID!, accessToken, days, now);
        const payload = JSON.stringify(report);
        if (new TextEncoder().encode(payload).length > 64_000) throw new Error("INVALID_REPORT_DATA");
        await env.LEARNING_DB.prepare("INSERT INTO admin_analytics_snapshots(provider,days,payload_json,synced_at,attempted_at,last_error) VALUES(?,?,?,?,?,NULL) ON CONFLICT(provider,days) DO UPDATE SET payload_json=excluded.payload_json,synced_at=excluded.synced_at,attempted_at=excluded.attempted_at,last_error=NULL")
          .bind(provider, days, payload, now.toISOString(), now.toISOString()).run();
      } catch (error) {
        // Keep the previous good snapshot. A failed refresh must not replace data with zero.
        await env.LEARNING_DB.prepare("INSERT INTO admin_analytics_snapshots(provider,days,attempted_at,last_error) VALUES(?,?,?,?) ON CONFLICT(provider,days) DO UPDATE SET attempted_at=excluded.attempted_at,last_error=excluded.last_error")
          .bind(provider, days, now.toISOString(), safeError(error)).run();
      }
    }));
    return { state: "updated" as const };
  } finally {
    await env.LEARNING_DB.prepare("UPDATE admin_analytics_sync_lock SET locked_until=? WHERE id=1 AND token=?").bind(now.toISOString(), token).run();
  }
}
