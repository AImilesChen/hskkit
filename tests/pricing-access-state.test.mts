import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("pricing explains that the welcome trial starts automatically instead of asking signed-in users to claim it", async () => {
  const [page, checkout] = await Promise.all([
    read("src/app/pricing/page.tsx"),
    read("src/app/pricing/subscription-checkout.tsx"),
  ]);
  assert.match(page, /Your 7-day Pro trial starts automatically after sign-up/);
  assert.match(page, /<WelcomeTrialAction \/>/);
  assert.doesNotMatch(page, /Start my free Pro trial/);
  assert.match(checkout, /Create account and start free trial/);
  assert.match(checkout, /Free Pro trial active/);
  assert.match(checkout, /Manage subscription/);
  assert.match(checkout, /Continue Free/);
});

test("pricing state distinguishes authenticated trial access from paid subscription state", async () => {
  const [checkout, route] = await Promise.all([
    read("src/app/pricing/subscription-checkout.tsx"),
    read("src/app/api/v1/commercial/subscription/route.ts"),
  ]);
  assert.match(checkout, /authenticated:boolean/);
  assert.match(checkout, /statusAvailable:boolean/);
  assert.match(checkout, /source:"paid"\|"trial"\|"promo"\|"free"/);
  assert.match(checkout, /response\.status===401\?\{authenticated:false,statusAvailable:true/);
  assert.match(checkout, /statusAvailable:false,checkoutEnabled:false/);
  assert.match(checkout, /Account status unavailable/);
  assert.match(checkout, /state\.access\.source==="trial"/);
  assert.match(route, /access:commercialAccess\.access/);
});

test("trial members can choose a paid plan with an explicit immediate-billing explanation", async () => {
  const checkout = await read("src/app/pricing/subscription-checkout.tsx");
  assert.match(checkout, /Your free Pro trial is active\. Buying starts a paid subscription now\./);
});