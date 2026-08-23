import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import {
  PUBLIC_ACCOUNT_SCOPE,
  PUBLIC_FORMAL_CONTENT_SCOPE,
  PURCHASING_UNAVAILABLE,
} from "@/lib/public-copy";

export const metadata: Metadata = {
  title: "Pricing | HSKKit",
  description: "Free HSK 3.0 study tools and the current status of planned printable study packs.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return <><SiteHeader/><main className="mx-auto w-full max-w-[1040px] px-5 py-12 sm:py-16">
    <div className="text-center">
      <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Current product boundaries</p>
      <h1 className="mt-3 text-[32px] font-extrabold tracking-tight sm:text-[40px]">Study online with the free core.</h1>
      <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">No subscription is offered in this release. {PURCHASING_UNAVAILABLE}.</p>
    </div>
    <div className="mt-10 grid gap-6 md:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-7">
        <p className="font-bold text-blue-700">FREE CORE</p>
        <h2 className="mt-3 text-3xl font-bold">US$0</h2>
        <ul className="mt-6 grid gap-3 text-slate-700"><li>✓ Published HSK 3.0 vocabulary catalog</li><li>✓ Placement and Today path</li><li>✓ Practice, mistakes and review</li><li>✓ Listening and mock tools where published</li><li>✓ Private account data export</li></ul>
        <Link href="/today" className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg border border-blue-600 px-5 font-bold text-blue-700">Open Today</Link>
      </section>
      <section className="rounded-2xl border border-slate-300 bg-slate-50 p-7">
        <p className="font-bold text-slate-700">PRINTABLE PDF PACK · {PURCHASING_UNAVAILABLE.toUpperCase()}</p>
        <h2 className="mt-3 text-3xl font-bold">Coming later</h2>
        <p className="mt-2 text-sm text-slate-600">Planned as a one-time pack for one selected level; no checkout is open.</p>
        <ul className="mt-6 grid gap-3 text-slate-700"><li>Planned: up to 120 authorized entries</li><li>Planned: up to 20 practice prompts</li><li>Planned: PDF and offline ZIP</li></ul>
        <p className="mt-6 rounded-lg bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-950">{PURCHASING_UNAVAILABLE}. This page does not accept payment.</p>
        <Link href="/pdf-packs" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-400 bg-white px-5 font-bold text-slate-800">View planned pack details</Link>
      </section>
    </div>
    <div className="mx-auto mt-8 max-w-3xl space-y-3 rounded-xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600"><p>{PUBLIC_FORMAL_CONTENT_SCOPE}</p><p>{PUBLIC_ACCOUNT_SCOPE}</p></div>
  </main><SiteFooter/></>;
}
