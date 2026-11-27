import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { build } from "esbuild";
import { REPORTING_SCOPES, REPORTING_STATE_PREFIX, exchangeReportingCode, hasReportingScopes, openReportingSecret, reportingAuthorizationUrl, resolveReportingConnection, saveReportingConnection, sealReportingSecret, validReportingState } from "../src/lib/admin/analytics-connection.ts";
import { readAnalytics } from "../src/lib/admin/analytics-storage.ts";
import { refreshBoundAnalytics } from "../src/lib/admin/analytics-runtime.ts";
import scheduler from "../workers/admin-analytics-worker.ts";

const config = { GOOGLE_CLIENT_ID: "client-id", GOOGLE_CLIENT_SECRET: "local-test-secret", GOOGLE_REDIRECT_URI: "https://hskkit.com/api/v1/auth/google/callback" };

test("reporting OAuth reuses the registered callback and requests only two offline read scopes with PKCE", () => {
  const url = reportingAuthorizationUrl(config, REPORTING_STATE_PREFIX + "random", "challenge");
  assert.equal(url.origin, "https://accounts.google.com");
  assert.deepEqual(url.searchParams.get("scope")?.split(" "), [...REPORTING_SCOPES]);
  assert.equal(url.searchParams.get("redirect_uri"), config.GOOGLE_REDIRECT_URI);
  assert.equal(url.searchParams.get("access_type"), "offline");
  assert.equal(url.searchParams.get("include_granted_scopes"), "false");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("prompt"), "consent select_account");
  assert.throws(() => reportingAuthorizationUrl({ ...config, GOOGLE_REDIRECT_URI: "https://other.example/callback" }, "s", "c"), /CREDENTIALS_INVALID/);
});

test("authorization state is bound to the initiating admin, verifier, purpose and short expiration", () => {
  const value = { state: REPORTING_STATE_PREFIX + "random", verifier: "a".repeat(64), userId: "admin-a", issuedAt: 100_000 };
  assert.equal(validReportingState(value, value.state, "admin-a", 200_000), true);
  assert.equal(validReportingState(value, value.state, "admin-b", 200_000), false);
  assert.equal(validReportingState(value, "learner-login-state", "admin-a", 200_000), false);
  assert.equal(validReportingState(value, value.state, "admin-a", 800_001), false);
  assert.equal(validReportingState(value, value.state, "admin-a", 0), false);
  assert.equal(validReportingState({ ...value, verifier: "short" }, value.state, "admin-a", 200_000), false);
});

test("stored credentials are encrypted, authenticated and separated from authorization-cookie keys", async () => {
  const sealed = await sealReportingSecret("fixture-refresh-token", config.GOOGLE_CLIENT_SECRET, "refresh-token");
  assert.ok(!sealed.includes("fixture-refresh-token"));
  assert.equal(await openReportingSecret(sealed, config.GOOGLE_CLIENT_SECRET, "refresh-token"), "fixture-refresh-token");
  await assert.rejects(openReportingSecret(sealed, "wrong-secret", "refresh-token"));
  await assert.rejects(openReportingSecret(sealed, config.GOOGLE_CLIENT_SECRET, "oauth-state"));
  const parts = sealed.split(".");
  parts[2] = (parts[2][0] === "A" ? "B" : "A") + parts[2].slice(1);
  await assert.rejects(openReportingSecret(parts.join("."), config.GOOGLE_CLIENT_SECRET, "refresh-token"));
});

test("partial grants and missing offline credentials cannot be silently accepted", async () => {
  assert.equal(hasReportingScopes(REPORTING_SCOPES[0]), false);
  await assert.rejects(exchangeReportingCode(config, "code", "v".repeat(64), async () => Response.json({ access_token: "access", scope: REPORTING_SCOPES.join(" ") })), /REFRESH_MISSING/);
  await assert.rejects(exchangeReportingCode(config, "code", "v".repeat(64), async () => Response.json({ refresh_token: "refresh", scope: REPORTING_SCOPES[0] })), /SCOPES_MISSING/);
  await assert.rejects(exchangeReportingCode(config, "code", "v".repeat(64), async () => new Response("private provider error", { status: 400 })), /ACCESS_DENIED/);
  const result = await exchangeReportingCode(config, "code", "v".repeat(64), async (_url, init) => {
    const body = init?.body as URLSearchParams;
    assert.equal(body.get("redirect_uri"), config.GOOGLE_REDIRECT_URI);
    assert.equal(body.get("code_verifier"), "v".repeat(64));
    return Response.json({ refresh_token: "refresh", scope: REPORTING_SCOPES.join(" ") });
  });
  assert.equal(result.refreshToken, "refresh");
});

test("connection stores only encrypted credentials, reuses existing property, and keeps secrets out of dashboard JSON", async () => {
  const sqlite = new DatabaseSync(":memory:");
  try {
    const db = { prepare(sql: string) {
      let values: (string | number | null)[] = [];
      return { bind(...args: unknown[]) { values = args as typeof values; return this; }, async first() { return sqlite.prepare(sql).get(...values) ?? null; }, async all() { return { results: sqlite.prepare(sql).all(...values) }; }, async run() { return sqlite.prepare(sql).run(...values); } };
    }, async batch(statements: { run(): Promise<unknown> }[]) {
      sqlite.exec("BEGIN");
      try { const result = []; for (const statement of statements) result.push(await statement.run()); sqlite.exec("COMMIT"); return result; }
      catch (error) { sqlite.exec("ROLLBACK"); throw error; }
    } };
    const env = { ...config, LEARNING_DB: db };
    assert.equal((await resolveReportingConnection(env as never)).status.connected, false);
    await saveReportingConnection(env as never, "fixture-refresh-token", REPORTING_SCOPES.join(" "), "admin-a");
    const stored = sqlite.prepare("SELECT * FROM admin_analytics_connection").get();
    assert.ok(!JSON.stringify(stored).includes("fixture-refresh-token"));
    const connected = await resolveReportingConnection(env as never);
    assert.equal(connected.credentials.ADMIN_ANALYTICS_GA4_PROPERTY_ID, "538727924");
    assert.equal(connected.credentials.ADMIN_ANALYTICS_GSC_SITE, "sc-domain:hskkit.com");
    assert.equal(connected.credentials.ADMIN_ANALYTICS_GOOGLE_REFRESH_TOKEN, "fixture-refresh-token");
    const dashboard = await readAnalytics(env as never, 28);
    assert.equal(dashboard.connection?.connected, true);
    assert.ok(dashboard.sources.every(source => source.configured));
    assert.doesNotMatch(JSON.stringify(dashboard), /fixture-refresh-token|local-test-secret|encrypted_refresh_token|admin-a/);
    await saveReportingConnection(env as never, "new-refresh", REPORTING_SCOPES.join(" "), "admin-a");
    assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM admin_analytics_connection").get()?.n, 1);
  } finally { sqlite.close(); }
});

test("reporting callback middleware does not reroute normal learner logins", async () => {
  const result = await build({ entryPoints: ["src/middleware.ts"], bundle: true, write: false, format: "cjs", platform: "node", packages: "external" });
  const moduleValue = { exports: {} as { middleware: (request: unknown) => Response } };
  const load = createRequire(import.meta.url);
  new Function("require", "module", "exports", result.outputFiles[0].text)(load, moduleValue, moduleValue.exports);
  const { NextRequest } = load("next/server");
  const normal = moduleValue.exports.middleware(new NextRequest("https://hskkit.com/api/v1/auth/google/callback?code=fixture&state=normal-login"));
  assert.equal(normal.headers.has("x-middleware-rewrite"), false);
  const reporting = moduleValue.exports.middleware(new NextRequest(`https://hskkit.com/api/v1/auth/google/callback?code=fixture&state=${REPORTING_STATE_PREFIX}random`));
  const target = new URL(reporting.headers.get("x-middleware-rewrite")!);
  assert.equal(target.pathname, "/api/v1/admin/analytics/google/callback");
  assert.equal(target.searchParams.get("code"), "fixture");
  assert.equal(reporting.headers.get("cache-control"), "private, no-store");
  const start = readFileSync(new URL("../src/app/api/v1/admin/analytics/connect/route.ts", import.meta.url), "utf8");
  assert.match(start, /requireAdmin\(\)/);
  assert.match(start, /requireAdminSameOrigin\(request\)/);
});

test("scheduled synchronization has no public HTTP trigger and bounds all windows", async () => {
  assert.equal((await scheduler.fetch()).status, 404);
  const windows: number[] = [];
  const env = { DASHBOARD: { async refresh(days: number) { windows.push(days); } } };
  await scheduler.scheduled({ scheduledTime: Date.parse("2026-11-27T09:00:00Z") }, env);
  await scheduler.scheduled({ scheduledTime: Date.parse("2026-11-27T10:15:00Z") }, env);
  assert.deepEqual(windows, []);
  await scheduler.scheduled({ scheduledTime: Date.parse("2026-11-27T09:15:00Z") }, env);
  assert.deepEqual(windows, [7, 28, 90]);
  await scheduler.scheduled({ scheduledTime: Date.parse("2026-11-27T09:15:00Z") }, {});
  await assert.rejects(refreshBoundAnalytics({} as never, 100_000), /INVALID_REPORT_WINDOW/);
});
