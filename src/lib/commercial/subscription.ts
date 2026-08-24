export type SubscriptionPlanId = "pro_monthly" | "pro_yearly";
export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  name: string;
  amountCents: number;
  currency: "usd";
  interval: "month" | "year";
  intervalCount: 1;
};

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlan> = {
  pro_monthly: { id: "pro_monthly", name: "Pro Monthly", amountCents: 599, currency: "usd", interval: "month", intervalCount: 1 },
  pro_yearly: { id: "pro_yearly", name: "Pro Yearly", amountCents: 4900, currency: "usd", interval: "year", intervalCount: 1 },
};

export function subscriptionPlan(value: unknown): SubscriptionPlan | undefined {
  return typeof value === "string" && value in SUBSCRIPTION_PLANS ? SUBSCRIPTION_PLANS[value as SubscriptionPlanId] : undefined;
}

export function buildSubscriptionCheckoutForm(input: {
  planId: SubscriptionPlanId;
  priceId?: string;
  ownerId: string;
  userId: string;
  orderId: string;
  origin: string;
}) {
  const plan = SUBSCRIPTION_PLANS[input.planId];
  const form = new URLSearchParams({
    mode: "subscription",
    "line_items[0][quantity]": "1",
    client_reference_id: input.orderId,
    success_url: `${input.origin}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/pricing?checkout=cancelled`,
    "metadata[purchase_type]": "subscription",
    "metadata[owner_id]": input.ownerId,
    "metadata[user_id]": input.userId,
    "metadata[plan_id]": input.planId,
    "metadata[order_id]": input.orderId,
    "subscription_data[metadata][purchase_type]": "subscription",
    "subscription_data[metadata][owner_id]": input.ownerId,
    "subscription_data[metadata][user_id]": input.userId,
    "subscription_data[metadata][plan_id]": input.planId,
    "subscription_data[metadata][order_id]": input.orderId,
  });
  if (input.priceId) form.set("line_items[0][price]", input.priceId);
  else {
    form.set("line_items[0][price_data][currency]", plan.currency);
    form.set("line_items[0][price_data][unit_amount]", String(plan.amountCents));
    form.set("line_items[0][price_data][recurring][interval]", plan.interval);
    form.set("line_items[0][price_data][recurring][interval_count]", String(plan.intervalCount));
    form.set("line_items[0][price_data][product_data][name]", `HSKKit ${plan.name}`);
    form.set("line_items[0][price_data][product_data][metadata][plan_id]", plan.id);
  }
  return form;
}

export type ProviderSubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "incomplete" | "incomplete_expired" | "paused";
export type EntitlementStatus = "active" | "suspended" | "ended" | "revoked";

export function entitlementFromSubscription(input: {
  status: ProviderSubscriptionStatus;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  revoked?: boolean;
}, now = new Date()): { status: EntitlementStatus; endsAt?: string } {
  if (input.revoked) return { status: "revoked", endsAt: now.toISOString() };
  const periodOpen = !input.currentPeriodEnd || new Date(input.currentPeriodEnd).getTime() > now.getTime();
  if ((input.status === "active" || input.status === "trialing") && periodOpen) return { status: "active", endsAt: input.currentPeriodEnd };
  if (input.status === "past_due" || input.status === "unpaid" || input.status === "incomplete" || input.status === "paused") return { status: "suspended", endsAt: input.currentPeriodEnd };
  return { status: "ended", endsAt: input.currentPeriodEnd ?? now.toISOString() };
}

const text = (value: unknown) => typeof value === "string" && value.length > 0 ? value : undefined;
const metadata = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const iso = (seconds: unknown) => typeof seconds === "number" && Number.isFinite(seconds) ? new Date(seconds * 1000).toISOString() : undefined;
const money = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
const subscriptionStatuses = new Set<ProviderSubscriptionStatus>(["trialing","active","past_due","canceled","unpaid","incomplete","incomplete_expired","paused"]);

export type NormalizedSubscriptionEvent =
  | { kind: "checkout_completed"; eventId: string; orderId: string; ownerId: string; userId: string; planId: SubscriptionPlanId; checkoutSessionId: string; customerId: string; subscriptionId: string; amountCents: number; currency: string }
  | { kind: "subscription_updated"; eventId: string; orderId?: string; ownerId: string; userId: string; planId: SubscriptionPlanId; subscriptionId: string; customerId: string; status: ProviderSubscriptionStatus; cancelAtPeriodEnd: boolean; amountCents: number; currency: string; currentPeriodStart?: string; currentPeriodEnd?: string }
  | { kind: "invoice_paid" | "invoice_payment_failed"; eventId: string; invoiceId: string; subscriptionId: string; customerId: string; paymentIntentId?: string; chargeId?: string; amountCents: number; currency: string; chargedAt?: string }
  | { kind: "charge_refunded"; eventId: string; chargeId: string; paymentIntentId?: string; amountRefundedCents: number; currency: string }
  | { kind: "invalid"; eventId: string; eventType: string }
  | { kind: "ignored"; eventId: string; eventType: string };

export function normalizeSubscriptionEvent(event: { id?: unknown; type?: unknown; data?: { object?: unknown } }): NormalizedSubscriptionEvent {
  const eventId = text(event.id) ?? "";
  const eventType = text(event.type) ?? "";
  const object = event.data?.object && typeof event.data.object === "object" ? event.data.object as Record<string, unknown> : {};
  const meta = metadata(object.metadata);
  if (eventType === "checkout.session.completed" && object.mode === "subscription") {
    const orderId = text(meta.order_id) ?? text(object.client_reference_id);
    const ownerId = text(meta.owner_id);
    const userId = text(meta.user_id);
    const plan = subscriptionPlan(meta.plan_id);
    const checkoutSessionId = text(object.id);
    const customerId = text(object.customer);
    const subscriptionId = text(object.subscription);
    const amountCents = money(object.amount_total);
    const currency = text(object.currency);
    if (eventId && orderId && ownerId && userId && plan && checkoutSessionId && customerId && subscriptionId && amountCents !== undefined && currency) return { kind: "checkout_completed", eventId, orderId, ownerId, userId, planId: plan.id, checkoutSessionId, customerId, subscriptionId, amountCents, currency };
    return { kind: "invalid", eventId, eventType };
  }
  if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(eventType)) {
    const ownerId = text(meta.owner_id);
    const userId = text(meta.user_id);
    const plan = subscriptionPlan(meta.plan_id);
    const subscriptionId = text(object.id);
    const customerId = text(object.customer);
    const providerStatus = text(object.status) as ProviderSubscriptionStatus | undefined;
    const items=metadata(object.items); const firstItem=Array.isArray(items.data)&&items.data[0]&&typeof items.data[0]==="object"?items.data[0] as Record<string,unknown>:{}; const price=metadata(firstItem.price);
    const amountCents=money(price.unit_amount); const currency=text(price.currency);
    if (eventId && ownerId && userId && plan && subscriptionId && customerId && providerStatus && subscriptionStatuses.has(providerStatus) && amountCents !== undefined && currency) return {
      kind: "subscription_updated", eventId, orderId: text(meta.order_id), ownerId, userId, planId: plan.id, subscriptionId, customerId,
      status: eventType === "customer.subscription.deleted" ? "canceled" : providerStatus,
      cancelAtPeriodEnd: object.cancel_at_period_end === true, amountCents, currency,
      currentPeriodStart: iso(object.current_period_start??firstItem.current_period_start), currentPeriodEnd: iso(object.current_period_end??firstItem.current_period_end),
    };
    return { kind: "invalid", eventId, eventType };
  }
  if (eventType === "invoice.paid" || eventType === "invoice.payment_failed") {
    const invoiceId = text(object.id);
    const parent=metadata(object.parent); const subscriptionDetails=metadata(parent.subscription_details);
    const subscriptionId = text(object.subscription)??text(subscriptionDetails.subscription);
    const customerId=text(object.customer); const amountCents=money(eventType === "invoice.paid" ? object.amount_paid : object.amount_due); const currency=text(object.currency);
    const payments=metadata(object.payments); const firstPayment=Array.isArray(payments.data)&&payments.data[0]&&typeof payments.data[0]==="object"?payments.data[0] as Record<string,unknown>:{}; const paymentRef=metadata(firstPayment.payment);
    if (eventId && invoiceId && subscriptionId && customerId && amountCents !== undefined && currency) return {
      kind: eventType === "invoice.paid" ? "invoice_paid" : "invoice_payment_failed", eventId, invoiceId, subscriptionId,
      customerId, paymentIntentId: text(object.payment_intent)??text(paymentRef.payment_intent), chargeId: text(object.charge),
      amountCents, currency,
      chargedAt: iso(metadata(object.status_transitions).paid_at),
    };
    return { kind: "invalid", eventId, eventType };
  }
  if (eventType === "charge.refunded") {
    const chargeId = text(object.id); const amountRefundedCents=money(object.amount_refunded); const currency=text(object.currency);
    if (eventId && chargeId && amountRefundedCents !== undefined && amountRefundedCents > 0 && currency) return { kind: "charge_refunded", eventId, chargeId, paymentIntentId: text(object.payment_intent), amountRefundedCents, currency };
    return { kind: "invalid", eventId, eventType };
  }
  return { kind: "ignored", eventId, eventType };
}

export function refundEligibility(input: { chargedAt: string; aiCreditsUsed: number; alreadyRefunded: boolean }, now = new Date()): { eligible: boolean; reason?: string } {
  if (input.alreadyRefunded) return { eligible: false, reason: "ALREADY_REFUNDED" };
  if (!Number.isInteger(input.aiCreditsUsed) || input.aiCreditsUsed > 10) return { eligible: false, reason: "AI_CREDIT_LIMIT_EXCEEDED" };
  const chargedAt = new Date(input.chargedAt).getTime();
  if (!Number.isFinite(chargedAt) || now.getTime() - chargedAt > 7 * 86_400_000 || now.getTime() < chargedAt) return { eligible: false, reason: "REFUND_WINDOW_CLOSED" };
  return { eligible: true };
}
