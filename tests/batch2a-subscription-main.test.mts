import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  SUBSCRIPTION_PLANS,
  buildSubscriptionCheckoutForm,
  entitlementFromSubscription,
  normalizeSubscriptionEvent,
  refundEligibility,
} from "../src/lib/commercial/subscription.ts";
import { subscriptionCommercePolicy } from "../src/lib/commercial/domain.ts";

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("2A freezes exactly Monthly and Yearly recurring Pro plans", () => {
  assert.deepEqual(Object.keys(SUBSCRIPTION_PLANS), ["pro_monthly", "pro_yearly"]);
  assert.deepEqual(SUBSCRIPTION_PLANS.pro_monthly, {
    id: "pro_monthly", name: "Pro Monthly", amountCents: 599, currency: "usd", interval: "month", intervalCount: 1,
  });
  assert.deepEqual(SUBSCRIPTION_PLANS.pro_yearly, {
    id: "pro_yearly", name: "Pro Yearly", amountCents: 4900, currency: "usd", interval: "year", intervalCount: 1,
  });
});

test("subscription Test commerce is independent from the future PDF export secret", () => {
  assert.equal(subscriptionCommercePolicy({ COMMERCE_MODE: "test", STRIPE_SECRET_KEY: "sk_test_123" }).enabled, true);
  assert.equal(subscriptionCommercePolicy({ COMMERCE_MODE: "test", STRIPE_SECRET_KEY: "rk_test_123" }).enabled, false);
});

test("subscription Checkout is recurring, account-scoped and idempotent", () => {
  const form = buildSubscriptionCheckoutForm({
    planId: "pro_monthly",
    priceId: "price_monthly_test",
    ownerId: "user:u_123",
    userId: "u_123",
    orderId: "ord_123",
    origin: "https://hskkit.com",
  });
  assert.equal(form.get("mode"), "subscription");
  assert.equal(form.get("line_items[0][price]"), "price_monthly_test");
  assert.equal(form.get("subscription_data[metadata][user_id]"), "u_123");
  assert.equal(form.get("subscription_data[metadata][owner_id]"), "user:u_123");
  assert.equal(form.get("subscription_data[metadata][plan_id]"), "pro_monthly");
  assert.equal(form.get("subscription_data[metadata][order_id]"), "ord_123");
  assert.equal(form.get("client_reference_id"), "ord_123");
  assert.match(form.get("success_url") ?? "", /checkout=success/);
  assert.match(form.get("cancel_url") ?? "", /checkout=cancelled/);
});

test("cancel-at-period-end preserves access, terminal or refund revokes it", () => {
  const future = "2026-09-24T00:00:00.000Z";
  assert.deepEqual(entitlementFromSubscription({ status: "active", currentPeriodEnd: future, cancelAtPeriodEnd: true }, new Date("2026-08-24T00:00:00Z")), {
    status: "active", endsAt: future,
  });
  assert.equal(entitlementFromSubscription({ status: "past_due", currentPeriodEnd: future, cancelAtPeriodEnd: false }, new Date("2026-08-24T00:00:00Z")).status, "suspended");
  assert.equal(entitlementFromSubscription({ status: "canceled", currentPeriodEnd: future, cancelAtPeriodEnd: false }, new Date("2026-08-24T00:00:00Z")).status, "ended");
  assert.equal(entitlementFromSubscription({ status: "active", currentPeriodEnd: future, cancelAtPeriodEnd: false, revoked: true }, new Date("2026-08-24T00:00:00Z")).status, "revoked");
});

test("Stripe subscription events normalize without granting on Checkout alone", () => {
  assert.deepEqual(normalizeSubscriptionEvent({ id: "evt_checkout", type: "checkout.session.completed", data: { object: { id: "cs_test", mode: "subscription", subscription: "sub_1", customer: "cus_1", client_reference_id: "ord_1", amount_total: 599, currency: "usd", metadata: { owner_id: "user:u_1", user_id: "u_1", plan_id: "pro_monthly", order_id: "ord_1" } } } }), {
    kind: "checkout_completed", eventId: "evt_checkout", orderId: "ord_1", ownerId: "user:u_1", userId: "u_1", planId: "pro_monthly", checkoutSessionId: "cs_test", customerId: "cus_1", subscriptionId: "sub_1", amountCents: 599, currency: "usd",
  });
  assert.equal(normalizeSubscriptionEvent({ id: "evt_active", type: "customer.subscription.updated", data: { object: { id: "sub_1", customer: "cus_1", status: "active", cancel_at_period_end: true, current_period_start: 1787529600, current_period_end: 1790208000, items: { data: [{ price: { unit_amount: 599, currency: "usd" } }] }, metadata: { owner_id: "user:u_1", user_id: "u_1", plan_id: "pro_monthly", order_id: "ord_1" } } } }).kind, "subscription_updated");
  assert.equal(normalizeSubscriptionEvent({ id: "evt_paid", type: "invoice.paid", data: { object: { id: "in_1", customer: "cus_1", subscription: "sub_1", payment_intent: "pi_1", charge: "ch_1", amount_paid: 599, currency: "usd", status_transitions: { paid_at: 1787529600 } } } }).kind, "invoice_paid");
  assert.equal(normalizeSubscriptionEvent({ id: "evt_refund", type: "charge.refunded", data: { object: { id: "ch_1", payment_intent: "pi_1", amount_refunded: 599, currency: "usd", refunded: true } } }).kind, "charge_refunded");
  assert.equal(normalizeSubscriptionEvent({ id: "evt_other", type: "product.updated", data: { object: {} } }).kind, "ignored");
  assert.equal(normalizeSubscriptionEvent({ id: "evt_bad", type: "customer.subscription.updated", data: { object: { id: "sub_1" } } }).kind, "invalid");
  assert.equal(normalizeSubscriptionEvent({ id: "evt_bad_status", type: "customer.subscription.updated", data: { object: { id: "sub_1", customer: "cus_1", status: "bogus", items: { data: [{ price: { unit_amount: 599, currency: "usd" } }] }, metadata: { owner_id: "user:u_1", user_id: "u_1", plan_id: "pro_monthly", order_id: "ord_1" } } } }).kind, "invalid");
  assert.equal(normalizeSubscriptionEvent({ id: "evt_bad_money", type: "invoice.paid", data: { object: { id: "in_1", customer: "cus_1", subscription: "sub_1", amount_paid: -1, currency: "usd" } } }).kind, "invalid");
});

test("a paid invoice repairs an incomplete subscription and suspended entitlement after webhook reordering", async () => {
  const storage = await read("src/lib/commercial/storage.ts");
  const paidBranch = storage.slice(storage.indexOf('if(event.kind==="invoice_paid"||event.kind==="invoice_payment_failed")'), storage.indexOf('if(event.kind==="charge_refunded")'));
  assert.match(paidBranch, /event\.kind==="invoice_paid"/);
  assert.match(paidBranch, /UPDATE subscriptions SET status='active'/);
  assert.match(paidBranch, /UPDATE subscription_entitlements SET status='active'/);
  assert.match(paidBranch, /revocation_reason IS NULL/);
});

test("refund eligibility follows seven UTC days, at most ten credits, once per charge", () => {
  const now = new Date("2026-08-30T00:00:00Z");
  assert.deepEqual(refundEligibility({ chargedAt: "2026-08-24T00:00:00Z", aiCreditsUsed: 10, alreadyRefunded: false }, now), { eligible: true });
  assert.equal(refundEligibility({ chargedAt: "2026-08-22T23:59:59Z", aiCreditsUsed: 0, alreadyRefunded: false }, now).eligible, false);
  assert.equal(refundEligibility({ chargedAt: "2026-08-24T00:00:00Z", aiCreditsUsed: 11, alreadyRefunded: false }, now).eligible, false);
  assert.equal(refundEligibility({ chargedAt: "2026-08-24T00:00:00Z", aiCreditsUsed: 0, alreadyRefunded: true }, now).eligible, false);
});

test("2A routes and UI expose the full subscription lifecycle but no PDF Pack implementation", async () => {
  const [checkout, webhook, subscriptionEvents, subscriptionRoute, refundRoute, pricing, account, migration, stripe, storage] = await Promise.all([
    read("src/app/api/v1/commercial/checkout/route.ts"),
    read("src/app/api/v1/commercial/webhook/route.ts"),
    read("src/lib/commercial/subscription.ts"),
    read("src/app/api/v1/commercial/subscription/route.ts"),
    read("src/app/api/v1/commercial/admin/refunds/route.ts"),
    read("src/app/pricing/page.tsx"),
    read("src/app/account/account-client.tsx"),
    read("migrations/0015_batch2a_subscriptions.sql"),
    read("src/lib/commercial/stripe.ts"),
    read("src/lib/commercial/storage.ts"),
  ]);
  assert.match(checkout, /accountOwnerId/);
  assert.match(checkout, /createStripeSubscriptionCheckout/);
  for (const event of ["checkout.session.completed", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted", "invoice.paid", "invoice.payment_failed", "charge.refunded"]) assert.match(subscriptionEvents, new RegExp(event.replaceAll(".", "\\.")));
  assert.match(webhook, /claimPaymentEvent/);
  assert.match(webhook, /WEBHOOK_PROCESSING/);
  assert.match(subscriptionRoute, /cancelStripeSubscriptionAtPeriodEnd/);
  assert.match(refundRoute, /cancelStripeSubscriptionImmediately/);
  assert.match(refundRoute, /findStripeInvoicePaymentIntent/);
  assert.match(subscriptionRoute, /subscriptionSummaryForOwner/);
  assert.match(pricing, /US\$5\.99/);
  assert.match(pricing, /US\$49/);
  assert.match(pricing, /pro_monthly/);
  assert.match(pricing, /pro_yearly/);
  assert.match(account, /Billing/);
  assert.match(account, /subscription/);
  for (const table of ["subscription_orders", "subscriptions", "subscription_charges", "subscription_entitlements"]) assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  assert.match(stripe, /Stripe-Version/);
  assert.match(stripe, /cancel_at_period_end/);
  assert.match(storage, /claimPaymentEvent/);
  assert.match(storage, /WEBHOOK_CLAIM_LOST/);
  assert.match(storage, /revocation_reason='refund'/);
  assert.match(storage, /source_order_status==="refunded"/);
  assert.match(storage, /order\.status==="refunded"/);
  assert.doesNotMatch(subscriptionRoute, /pdf_pack|ExportJob|PackPurchase/);
});
