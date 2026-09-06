"use client";

import { useEffect,useState } from "react";

type PlanId="pro_monthly"|"pro_yearly";
export default function SubscriptionCheckout({planId,label}:{planId:PlanId;label:string}){
  const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [checkoutEnabled,setCheckoutEnabled]=useState(false);
  useEffect(()=>{void fetch("/api/v1/commercial/config",{cache:"no-store"}).then(response=>response.ok?response.json():Promise.reject()).then((data:{checkoutEnabled?:boolean})=>setCheckoutEnabled(data.checkoutEnabled===true)).catch(()=>setCheckoutEnabled(false));},[]);
  const checkout=async()=>{
    setBusy(true);setError("");
    try{
      const response=await fetch("/api/v1/commercial/checkout",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({planRef:planId,idempotencyKey:crypto.randomUUID()})});
      const data=await response.json();
      if(response.status===401){location.href=`/login?next=${encodeURIComponent("/pricing")}`;return;}
      if(!response.ok||typeof data.checkoutUrl!=="string") throw new Error(data.error??"CHECKOUT_FAILED");
      location.href=data.checkoutUrl;
    }catch(cause){setError(cause instanceof Error?cause.message:"CHECKOUT_FAILED");setBusy(false);}
  };
  return <div className="mt-auto pt-7"><button type="button" disabled={busy||!checkoutEnabled} onClick={checkout} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-blue-700 px-5 font-bold text-white disabled:opacity-60">{busy?"Opening secure Checkout…":checkoutEnabled?label:"Checkout temporarily unavailable"}</button>{error&&<p className="mt-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}</div>;
}
