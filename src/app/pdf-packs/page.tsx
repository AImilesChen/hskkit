import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import PdfPackPurchase from "./pdf-pack-purchase";
import {
  PUBLIC_ACCOUNT_SCOPE,
  PUBLIC_FORMAL_CONTENT_SCOPE,
  PURCHASING_UNAVAILABLE,
} from "@/lib/public-copy";

export const metadata: Metadata = {
  title: "Advanced Study PDF Pack status | HSKKit",
  description: "See the planned HSKKit printable study-pack scope and current purchasing status.",
  alternates: { canonical: "/pdf-packs" },
};

export default function PdfPacksPage() {
  return <><SiteHeader/><main className="mx-auto w-full max-w-[960px] px-5 py-12 sm:py-16">
    <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Planned digital study material · {PURCHASING_UNAVAILABLE}</p>
    <h1 className="mt-3 text-[32px] font-extrabold tracking-tight sm:text-[40px]">HSKKit Advanced Study PDF Pack</h1>
    <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Coming later. The planned pack would use only published, QA-approved and rights-checked content for one selected HSK 3.0 level. No checkout is open.</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-3">{[["Up to 120","planned vocabulary entries"],["Up to 20","planned practice prompts"],["One level","planned personal pack"]].map(([value,label])=><div key={label} className="rounded-xl border border-slate-200 bg-white p-5"><strong className="text-2xl text-slate-950">{value}</strong><p className="mt-1 text-sm text-slate-600">{label}</p></div>)}</div>
    <PdfPackPurchase/>
    <section className="mt-10 border-t border-slate-200 pt-8"><h2 className="text-2xl font-bold">Planned scope</h2><ul className="mt-4 grid gap-3 text-slate-700 sm:grid-cols-2"><li>Searchable Chinese and English text</li><li>Embedded font for reliable printing</li><li>Generation version and asset manifest</li><li>Private, short-lived download links</li><li>PDF or offline ZIP from a private exports page</li><li>Personal, non-transferable use</li></ul><p className="mt-6 text-sm leading-6 text-slate-500">Audio, video courses, teacher materials, subscriptions, AI credits, future updates and unpublished content are not part of the planned pack. Need help? <Link className="font-semibold text-blue-700" href="/contact">Contact support</Link>.</p></section>
    <div className="mt-8 space-y-3 rounded-xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600"><p>{PUBLIC_FORMAL_CONTENT_SCOPE}</p><p>{PUBLIC_ACCOUNT_SCOPE}</p><p className="font-semibold text-amber-900">{PURCHASING_UNAVAILABLE}.</p></div>
  </main><SiteFooter/></>;
}
