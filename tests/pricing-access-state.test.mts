import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { checkoutAction, pricingReturnTo, selectedPricingPlan, annualPriceSummary, FREE_PLAN_BENEFITS, PLAN_COMPARISON, AI_CREDIT_COSTS, type PricingState } from "../src/lib/commercial/plan-presentation.ts";
import { googleSignInHref, signInReturnTo } from "../src/lib/account/sign-in.ts";

const state = (changes: Partial<PricingState> = {}): PricingState => ({ authenticated: true, statusAvailable: true, checkoutEnabled: true, sale: null, salePrices: {}, subscription: null, access: { tier: "free", source: "free", endsAt: null }, ...changes });

test("billing actions distinguish account errors, anonymous, trial and paid access", () => {
  assert.equal(checkoutAction(state({ statusAvailable: false }), "pro_yearly"), "unavailable");
  assert.equal(checkoutAction(state({ authenticated: false }), "pro_yearly"), "sign_in");
  assert.equal(checkoutAction(state({ checkoutEnabled: false }), "pro_yearly"), "checkout_unavailable");
  assert.equal(checkoutAction(state({ access: { tier: "pro", source: "trial", endsAt: "2026-11-14" } }), "pro_yearly"), "checkout");
  assert.equal(checkoutAction(state({ access: { tier: "pro", source: "paid", endsAt: null } }), "pro_yearly"), "manage");
});

test("current subscriptions cannot accidentally create another paid subscription", () => {
  const monthly = state({ subscription: { planId: "pro_monthly", status: "active", cancelAtPeriodEnd: false } });
  assert.equal(checkoutAction(monthly, "pro_monthly"), "manage");
  assert.equal(checkoutAction(monthly, "pro_yearly"), "switch_yearly");
  assert.equal(checkoutAction({ ...monthly, subscription: { ...monthly.subscription!, cancelAtPeriodEnd: true } }, "pro_yearly"), "scheduled_cancellation");
  for (const status of ["past_due", "unpaid", "incomplete", "paused"]) assert.equal(checkoutAction(state({ subscription: { planId: "pro_monthly", status, cancelAtPeriodEnd: false } }), "pro_yearly"), "manage");
  const yearly = state({ subscription: { planId: "pro_yearly", status: "active", cancelAtPeriodEnd: false } });
  assert.equal(checkoutAction(yearly, "pro_monthly"), "manage");
  assert.equal(checkoutAction(yearly, "pro_yearly"), "manage");
});

test("Google return path restores the selected cycle without automatically charging", () => {
  for (const plan of ["pro_monthly", "pro_yearly"] as const) {
    const href = new URL(googleSignInHref(pricingReturnTo(plan)), "https://hskkit.test");
    const restored = new URL(signInReturnTo(href.searchParams.get("returnTo")), "https://hskkit.test");
    assert.equal(restored.pathname, "/pricing");
    assert.equal(restored.hash, "#plans");
    assert.equal(selectedPricingPlan(restored.searchParams.get("plan")), plan);
  }
  assert.equal(selectedPricingPlan("//evil.example"), "pro_yearly");
  assert.deepEqual(annualPriceSummary(), { monthlyEquivalent: "4.08", savingsPercent: 32 });
});

test("pricing derives free benefits and AI costs from enforced capabilities", () => {
  assert.ok(FREE_PLAN_BENEFITS.includes("10 new items daily"));
  assert.ok(FREE_PLAN_BENEFITS.includes("Unlimited standard review of learned items"));
  assert.ok(FREE_PLAN_BENEFITS.includes("30 days of history, up to 500 entries"));
  assert.deepEqual(PLAN_COMPARISON.find(row => row[0] === "Store PDFs & resource packs"), ["Store PDFs & resource packs", "Purchased separately", "Purchased separately"]);
  assert.deepEqual(AI_CREDIT_COSTS, { explanation: 1, studyPlan: 5, imageMistake: 5 });
});

test("trial checkout retains an explicit immediate-billing warning and requires a click", async () => {
  const checkout = await readFile(new URL("../src/app/pricing/subscription-checkout.tsx", import.meta.url), "utf8");
  const page = await readFile(new URL("../src/app/pricing/page.tsx", import.meta.url), "utf8");
  assert.match(checkout, /Your free Pro trial is active\. Buying starts a paid subscription now\./);
  assert.match(checkout, /onClick=\{checkout\}/);
  assert.match(checkout, /googleSignInHref\(pricingReturnTo\(planId\)\)/);
  assert.doesNotMatch(checkout, /\/login\?next=/);
  assert.match(page, /Your 7-day Pro trial starts automatically after sign-up/);
});
