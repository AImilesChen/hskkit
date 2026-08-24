import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import StorePurchase from "./store-purchase";

export const metadata:Metadata={
  title:"HSK 3.0 Advanced Study PDF Pack Store | HSKKit",
  description:"Create a searchable, printable HSK 3.0 study PDF for one selected level with private signed delivery.",
  alternates:{canonical:"/store"},
};

export default function StorePage(){
  const product={"@context":"https://schema.org","@type":"Product",name:"HSKKit Advanced Study PDF Pack",description:"One selected HSK 3.0 level as a searchable printable PDF with private delivery.",offers:{"@type":"Offer",price:"9.99",priceCurrency:"USD",availability:"https://schema.org/InStock",url:"https://hskkit.com/store"}};
  return <><SiteHeader/><main className="mx-auto w-full max-w-[960px] px-5 py-12 sm:py-16">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(product)}}/>
    <p className="text-xs font-bold uppercase tracking-wider text-blue-600">One-time digital study material · Stripe Test mode</p>
    <h1 className="mt-3 text-[32px] font-extrabold tracking-tight sm:text-[40px]">HSKKit Advanced Study PDF Pack</h1>
    <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Choose one released HSK 3.0 level and generate a real searchable PDF from published, QA-approved, rights-checked content. Delivery stays private and uses a short-lived, owner-only signed link.</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-3">{[["US$9.99","one-time Test checkout"],["3 downloads","successful deliveries only"],["14 days","private access window"]].map(([value,label])=><div key={label} className="rounded-xl border border-slate-200 bg-white p-5"><strong className="text-2xl text-slate-950">{value}</strong><p className="mt-1 text-sm text-slate-600">{label}</p></div>)}</div>
    <StorePurchase/>
    <section className="mt-10 border-t border-slate-200 pt-8"><h2 className="text-2xl font-bold">What is included</h2><ul className="mt-4 grid gap-3 text-slate-700 sm:grid-cols-2"><li>Up to 120 authorized vocabulary entries</li><li>Up to 20 practice prompts with answers</li><li>Searchable Chinese and English text</li><li>Embedded fonts for reliable printing</li><li>Generation version and source/license manifest</li><li>Private PDF or offline ZIP delivery</li></ul><p className="mt-6 text-sm leading-6 text-slate-500">The PackPurchase is separate from any Pro subscription entitlement. Audio, video courses, teacher materials, AI credits, future updates and unpublished content are excluded. Refund review is available within 7 days only before a successful download, except where applicable law requires otherwise. See the <Link className="font-semibold text-blue-700" href="/refund-policy">Refund Policy</Link>.</p></section>
  </main><SiteFooter/></>;
}
