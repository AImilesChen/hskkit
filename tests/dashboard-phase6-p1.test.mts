import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const header = read("../src/app/site-header.tsx");
const headerStatus = read("../src/lib/account/header-status.ts");
const dashboard = read("../src/app/dashboard/dashboard-core.tsx");
const growth = read("../src/app/dashboard/dashboard-growth.tsx");

test("signed-in navigation exposes Dashboard directly without removing the guest Sign in entry", () => {
  assert.match(header, /loadHeaderAccountStatus/);
  assert.match(headerStatus, /fetch\("\/api\/v1\/account\/status"/);
  assert.match(header, /const \[authState, setAuthState\]/);
  assert.match(header, /const signedIn = authState === "account"/);
  assert.match(header, /\.then\(\(\{ signedIn \}\)/);
  assert.match(header, /href:\s*"\/dashboard"/);
  assert.match(header, /label:\s*"Dashboard"/);
  assert.match(header, /hskkit:auth-changed/);
  assert.match(header, /Manage your synced account, access, billing, and private exports/);
  assert.match(header, /entry\.href === "\/account"/);
  assert.match(header, /signedIn \? "Account" : entry\.label/);
});

test("guest Sign in remains visible while account status is loading or unavailable", () => {
  assert.match(header, /const navigation = signedIn\s*\? \[dashboardEntry, \.\.\.siteNavigation\] : siteNavigation;/);
  assert.doesNotMatch(header, /siteNavigation\.filter\(\(entry\) => isNavigationGroup\(entry\) \|\| entry\.href !== "\/account"\)/);
});

test("dashboard presents the approved four visual layers in order", () => {
  const layer1 = dashboard.indexOf('data-dashboard-layer="1-today-focus"');
  const layer2 = dashboard.indexOf('data-dashboard-layer="2-learning-signals"');
  const layer3 = growth.indexOf('data-dashboard-layer="3-growth"');
  const layer4 = growth.indexOf('data-dashboard-layer="4-level-progress"');
  assert.ok(layer1 >= 0 && layer2 > layer1);
  assert.ok(layer3 >= 0 && layer4 > layer3);
  for (const label of ["Today’s focus", "Current learning signals", "Your real learning growth", "HSK 1–9 progress"]) {
    assert.match(dashboard + growth, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("phase 6 keeps one primary action and reads the existing learning and growth contracts", () => {
  assert.match(dashboard, /dashboardPrimaryAction/);
  assert.equal((dashboard.match(/href=\{primary\.href\}/g) ?? []).length, 1);
  assert.match(dashboard, /\/api\/v1\/learning\?tzOffset=/);
  assert.match(dashboard, /\/api\/v1\/dashboard\/growth/);
  assert.match(growth, /growth\.calendar/);
  assert.match(growth, /growth\.curve30/);
  assert.match(growth, /growth\.levelProgress/);
});
