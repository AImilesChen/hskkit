export type HalfOffSaleEnv = {
  STRIPE_HALF_OFF_COUPON_ID?: string;
  STRIPE_HALF_OFF_START_AT?: string;
  STRIPE_HALF_OFF_END_AT?: string;
};

export function halfOffAmountCents(amountCents: number) {
  return Math.round(amountCents / 2);
}

export function activeHalfOffSale(env: HalfOffSaleEnv, now = new Date()) {
  const couponId = env.STRIPE_HALF_OFF_COUPON_ID?.trim();
  const startAt = env.STRIPE_HALF_OFF_START_AT?.trim();
  const endAt = env.STRIPE_HALF_OFF_END_AT?.trim();
  if (!couponId || !startAt || !endAt) return null;
  const start = Date.parse(startAt);
  const end = Date.parse(endAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start !== 14 * 86_400_000) return null;
  if (now.getTime() < start || now.getTime() >= end) return null;
  return { couponId, startAt: new Date(start).toISOString(), endAt: new Date(end).toISOString(), percentOff: 50 as const };
}

export function validOrderAmount(baseAmountCents: number, chargedAmountCents: number) {
  return chargedAmountCents === baseAmountCents || chargedAmountCents === halfOffAmountCents(baseAmountCents) || chargedAmountCents === Math.floor(baseAmountCents / 2);
}
