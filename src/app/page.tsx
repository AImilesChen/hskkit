import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "./site-footer";
import SiteHeader from "./site-header";
import { getHsk3LevelStatuses } from "@/lib/content/level-status";

export const metadata: Metadata = {
  title: "HSKKit — A clear HSK 3.0 study path",
  description: "Find a starting level, study HSK 3.0 Levels 1–9, practice, and review mistakes in one connected learning path.",
  alternates: { canonical: "/" },
};

const steps = [
  { n: "1", title: "Find your starting point", text: "Use a short diagnostic. If the evidence is limited, we say so instead of giving false precision.", href: "/placement", cta: "Start placement" },
  { n: "2", title: "Choose a Level 1–9 path", text: "See the real publication status for every HSK 3.0 level. Levels 7–9 share one advanced path.", href: "/levels", cta: "View all levels" },
  { n: "3", title: "Practice and review", text: "Complete a focused session, keep your attempt, and send mistakes into spaced review.", href: "/today", cta: "Open Today" },
];

export default function HomePage() {
  const levels = getHsk3LevelStatuses();
  const readyCount = levels.filter((entry) => entry.availability === "ready").length;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-gradient-to-b from-blue-50 to-white px-5 py-16 sm:py-24">
          <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.15em] text-blue-600">HSK 3.0 learning path</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-6xl">Know where to start. Always know what to study next.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">HSKKit connects placement, Levels 1–9, focused practice, mistakes, and spaced review. It is an independent study tool—not an official HSK examination.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/placement" className="inline-flex min-h-12 items-center justify-center rounded-full bg-blue-600 px-7 font-bold text-white hover:bg-blue-700">Find my level</Link>
                <Link href="/levels" className="inline-flex min-h-12 items-center justify-center rounded-full border border-blue-600 bg-white px-7 font-bold text-blue-700 hover:bg-blue-50">Explore Levels 1–9</Link>
              </div>
              <p className="mt-4 text-sm text-slate-500">No account required to start · Progress can be synced later</p>
            </div>
            <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-blue-900/5 sm:p-8" aria-label="Content publication status">
              <div className="flex items-start justify-between gap-5">
                <div><p className="text-sm font-bold uppercase tracking-wider text-slate-500">Official content gate</p><h2 className="mt-2 text-2xl font-bold">Level 1–9 status</h2></div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-800">{readyCount}/9 ready</span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {levels.map((entry) => <Link key={entry.level} href={`/vocabulary/${entry.level}`} className="flex min-h-16 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 font-bold hover:border-blue-400 hover:bg-blue-50"><span>Level {entry.level}</span><small className="font-medium text-slate-500">{entry.availability === "ready" ? `${entry.contentCount} items` : "Content gap"}</small></Link>)}
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-600">The release framework is live, but QA-approved HSK 3.0 study assets are not yet published. We show the gap instead of presenting demo words as complete official content.</p>
            </aside>
          </div>
        </section>

        <section className="px-5 py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px]">
            <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.15em] text-blue-600">One connected loop</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">From level estimate to daily review</h2></div>
            <div className="mt-9 grid gap-5 lg:grid-cols-3">
              {steps.map((step) => <article key={step.n} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">{step.n}</span><h3 className="mt-5 text-xl font-bold">{step.title}</h3><p className="mt-3 flex-1 leading-7 text-slate-600">{step.text}</p><Link href={step.href} className="mt-6 inline-flex min-h-11 items-center font-bold text-blue-700">{step.cta} <span aria-hidden="true" className="ml-2">→</span></Link></article>)}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 px-5 py-16 sm:py-20">
          <div className="mx-auto max-w-[900px] text-center"><h2 className="text-3xl font-bold sm:text-4xl">Two standards, clearly separated</h2><p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">Traditional HSK 2.0 pages remain available for learners who need them. The new main path uses HSK 3.0 labels and never silently converts old Level 1–5 material into the new standard.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/hsk-3-0" className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-900 px-7 font-bold text-white">Read the HSK 3.0 guide</Link><Link href="/hsk-2-0-vs-3-0" className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-7 font-bold text-slate-800">Compare the standards</Link></div></div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
