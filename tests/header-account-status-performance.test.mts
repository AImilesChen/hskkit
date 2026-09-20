import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path: string) => fs.readFileSync(new URL(path, root), "utf8");
const exists = (path: string) => fs.existsSync(new URL(path, root));

const statusRoutePath = "src/app/api/v1/account/status/route.ts";
const statusLoaderPath = "src/lib/account/header-status.ts";
const statusLoaderUrl = new URL(`../${statusLoaderPath}`, import.meta.url);

test("Header uses a dedicated lightweight account-status contract", () => {
  assert.equal(exists(statusRoutePath), true, "the lightweight status route must exist");
  assert.equal(exists(statusLoaderPath), true, "the Header status loader must exist");

  const header = read("src/app/site-header.tsx");
  const loader = read(statusLoaderPath);
  assert.match(header, /loadHeaderAccountStatus/);
  assert.doesNotMatch(header, /loadAccountSnapshot/);
  assert.match(loader, /fetch\("\/api\/v1\/account\/status"/);
  assert.doesNotMatch(loader, /fetch\("\/api\/v1\/account"/);
});

test("status route preserves session touch while avoiding full account and guest aggregates", () => {
  assert.equal(exists(statusRoutePath), true, "the lightweight status route must exist");
  const route = read(statusRoutePath);

  assert.match(route, /requestIdentity\(\{ touchSession: true \}\)/);
  assert.match(route, /signedIn:\s*Boolean\(identity\.account\)/);
  assert.match(route, /private, no-store/);
  for (const heavyRead of ["loadState", "loadPlacementState", "countPlans"]) {
    assert.doesNotMatch(route, new RegExp(`\\b${heavyRead}\\b`));
  }
});

test("full Account page keeps its existing detailed account request", () => {
  const accountClient = read("src/app/account/account-client.tsx");
  const accountLoader = read("src/lib/account/browser.ts");

  assert.match(accountClient, /loadAccountSnapshot<AccountView>/);
  assert.match(accountLoader, /fetch\("\/api\/v1\/account"/);
  assert.doesNotMatch(accountLoader, /\/api\/v1\/account\/status/);
});

test("Header status loader deduplicates concurrent requests and force-refreshes auth changes", async () => {
  const { clearHeaderAccountStatus, loadHeaderAccountStatus } = await import(statusLoaderUrl.href);
  const originalFetch = globalThis.fetch;
  let calls = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });

  globalThis.fetch = (async (input) => {
    calls += 1;
    assert.equal(input, "/api/v1/account/status");
    if (calls === 1) await gate;
    return Response.json({ signedIn: calls > 1 });
  }) as typeof fetch;

  try {
    clearHeaderAccountStatus();
    const first = loadHeaderAccountStatus({ timeoutMs: 1_000, retryDelaysMs: [] });
    const second = loadHeaderAccountStatus({ timeoutMs: 1_000, retryDelaysMs: [] });
    assert.equal(calls, 1);
    release();
    assert.deepEqual(await first, { signedIn: false });
    assert.deepEqual(await second, { signedIn: false });
    assert.equal(calls, 1);

    assert.deepEqual(await loadHeaderAccountStatus({ force: true, timeoutMs: 1_000, retryDelaysMs: [] }), { signedIn: true });
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
    clearHeaderAccountStatus();
  }
});
