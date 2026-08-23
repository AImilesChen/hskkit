import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const exists = (path: string) => fs.existsSync(new URL(path, import.meta.url));

test("P0-3 publishes a real Google OAuth login, callback, failure retry and logout path", () => {
  for (const route of [
    "../src/app/login/page.tsx",
    "../src/app/api/v1/auth/google/start/route.ts",
    "../src/app/api/v1/auth/google/callback/route.ts",
    "../src/app/api/v1/auth/logout/route.ts",
  ]) assert.equal(exists(route), true, `${route} must exist`);
  const login = read("../src/app/login/page.tsx");
  const start = read("../src/app/api/v1/auth/google/start/route.ts");
  const callback = read("../src/app/api/v1/auth/google/callback/route.ts");
  const logout = read("../src/app/api/v1/auth/logout/route.ts");
  const oauth = read("../src/lib/account/oauth.ts");
  assert.match(login, /Continue with Google/);
  assert.match(login, /Try Google sign-in again/);
  assert.match(start, /pkceChallenge/);
  assert.match(oauth, /code_challenge/);
  assert.match(oauth, /access_type/);
  assert.match(callback, /exchangeGoogleCode/);
  assert.match(callback, /upsertGoogleAccount/);
  assert.match(callback, /createAccountSession/);
  assert.match(logout, /revokeAccountSession/);
});

test("P0-3 keeps guest learning, requires preview confirmation and documents account-wins conflicts", () => {
  const account = read("../src/app/account/account-client.tsx");
  const merge = read("../src/app/api/v1/account/merge/route.ts");
  assert.match(account, /Guest progress found/);
  assert.match(account, /Preview merge/);
  assert.match(account, /Confirm merge/);
  assert.match(account, /account records win exact-ID conflicts/i);
  assert.match(merge, /action === "preview"/);
  assert.match(merge, /action === "confirm"/);
  assert.match(merge, /body\.action === "confirm"\) response\.cookies\.delete\(GUEST_COOKIE\)/);
});

test("P0-3 session and recovery contracts support cross-device sync plus key rotation and revocation", () => {
  const identity = read("../src/lib/account/identity.ts");
  const storage = read("../src/lib/account/storage.ts");
  const accountRoute = read("../src/app/api/v1/account/route.ts");
  assert.match(identity, /authenticateSession/);
  assert.match(identity, /authenticateAccount/);
  assert.match(storage, /export async function rotateSyncKey/);
  assert.match(storage, /export async function revokeSyncKeys/);
  assert.match(accountRoute, /rotate_sync_key/);
  assert.match(accountRoute, /revoke_sync_keys/);
  assert.match(accountRoute, /connection/);
});

test("P0-3 deletion immediately invalidates sessions, Sync Keys and private exports", () => {
  const storage = read("../src/lib/account/storage.ts");
  const client = read("../src/app/account/data/account-data-client.tsx");
  assert.match(storage, /UPDATE account_tokens SET revoked_at=/);
  assert.match(storage, /UPDATE account_sessions SET revoked_at=/);
  assert.match(storage, /UPDATE account_data_requests SET result_json=NULL,expires_at=NULL/);
  const dataRoute = read("../src/app/api/v1/account/data-requests/route.ts");
  assert.match(dataRoute, /ACCOUNT_DELETED/);
  assert.match(client, /result\?\.request\?\.state === "completed"/);
});

test("P0-3 removes contradictory account language and links Sign in later to login", () => {
  const placement = read("../src/app/placement/placement-client.tsx");
  const contact = read("../src/app/contact/page.tsx");
  const planner = read("../src/app/planner/planner-client.tsx");
  const account = read("../src/app/account/page.tsx");
  assert.match(placement, /href="\/login"/);
  assert.doesNotMatch(contact, /does not require accounts/i);
  assert.match(contact, /sign in with Google/i);
  assert.match(planner, /Guests can try Planner/);
  assert.match(planner, /sign in to save it across devices/i);
  assert.match(account, /Google sign-in/);
  assert.match(account, /Sync Key/);
});

test("P0-3 migration adds Google identities and revocable private sessions", () => {
  const migration = read("../migrations/0014_unified_account_contract.sql");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS account_oauth_identities/);
  assert.match(migration, /UNIQUE\(provider, provider_subject\)/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS account_sessions/);
  assert.match(migration, /revoked_at TEXT/);
});
