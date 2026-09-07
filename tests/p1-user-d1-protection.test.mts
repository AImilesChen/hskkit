import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  MAX_D1_READ_ATTEMPTS,
  resetUserD1ProtectionForTest,
  withUserD1ReadProtection,
} from "../src/lib/d1/user-retry.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("session authentication is request-cached and last-used writes stay throttled", () => {
  const identity = read("src/lib/account/identity.ts");
  const storage = read("src/lib/account/storage.ts");
  assert.match(identity, /import \{ cache \} from "react"/);
  assert.match(identity, /cache\(async function resolveRequestIdentity/);
  assert.match(storage, /last_used_at\s*<\s*\?/);
  assert.match(storage, /SESSION_TOUCH_INTERVAL_MS/);
  assert.match(storage, /last_seen_at\s*<=\s*\?/);
  assert.match(storage, /DEVICE_TOUCH_INTERVAL_MS/);
  const engagement = read("src/app/components/learning-engagement-tracker.tsx");
  const engagementStorage = read("src/lib/engagement/storage.ts");
  const engagementDomain = read("src/lib/engagement/domain.ts");
  assert.match(engagement, /setInterval\(async \(\) => \{[\s\S]*?\}, 60_000\)/);
  assert.match(engagement, /Math\.min\(60,/);
  assert.match(engagementStorage, /input\.seconds > 60/);
  assert.match(engagementDomain, /Math\.min\(60,/);
});

test("planner and user hot paths have bounded history and precise composite indexes", () => {
  const planner = read("src/lib/planner/storage.ts");
  const accountRoute = read("src/app/api/v1/account/route.ts");
  const migration = read("migrations/0039_user_d1_p1_hardening.sql");
  assert.doesNotMatch(accountRoute, /listAllPlans/);
  assert.match(accountRoute, /countPlans/);
  assert.match(planner, /LIMIT \?/);
  assert.match(planner, /version<\?/);
  assert.match(migration, /study_plan_versions\(owner_id,status,version DESC\)/);
  assert.match(migration, /policy_audit_events\(subject_id,resource_type,result,created_at DESC\)/);
  assert.match(migration, /subscription_orders\(owner_id,stripe_livemode,created_at DESC\)/);
  assert.match(migration, /promotional_entitlements\(owner_id,kind,created_at DESC\)/);
  assert.doesNotMatch(migration, /account_devices\(user_id,revoked_at,last_seen_at DESC\)/);
});

test("Account dashboard uses one read-only aggregate instead of six component requests", () => {
  const client = read("src/app/account/account-client.tsx");
  const overview = read("src/app/api/v1/account/overview/route.ts");
  const auxiliaryLoader = client.slice(client.indexOf("const loadAuxiliary"), client.indexOf("const refresh ="));
  assert.match(client, /\/api\/v1\/account\/overview\?deviceId=/);
  for (const path of ["/api/v1/account/streak", "/api/v1/account/sync", "/api/v1/commercial/subscription", "/api/v1/ai", "/api/v1/commercial/referrals", "/api/v1/planner"]) {
    assert.doesNotMatch(auxiliaryLoader, new RegExp(path.replaceAll("/", "\\/")));
  }
  assert.match(overview, /quotaSnapshot/);
  assert.match(overview, /trialAndReferralSnapshot/);
  assert.doesNotMatch(overview, /registerSyncDevice/);
  assert.match(overview, /withUserD1ReadProtection/);
});

test("Account, Learning and Planner return explicit bounded D1 overload responses", () => {
  const protection = read("src/lib/d1/user-protection.ts");
  const retry = read("src/lib/d1/user-retry.ts");
  assert.match(retry, /MAX_D1_READ_ATTEMPTS\s*=\s*2/);
  assert.match(retry, /D1_RETRY_CONCURRENCY\s*=\s*2/);
  assert.match(retry, /USER_D1_READ_TIMEOUT_MS\s*=\s*8_000/);
  assert.match(retry, /7429/);
  assert.match(protection, /D1_TEMPORARILY_UNAVAILABLE/);
  assert.match(retry, /circuitOpenUntil/);
  for (const path of ["src/app/api/v1/account/route.ts", "src/app/api/v1/learning/route.ts", "src/app/api/v1/planner/route.ts"]) {
    const route = read(path);
    assert.match(route, /withUserD1ReadProtection/);
    assert.match(route, /d1UnavailableResponse/);
  }
});

test("D1 retry stops at the bound, skips permanent failures and opens the circuit", async () => {
  resetUserD1ProtectionForTest();
  let attempts = 0;
  await assert.rejects(withUserD1ReadProtection(async () => {
    attempts += 1;
    throw new Error("D1 DB is overloaded. Requests queued for too long (7429)");
  }), /D1_TEMPORARILY_UNAVAILABLE/);
  assert.equal(attempts, MAX_D1_READ_ATTEMPTS);

  resetUserD1ProtectionForTest();
  let timedAttempts = 0;
  await assert.rejects(
    () => withUserD1ReadProtection(async () => {
      timedAttempts += 1;
      await new Promise((resolve) => setTimeout(resolve, 25));
      return "late";
    }, 5),
    /D1_TEMPORARILY_UNAVAILABLE/,
  );
  assert.equal(timedAttempts, 1);

  resetUserD1ProtectionForTest();
  attempts = 0;
  await assert.rejects(withUserD1ReadProtection(async () => {
    attempts += 1;
    throw new Error("PERMANENT_FAILURE");
  }), /PERMANENT_FAILURE/);
  assert.equal(attempts, 1);

  resetUserD1ProtectionForTest();
  let circuitAttempts = 0;
  const overload = async () => {
    circuitAttempts += 1;
    throw new Error("code 7429");
  };
  for (let failure = 0; failure < 3; failure += 1) {
    await assert.rejects(withUserD1ReadProtection(overload), /D1_TEMPORARILY_UNAVAILABLE/);
  }
  const beforeOpenCircuitCall = circuitAttempts;
  await assert.rejects(withUserD1ReadProtection(overload), /D1_TEMPORARILY_UNAVAILABLE/);
  assert.equal(circuitAttempts, beforeOpenCircuitCall);
});
