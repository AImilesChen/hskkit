import { collectGa4, collectSearchConsole, googleReportingToken, providerConfigured, type AnalyticsCredentials } from "./analytics-providers.ts";
import { type DashboardAnalytics, type Provider, type Report, type ReportDays } from "./analytics-model.ts";

interface AnalyticsStatement {
  bind(...values: unknown[]): AnalyticsStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}
export type AnalyticsDb = { prepare(sql: string): AnalyticsStatement };
export type AnalyticsEnv = AnalyticsCredentials & { LEARNING_DB: AnalyticsDb };
const providers: Provider[] = ["gsc", "ga4"];
type Stored = { provider: Provider; payload_json: string | null; synced_at: string | null; attempted_at: string; last_error: string | null };
const safeError = (error: unknown) => error instanceof Error && ["REPORT_ACCESS_DENIED", "REPORT_CREDENTIALS_INVALID", "INVALID_REPORT_DATA", "REPORT_NOT_CONFIGURED"].includes(error.message) ? error.message : "REPORT_PROVIDER_UNAVAILABLE";

export async function readAnalytics(env: AnalyticsEnv, days: ReportDays, now = new Date()): Promise<DashboardAnalytics> {
  let rows: Stored[] = [];
  let storageReady = true;
  try {
    const result = await env.LEARNING_DB.prepare("SELECT provider,payload_json,synced_at,attempted_at,last_error FROM admin_analytics_snapshots WHERE days=?").bind(days).all<Stored>();
    rows = result.results;
  } catch (error) {
    if (!String(error).includes("no such table")) throw error;
    storageReady = false;
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
  const acquired = await env.LEARNING_DB.prepare("UPDATE admin_analytics_sync_lock SET token=?,locked_until=? WHERE id=1 AND locked_until<=? RETURNING id")
    .bind(token, new Date(now.getTime() + 180_000).toISOString(), now.toISOString()).first();
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
