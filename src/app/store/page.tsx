import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import StorePurchase from "./store-purchase";

export const metadata:Metadata={
  title:"HSK 3.0 PDF Study Packs | HSKKit Store",
  description:"Choose an HSK 3.0 Level 1–7 searchable, printable PDF study pack with private signed delivery.",
  alternates:{canonical:"/store"},
};

const faqs=[
  ["Is each level sold separately?","Yes. Each US$9.99 purchase covers one HSK 3.0 level selected before checkout."],
  ["Is this included in Pro?","No. PDF Packs are separate one-time purchases. Pro covers ongoing review, Focused mode, device sync and AI learning features."],
  ["Does the pack include audio?","No. The pack contains searchable, printable study text and practice prompts. Audio is not included."],
  ["How many downloads do I get?","You receive up to three successful downloads for the purchased level."],
  ["How long is the download available?","Private access remains available for 14 days after the pack is first ready."],
  ["Can I print the PDF?","Yes. You may print it for your own personal, non-transferable study use."],
  ["What happens if a download fails?","A failed download does not use one of your three successful-download allowances."],
  ["What is the refund policy?",<>You may request manual refund review within 7 days only before any successful download, except where applicable law requires otherwise. Read the <Link className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4" href="/refund-policy">Refund Policy</Link>.</>],
] as const;

export default function StorePage(){
  const product={"@context":"https://schema.org","@type":"Product",name:"HSKKit HSK 3.0 PDF Study Pack",description:"One selected HSK 3.0 level as a searchable printable PDF with private delivery.",offers:{"@type":"Offer",price:"9.99",priceCurrency:"USD",availability:"https://schema.org/InStock",url:"https://hskkit.com/store"}};
  return <><SiteHeader/><main className="mx-auto w-full max-w-[1120px] px-5 py-10 sm:py-14">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(product)}}/>

    <header className="max-w-3xl border-b border-slate-200 pb-9 sm:pb-11">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">One-time digital study material · Stripe Test mode</p>
      <h1 className="mt-3 text-[34px] font-extrabold leading-tight tracking-[-0.035em] text-slate-950 sm:text-[46px]">Choose your HSK 3.0 PDF Study Pack</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Pick any released Level 1–7 pack. Every PDF is generated from published, QA-approved, rights-checked content and delivered through a private owner-only link.</p>
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-slate-700">
        <span>US$9.99 per level</span><span>3 successful downloads</span><span>14-day access</span>
      </div>
    </header>

    <StorePurchase/>

    <section className="mt-16 border-t border-slate-200 pt-10" aria-labelledby="included-heading">
      <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr]">
        <div><p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Clear and printable</p><h2 id="included-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">What every pack includes</h2></div>
        <ul className="grid gap-x-8 gap-y-4 text-slate-700 sm:grid-cols-2">
          {["120 authorized vocabulary entries","20 practice prompts with answers","Searchable Chinese and English text","Embedded fonts for reliable printing","Generation version and source/license manifest","Private PDF or offline ZIP delivery"].map(item=><li key={item} className="border-b border-slate-200 pb-4 text-sm leading-6"><span className="mr-2 font-bold text-blue-700">✓</span>{item}</li>)}
        </ul>
      </div>
      <p className="mt-7 max-w-4xl text-sm leading-6 text-slate-500">Audio, video courses, teacher materials, AI credits, future updates and unpublished content are excluded. Packs are licensed only for personal, non-transferable study and print use.</p>
    </section>

    <section className="mt-16 border-t border-slate-200 pt-10" aria-labelledby="compare-heading">
      <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-start">
        <div><p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Choose by learning goal</p><h2 id="compare-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">PDF Pack or Pro?</h2></div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="border-l-2 border-blue-600 pl-5"><h3 className="text-lg font-extrabold text-slate-950">PDF Pack</h3><p className="mt-2 text-sm leading-6 text-slate-600">A printable offline resource for one selected level, purchased once.</p></div>
          <div className="border-l-2 border-slate-300 pl-5"><h3 className="text-lg font-extrabold text-slate-950">Pro</h3><p className="mt-2 text-sm leading-6 text-slate-600">Ongoing review, Focused mode, device sync and AI learning capabilities.</p></div>
          <Link href="/pricing" className="inline-flex min-h-11 items-center font-bold text-blue-700 sm:col-span-2">Compare Free and Pro →</Link>
        </div>
      </div>
    </section>

    <section className="mt-16 border-t border-slate-200 pt-10" aria-labelledby="faq-heading">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Buying details</p>
      <h2 id="faq-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Frequently asked questions</h2>
      <dl className="mt-7 divide-y divide-slate-200 border-y border-slate-200">{faqs.map(([question,answer])=><div key={question} className="grid gap-2 py-5 md:grid-cols-[0.9fr_1.4fr] md:gap-10"><dt className="font-bold text-slate-950">{question}</dt><dd className="text-sm leading-6 text-slate-600">{answer}</dd></div>)}</dl>
    </section>
  </main><SiteFooter/></>;
}
