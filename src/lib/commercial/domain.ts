import { digitalProduct } from "./products.ts";

export const PDF_PACK_SKU = "hskkit_advanced_study_pdf_pack_v1";
export const PDF_PACK_PRICE_CENTS = 999;
export const PDF_PACK_CURRENCY = "usd";
export const PDF_PACK_DOWNLOAD_LIMIT = 3;
export const PDF_PACK_ACCESS_DAYS = 14;
export const PDF_PACK_REFUND_DAYS = 7;

export type StripeMode = "test" | "live";
export type CommerceEnv = { COMMERCE_MODE?: string; STRIPE_SECRET_KEY?: string; STRIPE_TEST_SECRET_KEY?: string; STRIPE_LIVE_SECRET_KEY?: string; STRIPE_WEBHOOK_SECRET?: string; STRIPE_TEST_WEBHOOK_SECRET?: string; STRIPE_LIVE_WEBHOOK_SECRET?: string; STRIPE_PAID_CHECKOUT_ENABLED?: string; STRIPE_PRICE_MAP?: string; EXPORT_SIGNING_SECRET?: string };

export function stripeModeFromSecret(secret:string|undefined):StripeMode|null {
  if(secret?.startsWith("sk_test_")||secret?.startsWith("rk_test_"))return "test";
  if(secret?.startsWith("sk_live_")||secret?.startsWith("rk_live_"))return "live";
  return null;
}

export function stripeSecretForMode(env:CommerceEnv,mode:StripeMode){
  if(mode==="test")return env.STRIPE_TEST_SECRET_KEY??env.STRIPE_SECRET_KEY;
  return env.STRIPE_LIVE_SECRET_KEY;
}

export function activeStripeSecret(env:CommerceEnv){
  return env.COMMERCE_MODE==="test"||env.COMMERCE_MODE==="live"?stripeSecretForMode(env,env.COMMERCE_MODE):undefined;
}

export function stripeWebhookSecretForMode(env:CommerceEnv,mode:StripeMode){
  if(mode==="test")return env.STRIPE_TEST_WEBHOOK_SECRET??env.STRIPE_WEBHOOK_SECRET;
  return env.STRIPE_LIVE_WEBHOOK_SECRET;
}

export function activeStripeWebhookSecret(env:CommerceEnv){
  return env.COMMERCE_MODE==="test"||env.COMMERCE_MODE==="live"?stripeWebhookSecretForMode(env,env.COMMERCE_MODE):undefined;
}

export function subscriptionCommercePolicy(env: CommerceEnv) {
  const mode=env.COMMERCE_MODE;
  if(mode!=="test"&&mode!=="live")return {enabled:false as const,code:"COMMERCE_NOT_CONFIGURED" as const};
  if(stripeModeFromSecret(activeStripeSecret(env))!==mode)return {enabled:false as const,code:"STRIPE_MODE_MISMATCH" as const};
  return {enabled:true as const,mode,checkoutEnabled:env.STRIPE_PAID_CHECKOUT_ENABLED==="true"};
}
export function commercialPolicy(env: CommerceEnv) {
  const base=subscriptionCommercePolicy(env);
  if(!base.enabled)return base;
  if(!env.EXPORT_SIGNING_SECRET||env.EXPORT_SIGNING_SECRET.length<32)return {enabled:false as const,code:"COMMERCE_NOT_CONFIGURED" as const};
  return {...base,sku:PDF_PACK_SKU,priceCents:PDF_PACK_PRICE_CENTS,currency:PDF_PACK_CURRENCY};
}

export function stripePriceId(raw:string|undefined,reference:string){
  if(!raw)throw new Error("STRIPE_LIVE_PRICE_MAP_REQUIRED");
  let parsed:unknown;try{parsed=JSON.parse(raw);}catch{throw new Error("STRIPE_LIVE_PRICE_MAP_INVALID");}
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error("STRIPE_LIVE_PRICE_MAP_INVALID");
  const value=(parsed as Record<string,unknown>)[reference];
  if(typeof value!=="string"||!value.startsWith("price_")||value.length>255)throw new Error("STRIPE_LIVE_PRICE_REQUIRED");
  return value;
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

export function normalizePackCheckoutEvent(object: PackCheckoutObject,mode:StripeMode="test") {
  const metadata = object.metadata && typeof object.metadata === "object"
    ? object.metadata as Record<string, unknown>
    : {};
  const selectedLevel = Number(metadata.selected_level);
  const valid =
    typeof object.id === "string" && object.id.startsWith(mode==="live"?"cs_live_":"cs_test_") &&
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

export function normalizeDigitalProductCheckoutEvent(object: PackCheckoutObject,mode:StripeMode="test") {
  const metadata = object.metadata && typeof object.metadata === "object"
    ? object.metadata as Record<string, unknown>
    : {};
  const product=digitalProduct(metadata.product_id);
  const valid=
    typeof object.id==="string"&&object.id.startsWith(mode==="live"?"cs_live_":"cs_test_")&&
    object.mode==="payment"&&object.payment_status==="paid"&&
    Boolean(product)&&object.amount_total===product?.amountCents&&object.currency===product?.currency&&
    typeof object.payment_intent==="string"&&object.payment_intent.startsWith("pi_")&&
    typeof metadata.order_id==="string"&&metadata.order_id.length>0&&
    typeof metadata.user_id==="string"&&metadata.user_id.length>0;
  if(!valid||!product) throw new Error("DIGITAL_CHECKOUT_MISMATCH");
  return {sessionId:object.id as string,orderId:metadata.order_id as string,userId:metadata.user_id as string,productId:product.id,amountCents:object.amount_total as number,currency:object.currency as string,paymentIntentId:object.payment_intent as string};
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
