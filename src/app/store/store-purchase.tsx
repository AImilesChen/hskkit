"use client";
import Image from "next/image";
import Link from "next/link";
import {useEffect,useState} from "react";
import {storeProductDetail} from "@/lib/commercial/product-details";

type Product={id:string;name:string;category:"level"|"bundle"|"resource"|"resource_bundle"|"teacher";amountCents:number;currency:string;levels:number[];description:string;deliverables:string[]};
type CommerceConfig={enabled:boolean;accessDays:number;successfulDownloadLimit:number;refundDays:number;products:Product[]};
const categories=["level","bundle","resource","resource_bundle","teacher"] as const;
const sectionCopy={
  level:{eyebrow:"Complete HSK 3.0 level files",title:"Choose one complete level",copy:"Six complete Levels 1–6 vocabulary PDFs with canonical counts, searchable text and source IDs."},
  bundle:{eyebrow:"Complete vocabulary Bundles",title:"Study across levels",copy:"Starter, Progression, unified Advanced 7–9 and the full 11,092-entry library—each with explicit contents and real samples."},
  resource:{eyebrow:"Practice, planning and assessment",title:"Build a repeatable study system",copy:"Open the actual sample pages, inspect every included file, then choose the complete resource that fits your work."},
  resource_bundle:{eyebrow:"Connected resource Bundles",title:"Combine practice and review",copy:"Complete component products packaged together at a lower one-time price; no shortened Bundle editions."},
  teacher:{eyebrow:"For independent teachers",title:"Teach from ready-to-edit files",copy:"Classroom plans, handouts, checks and editable office files under a bounded single-purchaser classroom licence."},
} as const;

export default function StorePurchase(){
  const [config,setConfig]=useState<CommerceConfig|null>(null),[message,setMessage]=useState("");
  useEffect(()=>{void fetch("/api/v1/commercial/config",{cache:"no-store"}).then(async response=>{if(!response.ok)throw new Error();return response.json();}).then((data:CommerceConfig)=>setConfig(data)).catch(()=>setMessage("Product catalog could not be loaded. Please refresh and try again."));},[]);
  if(!config)return <section className="mt-10" aria-live="polite"><p className="text-sm text-slate-600">Loading product catalog…</p>{message&&<p role="alert" className="mt-3 text-sm font-semibold text-red-700">{message}</p>}</section>;
  return <section aria-label="Digital product catalog" className="mt-10 space-y-16">
    {categories.map(category=>{const products=config.products.filter(product=>product.category===category);if(!products.length)return null;const copy=sectionCopy[category];return <section key={category} aria-labelledby={`${category}-catalog-heading`}>
      <div className="grid gap-3 md:grid-cols-[0.75fr_1.25fr] md:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">{copy.eyebrow}</p><h2 id={`${category}-catalog-heading`} className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{copy.title}</h2></div><p className="max-w-2xl text-sm leading-6 text-slate-600">{copy.copy}</p></div>
      <div className={`mt-6 grid gap-5 ${category==="bundle"||category==="resource_bundle"?"md:grid-cols-2":"sm:grid-cols-2 lg:grid-cols-3"}`}>
        {products.map(product=>{const detail=storeProductDetail(product.id);if(!detail)return null;return <article key={product.id} className="flex min-h-[360px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="relative aspect-[4/3] overflow-hidden border-b border-slate-200 bg-slate-100"><Image src={detail.previewImage} alt={detail.previewAlt} fill priority={product.id==="level-1"} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover"/></div>
          <div className="flex flex-1 flex-col p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">{detail.eyebrow}</p><h3 className="mt-2 text-xl font-extrabold tracking-tight text-slate-950">{product.name}</h3></div><span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">Digital</span></div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{detail.promise}</p><p className="mt-4 text-lg font-extrabold tracking-tight text-slate-800">US${(product.amountCents/100).toFixed(2)}</p><p className="mt-1 text-xs text-slate-500">One-time Stripe Test checkout</p>
          <ul className="mt-5 space-y-2 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-700">{detail.inside.slice(0,3).map(item=><li key={item}>✓ {item}</li>)}</ul>
          <Link href={`/store/${product.id}`} className="mt-auto inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">View details and samples</Link>
          </div>
        </article>})}
      </div>
    </section>})}
    <p className="border-t border-slate-200 pt-6 text-xs leading-5 text-slate-500">All checkouts remain in Stripe Test mode for this release candidate. Each product detail page states its exact contents, licence, 14-day access window and successful-download limit before checkout.</p>
  </section>;
}
