"use client";

import Link from "next/link";
import {useEffect,useState} from "react";

type PlanId="pro_monthly"|"pro_yearly";
type PricingState={
  authenticated:boolean;
  statusAvailable:boolean;
  checkoutEnabled:boolean;
  subscription:null|{planId:PlanId;status:string;cancelAtPeriodEnd:boolean};
  access:{tier:"free"|"pro";source:"paid"|"trial"|"promo"|"free";endsAt:string|null};
};

const freeAccess:PricingState["access"]={tier:"free",source:"free",endsAt:null};

let pricingStatePromise:Promise<PricingState>|null=null;
function loadPricingState(){
  if(!pricingStatePromise)pricingStatePromise=Promise.all([
    fetch("/api/v1/commercial/config",{cache:"no-store"}).then(response=>response.ok?response.json():Promise.reject(new Error("CONFIG_UNAVAILABLE"))),
    fetch("/api/v1/commercial/subscription",{cache:"no-store"}).then(async response=>response.status===401?{authenticated:false,statusAvailable:true,subscription:null,access:freeAccess}:response.ok?{authenticated:true,statusAvailable:true,...await response.json()}:Promise.reject(new Error("SUBSCRIPTION_UNAVAILABLE"))),
  ]).then(([config,account])=>({authenticated:account.authenticated,statusAvailable:account.statusAvailable,checkoutEnabled:config.checkoutEnabled===true,subscription:account.subscription??null,access:account.access??freeAccess}));
  return pricingStatePromise;
}

function usePricingState(){
  const [state,setState]=useState<PricingState|null>(null);
  useEffect(()=>{let active=true;void loadPricingState().then(value=>{if(active)setState(value);}).catch(()=>{if(active)setState({authenticated:false,statusAvailable:false,checkoutEnabled:false,subscription:null,access:freeAccess});});return()=>{active=false;};},[]);
  return state;
}

function accessEnd(endsAt:string|null){
  if(!endsAt)return "";
  return new Intl.DateTimeFormat("en",{year:"numeric",month:"short",day:"numeric"}).format(new Date(endsAt));
}

export function WelcomeTrialAction(){
  const state=usePricingState();
  const buttonClass="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-5 font-bold text-white";
  if(!state)return <button type="button" disabled className={`${buttonClass} opacity-60`}>Checking your access…</button>;
  if(!state.statusAvailable)return <button type="button" disabled className={`${buttonClass} opacity-60`}>Account status unavailable</button>;
  if(!state.authenticated)return <Link href="/login?returnTo=%2Faccount" className={buttonClass}>Create account and start free trial</Link>;
  if(state.access.source==="paid")return <Link href="/account" className={buttonClass}>Manage subscription</Link>;
  if(state.access.source==="trial")return <span><Link href="/account" className={buttonClass}>Free Pro trial active</Link>{state.access.endsAt&&<span className="mt-2 block text-sm font-semibold text-blue-900">Ends {accessEnd(state.access.endsAt)}</span>}</span>;
  if(state.access.source==="promo")return <Link href="/account" className={buttonClass}>Current Pro access</Link>;
  return <Link href="/today" className={buttonClass}>Continue Free</Link>;
}

export function FreePlanAction(){
  const state=usePricingState();
  if(!state)return <div className="mt-auto pt-7"><button type="button" disabled className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-blue-600 px-5 font-bold text-blue-700 opacity-60">Checking your access…</button></div>;
  if(!state.statusAvailable)return <div className="mt-auto pt-7"><button type="button" disabled className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-blue-600 px-5 font-bold text-blue-700 opacity-60">Account status unavailable</button></div>;
  if(state.access.source==="trial")return <div className="mt-auto pt-7"><p className="mb-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-extrabold tracking-wide text-blue-900">FREE PRO TRIAL ACTIVE</p><Link href="/account" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-blue-600 px-5 font-bold text-blue-700">View trial details</Link><p className="mt-3 text-sm text-slate-600">{state.access.endsAt?`Your Pro trial ends ${accessEnd(state.access.endsAt)}.`:"Your Pro trial is active."}</p></div>;
  if(state.access.tier==="pro")return <div className="mt-auto pt-7"><Link href="/account" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-emerald-600 px-5 font-bold text-emerald-700">Current access: Pro</Link><p className="mt-3 text-sm text-slate-600">Free remains available if Pro ends.</p></div>;
  return <Link href="/today" className="mt-auto inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-blue-600 px-5 font-bold text-blue-700">Continue Free</Link>;
}

export default function SubscriptionCheckout({planId,label}:{planId:PlanId;label:string}){
  const state=usePricingState();const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  const subscription=state?.subscription;const active=Boolean(subscription&&["active","trialing"].includes(subscription.status));
  const isCurrent=active&&subscription?.planId===planId;
  const isMonthlyToYearly=active&&subscription?.planId==="pro_monthly"&&planId==="pro_yearly";
  const buttonClass=planId==="pro_yearly"?"bg-emerald-700":"bg-blue-700";

  const checkout=async()=>{
    setBusy(true);setError("");
    try{
      const response=await fetch("/api/v1/commercial/checkout",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({planRef:planId,idempotencyKey:crypto.randomUUID()})});
      const data=await response.json();
      if(response.status===401){location.href=`/login?next=${encodeURIComponent("/pricing")}`;return;}
      if(!response.ok||typeof data.checkoutUrl!=="string")throw new Error(data.error??"CHECKOUT_FAILED");
      location.href=data.checkoutUrl;
    }catch(cause){setError(cause instanceof Error?cause.message:"CHECKOUT_FAILED");setBusy(false);}
  };
  const switchToYearly=async()=>{
    setBusy(true);setError("");
    try{
      const response=await fetch("/api/v1/commercial/subscription",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"switch_to_yearly",idempotencyKey:crypto.randomUUID()})});
      const data=await response.json();
      if(response.status===401){location.href=`/login?next=${encodeURIComponent("/pricing")}`;return;}
      if(!response.ok||typeof data.portalUrl!=="string")throw new Error(data.error??"UPGRADE_PORTAL_FAILED");
      location.href=data.portalUrl;
    }catch(cause){setError(cause instanceof Error?cause.message:"UPGRADE_PORTAL_FAILED");setBusy(false);}
  };

  if(!state)return <div className="mt-auto pt-7"><button type="button" disabled className={`inline-flex min-h-11 w-full items-center justify-center rounded-lg ${buttonClass} px-5 font-bold text-white opacity-60`}>Checking your plan…</button></div>;
  if(isCurrent){
    const currentPlanText=planId==="pro_monthly"?"Your Pro Monthly plan is active.":"Your Pro Yearly plan is active.";
    return <div className="mt-auto pt-7"><p className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-extrabold tracking-wide ${planId==="pro_monthly"?"bg-blue-100 text-blue-900":"bg-emerald-100 text-emerald-900"}`}>CURRENT PLAN</p><Link href="/account" className={`inline-flex min-h-11 w-full items-center justify-center rounded-lg ${buttonClass} px-5 font-bold text-white`}>Manage subscription</Link><p className={`mt-3 text-sm ${planId==="pro_monthly"?"text-slate-300":"text-slate-600"}`}>{currentPlanText}</p></div>;
  }
  if(isMonthlyToYearly){
    const blocked=subscription?.cancelAtPeriodEnd===true;
    return <div className="mt-auto pt-7"><button type="button" disabled={busy||blocked} onClick={switchToYearly} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-700 px-5 font-bold text-white disabled:opacity-60">{busy?"Opening secure billing…":blocked?"Cancellation is scheduled":"Switch to Pro Yearly"}</button><p className="mt-3 text-sm text-slate-600">{blocked?"Manage the scheduled cancellation before changing plans.":"Review the prorated charge in Stripe before confirming."}</p>{error&&<p className="mt-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}</div>;
  }
  if(active)return <div className="mt-auto pt-7"><button type="button" disabled className={`inline-flex min-h-11 w-full items-center justify-center rounded-lg ${buttonClass} px-5 font-bold text-white opacity-60`}>Pro Yearly is active</button><p className="mt-3 text-sm text-slate-300">Downgrades are not offered from this page.</p></div>;
  const trialNote=state.access.source==="trial"?"Your free Pro trial is active. Buying starts a paid subscription now.":"";
  return <div className="mt-auto pt-7"><button type="button" disabled={busy||!state.checkoutEnabled} onClick={checkout} className={`inline-flex min-h-11 w-full items-center justify-center rounded-lg ${buttonClass} px-5 font-bold text-white disabled:opacity-60`}>{busy?"Opening secure Checkout…":state.checkoutEnabled?label:"Checkout temporarily unavailable"}</button>{trialNote&&<p className={`mt-3 text-sm ${planId==="pro_monthly"?"text-slate-300":"text-slate-600"}`}>{trialNote}</p>}{error&&<p className="mt-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}</div>;
}
