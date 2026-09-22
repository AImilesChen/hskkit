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

test("P0 signed-in account UI leads with identity and the next real study action", () => {
  for (const required of [
    "Member since",
    "Your next study action",
    "Continue learning",
    "Weekly progress",
    "Due reviews",
  ]) assert.match(client, new RegExp(required), `${required} must remain visible`);
  assert.match(client, /\/api\/v1\/planner/);
  assert.match(client, /account-identity-card/);
  assert.match(client, /account-study-focus/);
  assert.match(client, /role="progressbar"/);
});

test("P1 and P2 present real learning signals, clear access value, rewards and grouped settings", () => {
  for (const required of [
    "Learning momentum",
    "Best streak",
    "AI credit balance",
    "How credits work",
    "Invite & earn",
    "Next reward",
    "Learning & devices",
    "Membership & rewards",
    "Privacy & account",
    "Profile & sign-in",
    "Devices & sync",
    "Membership & billing",
    "Privacy & data",
    "Referral rewards",
  ]) assert.match(client, new RegExp(required.replace(/[&]/g, "\\&")), `${required} must remain visible`);

  assert.match(client, /account-momentum-grid/);
  assert.match(client, /account-benefits-grid/);
  assert.match(client, /account-settings-group/);
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
    "/api/v1/planner",
    "/account/data",
    "/pricing#ai-value",
  ]) assert.match(client, new RegExp(contract.replace(/[/?#.]/g, "\\$&")), `${contract} must remain wired`);
});

test("signed-in account renders primary account data before auxiliary resources finish", () => {
  assert.match(
    client,
    /const data = await loadAccountSnapshot<AccountView>\(\{ force \}\);[\s\S]*?if \(generation !== refreshGeneration\.current\) return;\s*setView\(data\);\s*if \(data\.account\?\.timezone\) setTimezone\(data\.account\.timezone\);\s*if \(data\.account\?\.status === "active"\) \{\s*void loadAuxiliary\(generation\);/,
    "the primary account shell must render and finish refresh without awaiting auxiliary resources",
  );
  assert.match(client, /const loadAuxiliary = async \(generation: number, requested: AuxiliaryResource\[\] = auxiliaryResources\) => \{/);
  assert.match(client, /const data = await json\(`\/api\/v1\/account\/overview\?deviceId=[\s\S]*?if \(generation !== refreshGeneration\.current\) return;/);
  assert.doesNotMatch(client, /await loadAuxiliary\(generation\)/);
});

test("account metrics reuse canonical data contracts and hero links open their settings", () => {
  assert.match(client, /normalizePlannerCompletions/);
  assert.match(client, /planner-task-completion:/);
  assert.match(client, /aiQuota\?\.quota\?\.used \?\? 0/);
  assert.match(client, /Credits available/);
  assert.match(client, /item\.status === "signed_up" && item\.risk_status === "clear"/);
  assert.match(client, /referrals\?\.access\?\.source === "paid"/);
  assert.match(client, /type AuxiliaryState/);
  assert.match(client, /setAuxiliary\(current =>/);
  assert.match(client, /No plan or credit values are shown until they can be verified/);
  assert.match(client, /item\.status === "paid_pending" && item\.risk_status === "clear"/);
  assert.match(client, /refreshGeneration/);
  assert.match(client, /generation !== refreshGeneration\.current/);
  assert.match(client, /referrals\.access\.baseAiCredits/);
  assert.match(client, /auxiliary\.referrals === "ready" && auxiliary\.ai === "ready"/);
  assert.match(client, /All recorded rewards issued/);
  assert.match(client, /onClick=\{\(\) => setProfileOpen\(true\)\}/);
  assert.match(client, /open=\{profileOpen\}/);
  assert.match(client, /onClick=\{\(\) => setBillingOpen\(true\)\}/);
  assert.match(client, /open=\{billingOpen\}/);
  assert.doesNotMatch(client, /creditAllowance - remainingCredits/);
});

test("account layout has an intentional desktop hierarchy and exact-mobile single-column contract", () => {
  assert.match(css, /\.account-overview-shell\s*\{/);
  assert.match(css, /\.account-profile-overview\s*\{/);
  assert.match(css, /\.account-momentum-grid\s*\{/);
  assert.match(css, /\.account-benefits-grid\s*\{/);
  assert.match(css, /\.account-settings-list\s*\{/);
  assert.match(css, /@media \(max-width: 639px\)[\s\S]*\.account-profile-overview\s*\{[^}]*grid-template-columns:\s*1fr/);
  assert.match(css, /@media \(max-width: 639px\)[\s\S]*\.account-benefits-grid\s*\{[^}]*grid-template-columns:\s*1fr/);
  assert.match(css, /@media \(max-width: 639px\)[\s\S]*\.account-momentum-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2/);
  assert.match(css, /@media \(max-width: 639px\)[\s\S]*\.account-primary-action/);
  assert.match(css, /\.account-identity-top > \.account-plan-badge \{ grid-column: 2; justify-self: start; \}/);
  assert.match(css, /\.account-credit-meta a \{[^}]*min-height: 44px/);
  assert.match(css, /min-height:\s*44px/);
});
