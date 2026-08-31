import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("pricing makes the welcome trial visible before plan comparison", async () => {
  const pricing = await read("src/app/pricing/page.tsx");
  assert.match(pricing, /Try Pro free for 7 days/);
  assert.match(pricing, /New verified accounts receive 7 days of Pro and 50 AI credits/);
  assert.match(pricing, /No card required\. It returns to Free automatically\./);
  assert.match(pricing, /Start my free Pro trial/);
  assert.match(pricing, /href="\/login\?returnTo=%2Faccount"/);
  assert.match(pricing, /Compare plans/);
});

test("Free card distinguishes the welcome bonus from post-trial limits", async () => {
  const pricing = await read("src/app/pricing/page.tsx");
  assert.match(pricing, /New account bonus: 7-day Pro trial \+ 50 AI credits/);
  assert.match(pricing, /After the trial: no Focused Review or monthly AI credits/);
  assert.doesNotMatch(pricing, /No Focused Review · No AI credits/);
});

test("pricing publicly explains both referral milestones without changing billing", async () => {
  const pricing = await read("src/app/pricing/page.tsx");
  assert.match(pricing, /Invite friends\. Earn more AI help\./);
  assert.match(pricing, /30 eligible learning actions across 3 different days/);
  assert.match(pricing, /50 AI credits/);
  assert.match(pricing, /3 days of Pro/);
  assert.match(pricing, /150 AI credits/);
  assert.match(pricing, /14 days of Pro/);
  assert.match(pricing, /billing dates never change/);
  assert.match(pricing, /Sign in to get your referral link/);
});

test("Account surfaces active trial confirmation and actionable referral progress", async () => {
  const [account, storage] = await Promise.all([
    read("src/app/account/account-client.tsx"),
    read("src/lib/commercial/referral-storage.ts"),
  ]);
  assert.match(account, /Your 7-day Pro trial is active/);
  assert.match(account, /aiQuota\?\.quota\?\.remaining[\s\S]*trial AI credits available/);
  assert.match(account, /No card stored · no automatic charge/);
  assert.ok(account.indexOf('item.status === "blocked"') < account.indexOf('item.risk_status !== "clear"'), "blocked referrals must be labelled ineligible before the generic risk-review branch");
  assert.match(account, /Start Focused Review/);
  assert.match(account, /See what AI credits can do/);
  assert.match(account, /learning_days/);
  assert.match(account, /learning_units/);
  assert.match(account, /Paid reward pending/);
  assert.match(account, /Reward issued/);
  assert.match(storage, /learning_days/);
  assert.match(storage, /learning_units/);
  assert.match(storage, /referral_learning_events/);
});
