"use client";
import Image from "next/image";
import Link from "next/link";
import {useEffect,useState} from "react";
import {storeProductDetail} from "@/lib/commercial/product-details";
import type {PublicCommerceConfig} from "@/lib/commercial/public-catalog";

type CommerceConfig=PublicCommerceConfig;
const categories=["level","bundle","resource","resource_bundle","teacher"] as const;
const categoryLinks={level:"HSK levels",bundle:"Vocabulary bundles",resource:"Study resources",resource_bundle:"Resource bundles",teacher:"Teacher pack"} as const;
const sectionCopy={
  level:{eyebrow:"Complete HSK 3.0 level files",title:"Choose one complete level",copy:"Six complete Levels 1–6 vocabulary PDFs with canonical counts, searchable text and source IDs."},
  bundle:{eyebrow:"Complete vocabulary Bundles",title:"Study across levels",copy:"Starter, Progression, unified Advanced 7–9 and the 11,000-entry library aligned with the 2025 HSK exam syllabus—each with explicit contents and real samples."},
  resource:{eyebrow:"Practice, planning and assessment",title:"Build a repeatable study system",copy:"Open the actual sample pages, inspect every included file, then choose the complete resource that fits your work."},
  resource_bundle:{eyebrow:"Connected resource Bundles",title:"Combine practice and review",copy:"Complete component products packaged together at a lower one-time price; no shortened Bundle editions."},
  teacher:{eyebrow:"For independent teachers",title:"Teach from ready-to-edit files",copy:"Classroom plans, handouts, checks and editable office files with flexible printing for learners you teach."},
} as const;
const skeletonCategoryCounts:Record<(typeof categories)[number],number>={level:6,bundle:4,resource:4,resource_bundle:2,teacher:1};

function StoreCatalogSkeleton({message}:{message:string}){
  return <section className="mt-[24px] space-y-[56px]" aria-busy="true" aria-live="polite">
    <p className="sr-only">Loading product catalog…</p>
    {message?<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{message}</p>:null}
    {categories.map(category=><section key={category} aria-hidden="true">
      <div><div className="h-3 w-44 rounded bg-slate-200"/><div className="mt-3 h-8 w-64 max-w-full rounded bg-slate-200"/><div className="mt-2 h-6 max-w-2xl rounded bg-slate-100"/></div>
      <div className={`mt-[20px] grid gap-5 ${category==="teacher"?"md:grid-cols-1":category==="bundle"||category==="resource_bundle"?"md:grid-cols-2":"md:grid-cols-2 lg:grid-cols-3"}`}>
        {Array.from({length:skeletonCategoryCounts[category]},(_,index)=><article key={index} className="min-h-[360px] overflow-hidden rounded-xl border border-slate-200 bg-white"><div className={`${category==="level"?"aspect-[4/5]":"aspect-[4/3]"} bg-slate-100`}/><div className="space-y-4 p-5"><div className="h-7 w-3/4 rounded bg-slate-200"/><div className="h-16 rounded bg-slate-100"/><div className="h-11 rounded-lg bg-slate-200"/></div></article>)}
      </div>
    </section>)}
  </section>;
}

export default function StorePurchase({initialConfig}:{initialConfig:CommerceConfig}){
  const [config,setConfig]=useState<CommerceConfig|null>(initialConfig),[message,setMessage]=useState("");
  useEffect(()=>{void fetch("/api/v1/commercial/config",{cache:"no-store"}).then(async response=>{if(!response.ok)throw new Error();return response.json();}).then((data:CommerceConfig)=>setConfig(data)).catch(()=>setMessage("Product catalog could not be loaded. Please refresh and try again."));},[]);
  if(!config)return <StoreCatalogSkeleton message={message}/>;
  return <section aria-label="Digital product catalog" className="mt-[24px]">
    {config.sale&&<p className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-900">Limited-time 50% off new purchases. Ends {new Date(config.sale.endAt).toLocaleDateString("en",{year:"numeric",month:"short",day:"numeric",timeZone:"UTC"})} UTC. Discount is applied automatically at checkout.</p>}
    <nav aria-label="Browse store categories" className={`${config.sale?"mt-[16px]":""} flex flex-wrap items-center gap-2 text-sm`}><span className="mr-1 font-semibold text-slate-600">Browse:</span>{categories.filter(category=>config.products.some(product=>product.category===category)).map(category=><a key={category} href={`#${category}-catalog-heading`} className="rounded-full border border-slate-200 bg-white px-3 py-2 font-semibold text-blue-700 hover:border-blue-300 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">{categoryLinks[category]}</a>)}</nav>
    <div className="mt-[24px] space-y-[56px]">{categories.map(category=>{const products=config.products.filter(product=>product.category===category);if(!products.length)return null;const copy=sectionCopy[category];return <section key={category} aria-labelledby={`${category}-catalog-heading`}>
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">{copy.eyebrow}</p><h2 id={`${category}-catalog-heading`} className="mt-2 scroll-mt-24 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{copy.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{copy.copy}</p></div>
      <div className={`mt-[20px] grid gap-5 ${category==="teacher"?"md:grid-cols-1":category==="bundle"||category==="resource_bundle"?"md:grid-cols-2":"md:grid-cols-2 lg:grid-cols-3"}`}>
        {products.map(product=>{const detail=storeProductDetail(product.id);if(!detail)return null;return <article key={product.id} className={`min-h-[360px] overflow-hidden rounded-xl border border-slate-200 bg-white ${category==="teacher"?"flex flex-col md:grid md:grid-cols-2":"flex flex-col"}`}>
          <Link href={`/store/${product.id}`} aria-label={`View full-size sample pages for ${product.name}`} className={`group flex flex-col overflow-hidden border-b border-slate-200 bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${category==="teacher"?"md:border-b-0 md:border-r":""}`}>
            <div className={`relative overflow-hidden ${category==="teacher"?"aspect-[4/3] md:aspect-auto md:min-h-[340px] md:flex-1":category==="level"?"aspect-[4/5]":"aspect-[4/3]"}`}><Image src={detail.previewImage} alt={detail.previewAlt} fill priority={product.id==="level-1"} sizes={category==="teacher"?"(max-width: 768px) 100vw, 50vw":"(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"} className={category==="level"||category==="bundle"?"object-contain p-3":"object-contain"}/></div>
            <span className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700"><span>{category==="level"||category==="bundle"?"Full sample page":"Sample page"}</span><span className="text-emerald-800 group-hover:underline">View full-size samples →</span></span>
          </Link>
          <div className="flex flex-1 flex-col p-5"><div className="flex flex-wrap items-start justify-between gap-3"><h3 className="text-xl font-extrabold tracking-tight text-slate-950">{product.name}</h3><div className="flex shrink-0 flex-wrap gap-1" aria-label={`Included formats: ${detail.fileTypes.join(", ")}`}>{detail.fileTypes.map(fileType=><span key={fileType} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{fileType}</span>)}</div></div>
          <p className="mt-3 text-sm leading-6 text-slate-600">{detail.promise}</p><p className="mt-4 text-lg font-extrabold tracking-tight text-slate-800">{product.saleAmountCents!==null?<><span className="mr-2 text-sm font-medium text-slate-500 line-through">US${(product.amountCents/100).toFixed(2)}</span><span>US${(product.saleAmountCents/100).toFixed(2)}</span></>:`US$${(product.amountCents/100).toFixed(2)}`}</p><p className="mt-1 text-xs text-slate-500">One-time secure Stripe checkout</p>
          <ul className="mt-5 space-y-2 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-700">{detail.inside.slice(0,3).map(item=><li key={item}>✓ {item}</li>)}</ul>
          <div className="mt-auto pt-5"><Link href={`/store/${product.id}`} aria-label={`View details and samples for ${product.name}`} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">View details and samples</Link></div>
          </div>
        </article>})}
      </div>
    </section>})}</div>
    <p className="mt-[48px] border-t border-slate-200 pt-6 text-xs leading-5 text-slate-500">All payments are processed securely by Stripe. Each product detail page states its exact contents, licence, 14-day download window and successful-download limit before checkout.</p>
  </section>;
}

