import type { Metadata } from "next";
import Link from "next/link";
import { StudyPage } from "../components/study-shell";

export const metadata: Metadata = {
  title: "HSK 2.0 vs HSK 3.0 — HSKKit",
  description: "See how HSKKit keeps traditional HSK 2.0 resources separate from the current HSK 3.0 Level 1–9 learning path.",
  alternates: { canonical: "/hsk-2-0-vs-3-0" },
};

const differences = [
  { topic: "Level structure", old: "Six levels (HSK 1–6)", next: "Nine learning levels; Levels 7–9 use one unified advanced learning path" },
  { topic: "HSKKit URLs", old: "Retained /hsk-N-vocabulary and /hsk-N-practice-test resources carry a Traditional HSK 2.0 notice", next: "/levels and /vocabulary/N are the primary HSK 3.0 paths" },
  { topic: "Content eligibility", old: "Traditional resources keep their original labels and evidence", next: "Only source-locked, license-recorded, QA-approved entries in the active HSK 3.0 release" },
  { topic: "Conversion", old: "No automatic conversion", next: "No traditional word, score, or attempt is silently counted as HSK 3.0 evidence" },
];

export default function ComparisonPage() {
  return (
    <StudyPage>
      <main className="mx-auto w-full max-w-[1000px] flex-1 px-5 py-12 md:px-16 md:py-16">
        <header className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.15em] text-blue-600">Standards comparison</p><h1 className="mt-3 text-4xl font-bold md:text-5xl">HSK 2.0 vs HSK 3.0</h1><p className="mt-5 text-lg leading-8 text-slate-600">Both systems can be useful, but their level labels are not interchangeable. HSKKit keeps their routes, content, and progress evidence separate.</p></header>
        <section className="mt-10 overflow-hidden rounded-2xl border border-slate-200"><div className="hidden grid-cols-[.8fr_1fr_1fr] bg-slate-900 px-5 py-4 font-bold text-white sm:grid"><span>Topic</span><span>Traditional HSK 2.0</span><span>HSK 3.0 path</span></div>{differences.map((item) => <article key={item.topic} className="grid gap-3 border-t border-slate-200 p-5 first:border-t-0 sm:grid-cols-[.8fr_1fr_1fr]"><h2 className="text-base font-bold">{item.topic}</h2><p className="text-slate-600"><span className="mb-1 block text-xs font-bold uppercase text-slate-400 sm:hidden">Traditional HSK 2.0</span>{item.old}</p><p className="text-slate-600"><span className="mb-1 block text-xs font-bold uppercase text-slate-400 sm:hidden">HSK 3.0 path</span>{item.next}</p></article>)}</section>
        <aside className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6"><h2 className="text-xl font-bold">Current formal release</h2><p className="mt-2 leading-7 text-green-950">11,092 source-audited HSK 3.0 entries are published across Levels 1–6. Levels 7–9 form one unified advanced band with 5,636 entries, so Level 8 and 9 do not pretend to be separate catalogs.</p></aside>
        <div className="mt-9 flex flex-wrap gap-3"><Link href="/levels" className="inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-5 py-3 font-bold text-white">Open HSK 3.0 Levels</Link><Link href="/hsk-3-0" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-5 py-3 font-bold text-slate-800">Read the HSK 3.0 guide</Link></div>
      </main>
    </StudyPage>
  );
}
