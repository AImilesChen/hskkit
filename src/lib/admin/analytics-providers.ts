import { numberValue, reportWindow, type Provider, type Report, type ReportDays, type Totals } from "./analytics-model.ts";

export type AnalyticsCredentials = {
  ADMIN_ANALYTICS_GOOGLE_SERVICE_ACCOUNT?: string;
  ADMIN_ANALYTICS_GOOGLE_REFRESH_TOKEN?: string;
  GOOGLE_CLIENT_ID?: string; GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  ADMIN_ANALYTICS_GSC_SITE?: string; ADMIN_ANALYTICS_GA4_PROPERTY_ID?: string;
};
export type JsonFetch = (url: string, init?: RequestInit) => Promise<Response>;

export function providerConfigured(provider: Provider, env: AnalyticsCredentials) {
  const google = Boolean(env.ADMIN_ANALYTICS_GOOGLE_SERVICE_ACCOUNT ||
    (env.ADMIN_ANALYTICS_GOOGLE_REFRESH_TOKEN && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET));
  return google && (provider === "gsc" ? Boolean(env.ADMIN_ANALYTICS_GSC_SITE) : /^\d+$/.test(env.ADMIN_ANALYTICS_GA4_PROPERTY_ID || ""));
}

async function jsonRequest(url: string, init: RequestInit, fetcher: JsonFetch) {
  // Manual preserves the no-follow policy on the Workers runtime.
  const response = await fetcher(url, { ...init, signal: AbortSignal.timeout(8_000), redirect: "manual" });
  if (response.status >= 300 && response.status < 400) throw new Error("REPORT_PROVIDER_UNAVAILABLE");
  // Never expose provider error bodies, tokens or personal identifiers in errors/logs.
  if (!response.ok) {
    if (response.status === 403) {
      const details = await response.json().catch(() => null) as { error?: { details?: { reason?: string }[] } } | null;
      if (details?.error?.details?.some(detail => detail.reason === "SERVICE_DISABLED")) throw new Error("REPORT_API_DISABLED");
    }
    throw new Error(response.status === 401 || response.status === 403 ? "REPORT_ACCESS_DENIED" : "REPORT_PROVIDER_UNAVAILABLE");
  }
  return response.json();
}

const encode = (input: string | Uint8Array) => {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const value of bytes) binary += String.fromCharCode(value);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
};

export async function googleReportingToken(env: AnalyticsCredentials, fetcher: JsonFetch = fetch) {
  let body: URLSearchParams;
  if (env.ADMIN_ANALYTICS_GOOGLE_SERVICE_ACCOUNT) {
    const account = JSON.parse(env.ADMIN_ANALYTICS_GOOGLE_SERVICE_ACCOUNT) as { client_email: string; private_key: string };
    if (!account.client_email || !account.private_key) throw new Error("REPORT_CREDENTIALS_INVALID");
    const now = Math.floor(Date.now() / 1_000);
    const unsigned = `${encode(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${encode(JSON.stringify({
      iss: account.client_email, scope: "https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3_600,
    }))}`;
    const pem = account.private_key.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
    const key = await crypto.subtle.importKey("pkcs8", Uint8Array.from(atob(pem), char => char.charCodeAt(0)), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
    body = new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${encode(new Uint8Array(signature))}` });
  } else {
    if (!env.ADMIN_ANALYTICS_GOOGLE_REFRESH_TOKEN || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) throw new Error("REPORT_NOT_CONFIGURED");
    body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: env.ADMIN_ANALYTICS_GOOGLE_REFRESH_TOKEN, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET });
  }
  const data = await jsonRequest("https://oauth2.googleapis.com/token", { method: "POST", body }, fetcher) as { access_token?: string };
  if (!data.access_token) throw new Error("REPORT_CREDENTIALS_INVALID");
  return data.access_token;
}

type SearchRow = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };
type SearchResponse = { rows?: SearchRow[] };
const searchTotals = (row?: SearchRow): Totals => ({ clicks: row ? numberValue(row.clicks) : 0, impressions: row ? numberValue(row.impressions) : 0, ctr: row ? numberValue(row.ctr) : 0, position: row && row.impressions > 0 ? numberValue(row.position) : null });

export async function collectSearchConsole(site: string, token: string, days: ReportDays, now = new Date(), fetcher: JsonFetch = fetch): Promise<Report> {
  const window = reportWindow(days, now);
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
  const query = (startDate: string, endDate: string, dimensions: string[] = [], rowLimit = 100) => jsonRequest(endpoint, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ startDate, endDate, dimensions, rowLimit, type: "web", dataState: "final" }),
  }, fetcher) as Promise<SearchResponse>;
  // Property totals are queried separately: anonymized queries and top-row truncation
  // make summing the keyword/page tables an incorrect way to calculate totals.
  const [current, previous, daily, keywords, pages] = await Promise.all([
    query(window.start, window.end), query(window.previousStart, window.previousEnd),
    query(window.start, window.end, ["date"]), query(window.start, window.end, ["query"], 10), query(window.start, window.end, ["page"], 10),
  ]);
  return {
    provider: "gsc", days, ...window, timezone: "America/Los_Angeles",
    totals: searchTotals(current.rows?.[0]), previous: searchTotals(previous.rows?.[0]),
    trend: (daily.rows || []).map(row => ({ date: row.keys?.[0] || "", value: numberValue(row.clicks) })).sort((a, b) => a.date.localeCompare(b.date)),
    keywords: (keywords.rows || []).map(row => ({ label: row.keys?.[0] || "", value: numberValue(row.clicks), secondary: numberValue(row.impressions) })),
    pages: (pages.rows || []).map(row => ({ label: row.keys?.[0] || "", value: numberValue(row.clicks), secondary: numberValue(row.impressions) })),
  };
}

type GaResponse = { rows?: { dimensionValues?: { value: string }[]; metricValues: { value: string }[] }[]; metadata?: { timeZone?: string; subjectToThresholding?: boolean } };
const gaMetrics = ["activeUsers", "sessions", "screenPageViews"];
const gaTotals = (report: GaResponse): Totals => Object.fromEntries(gaMetrics.map((metric, index) => [metric, numberValue(report.rows?.[0]?.metricValues[index]?.value || 0)]));

export async function collectGa4(property: string, token: string, days: ReportDays, now = new Date(), fetcher: JsonFetch = fetch): Promise<Report> {
  if (!/^\d+$/.test(property)) throw new Error("REPORT_CREDENTIALS_INVALID");
  const window = reportWindow(days, now, 2);
  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`;
  const query = (startDate: string, endDate: string, metrics: string[], dimensions: string[] = [], organic = false, limit = 100) => jsonRequest(endpoint, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ dateRanges: [{ startDate, endDate }], metrics: metrics.map(name => ({ name })), dimensions: dimensions.map(name => ({ name })),
      limit, ...(dimensions.length ? { orderBys: dimensions[0] === "date" ? [{ dimension: { dimensionName: "date" } }] : [{ metric: { metricName: metrics[0] }, desc: true }] } : {}),
      ...(organic ? { dimensionFilter: { filter: { fieldName: "sessionDefaultChannelGroup", stringFilter: { matchType: "EXACT", value: "Organic Search" } } } } : {}),
    }),
  }, fetcher) as Promise<GaResponse>;
  const [current, previous, organic, oldOrganic, daily, pages] = await Promise.all([
    query(window.start, window.end, gaMetrics), query(window.previousStart, window.previousEnd, gaMetrics),
    query(window.start, window.end, ["sessions"], [], true), query(window.previousStart, window.previousEnd, ["sessions"], [], true),
    query(window.start, window.end, ["sessions"], ["date"]), query(window.start, window.end, ["sessions"], ["landingPage"], false, 10),
  ]);
  return {
    provider: "ga4", days, ...window, timezone: current.metadata?.timeZone || "Property timezone",
    totals: { ...gaTotals(current), organicSessions: numberValue(organic.rows?.[0]?.metricValues[0]?.value || 0) },
    previous: { ...gaTotals(previous), organicSessions: numberValue(oldOrganic.rows?.[0]?.metricValues[0]?.value || 0) },
    trend: (daily.rows || []).map(row => ({ date: (row.dimensionValues?.[0]?.value || "").replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3"), value: numberValue(row.metricValues[0]?.value || 0) })),
    keywords: [], pages: (pages.rows || []).map(row => ({ label: row.dimensionValues?.[0]?.value || "(not set)", value: numberValue(row.metricValues[0]?.value || 0) })),
  };
}
