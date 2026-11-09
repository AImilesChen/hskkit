"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TOTAL_MOCK_COUNT, MOCK_HUB_HREF } from "@/lib/formal-exams/offer";
import { googleSignInHref } from "@/lib/account/sign-in";
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId } from "@/lib/commercial/subscription";
import { PRO_PLAN_BENEFITS as PRO_FEATURES, annualPriceSummary, checkoutAction, pricingReturnTo, selectedPricingPlan, type PricingState } from "@/lib/commercial/plan-presentation";

const freeAccess: PricingState["access"] = { tier: "free", source: "free", endsAt: null };
let pricingStatePromise: Promise<PricingState> | null = null;
function loadPricingState() {
  if (!pricingStatePromise) pricingStatePromise = Promise.all([
    fetch("/api/v1/commercial/config", { cache: "no-store" }).then(response => response.ok ? response.json() : Promise.reject(new Error("CONFIG_UNAVAILABLE"))),
    fetch("/api/v1/commercial/subscription", { cache: "no-store" }).then(async response => response.status === 401 ? { authenticated: false, statusAvailable: true, subscription: null, access: freeAccess } : response.ok ? { authenticated: true, statusAvailable: true, ...await response.json() } : Promise.reject(new Error("SUBSCRIPTION_UNAVAILABLE"))),
  ]).then(([config, account]) => ({ authenticated: account.authenticated, statusAvailable: account.statusAvailable, checkoutEnabled: config.checkoutEnabled === true, sale: config.sale ?? null, salePrices: Object.fromEntries((config.subscriptions ?? []).filter((plan: { saleAmountCents: number | null }) => typeof plan.saleAmountCents === "number").map((plan: { id: SubscriptionPlanId; saleAmountCents: number }) => [plan.id, plan.saleAmountCents])), subscription: account.subscription ?? null, access: account.access ?? freeAccess }));
  return pricingStatePromise;
}

function usePricingState() {
  const [state, setState] = useState<PricingState | null>(null);
  useEffect(() => {
    let active = true;
    void loadPricingState().then(value => { if (active) setState(value); }).catch(() => {
      pricingStatePromise = null;
      if (active) setState({ authenticated: false, statusAvailable: false, checkoutEnabled: false, sale: null, salePrices: {}, subscription: null, access: freeAccess });
    });
    return () => { active = false; };
  }, []);
  return state;
}

function accessEnd(endsAt: string | null) {
  return endsAt ? new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(endsAt)) : "";
}

export function SubscriptionPrice({ planId }: { planId: SubscriptionPlanId }) {
  const state = usePricingState();
  const regular = SUBSCRIPTION_PLANS[planId].amountCents;
  const sale = state?.salePrices[planId];
  const interval = SUBSCRIPTION_PLANS[planId].interval;
  return <div className="pricing-price" aria-live="polite" aria-atomic="true">
    <p><strong>US${((sale ?? regular) / 100).toFixed(2)}</strong><span> / {interval}</span></p>
    {sale !== undefined ? <p className="pricing-price-detail">First payment {state?.sale?.percentOff ?? 50}% off <s>US${(regular / 100).toFixed(2)}</s>. Renews at US${(regular / 100).toFixed(2)} per {interval}.</p> : <p className="pricing-price-detail">{interval === "year" ? `About $${annualPriceSummary().monthlyEquivalent}/month · Billed annually` : "Billed monthly"}</p>}
    <p className="pricing-renewal">Renews automatically. Cancel anytime.</p>
  </div>;
}

export function WelcomeTrialAction() {
  const state = usePricingState();
  if (!state) return <p role="status">Checking trial availability…</p>;
  if (!state.statusAvailable) return <p>Account status unavailable. <button type="button" className="pricing-text-button" onClick={() => location.reload()}>Retry</button></p>;
  if (!state.authenticated) return <p>Eligible new accounts receive 7 days of Pro access and 20 AI credits. No card required. Access returns to Free automatically. <Link href={googleSignInHref("/account")}>Start free trial →</Link></p>;
  if (state.access.source === "trial") return <p>Your free Pro trial includes all {TOTAL_MOCK_COUNT} mock papers{state.access.endsAt ? ` until ${accessEnd(state.access.endsAt)}` : ""}. <Link href="/account">View trial details →</Link></p>;
  if (state.access.source === "paid") return <p>Pro is active. All {TOTAL_MOCK_COUNT} mock papers are included. <Link href="/account">Manage subscription →</Link></p>;
  if (state.access.source === "promo") return <p>Your promotional Pro access is active. <Link href="/account">View access details →</Link></p>;
  return <p>Continue Free, or choose Pro when you need more. Your saved progress stays with your account.</p>;
}

export function FreePlanAction() {
  return <Link href="/today" className="pricing-button pricing-button-secondary">Start learning free <span aria-hidden="true">→</span></Link>;
}

const checkoutErrors: Record<string, string> = {
  CHECKOUT_FAILED: "Checkout could not open. Please try again.",
  UPGRADE_PORTAL_FAILED: "Billing could not open. Please try again.",
  SUBSCRIPTION_EXISTS: "A subscription already exists. Manage it from your account.",
};

export default function SubscriptionCheckout({ planId, label, onBusyChange }: { planId: SubscriptionPlanId; label: string; onBusyChange?: (busy: boolean) => void }) {
  const state = usePricingState();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setError(""); }, [planId]);
  const buttonClass = "pricing-button pricing-button-primary";
  if (!state) return <div className="pricing-checkout"><button type="button" disabled className={buttonClass}>Checking your plan…</button></div>;
  const action = checkoutAction(state, planId);
  if (action === "unavailable") return <div className="pricing-checkout" role="status"><p>Account status unavailable. Your plan could not be verified.</p><button type="button" className={buttonClass} onClick={() => location.reload()}>Retry plan details</button></div>;
  if (action === "manage" || action === "scheduled_cancellation") return <div className="pricing-checkout"><Link href="/account#billing" className={buttonClass}>Manage subscription</Link><p>{action === "scheduled_cancellation" ? "Cancellation is scheduled. Manage it before switching plans." : state.subscription?.planId === planId ? `Your ${SUBSCRIPTION_PLANS[planId].name} plan is active.` : "You already have a subscription. Manage your existing plan in your account."}</p></div>;
  if (action === "checkout_unavailable") return <div className="pricing-checkout"><button type="button" disabled className={buttonClass}>Checkout temporarily unavailable</button><button className="pricing-text-button" type="button" onClick={() => location.reload()}>Retry</button></div>;
  if (action === "sign_in") return <div className="pricing-checkout"><Link href={googleSignInHref(pricingReturnTo(planId))} className={buttonClass}>Sign in to choose {SUBSCRIPTION_PLANS[planId].name} <span aria-hidden="true">→</span></Link><p>Sign in, then confirm your plan before payment.</p></div>;
  const switchYearly = action === "switch_yearly";
  const checkout = async () => {
    setBusy(true); onBusyChange?.(true); setError("");
    try {
      const response = await fetch(switchYearly ? "/api/v1/commercial/subscription" : "/api/v1/commercial/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(switchYearly ? { action: "switch_to_yearly", idempotencyKey: crypto.randomUUID() } : { planRef: planId, idempotencyKey: crypto.randomUUID() }) });
      const data = await response.json();
      if (response.status === 401) { location.href = googleSignInHref(pricingReturnTo(planId)); return; }
      const target = switchYearly ? data.portalUrl : data.checkoutUrl;
      if (!response.ok || typeof target !== "string") throw new Error(switchYearly ? "UPGRADE_PORTAL_FAILED" : data.error ?? "CHECKOUT_FAILED");
      location.href = target;
    } catch (cause) { const code = cause instanceof Error ? cause.message : "CHECKOUT_FAILED"; setError(checkoutErrors[code] ?? "Checkout is unavailable. Please try again or manage your plan from your account."); setBusy(false); onBusyChange?.(false); }
  };
  return <div className="pricing-checkout"><button type="button" disabled={busy} onClick={checkout} className={buttonClass}>{busy ? "Opening secure billing…" : switchYearly ? "Switch to Pro Yearly" : label}</button>
    {switchYearly ? <p>Review the prorated charge in Stripe before confirming.</p> : state.access.source === "trial" ? <p className="pricing-billing-notice">Your free Pro trial is active. Buying starts a paid subscription now.</p> : state.access.source === "promo" ? <p className="pricing-billing-notice">Buying starts a paid subscription now, during your promotional access.</p> : null}
    {error && <p className="pricing-error" role="alert">{error} <Link href="/account">Account →</Link></p>}
  </div>;
}

export function ProPlanChoice() {
  const [planId, setPlanId] = useState<SubscriptionPlanId>("pro_yearly");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setPlanId(selectedPricingPlan(new URLSearchParams(location.search).get("plan"))); }, []);
  return <>
    <SubscriptionPrice planId={planId}/>
    <fieldset className="pricing-cycle" disabled={busy}><legend>Billing period</legend><div>
      <button type="button" aria-pressed={planId === "pro_monthly"} onClick={() => setPlanId("pro_monthly")}>Monthly</button>
      <button type="button" aria-pressed={planId === "pro_yearly"} onClick={() => setPlanId("pro_yearly")}>Yearly <span>Save {annualPriceSummary().savingsPercent}%</span></button>
    </div></fieldset>
    <ul className="pricing-benefits">{PRO_FEATURES.map(item => <li key={item.title}><span aria-hidden="true">✓</span><div><strong>{item.title}</strong><p>{item.detail}</p></div></li>)}</ul>
    <p className="pricing-pro-exam-link"><Link href={MOCK_HUB_HREF}>Explore included HSK mock papers →</Link></p>
    <SubscriptionCheckout key={planId} planId={planId} label={`Choose ${SUBSCRIPTION_PLANS[planId].name}`} onBusyChange={setBusy}/>
  </>;
}
