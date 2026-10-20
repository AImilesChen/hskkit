import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { publicCommerceConfig } from "../src/lib/commercial/public-catalog.ts";
import { DIGITAL_PRODUCTS } from "../src/lib/commercial/products.ts";
import { SUBSCRIPTION_PLANS } from "../src/lib/commercial/subscription.ts";

test("published vocabulary totals count words rather than every content asset", () => {
  const runtime = JSON.parse(readFileSync("src/lib/content/runtime-content-index.json", "utf8")) as {
    levels: Array<{ level: number; contentCount: number; wordCount: number }>;
  };
  const published = runtime.levels.filter((level) => level.level <= 7);
  assert.equal(published.slice(0, 6).reduce((sum, level) => sum + level.wordCount, 0), 5456);
  assert.equal(published[6].wordCount, 5636);
  assert.equal(published.reduce((sum, level) => sum + level.wordCount, 0), 11092);
  assert.equal(published.reduce((sum, level) => sum + level.contentCount - level.wordCount, 0), 15);
  const catalog = JSON.parse(readFileSync("src/lib/content/catalog.json", "utf8")) as {
    activeReleaseByStandard: { hsk3: string };
    releases: Array<{ id: string; contentAssetIds: string[] }>;
    contentAssets: Array<{ id: string; kind: string }>;
  };
  const release = catalog.releases.find((item) => item.id === catalog.activeReleaseByStandard.hsk3);
  assert.ok(release);
  const publishedIds = new Set(release.contentAssetIds);
  const nonWords = catalog.contentAssets.filter((item) => publishedIds.has(item.id) && item.kind !== "word");
  assert.deepEqual(
    Object.fromEntries([...new Set(nonWords.map((item) => item.kind))].map((kind) => [kind, nonWords.filter((item) => item.kind === kind).length])),
    { grammar: 7, reading: 7, sentence: 1 },
  );
  const publicCopy = readFileSync("src/lib/public-copy.ts", "utf8");
  assert.match(publicCopy, /11,092.*5,456.*5,636/);
  assert.doesNotMatch(publicCopy, /11,107.*vocabulary/);
});

test("server catalog and browser config use the same sale pricing and expiry", () => {
  const priceMap = Object.fromEntries([
    ...DIGITAL_PRODUCTS.map((product) => [`product:${product.id}`, `price_${product.id}`]),
    ...Object.values(SUBSCRIPTION_PLANS).map((plan) => [`subscription:${plan.id}`, `price_${plan.id}`]),
  ]);
  const env = {
    COMMERCE_MODE: "live",
    STRIPE_LIVE_SECRET_KEY: "sk_live_test_value",
    STRIPE_PAID_CHECKOUT_ENABLED: "true",
    EXPORT_SIGNING_SECRET: "a".repeat(32),
    STRIPE_PRICE_MAP: JSON.stringify(priceMap),
    STRIPE_HALF_OFF_COUPON_ID: "coupon_test",
    STRIPE_HALF_OFF_START_AT: "2026-10-20T12:00:00.000Z",
    STRIPE_HALF_OFF_END_AT: "2026-11-03T12:00:00.000Z",
  };
  const active = publicCommerceConfig(env, new Date("2026-10-21T12:00:00.000Z"));
  assert.equal(active.products.length, 17);
  assert.equal(active.sale?.percentOff, 50);
  assert.equal(active.products.find((product) => product.amountCents === 399)?.saleAmountCents, 200);
  assert.equal(JSON.stringify(active).includes("coupon_test"), false);
  const expired = publicCommerceConfig(env, new Date("2026-11-03T12:00:00.000Z"));
  assert.equal(expired.sale, null);
  assert.ok(expired.products.every((product) => product.saleAmountCents === null));
  const unready = publicCommerceConfig({ ...env, STRIPE_PRICE_MAP: "{}" }, new Date("2026-10-21T12:00:00.000Z"));
  assert.equal(unready.checkoutEnabled, false);
  assert.equal(unready.sale, null);
});
