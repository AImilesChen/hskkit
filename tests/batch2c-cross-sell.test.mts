import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pricingPath = new URL("../src/app/pricing/page.tsx", import.meta.url);
const storePath = new URL("../src/app/store/page.tsx", import.meta.url);
const checkoutPath = new URL("../src/app/pricing/subscription-checkout.tsx", import.meta.url);

test("2C keeps Pro and one-time Store product cross-sell boundaries explicit", async () => {
  const [pricing, store, checkout] = await Promise.all([
    readFile(pricingPath, "utf8"),
    readFile(storePath, "utf8"),
    readFile(checkoutPath, "utf8"),
  ]);

  assert.match(pricing, /Open Store/);
  assert.match(pricing, /Does not include the Advanced Study PDF Pack/);
  assert.match(store, /Store product or Pro\?/);
  assert.match(store, /Pro covers ongoing review, Focused mode, device sync and AI learning features/);

  assert.equal((pricing.match(/<SubscriptionCheckout /g) ?? []).length, 2);
  assert.match(checkout, /type PlanId="pro_monthly"\|"pro_yearly"/);
  assert.doesNotMatch(`${pricing}\n${store}\n${checkout}`, /Scholar/i);
});
