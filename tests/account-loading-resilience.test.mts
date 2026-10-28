import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const browserModuleUrl = new URL("../src/lib/account/browser.ts", import.meta.url);
const auxiliaryModuleUrl = new URL("../src/lib/account/auxiliary.ts", import.meta.url);
const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

const accountPayload = {
  account: { userId: "user-1", displayName: "Learner", timezone: "UTC", status: "active", createdAt: "2026-09-06T00:00:00.000Z" },
  connection: "google",
  guest: { hasData: false, attempts: 0, learningSessions: 0, plannerVersions: 0, revision: 0 },
};

test("header and Account share one in-flight account request", async () => {
  assert.equal(fs.existsSync(browserModuleUrl), true, "a shared browser account loader must exist");
  const { clearAccountSnapshot, loadAccountSnapshot } = await import(browserModuleUrl.href);
  clearAccountSnapshot();

  const originalFetch = globalThis.fetch;
  let calls = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  globalThis.fetch = (async () => {
    calls += 1;
    await gate;
    return Response.json(accountPayload);
  }) as typeof fetch;

  try {
    const first = loadAccountSnapshot({ timeoutMs: 1000, retryDelaysMs: [] });
    const second = loadAccountSnapshot({ timeoutMs: 1000, retryDelaysMs: [] });
    assert.equal(calls, 1);
    release();
    assert.deepEqual(await first, accountPayload);
    assert.deepEqual(await second, accountPayload);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    clearAccountSnapshot();
  }
});

test("account loader retries one transient response and exposes a bounded timeout", async () => {
  assert.equal(fs.existsSync(browserModuleUrl), true, "a bounded account loader must exist");
  const { clearAccountSnapshot, loadAccountSnapshot } = await import(browserModuleUrl.href);
  const originalFetch = globalThis.fetch;

  try {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return calls === 1 ? Response.json({ error: "busy" }, { status: 503 }) : Response.json(accountPayload);
    }) as typeof fetch;
    clearAccountSnapshot();
    assert.deepEqual(await loadAccountSnapshot({ timeoutMs: 100, retryDelaysMs: [0] }), accountPayload);
    assert.equal(calls, 2);

    globalThis.fetch = ((_: string | URL | Request, init?: RequestInit) => new Promise<Response>((_, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
    })) as typeof fetch;
    clearAccountSnapshot();
    await assert.rejects(
      loadAccountSnapshot({ timeoutMs: 5, retryDelaysMs: [] }),
      /ACCOUNT_STATUS_TIMEOUT/,
    );
  } finally {
    globalThis.fetch = originalFetch;
    clearAccountSnapshot();
  }
});

test("Account auxiliary resources load in bounded batches", async () => {
  assert.equal(fs.existsSync(auxiliaryModuleUrl), true, "an auxiliary batch loader must exist");
  const { settleInBatches } = await import(auxiliaryModuleUrl.href);
  let active = 0;
  let maximum = 0;
  const tasks = Array.from({ length: 6 }, (_, index) => async () => {
    active += 1;
    maximum = Math.max(maximum, active);
    await new Promise((resolve) => setTimeout(resolve, 2));
    active -= 1;
    return index;
  });
  const results = await settleInBatches(tasks, 3);
  assert.equal(maximum, 3);
  assert.deepEqual(results.map((result: PromiseSettledResult<number>) => result.status === "fulfilled" ? result.value : -1), [0, 1, 2, 3, 4, 5]);
});

test("only the primary account status request touches session recency", () => {
  const identity = read("../src/lib/account/identity.ts");
  const storage = read("../src/lib/account/storage.ts");
  const route = read("../src/app/api/v1/account/route.ts");
  const accountClient = read("../src/app/account/account-client.tsx");
  const header = read("../src/app/site-header.tsx");

  assert.match(identity, /requestIdentity\(options:[\s\S]*touchSession/);
  assert.match(identity, /authenticateSession\(sessionToken, options\.touchSession/);
  assert.match(storage, /authenticateSession\(sessionToken: string \| undefined, touchSession = false\)/);
  assert.match(storage, /if \(touchSession\)[\s\S]*UPDATE account_sessions SET last_used_at/);
  assert.match(route, /requestIdentity\(\{ touchSession: true \}\)/);
  assert.match(accountClient, /loadAccountSnapshot/);
  assert.match(accountClient, /settleInBatches/);
  assert.match(header, /loadAccountSessionSnapshot/);
  assert.match(read("../src/app/api/v1/account/session/route.ts"), /!jar\.has\(SESSION_COOKIE\)[\s\S]*!jar\.has\(ACCOUNT_COOKIE\)/);
  assert.doesNotMatch(header, /fetch\("\/api\/v1\/account"/);
});
