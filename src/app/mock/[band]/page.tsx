import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteFooter from "../../site-footer";
import SiteHeader from "../../site-header";

export const metadata: Metadata = {
  title: "HSK 3.0 Mock availability — HSKKit",
  description: "Check whether a bounded HSK 3.0 Mock has an approved timed structure and scoring contract.",
  robots: { index: false, follow: false },
};

export default async function MockAvailabilityPage({ params }: { params: Promise<{ band: string }> }) {
  const { band } = await params;
  if (band !== "basic" && band !== "advanced") notFound();
  const advanced = band === "advanced";
  return <><SiteHeader/><main className="mx-auto min-h-[calc(100vh-64px)] max-w-4xl px-4 py-14 sm:px-8 sm:py-24">
    <span className="text-xs font-extrabold uppercase tracking-[.2em] text-amber-700">{advanced ? "HSK 7–9 · P2" : "HSK 1–6 · P1"} readiness gate</span>
    <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-slate-950 sm:text-6xl">{advanced ? "Advanced Mock is not open" : "Basic Mock is not open"}</h1>
    <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">A timed Mock can open only after its exam structure, published questions, authorization, timer, and scoring rules are approved together. That contract is not ready, so HSKKit does not start or score a fake Mock.</p>
    <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950"><h2 className="text-2xl font-bold">Available path</h2><p className="mt-2 leading-7">Use versioned Practice for immediate feedback, Mistakes, and SRS. Practice results are learning feedback and are not official HSK scores.</p><div className="mt-5 flex flex-wrap gap-3"><Link className="btn" href={advanced ? "/practice?level=6" : "/practice?level=1"}>{advanced ? "Use published Level 6 Practice" : "Open bounded Practice"}</Link>{advanced && <Link className="btn secondary" href="/listen/advanced/hsk3-sentence-dictation">Use advanced listening</Link>}<Link className="btn secondary" href="/placement">Use Placement</Link></div></section>
    {advanced && <p className="mt-6 text-sm leading-6 text-slate-500">HSK 7–9 advanced Mock remains P2 and has not been pulled into this batch.</p>}
  </main><SiteFooter/></>;
}
