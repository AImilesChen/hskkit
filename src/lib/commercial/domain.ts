export const PDF_PACK_SKU = "hskkit_advanced_study_pdf_pack_v1";
export const PDF_PACK_PRICE_CENTS = 999;
export const PDF_PACK_CURRENCY = "usd";
export const PDF_PACK_DOWNLOAD_LIMIT = 3;
export const PDF_PACK_ACCESS_DAYS = 14;
export const PDF_PACK_REFUND_DAYS = 7;

export type CommerceEnv = { COMMERCE_MODE?: string; STRIPE_SECRET_KEY?: string; EXPORT_SIGNING_SECRET?: string };
export function subscriptionCommercePolicy(env: Pick<CommerceEnv, "COMMERCE_MODE" | "STRIPE_SECRET_KEY">) {
  if (env.COMMERCE_MODE !== "test") return { enabled: false as const, code: env.COMMERCE_MODE === "live" ? "LIVE_MODE_FORBIDDEN" as const : "COMMERCE_NOT_CONFIGURED" as const };
  if (!env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) return { enabled: false as const, code: "COMMERCE_NOT_CONFIGURED" as const };
  return { enabled: true as const, mode: "test" as const };
}
export function commercialPolicy(env: CommerceEnv) {
  if (env.COMMERCE_MODE !== "test") return { enabled: false as const, code: env.COMMERCE_MODE === "live" ? "LIVE_MODE_FORBIDDEN" as const : "COMMERCE_NOT_CONFIGURED" as const };
  if (!env.STRIPE_SECRET_KEY?.startsWith("sk_test_") || !env.EXPORT_SIGNING_SECRET || env.EXPORT_SIGNING_SECRET.length < 32) return { enabled: false as const, code: "COMMERCE_NOT_CONFIGURED" as const };
  return { enabled: true as const, mode: "test" as const, sku: PDF_PACK_SKU, priceCents: PDF_PACK_PRICE_CENTS, currency: PDF_PACK_CURRENCY };
}

export function refundEligibility(input: { purchasedAt: string; successfulDownloads: number; alreadyRefunded: boolean }, at = new Date()) {
  if (input.alreadyRefunded) return { eligible: false as const, code: "ALREADY_REFUNDED" as const };
  if (input.successfulDownloads > 0) return { eligible: false as const, code: "ALREADY_DOWNLOADED" as const };
  const purchased = Date.parse(input.purchasedAt);
  if (!Number.isFinite(purchased) || at.getTime() > purchased + PDF_PACK_REFUND_DAYS * 86_400_000) return { eligible: false as const, code: "REFUND_WINDOW_EXPIRED" as const };
  return { eligible: true as const, code: "ELIGIBLE_FOR_MANUAL_REVIEW" as const };
}

export const EXPORT_STATES = ["queued", "generating", "ready", "failed", "expired", "cancelled", "revoked"] as const;
export type ExportState = (typeof EXPORT_STATES)[number];
export type ExportAction = "start" | "complete" | "fail" | "cancel" | "expire" | "revoke";
const transitions: Record<ExportState, Partial<Record<ExportAction, ExportState>>> = {
  queued: { start: "generating", fail: "failed", cancel: "cancelled", revoke: "revoked" },
  generating: { complete: "ready", fail: "failed", cancel: "cancelled", revoke: "revoked" },
  ready: { expire: "expired", revoke: "revoked" },
  failed: {}, cancelled: {}, expired: {}, revoked: {},
};
export function transitionExport(state: ExportState, action: ExportAction) {
  const next = transitions[state]?.[action];
  if (!next) throw new Error("INVALID_EXPORT_TRANSITION");
  return next;
}

type PackCheckoutObject = {
  id?: unknown;
  mode?: unknown;
  payment_status?: unknown;
  amount_total?: unknown;
  currency?: unknown;
  payment_intent?: unknown;
  metadata?: unknown;
};

export function normalizePackCheckoutEvent(object: PackCheckoutObject) {
  const metadata = object.metadata && typeof object.metadata === "object"
    ? object.metadata as Record<string, unknown>
    : {};
  const selectedLevel = Number(metadata.selected_level);
  const valid =
    typeof object.id === "string" && object.id.startsWith("cs_test_") &&
    object.mode === "payment" && object.payment_status === "paid" &&
    object.amount_total === PDF_PACK_PRICE_CENTS && object.currency === PDF_PACK_CURRENCY &&
    typeof object.payment_intent === "string" && object.payment_intent.startsWith("pi_") &&
    typeof metadata.order_id === "string" && metadata.order_id.length > 0 &&
    typeof metadata.user_id === "string" && metadata.user_id.length > 0 &&
    metadata.sku === PDF_PACK_SKU &&
    Number.isInteger(selectedLevel) && selectedLevel >= 1 && selectedLevel <= 7;
  if (!valid) throw new Error("PACK_CHECKOUT_MISMATCH");
  return {
    sessionId: object.id as string,
    orderId: metadata.order_id as string,
    userId: metadata.user_id as string,
    sku: metadata.sku as string,
    selectedLevel,
    amountCents: object.amount_total as number,
    currency: object.currency as string,
    paymentIntentId: object.payment_intent as string,
  };
}

export function canIssueDownload(input: {
  actorUserId: string;
  ownerUserId: string;
  packPurchaseStatus: string;
  jobState: string;
  expiresAt: string;
  successfulDownloads: number;
  downloadLimit: number;
}, at = new Date()) {
  if (input.actorUserId !== input.ownerUserId) return { allowed: false as const, code: "ACCESS_DENIED" as const };
  if (input.packPurchaseStatus !== "active") return { allowed: false as const, code: "PACK_PURCHASE_REVOKED" as const };
  if (input.jobState !== "ready") return { allowed: false as const, code: input.jobState === "revoked" ? "EXPORT_REVOKED" as const : "EXPORT_NOT_READY" as const };
  if (!input.expiresAt || Date.parse(input.expiresAt) <= at.getTime()) return { allowed: false as const, code: "EXPORT_EXPIRED" as const };
  if (input.successfulDownloads >= input.downloadLimit) return { allowed: false as const, code: "DOWNLOAD_LIMIT_REACHED" as const };
  return { allowed: true as const, code: "DOWNLOAD_ALLOWED" as const };
}
