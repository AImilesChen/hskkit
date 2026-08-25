"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
type Result={order_id:string;order_status:string;purchase_status?:string;selected_level?:number;product_id?:string;product_name?:string;delivery_count?:number;expires_at?:string;download_limit?:number};
export default function CheckoutSuccessClient({sessionId}:{sessionId:string}){
  const [result,setResult]=useState<Result|null>(null),[state,setState]=useState("loading");
  useEffect(()=>{
    if(!sessionId){setState("invalid");return;}
    let attempts=0,cancelled=false,timer:ReturnType<typeof setTimeout>|undefined;
    const retry=()=>{if(!cancelled&&attempts<12)timer=setTimeout(()=>void load(),2000);else if(!cancelled)setState("pending");};
    const load=async()=>{attempts++;try{const response=await fetch(`/api/v1/commercial/checkout/result?session_id=${encodeURIComponent(sessionId)}`,{cache:"no-store"});if(response.status===401){location.assign(`/login?returnTo=${encodeURIComponent(location.pathname+location.search)}`);return;}if(response.ok){const data=await response.json() as Result;setResult(data);if(data.order_status==="paid"||data.purchase_status==="active"){setState("ready");return;}}}catch{}retry();};
    void load();return()=>{cancelled=true;if(timer)clearTimeout(timer);};
  },[sessionId]);
  if(state==="loading")return <p aria-live="polite">Confirming Stripe Test payment and preparing access…</p>;
  if(state==="invalid")return <p role="alert" className="text-red-700">The checkout session reference is missing.</p>;
  if(state==="pending")return <div><p>Your Test payment is still being confirmed. No live card was charged.</p><Link href="/orders" className="mt-4 inline-flex min-h-11 items-center font-bold text-blue-700">Check orders →</Link></div>;
  const name=result?.product_name??(result?.selected_level?`Level ${result.selected_level} PDF Pack`:"digital product");
  return <div><p className="text-sm font-bold uppercase tracking-wider text-emerald-700">Payment confirmed</p><h2 className="mt-2 text-2xl font-extrabold">{name} is ready</h2><p className="mt-3 text-slate-600">{result?.delivery_count?`${result.delivery_count} separately metered deliveries are available. `:""}Each delivery allows up to {result?.download_limit??3} successful downloads before {result?.expires_at?new Date(result.expires_at).toLocaleString():"the access window ends"}.</p><div className="mt-6 flex flex-wrap gap-4"><Link href="/exports" className="inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-5 font-bold text-white">Open exports</Link><Link href="/orders" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-5 font-bold">View order</Link></div></div>;
}
