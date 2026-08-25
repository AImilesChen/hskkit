import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { entitlementFromSubscription } from "../src/lib/commercial/subscription.ts";
import { capabilitiesForEntitlement } from "../src/lib/commercial/capabilities.ts";

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public refund and support copy uses the frozen 2/5/3 UTC-day SLA", async () => {
  const [refund, terms, disclaimer, contact, footer] = await Promise.all([
    read("src/app/refund-policy/page.tsx"),
    read("src/app/terms-of-service/page.tsx"),
    read("src/app/disclaimer/page.tsx"),
    read("src/app/contact/page.tsx"),
    read("src/app/site-footer.tsx"),
  ]);
  assert.match(refund, /confirm receipt within 2 UTC calendar days/i);
  assert.match(refund, /complete manual review within 5 UTC calendar days after receipt/i);
  assert.match(refund, /initiate the refund to the original payment method within 3 UTC calendar days/i);
  assert.match(refund, /posting time is controlled by the payment institution/i);
  assert.match(terms, /Mandatory consumer rights remain unaffected/i);
  assert.match(disclaimer, /AI output can contain errors or vary/i);
  assert.match(contact, /Billing and subscription help/i);
  assert.match(contact, /href="\/account"/);
  assert.match(contact, /href="\/exports"/);
  assert.match(contact, /href="\/refund-policy"/);
  assert.match(contact, /email is the fallback support channel/i);
  assert.doesNotMatch(contact, /1[–-]2 business days/i);
  assert.doesNotMatch(contact, /typically (?:reply|respond) within/i);
  for (const route of ["/refund-policy", "/terms-of-service", "/disclaimer", "/contact"]) {
    assert.match(footer, new RegExp(`href:\\s*\\"${route}\\"`));
  }
});

test("Pricing states the exact Free, shared Pro, and separate PDF Pack capabilities", async () => {
  const pricing = await read("src/app/pricing/page.tsx");
  for (const copy of [
    "10 new items daily",
    "20 successful SRS ratings daily",
    "Recent 7 days, up to 100 history entries",
    "No Focused Review",
    "No AI credits",
    "Sync 1 active device",
    "500 AI credits each month",
    "10 AI requests per hour",
    "1 concurrent AI request",
    "Long-term history, up to 10,000 entries",
    "Sync up to 3 active devices",
    "same Pro entitlement",
    "US$9.99 one-time",
    "3 successful downloads",
    "14-day private access window",
  ]) assert.match(pricing, new RegExp(copy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  assert.match(pricing, /anti-abuse safeguards/i);
  assert.match(pricing, /not included in Pro/i);
});

test("Free to Pro, period-end cancellation, payment failure, and refund downgrade capabilities without deleting history", () => {
  const now = new Date("2026-08-24T12:00:00Z");
  const periodEnd = "2026-09-24T00:00:00.000Z";
  assert.equal(capabilitiesForEntitlement(null, now).tier, "free");

  const active = entitlementFromSubscription({ status: "active", currentPeriodEnd: periodEnd, cancelAtPeriodEnd: false }, now);
  assert.equal(capabilitiesForEntitlement({ status: active.status, endsAt: active.endsAt ?? null }, now).tier, "pro");

  const cancelling = entitlementFromSubscription({ status: "active", currentPeriodEnd: periodEnd, cancelAtPeriodEnd: true }, now);
  assert.equal(cancelling.status, "active");
  assert.equal(capabilitiesForEntitlement({ status: cancelling.status, endsAt: cancelling.endsAt ?? null }, now).tier, "pro");

  const failed = entitlementFromSubscription({ status: "past_due", currentPeriodEnd: periodEnd, cancelAtPeriodEnd: false }, now);
  assert.equal(failed.status, "suspended");
  assert.equal(capabilitiesForEntitlement({ status: failed.status, endsAt: failed.endsAt ?? null }, now).tier, "free");

  const refunded = entitlementFromSubscription({ status: "active", currentPeriodEnd: periodEnd, cancelAtPeriodEnd: false, revoked: true }, now);
  assert.equal(refunded.status, "revoked");
  assert.equal(capabilitiesForEntitlement({ status: refunded.status, endsAt: refunded.endsAt ?? null }, now).tier, "free");
});
