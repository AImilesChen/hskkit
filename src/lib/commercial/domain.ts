export const PDF_PACK_SKU = "hskkit_advanced_study_pdf_pack_v1";
export const PDF_PACK_PRICE_CENTS = 999;
export const PDF_PACK_CURRENCY = "usd";
export const PDF_PACK_DOWNLOAD_LIMIT = 3;
export const PDF_PACK_ACCESS_DAYS = 14;
export const PDF_PACK_REFUND_DAYS = 7;

export type CommerceEnv = { COMMERCE_MODE?: string; STRIPE_SECRET_KEY?: string; EXPORT_SIGNING_SECRET?: string };
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

export type ExportState = "queued" | "generating" | "ready" | "failed" | "cancelled" | "expired" | "revoked";
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

export function canIssueDownload(input: {
  actorUserId: string;
  ownerUserId: string;
  entitlementStatus: string;
  jobState: string;
  expiresAt: string;
  successfulDownloads: number;
  downloadLimit: number;
}, at = new Date()) {
  if (input.actorUserId !== input.ownerUserId) return { allowed: false as const, code: "ACCESS_DENIED" as const };
  if (input.entitlementStatus !== "active") return { allowed: false as const, code: "ENTITLEMENT_REVOKED" as const };
  if (input.jobState !== "ready") return { allowed: false as const, code: input.jobState === "revoked" ? "EXPORT_REVOKED" as const : "EXPORT_NOT_READY" as const };
  if (!input.expiresAt || Date.parse(input.expiresAt) <= at.getTime()) return { allowed: false as const, code: "EXPORT_EXPIRED" as const };
  if (input.successfulDownloads >= input.downloadLimit) return { allowed: false as const, code: "DOWNLOAD_LIMIT_REACHED" as const };
  return { allowed: true as const, code: "DOWNLOAD_ALLOWED" as const };
}
