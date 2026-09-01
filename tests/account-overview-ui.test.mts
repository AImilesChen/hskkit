import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const page = read("../src/app/account/page.tsx");
const client = read("../src/app/account/account-client.tsx");
const css = read("../src/app/globals.css");

test("account route presents a focused account overview instead of unrelated study navigation", () => {
  assert.match(page, /Your HSKKit account/);
  assert.match(page, /Continue learning, understand your access, and manage your account/);
  assert.doesNotMatch(page, /Learning navigation/);
  assert.doesNotMatch(page, />Today<\/Link>/);
  assert.doesNotMatch(page, />Mistakes<\/Link>/);
});

test("signed-in account UI prioritizes learning, plan value and compact settings destinations", () => {
  for (const required of [
    "Continue today’s learning",
    "Learning snapshot",
    "AI credits",
    "Quick settings",
    "Profile & sign-in",
    "Devices & sync",
    "Membership & billing",
    "Privacy & data",
    "Referral rewards",
  ]) assert.match(client, new RegExp(required.replace(/[&]/g, "\\&")), `${required} must remain visible`);

  assert.match(client, /account-overview-shell/);
  assert.match(client, /account-hero/);
  assert.match(client, /account-settings-list/);
  assert.match(client, /account-danger-zone/);
});

test("account UI hides engineering implementation details from ordinary users", () => {
  assert.doesNotMatch(client, /Server revision:/);
  assert.doesNotMatch(client, /conflict audit record/);
  assert.doesNotMatch(client, /IANA timezone/);
  assert.doesNotMatch(client, /device\.device_id\.slice/);
  assert.match(client, /Last synced/);
  assert.match(client, /Current device/);
  assert.match(client, /Automatically detected/);
});

test("account redesign preserves the approved account, sync, billing, referral and data routes", () => {
  for (const contract of [
    "/api/v1/account",
    "/api/v1/account/streak",
    "/api/v1/account/sync",
    "/api/v1/commercial/subscription",
    "/api/v1/commercial/referrals",
    "/api/v1/ai",
    "/account/data",
    "/pricing#ai-value",
  ]) assert.match(client, new RegExp(contract.replace(/[/?#.]/g, "\\$&")), `${contract} must remain wired`);
});

test("account layout has an intentional desktop hierarchy and exact-mobile single-column contract", () => {
  assert.match(css, /\.account-overview-shell\s*\{/);
  assert.match(css, /\.account-main-grid\s*\{/);
  assert.match(css, /\.account-settings-list\s*\{/);
  assert.match(css, /@media \(max-width: 639px\)[\s\S]*\.account-main-grid\s*\{[^}]*grid-template-columns:\s*1fr/);
  assert.match(css, /@media \(max-width: 639px\)[\s\S]*\.account-primary-action/);
  assert.match(css, /min-height:\s*44px/);
});
