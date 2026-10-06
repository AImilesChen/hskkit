import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const page = read("../src/app/account/page.tsx");
const client = read("../src/app/account/account-client.tsx");
const css = read("../src/app/globals.css");
const login = read("../src/app/login/google-sign-in-link.tsx");
const oauthStart = read("../src/app/api/v1/auth/google/start/route.ts");
const oauthCallback = read("../src/app/api/v1/auth/google/callback/route.ts");

test("account page prioritizes account access and keeps a single study shortcut", () => {
  assert.match(page, /Manage your plan, AI credits, devices and data in one place/);
  assert.match(client, /Your next study action/);
  assert.match(client, /View learning progress on Dashboard/);
  assert.doesNotMatch(client, /Your real learning signals/);
  assert.doesNotMatch(client, /Weekly progress/);
});

test("guest merge is visible before membership and settings, but still requires confirmation", () => {
  const mergeAt = client.indexOf("Guest progress found");
  assert.ok(mergeAt > 0 && mergeAt < client.indexOf("Your plan and AI credits"));
  assert.match(client, /Nothing changes until you confirm/);
  assert.match(client, /Preview merge/);
  assert.match(client, /Confirm merge/);
});

test("learning day follows a validated browser timezone at sign-in and on the account page", () => {
  assert.match(login, /Intl\.DateTimeFormat\(\)\.resolvedOptions\(\)\.timeZone/);
  assert.match(oauthStart, /browserTimezone\(new URL\(request\.url\)\.searchParams\.get\("timezone"\)\)/);
  assert.match(oauthCallback, /validTimezone\(proposedTimezone\)/);
  assert.match(oauthCallback, /updateTimezone\(account\.userId, timezone\)/);
  assert.match(client, /account\.timezone === detectedTimezone/);
  assert.match(client, /action: "timezone", timezone: detectedTimezone/);
  assert.doesNotMatch(client, /Save timezone|setTimezone|Learning timezone<input/);
});

test("device status reflects registration and a full slot has a clear recovery path", () => {
  assert.match(client, /This device is not connected/);
  assert.match(client, /deviceSlotsFull/);
  assert.match(client, /Remove an old device below before connecting this one/);
  assert.match(client, /disabled=\{busy \|\| deviceSlotsFull\}/);
  assert.match(client, /const latest = await json\(`\/api\/v1\/account\/sync\?deviceId=/);
  assert.match(css, /\.account-status-dot\.pending/);
});

test("account rewards appear once and name the invited friend as the qualifier", () => {
  assert.equal(client.split("<strong>Referral rewards</strong>").length - 1, 1);
  assert.equal(client.split("Copy referral link").length - 1, 1);
  assert.match(client, /Your invited friend qualifies after learning on 3 different days/);
  assert.match(client, /How referral rewards work/);
  assert.match(client, /Includes \$\{referrals\.bonusCredits\} referral reward credits/);
});

test("account keeps billing, data, sync and merge routes with accessible responsive controls", () => {
  for (const route of ["/api/v1/account", "/api/v1/account/merge", "/api/v1/account/sync", "/api/v1/commercial/subscription", "/account/data"]) {
    assert.ok(client.includes(route), `${route} remains wired`);
  }
  assert.match(client, /Account details/);
  assert.match(client, /Sign out/);
  assert.match(css, /@media \(max-width: 639px\)[\s\S]*\.account-profile-overview\s*\{[^}]*grid-template-columns:\s*1fr/);
  assert.match(css, /\.account-setting > summary:focus-visible/);
});
