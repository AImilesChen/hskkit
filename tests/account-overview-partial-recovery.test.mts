import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { resetUserD1ProtectionForTest, withUserD1TransientRetry } from "../src/lib/d1/user-retry.ts";

const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const route = read("../src/app/api/v1/account/overview/route.ts");
const client = read("../src/app/account/account-client.tsx");

test("account overview protects bounded read groups instead of timing the whole aggregate as one D1 read", () => {
  assert.doesNotMatch(route, /return await withUserD1ReadProtection\(async \(\) => \{/);
  assert.match(route, /const baseReads = await Promise\.allSettled\(/);
  assert.match(route, /protectedRead\(\(\) => loadState\(ownerId\)\)/);
  assert.match(route, /protectedRead\(\(\) => resolveCommercialAccess\(ownerId\)\)/);
  assert.match(route, /return \{ ok: true, value: await withUserD1TransientRetry\(operation\) \}/);
  assert.doesNotMatch(route, /withUserD1ReadProtection/);
});

test("account overview returns independent resource envelopes and supports retrying selected resources", () => {
  assert.match(route, /type AccountOverviewResource =/);
  assert.match(route, /status: "ready"/);
  assert.match(route, /status: "error"/);
  assert.match(route, /searchParams\.get\("resources"\)/);
  assert.match(route, /resources: responseResources/);
});

test("account client applies each resource independently and retries only failed resources", () => {
  assert.match(client, /data\.resources/);
  assert.match(client, /setAuxiliary\(current => \(\{ \.\.\.current, \[resource\]: result\.status \}\)\)/);
  assert.match(client, /const retryFailedAuxiliary =/);
  assert.match(client, /filter\(resource => auxiliary\[resource\] === "error"\)/);
  assert.match(client, /resources=\$\{encodeURIComponent\(requested\.join\(","\)\)\}/);
  assert.doesNotMatch(client, /setAuxiliary\(\{ streak: "error", sync: "error", subscription: "error", ai: "error", referrals: "error", planner: "error" \}\)/);
});

test("aggregate retry retries a real transient D1 error without using the synthetic read timeout", async () => {
  resetUserD1ProtectionForTest();
  let attempts = 0;
  const result = await withUserD1TransientRetry(async () => {
    attempts += 1;
    if (attempts === 1) throw new Error("D1 DB is overloaded");
    return "ready";
  });
  assert.equal(result, "ready");
  assert.equal(attempts, 2);
});

test("aggregate retry does not relabel permanent application errors as D1 failures", async () => {
  resetUserD1ProtectionForTest();
  await assert.rejects(() => withUserD1TransientRetry(async () => {
    throw new Error("INVALID_ACCOUNT_SHAPE");
  }), /INVALID_ACCOUNT_SHAPE/);
});
