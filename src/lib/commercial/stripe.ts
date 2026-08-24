import { PDF_PACK_CURRENCY, PDF_PACK_PRICE_CENTS, PDF_PACK_SKU } from "./domain.ts";
import { buildSubscriptionCheckoutForm, type SubscriptionPlanId } from "./subscription.ts";

const STRIPE_VERSION = "2024-06-20";

const stripeFetch = async (path: string, secret: string, form: URLSearchParams, idempotencyKey?: string) => {
  if (!secret.startsWith("sk_test_")) throw new Error("STRIPE_TEST_KEY_REQUIRED");
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/x-www-form-urlencoded", "Stripe-Version": STRIPE_VERSION, ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}) },
    body: form,
  });
  const value = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(`STRIPE_API_ERROR:${String((value.error as Record<string,unknown> | undefined)?.code ?? response.status)}`);
  if (value.livemode === true) throw new Error("STRIPE_LIVE_RESPONSE_REJECTED");
  return value;
};

const stripeDelete = async (path: string, secret: string, idempotencyKey: string) => {
  if (!secret.startsWith("sk_test_")) throw new Error("STRIPE_TEST_KEY_REQUIRED");
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${secret}`, "Stripe-Version": STRIPE_VERSION, "idempotency-key": idempotencyKey },
  });
  const value = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(`STRIPE_API_ERROR:${String((value.error as Record<string,unknown> | undefined)?.code ?? response.status)}`);
  if (value.livemode === true) throw new Error("STRIPE_LIVE_RESPONSE_REJECTED");
  return value;
};

export async function createStripeTestCheckout(input: { orderId: string; userId: string; selectedLevel:number; successUrl: string; cancelUrl: string; secret: string }) {
  const form = new URLSearchParams({
    mode: "payment", success_url: input.successUrl, cancel_url: input.cancelUrl, client_reference_id: input.userId,
    "line_items[0][quantity]": "1", "line_items[0][price_data][currency]": PDF_PACK_CURRENCY,
    "line_items[0][price_data][unit_amount]": String(PDF_PACK_PRICE_CENTS),
    "line_items[0][price_data][product_data][name]": "HSKKit Advanced Study PDF Pack",
    "line_items[0][price_data][product_data][description]": "One-time purchase. Up to 3 successful downloads during a 14-day access window.",
    "metadata[order_id]": input.orderId, "metadata[user_id]": input.userId, "metadata[sku]": PDF_PACK_SKU, "metadata[selected_level]": String(input.selectedLevel),
    "payment_intent_data[metadata][order_id]": input.orderId, "payment_intent_data[metadata][user_id]": input.userId,
  });
  const result = await stripeFetch("checkout/sessions", input.secret, form, `checkout:${input.orderId}`);
  if (typeof result.id !== "string" || typeof result.url !== "string") throw new Error("STRIPE_CHECKOUT_INVALID");
  return { id: result.id, url: result.url };
}

export async function createStripeSubscriptionCheckout(input:{orderId:string;ownerId:string;userId:string;planId:SubscriptionPlanId;origin:string;secret:string;priceId?:string}){
  const form=buildSubscriptionCheckoutForm({planId:input.planId,priceId:input.priceId,ownerId:input.ownerId,userId:input.userId,orderId:input.orderId,origin:input.origin});
  const result=await stripeFetch("checkout/sessions",input.secret,form,`subscription-checkout:${input.orderId}`);
  if(typeof result.id!=="string"||typeof result.url!=="string"||!result.id.startsWith("cs_test_")) throw new Error("STRIPE_SUBSCRIPTION_CHECKOUT_INVALID");
  return {id:result.id,url:result.url};
}

export async function cancelStripeSubscriptionAtPeriodEnd(input:{subscriptionId:string;secret:string;idempotencyKey:string}){
  const result=await stripeFetch(`subscriptions/${encodeURIComponent(input.subscriptionId)}`,input.secret,new URLSearchParams({cancel_at_period_end:"true"}),input.idempotencyKey);
  if(typeof result.id!=="string"||result.cancel_at_period_end!==true) throw new Error("STRIPE_SUBSCRIPTION_CANCEL_INVALID");
  const periodEnd=typeof result.current_period_end==="number"?new Date(result.current_period_end*1000).toISOString():undefined;
  return {id:result.id,status:String(result.status??"active"),cancelAtPeriodEnd:true,periodEnd};
}

export async function cancelStripeSubscriptionImmediately(input:{subscriptionId:string;secret:string;idempotencyKey:string}){
  const result=await stripeDelete(`subscriptions/${encodeURIComponent(input.subscriptionId)}`,input.secret,input.idempotencyKey);
  if(typeof result.id!=="string"||result.status!=="canceled") throw new Error("STRIPE_SUBSCRIPTION_CANCEL_INVALID");
  return {id:result.id,status:"canceled" as const};
}

export async function createStripeTestRefund(input: { paymentIntentId: string; secret: string; idempotencyKey: string }) {
  const result = await stripeFetch("refunds", input.secret, new URLSearchParams({ payment_intent: input.paymentIntentId, reason: "requested_by_customer", "metadata[hskkit_refund_request]": input.idempotencyKey }), input.idempotencyKey);
  if (typeof result.id !== "string") throw new Error("STRIPE_REFUND_INVALID");
  return { id: result.id, status: String(result.status ?? "pending") };
}

const encoder = new TextEncoder();
const hexBytes = (hex: string) => hex.length % 2 ? new Uint8Array() : Uint8Array.from(hex.match(/.{2}/g) ?? [], (pair) => Number.parseInt(pair, 16));
export async function verifyStripeWebhook(rawBody: string, signatureHeader: string | null, secret: string, now = Date.now()) {
  if (!signatureHeader || !secret.startsWith("whsec_")) throw new Error("STRIPE_WEBHOOK_NOT_CONFIGURED");
  const fields = signatureHeader.split(",").map((part) => part.trim().split("=", 2));
  const timestamp = fields.find(([key]) => key === "t")?.[1]; const signatures = fields.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || !signatures.length || Math.abs(Math.floor(now / 1000) - Number(timestamp)) > 300) throw new Error("STRIPE_SIGNATURE_EXPIRED");
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${rawBody}`)));
  const valid = signatures.some((hex) => { const supplied=hexBytes(hex); if(supplied.length!==expected.length) return false; let diff=0; for(let i=0;i<expected.length;i++) diff|=expected[i]^supplied[i]; return diff===0; });
  if (!valid) throw new Error("STRIPE_SIGNATURE_INVALID");
  const event = JSON.parse(rawBody) as { id:string; type:string; livemode:boolean; data:{ object:Record<string,unknown> } };
  if (!event.id || !event.type || event.livemode) throw new Error("STRIPE_LIVE_EVENT_REJECTED");
  return event;
}
