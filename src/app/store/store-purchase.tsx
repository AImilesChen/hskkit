"use client";

import { useEffect, useState } from "react";

type CommerceConfig={enabled:boolean;amountCents:number;currency:string;accessDays:number;successfulDownloadLimit:number;refundDays:number;levelsAvailable:number[]};

export default function StorePurchase(){
  const [config,setConfig]=useState<CommerceConfig|null>(null);
  const [level,setLevel]=useState(1);
  const [accepted,setAccepted]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  useEffect(()=>{void fetch("/api/v1/commercial/config",{cache:"no-store"}).then(r=>r.json()).then(setConfig).catch(()=>setMessage("Checkout configuration could not be loaded."));},[]);
  const commerceEnabled=Boolean(config?.enabled);
  async function checkout(){
    setBusy(true);setMessage("");
    try{
      const response=await fetch("/api/v1/commercial/checkout",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({level,idempotencyKey:`pack-${level}-${crypto.randomUUID()}`})});
      const data=await response.json() as {checkoutUrl?:string;error?:string};
      if(response.status===401){location.assign(`/sign-in?returnTo=${encodeURIComponent("/store")}`);return;}
      if(!response.ok||!data.checkoutUrl) throw new Error(data.error??"Checkout could not be started.");
      location.assign(data.checkoutUrl);
    }catch(error){setMessage(error instanceof Error?error.message:"Checkout could not be started.");setBusy(false);}
  }
  return <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
    <label htmlFor="pack-level" className="block font-semibold text-slate-950">Choose one HSK 3.0 level</label>
    <select id="pack-level" value={level} onChange={event=>setLevel(Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 sm:max-w-xs">
      {(config?.levelsAvailable??[1,2,3,4,5,6,7]).map(value=><option key={value} value={value}>Level {value}</option>)}
    </select>
    <p className="mt-5 text-sm leading-6 text-slate-600">One-time Stripe Test checkout. Price: US${((config?.amountCents??999)/100).toFixed(2)}. Includes {config?.successfulDownloadLimit??3} successful downloads during a {config?.accessDays??14}-day private access window.</p>
    <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={accepted} onChange={event=>setAccepted(event.target.checked)} className="mt-1 h-4 w-4"/><span>I understand this pack covers one selected level, is separate from Pro, excludes audio, and is for personal non-transferable study/print use.</span></label>
    <button type="button" onClick={()=>void checkout()} disabled={!commerceEnabled||!accepted||busy} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-6 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-700">{busy?"Opening secure checkout…":"Continue to Stripe Test checkout"}</button>
    {!commerceEnabled&&config&&<p className="mt-4 text-sm font-semibold text-amber-900">Checkout is temporarily unavailable. No order will be created.</p>}
    {message&&<p role="alert" className="mt-4 text-sm font-semibold text-red-700">{message}</p>}
    <p className="mt-4 text-xs leading-5 text-slate-500">Test mode only: use Stripe test payment details. No live card charge occurs.</p>
  </div>;
}
