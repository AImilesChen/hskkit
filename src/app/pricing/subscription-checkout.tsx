"use client";

import Link from "next/link";
import {useEffect,useState} from "react";

type PlanId="pro_monthly"|"pro_yearly";
type PricingState={
  checkoutEnabled:boolean;
  subscription:null|{planId:PlanId;status:string;cancelAtPeriodEnd:boolean};
};

let pricingStatePromise:Promise<PricingState>|null=null;
function loadPricingState(){
  if(!pricingStatePromise)pricingStatePromise=Promise.all([
    fetch("/api/v1/commercial/config",{cache:"no-store"}).then(response=>response.ok?response.json():Promise.reject(new Error("CONFIG_UNAVAILABLE"))),
    fetch("/api/v1/commercial/subscription",{cache:"no-store"}).then(async response=>response.status===401?{subscription:null}:response.ok?response.json():Promise.reject(new Error("SUBSCRIPTION_UNAVAILABLE"))),
  ]).then(([config,account])=>({checkoutEnabled:config.checkoutEnabled===true,subscription:account.subscription??null}));
  return pricingStatePromise;
}

function usePricingState(){
  const [state,setState]=useState<PricingState|null>(null);
  useEffect(()=>{let active=true;void loadPricingState().then(value=>{if(active)setState(value);}).catch(()=>{if(active)setState({checkoutEnabled:false,subscription:null});});return()=>{active=false;};},[]);
  return state;
}

export function FreePlanAction(){
  const state=usePricingState();
  const hasPro=state?.subscription&&["active","trialing"].includes(state.subscription.status);
  if(hasPro)return <div className="mt-auto pt-7"><Link href="/account" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-emerald-600 px-5 font-bold text-emerald-700">Current access: Pro</Link><p className="mt-3 text-sm text-slate-600">Free remains available if Pro ends.</p></div>;
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
  return <div className="mt-auto pt-7"><button type="button" disabled={busy||!state.checkoutEnabled} onClick={checkout} className={`inline-flex min-h-11 w-full items-center justify-center rounded-lg ${buttonClass} px-5 font-bold text-white disabled:opacity-60`}>{busy?"Opening secure Checkout…":state.checkoutEnabled?label:"Checkout temporarily unavailable"}</button>{error&&<p className="mt-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}</div>;
}
