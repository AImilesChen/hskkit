"use client";

import { useEffect, useState } from "react";

const PACK_LEVELS=[1,2,3,4,5,6,7];

type CommerceConfig={enabled:boolean;amountCents:number;currency:string;accessDays:number;successfulDownloadLimit:number;refundDays:number;levelsAvailable:number[]};

export default function StorePurchase(){
  const [config,setConfig]=useState<CommerceConfig|null>(null);
  const [level,setLevel]=useState<number|null>(null);
  const [accepted,setAccepted]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  useEffect(()=>{void fetch("/api/v1/commercial/config",{cache:"no-store"}).then(r=>r.json()).then(setConfig).catch(()=>setMessage("Checkout configuration could not be loaded."));},[]);
  useEffect(()=>{
    if(!config) return;
    const requestedLevel=Number(new URLSearchParams(location.search).get("level"));
    if(PACK_LEVELS.includes(requestedLevel)&&config.levelsAvailable.includes(requestedLevel)) setLevel(requestedLevel);
  },[config]);
  const commerceEnabled=Boolean(config?.enabled);
  const availableLevels=PACK_LEVELS.filter(value=>(config?.levelsAvailable??PACK_LEVELS).includes(value));
  const price=((config?.amountCents??999)/100).toFixed(2);

  function selectLevel(value:number){
    if(busy) return;
    setLevel(value);
    setAccepted(false);
    setMessage("");
    window.setTimeout(()=>{
      const review=document.getElementById("purchase-review");
      review?.focus({preventScroll:true});
      review?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"});
    },0);
  }

  async function checkout(){
    if(level===null) return;
    if(!config?.levelsAvailable.includes(level)){setMessage("This level is not currently available for purchase.");return;}
    const submittedLevel=level;
    setBusy(true);setMessage("");
    try{
      const response=await fetch("/api/v1/commercial/checkout",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({level:submittedLevel,idempotencyKey:`pack-${submittedLevel}-${crypto.randomUUID()}`})});
      const data=await response.json() as {checkoutUrl?:string;error?:string};
      if(response.status===401){location.assign(`/login?returnTo=${encodeURIComponent(`/store?level=${submittedLevel}`)}`);return;}
      if(!response.ok||!data.checkoutUrl) throw new Error(data.error??"Checkout could not be started.");
      location.assign(data.checkoutUrl);
    }catch(error){setMessage(error instanceof Error?error.message:"Checkout could not be started.");setBusy(false);}
  }

  return <section aria-labelledby="pack-catalog-heading" className="mt-10">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Available now</p>
        <h2 id="pack-catalog-heading" className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Choose your level</h2>
      </div>
      <p className="max-w-xl text-sm leading-6 text-slate-600">Each level is sold separately. All seven released packs use the same one-time price and delivery terms.</p>
    </div>

    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {availableLevels.map(value=><article key={value} className={`flex min-h-[330px] flex-col rounded-xl border bg-white p-6 transition-colors ${level===value?"border-blue-600 ring-2 ring-blue-100":"border-slate-200 hover:border-blue-300"}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">HSK 3.0</p>
            <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">Level {value} PDF Pack</h3>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">Digital PDF</span>
        </div>
        <p className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950">US${price}</p>
        <p className="mt-1 text-sm text-slate-500">One-time Stripe Test checkout</p>
        <ul className="mt-5 space-y-2 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-700">
          <li><strong className="font-semibold text-slate-950">120</strong> vocabulary entries</li>
          <li><strong className="font-semibold text-slate-950">20</strong> practice prompts with answers</li>
          <li>{config?.successfulDownloadLimit??3} successful downloads · {config?.accessDays??14}-day access</li>
        </ul>
        <button type="button" onClick={()=>selectLevel(value)} disabled={busy} aria-pressed={level===value} className="mt-auto inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-5 font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:bg-blue-400">Buy Level {value} Pack</button>
      </article>)}
    </div>

    {level!==null&&<div id="purchase-review" tabIndex={-1} className="mt-8 border-y border-blue-200 bg-blue-50 px-5 py-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:px-7">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Purchase confirmation</p>
          <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">Review Level {level} purchase</h3>
          <p className="mt-3 text-sm leading-6 text-slate-700">US${price} one-time. Includes {config?.successfulDownloadLimit??3} successful downloads during a {config?.accessDays??14}-day private access window.</p>
          <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={accepted} onChange={event=>setAccepted(event.target.checked)} className="mt-1 h-4 w-4 shrink-0"/><span>I understand this pack covers Level {level} only, is separate from Pro, excludes audio, and is for personal non-transferable study and print use.</span></label>
        </div>
        <button type="button" onClick={()=>void checkout()} disabled={!commerceEnabled||!accepted||busy} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-6 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-700">{busy?"Opening secure checkout…":"Continue to Stripe Test checkout"}</button>
      </div>
      {!commerceEnabled&&config&&<p className="mt-4 text-sm font-semibold text-amber-900">Checkout is temporarily unavailable. No order will be created.</p>}
      <p className="mt-4 text-xs leading-5 text-slate-500">Test mode only: use Stripe test payment details. No live card charge occurs.</p>
    </div>}
    {message&&<p role="alert" className="mt-4 text-sm font-semibold text-red-700">{message}</p>}
  </section>;
}
