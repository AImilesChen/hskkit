import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "./site-footer";
import SiteHeader from "./site-header";
import { getHsk3LevelStatuses } from "@/lib/content/level-status";

export const metadata: Metadata = {
  title: "HSKKit — HSK 3.0 Levels 1–9 study path",
  description: "Find your starting level, open today's study plan, and use published HSK 3.0 vocabulary, dictionary, listening, and practice tools.",
  alternates: { canonical: "/" },
};

const tools = [
  { title: "Dictionary", text: "Search published words by Hanzi, pinyin, English meaning, or level.", href: "/dictionary", cta: "Search the dictionary" },
  { title: "Listening", text: "Build word and context listening mastery with levelled audio tasks.", href: "/listen", cta: "Start listening" },
  { title: "Practice", text: "Complete focused questions, keep your attempt, and send mistakes into review.", href: "/practice/1/vocabulary", cta: "Start Level 1 practice" },
];

export default function HomePage() {
  const levels = getHsk3LevelStatuses();
  const publishedCount = levels.filter((entry) => entry.availability === "ready").length;

  return (
    <>
      <SiteHeader />
      <main>
        <section data-home-section="positioning" className="bg-gradient-to-b from-blue-50 to-white px-5 py-16 sm:py-24">
          <div className="mx-auto max-w-[1120px] text-center">
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-blue-600">HSK 3.0 · Levels 1–9</p>
            <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-6xl">One clear path from placement to daily Chinese study.</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600">HSKKit connects an evidence-based starting point, published HSK 3.0 vocabulary, Today, listening, practice, and progress. Levels 7–9 are one unified advanced learning path—not three separate examinations.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/placement" className="inline-flex min-h-12 items-center justify-center rounded-full bg-blue-600 px-7 font-bold text-white hover:bg-blue-700">Find my starting level</Link>
              <Link href="/levels" className="inline-flex min-h-12 items-center justify-center rounded-full border border-blue-600 bg-white px-7 font-bold text-blue-700 hover:bg-blue-50">Explore Levels 1–9</Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">Independent study guidance · Not an official HSK score or examination service</p>
          </div>
        </section>

        <section data-home-section="placement" className="px-5 py-14 sm:py-18">
          <div className="mx-auto grid max-w-[1120px] gap-6 rounded-3xl bg-slate-950 p-7 text-white sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div><p className="text-sm font-bold uppercase tracking-[0.15em] text-blue-300">Start here</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Not sure which level fits?</h2><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">Placement saves each answer, restores after refresh, and recommends a learning starting point. If listening evidence is unavailable, the result says so instead of pretending to be an official score.</p></div>
            <Link href="/placement" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 font-bold text-slate-950 hover:bg-blue-50">Start Placement</Link>
          </div>
        </section>

        <section data-home-section="today" className="bg-slate-50 px-5 py-16 sm:py-20">
          <div className="mx-auto grid max-w-[1120px] gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
            <div><p className="text-sm font-bold uppercase tracking-[0.15em] text-blue-600">Today status</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Your next step stays visible.</h2><p className="mt-4 text-lg leading-8 text-slate-600">Open Today to restore your current session and see what is completed, ready, or waiting. The order stays Review → Learn → Listen or Practice → Summary.</p><Link href="/today" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-blue-600 px-7 font-bold text-white hover:bg-blue-700">Open Today</Link></div>
            <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2" aria-label="Today learning order">
              {["Review due items", "Learn focused content", "Listen or practice", "See daily summary"].map((item, index) => <div key={item} className="flex min-h-20 items-center gap-4 rounded-2xl bg-slate-50 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">{index + 1}</span><strong>{item}</strong></div>)}
            </div>
          </div>
        </section>

        <section data-home-section="levels" className="px-5 py-16 sm:py-20">
          <div className="mx-auto max-w-[1120px]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.15em] text-blue-600">Level learning path</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Published HSK 3.0 content from Level 1 through the advanced band</h2><p className="mt-4 leading-7 text-slate-600">{publishedCount} published catalog routes are active. Levels 7–9 share one 5,636-item advanced catalog, so Level 8 and 9 continue into that same route instead of opening empty pages.</p></div><Link href="/levels" className="font-bold text-blue-700">See the full level path →</Link></div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
              {levels.map((entry) => {
                const catalogLevel = entry.level >= 8 ? 7 : entry.level;
                return <Link key={entry.level} href={`/vocabulary/${catalogLevel}`} className="flex min-h-28 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 hover:border-blue-400 hover:bg-blue-50"><span className="text-sm font-bold text-blue-600">LEVEL</span><strong className="text-2xl">{entry.level}</strong><small className="leading-5 text-slate-500">{entry.level >= 8 ? "Unified 7–9 band" : `${entry.contentCount.toLocaleString("en-US")} words`}</small></Link>;
              })}
            </div>
          </div>
        </section>

        <section data-home-section="tools" className="bg-blue-50/60 px-5 py-16 sm:py-20">
          <div className="mx-auto max-w-[1120px]"><div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.15em] text-blue-600">Real study tools</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Use the content, not empty feature promises.</h2></div><div className="mt-8 grid gap-5 lg:grid-cols-3">{tools.map((tool) => <article key={tool.href} className="flex flex-col rounded-2xl border border-blue-100 bg-white p-6"><h3 className="text-2xl font-bold">{tool.title}</h3><p className="mt-3 flex-1 leading-7 text-slate-600">{tool.text}</p><Link href={tool.href} className="mt-6 inline-flex min-h-11 items-center font-bold text-blue-700">{tool.cta} →</Link></article>)}</div></div>
        </section>

        <section data-home-section="account" className="px-5 py-16 sm:py-20">
          <div className="mx-auto grid max-w-[1120px] gap-8 lg:grid-cols-2 lg:items-center">
            <div><p className="text-sm font-bold uppercase tracking-[0.15em] text-blue-600">Account & progress</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Start as a guest. Sync when you are ready.</h2><p className="mt-4 text-lg leading-8 text-slate-600">Your account area shows sync state, streak, and a preview before guest progress is merged. Today, mistakes, and review remain connected to the same learning record.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/account" className="inline-flex min-h-12 items-center rounded-full bg-slate-900 px-7 font-bold text-white">Open account</Link><Link href="/today" className="inline-flex min-h-12 items-center rounded-full border border-slate-300 px-7 font-bold text-slate-800">View progress in Today</Link></div></div>
            <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-7"><h3 className="text-xl font-bold">Standards stay separate</h3><p className="mt-3 leading-7 text-slate-600">The main path uses HSK 3.0. Traditional HSK 2.0 resources retain their original label and never count as HSK 3.0 progress.</p><div className="mt-5 flex flex-wrap gap-x-5 gap-y-3"><Link href="/hsk-3-0" className="font-bold text-blue-700">HSK 3.0 guide</Link><Link href="/hsk-2-0-vs-3-0" className="font-bold text-blue-700">Compare HSK 2.0 and 3.0</Link></div></aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
