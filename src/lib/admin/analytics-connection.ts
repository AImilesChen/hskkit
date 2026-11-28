import type { AnalyticsEnv } from "./analytics-storage.ts";
import type { AnalyticsCredentials } from "./analytics-providers.ts";

export const REPORTING_SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly", "https://www.googleapis.com/auth/analytics.readonly"] as const;
export const REPORTING_STATE_PREFIX = "hskkit_analytics_";
export const REPORTING_COOKIE = "__Host-hskkit_reporting_oauth";
export const REPORTING_CONNECTION_SCHEMA = "CREATE TABLE IF NOT EXISTS admin_analytics_connection (id INTEGER PRIMARY KEY CHECK(id=1),encrypted_refresh_token TEXT NOT NULL,granted_scopes TEXT NOT NULL,connected_by TEXT NOT NULL,updated_at TEXT NOT NULL)";
const DEFAULT_SITE = "sc-domain:hskkit.com";
const DEFAULT_PROPERTY = "538727924"; // Existing property verified against G-W19896DKRJ.
const encoder = new TextEncoder();
const bytes64 = (bytes: Uint8Array) => btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(""));
const from64 = (value: string) => Uint8Array.from(atob(value), char => char.charCodeAt(0));

async function encryptionKey(secret: string, purpose: string) {
  if (!secret) throw new Error("REPORT_CREDENTIALS_INVALID");
  const material = await crypto.subtle.importKey("raw", encoder.encode(secret), "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: encoder.encode("hskkit-admin-analytics-v1"), info: encoder.encode(purpose) }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
export async function sealReportingSecret(value: string, secret: string, purpose: string) {
  if (value.length > 16_000) throw new Error("REPORT_CREDENTIALS_INVALID");
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce, additionalData: encoder.encode(purpose) }, await encryptionKey(secret, purpose), encoder.encode(value));
  return `v1.${bytes64(nonce)}.${bytes64(new Uint8Array(ciphertext))}`;
}
export async function openReportingSecret(value: string, secret: string, purpose: string) {
  if (value.length > 24_000) throw new Error("REPORT_CREDENTIALS_INVALID");
  const [version, iv, data, extra] = value.split(".");
  if (version !== "v1" || !iv || !data || extra) throw new Error("REPORT_CREDENTIALS_INVALID");
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: from64(iv), additionalData: encoder.encode(purpose) }, await encryptionKey(secret, purpose), from64(data));
  return new TextDecoder().decode(plaintext);
}

export type ReportingOAuthState = { state: string; verifier: string; userId: string; issuedAt: number };
export function validReportingState(value: ReportingOAuthState, state: string, userId: string, now = Date.now()) {
  return Boolean(state.startsWith(REPORTING_STATE_PREFIX) && state === value.state && userId === value.userId &&
    typeof value.verifier === "string" && /^[A-Za-z0-9_-]{43,128}$/.test(value.verifier) &&
    Number.isFinite(value.issuedAt) && now - value.issuedAt >= -60_000 && now - value.issuedAt <= 600_000);
}
export function hasReportingScopes(value: string) {
  const granted = new Set(value.split(/\s+/));
  return REPORTING_SCOPES.every(scope => granted.has(scope));
}

type Connection = { encrypted_refresh_token: string; granted_scopes: string; updated_at: string };
async function readConnection(env: AnalyticsEnv) {
  try {
    return await env.LEARNING_DB.prepare("SELECT encrypted_refresh_token,granted_scopes,updated_at FROM admin_analytics_connection WHERE id=1").first<Connection>();
  } catch (error) {
    if (/no such table:\s*admin_analytics_connection/i.test(String(error))) return null;
    throw error;
  }
}

export async function saveReportingConnection(env: AnalyticsEnv, refreshToken: string, scopes: string, userId: string, now = new Date()) {
  if (!refreshToken || refreshToken.length > 8_000 || !hasReportingScopes(scopes)) throw new Error("REPORT_SCOPES_MISSING");
  const encrypted = await sealReportingSecret(refreshToken, env.GOOGLE_CLIENT_SECRET || "", "refresh-token");
  await env.LEARNING_DB.batch([
    env.LEARNING_DB.prepare(REPORTING_CONNECTION_SCHEMA),
    env.LEARNING_DB.prepare("INSERT INTO admin_analytics_connection(id,encrypted_refresh_token,granted_scopes,connected_by,updated_at) VALUES(1,?,?,?,?) ON CONFLICT(id) DO UPDATE SET encrypted_refresh_token=excluded.encrypted_refresh_token,granted_scopes=excluded.granted_scopes,connected_by=excluded.connected_by,updated_at=excluded.updated_at")
      .bind(encrypted, scopes, userId, now.toISOString()),
  ]);
}

export type ReportingConnectionStatus = { canConnect: boolean; connected: boolean; updatedAt: string | null };
export async function resolveReportingConnection(env: AnalyticsEnv): Promise<{ credentials: AnalyticsEnv; status: ReportingConnectionStatus }> {
  const status: ReportingConnectionStatus = { canConnect: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REDIRECT_URI), connected: false, updatedAt: null };
  // Explicit operator-managed credentials remain supported and take precedence.
  if (env.ADMIN_ANALYTICS_GOOGLE_SERVICE_ACCOUNT || env.ADMIN_ANALYTICS_GOOGLE_REFRESH_TOKEN) return { credentials: env, status: { ...status, connected: true } };
  if (!env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CLIENT_ID) return { credentials: env, status };
  const connection = await readConnection(env);
  if (!connection || !hasReportingScopes(connection.granted_scopes)) return { credentials: env, status };
  try {
    return { credentials: { ...env, ADMIN_ANALYTICS_GOOGLE_REFRESH_TOKEN: await openReportingSecret(connection.encrypted_refresh_token, env.GOOGLE_CLIENT_SECRET || "", "refresh-token"),
      ADMIN_ANALYTICS_GSC_SITE: env.ADMIN_ANALYTICS_GSC_SITE || DEFAULT_SITE, ADMIN_ANALYTICS_GA4_PROPERTY_ID: env.ADMIN_ANALYTICS_GA4_PROPERTY_ID || DEFAULT_PROPERTY }, status: { ...status, connected: true, updatedAt: connection.updated_at } };
  } catch { throw new Error("REPORT_CREDENTIALS_INVALID"); }
}

export async function resolveReportingCredentials(env: AnalyticsEnv): Promise<AnalyticsEnv> {
  return (await resolveReportingConnection(env)).credentials;
}

export type ReportingOAuthConfig = AnalyticsCredentials & { GOOGLE_REDIRECT_URI?: string };
export function reportingAuthorizationUrl(env: ReportingOAuthConfig, state: string, challenge: string) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) throw new Error("REPORT_NOT_CONFIGURED");
  const redirect = new URL(env.GOOGLE_REDIRECT_URI);
  if (redirect.protocol !== "https:" || redirect.hostname !== "hskkit.com" || redirect.pathname !== "/api/v1/auth/google/callback") throw new Error("REPORT_CREDENTIALS_INVALID");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: env.GOOGLE_REDIRECT_URI, response_type: "code", scope: REPORTING_SCOPES.join(" "), state, code_challenge: challenge, code_challenge_method: "S256", access_type: "offline", include_granted_scopes: "false", prompt: "consent select_account" }).toString();
  return url;
}

export async function exchangeReportingCode(env: ReportingOAuthConfig, code: string, verifier: string, request: typeof fetch = fetch) {
  if (!code || code.length > 2_048 || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) throw new Error("REPORT_CREDENTIALS_INVALID");
  // Workers supports manual/follow only. Never forward OAuth credentials to redirects.
  const response = await request("https://oauth2.googleapis.com/token", { method: "POST", redirect: "manual", signal: AbortSignal.timeout(8_000),
    headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, code_verifier: verifier, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: env.GOOGLE_REDIRECT_URI, grant_type: "authorization_code" }) });
  if (response.status >= 300 && response.status < 400) throw new Error("REPORT_ACCESS_DENIED");
  if (!response.ok) {
    // Keep only a fixed OAuth error category, never error_description or raw data.
    const details = await response.json().catch(() => null) as { error?: string } | null;
    const codes: Record<string, string> = {
      invalid_client: "REPORT_TOKEN_INVALID_CLIENT",
      invalid_grant: "REPORT_TOKEN_INVALID_GRANT",
      invalid_request: "REPORT_TOKEN_INVALID_REQUEST",
    };
    const category = details?.error;
    throw new Error(category && Object.hasOwn(codes, category) ? codes[category] : "REPORT_ACCESS_DENIED");
  }
  const body = await response.json() as { refresh_token?: string; scope?: string };
  if (!body.refresh_token) throw new Error("REPORT_REFRESH_MISSING");
  if (!hasReportingScopes(body.scope || "")) throw new Error("REPORT_SCOPES_MISSING");
  return { refreshToken: body.refresh_token, scopes: body.scope! };
}
