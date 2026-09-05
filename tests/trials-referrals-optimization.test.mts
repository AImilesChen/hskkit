import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  WELCOME_TRIAL_CREDITS,
  WELCOME_TRIAL_DAYS,
  referralQualification,
  referralReward,
  resolveAccessSource,
  paidCreditAllowance,
  welcomeCreditRollover,
} from "../src/lib/commercial/referrals.ts";

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const now = new Date("2026-09-01T00:00:00.000Z");
const active = (days: number) => ({ status: "active" as const, endsAt: new Date(now.getTime() + days * 86_400_000).toISOString() });

test("new welcome trials are exactly seven days with 20 AI credits and no card contract", () => {
  assert.equal(WELCOME_TRIAL_DAYS, 7);
  assert.equal(WELCOME_TRIAL_CREDITS, 20);
  assert.deepEqual(resolveAccessSource({ paid: null, trial: active(7), promo: null }, now), {
    tier: "pro", source: "trial", endsAt: active(7).endsAt, baseAiCredits: 20,
  });
});

test("an already-started 50-credit welcome trial keeps its granted allowance", () => {
  assert.deepEqual(resolveAccessSource({ paid: null, trial: { ...active(7), aiCredits: 50 }, promo: null }, now), {
    tier: "pro", source: "trial", endsAt: active(7).endsAt, baseAiCredits: 50,
  });
});

test("paid Pro preserves unused welcome credits without repeating spent credits next month", () => {
  const rollover = welcomeCreditRollover({ grantedCredits: 50, spentBeforePaid: 1, conversionPeriod: "2026-09", spentInConversionPeriod: 1 });
  assert.deepEqual(rollover, { remainingCredits: 49, conversionPeriod: "2026-09", spentInConversionPeriod: 1 });
  assert.deepEqual(paidCreditAllowance({ rollover, currentPeriod: "2026-09" }), { baseAllowance: 500, bonusCredits: 49, totalAllowance: 550, bonusSpendThreshold: 501 });
  assert.deepEqual(paidCreditAllowance({ rollover, currentPeriod: "2026-10" }), { baseAllowance: 500, bonusCredits: 49, totalAllowance: 549, bonusSpendThreshold: 500 });
});

test("welcome-credit rollover is persisted, accumulated, and spent once", async () => {
  const [migration, commerceStorage, referralStorage, aiStorage] = await Promise.all([
    read("migrations/0032_welcome_credit_rollover.sql"),
    read("src/lib/commercial/storage.ts"),
    read("src/lib/commercial/referral-storage.ts"),
    read("src/lib/ai/storage.ts"),
  ]);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS welcome_credit_rollovers/);
  assert.match(migration, /remaining_units INTEGER NOT NULL/);
  assert.match(commerceStorage, /spentBeforePaid:Number\(spent\?\.total\?\?0\)/);
  assert.match(commerceStorage, /INSERT OR IGNORE INTO welcome_credit_rollovers/);
  assert.match(commerceStorage, /firstPaidWindow/);
  assert.match(commerceStorage, /kind='welcome_trial' AND status='active'/);
  assert.match(referralStorage, /remaining_units,conversion_period,conversion_period_used FROM welcome_credit_rollovers/);
  assert.match(referralStorage, /paidCredits\.totalAllowance \+ bonus/);
  assert.equal([...aiStorage.matchAll(/MAX\(ai_quota_buckets\.allowance,excluded\.allowance,used\+reserved\)/g)].length, 2, "quota reads and reservations must both preserve the current-period grant");
  assert.match(aiStorage, /UPDATE welcome_credit_rollovers SET remaining_units=remaining_units-\?/);
  assert.match(aiStorage, /bonusSpend - welcomeSpend/);
});

test("paid entitlement wins; expired trial and promo downgrade safely", () => {
  const paid = active(30);
  assert.deepEqual(resolveAccessSource({ paid, trial: active(7), promo: active(3) }, now), {
    tier: "pro", source: "paid", endsAt: paid.endsAt, baseAiCredits: 500,
  });
  const expired = { status: "active" as const, endsAt: "2026-08-31T23:59:59.000Z" };
  assert.deepEqual(resolveAccessSource({ paid: null, trial: expired, promo: expired }, now), {
    tier: "free", source: "free", endsAt: null, baseAiCredits: 0,
  });
});

test("referral qualification requires verified real learning across 3 days and 30 units", () => {
  assert.equal(referralQualification({ emailVerified: true, distinctLearningDays: 3, learningUnits: 30, riskStatus: "clear" }).eligible, true);
  assert.equal(referralQualification({ emailVerified: true, distinctLearningDays: 2, learningUnits: 300, riskStatus: "clear" }).eligible, false);
  assert.equal(referralQualification({ emailVerified: false, distinctLearningDays: 3, learningUnits: 30, riskStatus: "clear" }).eligible, false);
  assert.equal(referralQualification({ emailVerified: true, distinctLearningDays: 3, learningUnits: 30, riskStatus: "blocked" }).eligible, false);
});

test("referral rewards branch by current paid status without changing Stripe billing dates", () => {
  assert.deepEqual(referralReward("qualified", false), { promoDays: 3, bonusCredits: 50 });
  assert.deepEqual(referralReward("qualified", true), { promoDays: 0, bonusCredits: 50 });
  assert.deepEqual(referralReward("paid", false), { promoDays: 14, bonusCredits: 150 });
  assert.deepEqual(referralReward("paid", true), { promoDays: 0, bonusCredits: 150 });
});

test("migration, OAuth, learning, paid webhook and admin contracts are wired", async () => {
  const [migration, callback, learning, webhook, api, admin, referralStorage] = await Promise.all([
    read("migrations/0020_trials_referrals.sql"),
    read("src/app/api/v1/auth/google/callback/route.ts"),
    read("src/app/api/v1/learning/route.ts"),
    read("src/app/api/v1/commercial/webhook/route.ts"),
    read("src/app/api/v1/commercial/referrals/route.ts"),
    read("src/app/api/v1/commercial/admin/referrals/route.ts"),
    read("src/lib/commercial/referral-storage.ts"),
  ]);
  for (const table of ["promotional_entitlements", "referral_codes", "referral_relationships", "referral_learning_events", "reward_issuances", "credit_ledger", "referral_risk_flags"]) {
    assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  }
  assert.match(migration, /UNIQUE\(referred_user_id\)/);
  assert.match(migration, /UNIQUE\(relationship_id,stage\)/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS referral_annual_counters/);
  assert.match(migration, /paid_charge_id TEXT/);
  assert.match(callback, /activateWelcomeTrialAndReferral/);
  assert.match(learning, /ReferralLearningActivity/);
  assert.match(learning, /reconcileReferralLearningMilestone/);
  assert.match(webhook, /rewardFirstPaidReferral/);
  assert.match(webhook, /flagRefundedReferralCharge/);
  assert.match(api, /trialAndReferralSummary/);
  assert.match(admin, /ADMIN_REFUND_TOKEN/);
  assert.match(admin, /block_referral|revoke_reward/);
  assert.match(referralStorage, /bonus_credits\+\?<=\?/);
  assert.match(referralStorage, /promo_days\+\?<=\?/);
  assert.match(referralStorage, /status IN \('signed_up','qualified','paid_pending'\)/);
  assert.match(referralStorage, /relationship\.risk_status !== "clear"/);
  assert.match(referralStorage, /WHERE id=\? AND owner_id=\?/);
  assert.match(referralStorage, /if \(reconciled\) relationshipRows = await/, "paid referral reconciliation must return the updated relationship status in the same response");
  assert.match(referralStorage, /VALUES\(\?,\?,'referral_pass','active',\?,\?,\?,\?,\?\)/, "referral-pass insert must bind exactly the seven dynamic columns");
  assert.match(api, /REFERRAL_SUMMARY_FAILED/, "referral API must serialize transaction failures as JSON");
  assert.match(learning, /new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/);
});

test("user-facing copy explains unlimited standard study, 500 monthly credits, trial and rewards", async () => {
  const [pricing, login, account] = await Promise.all([
    read("src/app/pricing/page.tsx"),
    read("src/app/login/page.tsx"),
    read("src/app/account/account-client.tsx"),
  ]);
  assert.match(pricing, /Unlimited learning and reviews/);
  assert.match(pricing, /7-day Pro trial/);
  assert.match(pricing, /no card required/i);
  assert.match(pricing, /500 explanations/);
  assert.match(login, /20 AI credits/);
  assert.match(account, /Invite friends/);
  assert.match(account, /next reset/i);
  assert.match(account, /3 different days/);
  assert.match(account, /30 learning actions/);
  assert.match(account, /Promise\.allSettled/, "a device-sync failure must not hide trial, subscription, AI, or referral state");
});
