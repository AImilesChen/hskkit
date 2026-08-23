import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../../site-header";
import SiteFooter from "../../site-footer";
export const metadata:Metadata={title:"Test checkout result | HSKKit",robots:{index:false,follow:false}};
export default function CheckoutSuccess(){return <><SiteHeader/><main className="mx-auto max-w-2xl px-5 py-20 text-center"><div className="rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</span><h1 className="mt-5 text-3xl font-bold">Test checkout complete</h1><p className="mt-3 leading-7 text-slate-600">This page records an authorized Stripe Test-mode result only. Public purchasing is unavailable; no live purchase occurred.</p><Link href="/exports" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-6 font-bold text-white">Open private test exports</Link></div></main><SiteFooter/></>}
