import Link from "next/link";
import type {StoreProductDetail} from "@/lib/commercial/product-details";
import ResourceProductCheckout from "./resource-product-checkout";
import ResourceSampleGallery from "./resource-sample-gallery";

export default function ResourceProductDetail({product}: {product:StoreProductDetail}){
  return <>
    <section className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,1.08fr)] lg:items-start">
      <div className="lg:sticky lg:top-6">
        <Link href="/store" className="inline-flex min-h-11 items-center text-sm font-bold text-emerald-800">← Back to Store</Link>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">{product.eyebrow}</p>
        <h1 className="mt-3 max-w-2xl text-[36px] font-extrabold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-[52px]">{product.name}</h1>
        <p className="mt-5 max-w-xl text-xl font-semibold leading-8 text-slate-800">{product.promise}</p>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">{product.summary}</p>
        <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-700">{product.outcomes.map(item=><li key={item} className="flex gap-3"><span aria-hidden="true" className="font-extrabold text-emerald-700">✓</span><span>{item}</span></li>)}</ul>
        <div className="mt-8 max-w-xl"><ResourceProductCheckout productId={product.id} name={product.name} amountCents={product.amountCents}/></div>
      </div>
      <div aria-label="Real product preview">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Real delivery files · watermarked samples</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Sample pages you can read</h2>
        <p className="mb-6 mt-3 max-w-2xl text-sm leading-6 text-slate-600">Open any page at full size. Use 100%, 150% or 200% zoom on desktop; swipe or pinch on mobile.</p>
        <ResourceSampleGallery samples={product.samplePages} productName={product.name}/>
        <p className="mt-4 text-xs leading-5 text-slate-500">Rendered from the actual delivery files. PDF previews add only the “SAMPLE PREVIEW” watermark; CSV previews add a labelled table frame and the same watermark. Minor scale differences may occur when printing.</p>
      </div>
    </section>

    <section className="mt-20 border-t border-slate-200 pt-12" aria-labelledby="fit-heading">
      <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Decide before checkout</p><h2 id="fit-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Is this right for me?</h2><p className="mt-3 text-sm leading-6 text-slate-600">Check the audience, limits and exact delivery facts—not just the product promise.</p></div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl bg-emerald-50 p-6"><h3 className="text-base font-extrabold text-emerald-950">A good fit if…</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-emerald-950">{product.fit.idealFor.map(item=><li key={item} className="flex gap-3"><span aria-hidden="true" className="font-bold">✓</span><span>{item}</span></li>)}</ul></div>
          <div className="rounded-2xl bg-slate-100 p-6"><h3 className="text-base font-extrabold text-slate-950">Not the right fit if…</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">{product.fit.notFor.map(item=><li key={item} className="flex gap-3"><span aria-hidden="true" className="font-bold">×</span><span>{item}</span></li>)}</ul></div>
          <div className="border-t border-slate-200 pt-5 md:col-span-2"><h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-slate-950">Delivery facts</h3><ul className="mt-4 grid gap-x-8 gap-y-3 text-sm leading-6 text-slate-700 sm:grid-cols-2">{product.fit.facts.map(item=><li key={item} className="flex gap-3"><span aria-hidden="true" className="text-emerald-700">•</span><span>{item}</span></li>)}</ul></div>
        </div>
      </div>
    </section>

    <section className="mt-16 border-t border-slate-200 pt-12" aria-labelledby="inside-heading"><div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Files, not promises</p><h2 id="inside-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">What’s inside</h2><p className="mt-3 text-sm leading-6 text-slate-600">Every listed file is generated, parsed and checked before release.</p></div><div className="grid gap-4 sm:grid-cols-2">{product.inside.map((item,index)=><div key={item} className="border-l-2 border-emerald-600 pl-4"><p className="text-xs font-bold text-emerald-800">{String(index+1).padStart(2,"0")}</p><p className="mt-1 text-sm font-semibold leading-6 text-slate-800">{item}</p></div>)}</div></div><div className="mt-10"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-950">Included formats</p><div className="mt-3 flex flex-wrap gap-2">{product.fileTypes.map(fileType=><span key={fileType} className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">{fileType}</span>)}</div></div><div className="mt-6 flex flex-wrap gap-2">{product.formats.map(format=><span key={format} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700">{format}</span>)}</div></section>
    <section className="mt-16 border-t border-slate-200 pt-12" aria-labelledby="use-heading"><div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">A simple routine</p><h2 id="use-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">How to use it</h2></div><ol className="space-y-5">{product.howToUse.map((step,index)=><li key={step} className="grid grid-cols-[44px_1fr] gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-700 text-sm font-extrabold text-white">{index+1}</span><p className="pt-2 text-sm leading-6 text-slate-700">{step}</p></li>)}</ol></div></section>
    <section className="mt-16 border-t border-slate-200 pt-12" aria-labelledby="faq-heading"><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Before you buy</p><h2 id="faq-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Questions about this pack</h2><dl className="mt-7 divide-y divide-slate-200 border-y border-slate-200">{product.faqs.map(item=><div key={item.question} className="grid gap-2 py-5 md:grid-cols-[0.8fr_1.3fr] md:gap-10"><dt className="font-bold text-slate-950">{item.question}</dt><dd className="text-sm leading-6 text-slate-600">{item.answer}</dd></div>)}</dl></section>
  </>;
}
