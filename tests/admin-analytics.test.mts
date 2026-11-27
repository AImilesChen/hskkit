import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { parseReportDays, percentChange, reportWindow } from "../src/lib/admin/analytics-model.ts";
import { collectGa4, collectSearchConsole, providerConfigured } from "../src/lib/admin/analytics-providers.ts";
import { readAnalytics, syncAnalytics } from "../src/lib/admin/analytics-storage.ts";

test("bounded ranges, finalized date windows and zero baselines are handled honestly", () => {
  assert.equal(parseReportDays("90"), 90);
  assert.equal(parseReportDays("100000"), 28);
  assert.deepEqual(reportWindow(7, new Date("2026-11-27T01:00:00Z")), {
    start: "2026-11-17", end: "2026-11-23", previousStart: "2026-11-10", previousEnd: "2026-11-16",
  });
  assert.equal(percentChange(5, 0), null);
  assert.equal(percentChange(null, 5), null);
  assert.equal(percentChange(0, 5), -100);
  assert.equal(providerConfigured("ga4", { GOOGLE_CLIENT_ID: "login-client", GOOGLE_CLIENT_SECRET: "login-secret", ADMIN_ANALYTICS_GA4_PROPERTY_ID: "123" }), false);
  assert.equal(providerConfigured("ga4", { ADMIN_ANALYTICS_GOOGLE_SERVICE_ACCOUNT: "{}", ADMIN_ANALYTICS_GA4_PROPERTY_ID: "G-TRACKING" }), false);
});

test("GSC totals come from property reports, not truncated or anonymized keyword rows", async () => {
  const requests: Record<string, unknown>[] = [];
  const report = await collectSearchConsole("sc-domain:hskkit.com", "test-token", 7, new Date("2026-11-27T01:00:00Z"), async (_url, init) => {
    const body = JSON.parse(String(init?.body)); requests.push(body);
    const dimension = body.dimensions[0];
    const rows = dimension === "query" ? [{ keys: ["test keyword"], clicks: 2, impressions: 10, ctr: .2, position: 3 }]
      : dimension === "date" ? [{ keys: ["2026-11-23"], clicks: 3, impressions: 10, ctr: .3, position: 3 }, { keys: ["2026-11-17"], clicks: 1, impressions: 10, ctr: .1, position: 3 }]
      : dimension === "page" ? [{ keys: ["https://hskkit.com/levels"], clicks: 2, impressions: 10, ctr: .2, position: 3 }]
      : [{ clicks: body.startDate === "2026-11-17" ? 12 : 8, impressions: 120, ctr: .1, position: 4 }];
    return Response.json({ rows });
  });
  assert.equal(report.totals.clicks, 12);
  assert.equal(report.previous.clicks, 8);
  assert.equal(report.keywords[0].value, 2);
  assert.deepEqual(report.trend.map(point => point.date), ["2026-11-17", "2026-11-23"]);
  assert.equal(requests.length, 5);
  assert.ok(requests.every(request => request.dataState === "final"));
});

test("GA4 uses distinct whole-period users and filtered organic sessions", async () => {
  const reports: Record<string, unknown>[] = [];
  const report = await collectGa4("12345", "test-token", 7, new Date("2026-11-27T01:00:00Z"), async (url, init) => {
    assert.ok(url.startsWith("https://analyticsdata.googleapis.com/v1beta/properties/12345:"));
    const body = JSON.parse(String(init?.body)); reports.push(body);
    const dimensions = body.dimensions;
    if (dimensions.length) return Response.json({ rows: [{ dimensionValues: [{ value: dimensions[0].name === "date" ? "20261121" : "/levels" }], metricValues: [{ value: "40" }] }] });
    if (body.dimensionFilter) return Response.json({ rows: [{ metricValues: [{ value: "18" }] }] });
    return Response.json({ rows: [{ metricValues: [{ value: "25" }, { value: "70" }, { value: "120" }] }], metadata: { timeZone: "America/New_York" } });
  });
  assert.equal(report.totals.activeUsers, 25);
  assert.equal(report.totals.sessions, 70);
  assert.equal(report.totals.organicSessions, 18);
  assert.equal(report.trend[0].date, "2026-11-21");
  assert.equal(report.timezone, "America/New_York");
  assert.equal(reports.length, 6);
  assert.equal(reports.filter(report => report.dimensionFilter).length, 2);
});

test("provider errors never include raw response bodies or tokens", async () => {
  await assert.rejects(collectGa4("123", "secret-token", 7, new Date(), async () => new Response("secret-token private account details", { status: 403 })), error => {
    assert.equal((error as Error).message, "REPORT_ACCESS_DENIED");
    return true;
  });
});

test("GET only reads snapshots and marks old data stale without clearing it", async () => {
  const payload = { provider: "gsc", days: 28, totals: { clicks: 10 } };
  let queries = 0;
  const db = { prepare(sql: string) {
    assert.match(sql, /^SELECT /); queries++;
    return { bind() { return this; }, async all() { return { results: [{ provider: "gsc", payload_json: JSON.stringify(payload), synced_at: "2026-11-20T00:00:00Z", attempted_at: "2026-11-21T00:00:00Z", last_error: "REPORT_PROVIDER_UNAVAILABLE" }] }; } };
  } };
  const data = await readAnalytics({ LEARNING_DB: db } as never, 28, new Date("2026-11-27T01:00:00Z"));
  assert.equal(queries, 1);
  assert.equal(data.sources[0].report?.totals.clicks, 10);
  assert.equal(data.sources[0].stale, true);
  assert.equal(data.sources[0].error, "REPORT_PROVIDER_UNAVAILABLE");
  assert.equal(data.sources[1].report, null);
});

test("unmigrated storage gives an explicit setup state, while other DB failures propagate", async () => {
  const env = (message: string) => ({ LEARNING_DB: { prepare() { return { bind() { return this; }, async all() { throw new Error(message); } }; } } });
  assert.equal((await readAnalytics(env("no such table: admin_analytics_snapshots") as never, 28)).storageReady, false);
  await assert.rejects(readAnalytics(env("D1 overloaded") as never, 28), /overloaded/);
});

test("no reporting credentials means no network requests or database writes", async () => {
  const env = { LEARNING_DB: { prepare() { throw new Error("must not touch database"); } } };
  assert.deepEqual(await syncAnalytics(env as never, 28), { state: "not_configured" });
});

test("overlapping refreshes cannot start another provider collection", async () => {
  let prepares = 0;
  const env = { ADMIN_ANALYTICS_GOOGLE_SERVICE_ACCOUNT: "{}", ADMIN_ANALYTICS_GSC_SITE: "sc-domain:hskkit.com", LEARNING_DB: { prepare(sql: string) {
    prepares++; assert.match(sql, /^UPDATE admin_analytics_sync_lock/);
    return { bind() { return this; }, async first() { return null; } };
  } } };
  assert.deepEqual(await syncAnalytics(env as never, 28), { state: "busy" });
  assert.equal(prepares, 1);
});

test("recent failed refreshes are rate limited too, and the lock is released", async () => {
  let released = false;
  const now = new Date("2026-11-27T01:00:00Z");
  const env = { ADMIN_ANALYTICS_GOOGLE_SERVICE_ACCOUNT: "{}", ADMIN_ANALYTICS_GSC_SITE: "sc-domain:hskkit.com", LEARNING_DB: { prepare(sql: string) {
    return { bind() { return this; }, async first() { return { id: 1 }; }, async all() { return { results: [{ provider: "gsc", attempted_at: now.toISOString(), last_error: "REPORT_PROVIDER_UNAVAILABLE", payload_json: null, synced_at: null }] }; }, async run() { assert.match(sql, /WHERE id=1 AND token=/); released = true; } };
  } } };
  assert.deepEqual(await syncAnalytics(env as never, 28, now), { state: "recent" });
  assert.equal(released, true);
});

test("real SQLite migration and failed sync preserve last-good snapshots and release the lease", async () => {
  const sqlite = new DatabaseSync(":memory:");
  try {
    const migration = readFileSync(new URL("../migrations/0060_admin_analytics_snapshots.sql", import.meta.url), "utf8");
    sqlite.exec(migration);
    sqlite.exec(migration); // migration is safe to retry
    const payload = JSON.stringify({ provider: "gsc", days: 28, totals: { clicks: 42 } });
    sqlite.prepare("INSERT INTO admin_analytics_snapshots VALUES(?,?,?,?,?,?)").run("gsc", 28, payload, "2026-11-20T00:00:00Z", "2026-11-20T00:00:00Z", null);
    const db = { prepare(sql: string) {
      const statement = sqlite.prepare(sql);
      let values: (string | number | null)[] = [];
      return { bind(...args: unknown[]) { values = args as typeof values; return this; },
        async first() { return statement.get(...values) ?? null; },
        async all() { return { results: statement.all(...values) }; },
        async run() { return statement.run(...values); },
      };
    } };
    const env = { LEARNING_DB: db, ADMIN_ANALYTICS_GOOGLE_SERVICE_ACCOUNT: "invalid JSON", ADMIN_ANALYTICS_GSC_SITE: "sc-domain:hskkit.com" };
    const now = new Date("2026-11-27T01:00:00Z");
    assert.deepEqual(await syncAnalytics(env as never, 28, now), { state: "updated" });
    const data = await readAnalytics(env as never, 28, now);
    assert.equal(data.sources[0].report?.totals.clicks, 42);
    assert.equal(data.sources[0].syncedAt, "2026-11-20T00:00:00Z");
    assert.equal(data.sources[0].attemptedAt, now.toISOString());
    assert.equal(data.sources[0].error, "REPORT_PROVIDER_UNAVAILABLE");
    assert.deepEqual(await syncAnalytics(env as never, 28, now), { state: "recent" });
    assert.deepEqual(await syncAnalytics(env as never, 7, now), { state: "updated" });
    assert.deepEqual(await syncAnalytics(env as never, 90, now), { state: "updated" });
    assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM admin_analytics_snapshots").get()?.n, 3);
  } finally { sqlite.close(); }
});
