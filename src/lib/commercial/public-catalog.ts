import { commercialPolicy, stripePriceId, type CommerceEnv } from "./domain.ts";
import {
  DIGITAL_ACCESS_DAYS,
  DIGITAL_DOWNLOAD_LIMIT,
  DIGITAL_PRODUCTS,
  DIGITAL_REFUND_DAYS,
} from "./products.ts";
import { activeHalfOffSale, halfOffAmountCents } from "./sale.ts";
import { SUBSCRIPTION_PLANS } from "./subscription.ts";

/** Keep the server-rendered catalog and the browser's price refresh in sync. */
export function publicCommerceConfig(env: CommerceEnv, now = new Date()) {
  const policy = commercialPolicy(env);
  let pricesReady = policy.enabled;
  if (policy.enabled && policy.mode === "live") {
    try {
      for (const product of DIGITAL_PRODUCTS) stripePriceId(env.STRIPE_PRICE_MAP, `product:${product.id}`);
      for (const plan of Object.values(SUBSCRIPTION_PLANS)) stripePriceId(env.STRIPE_PRICE_MAP, `subscription:${plan.id}`);
    } catch {
      pricesReady = false;
    }
  }
  const sale = policy.enabled && policy.mode === "live" && policy.checkoutEnabled && pricesReady
    ? activeHalfOffSale(env, now)
    : null;
  return {
    enabled: policy.enabled,
    checkoutEnabled: Boolean(policy.enabled && policy.checkoutEnabled && pricesReady),
    mode: policy.enabled ? policy.mode : null,
    accessDays: DIGITAL_ACCESS_DAYS,
    successfulDownloadLimit: DIGITAL_DOWNLOAD_LIMIT,
    refundDays: DIGITAL_REFUND_DAYS,
    sale: sale ? { percentOff: sale.percentOff, endAt: sale.endAt } : null,
    products: DIGITAL_PRODUCTS.map((product) => ({
      ...product,
      saleAmountCents: sale ? halfOffAmountCents(product.amountCents) : null,
    })),
    subscriptions: Object.values(SUBSCRIPTION_PLANS).map((plan) => ({
      ...plan,
      saleAmountCents: sale ? halfOffAmountCents(plan.amountCents) : null,
    })),
  };
}

export type PublicCommerceConfig = ReturnType<typeof publicCommerceConfig>;
