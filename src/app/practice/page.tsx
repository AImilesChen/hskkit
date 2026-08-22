import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";

export const metadata: Metadata = {
  title: "Choose HSK 3.0 Practice — HSKKit",
  description: "Choose a level and skill for a versioned, resumable HSK 3.0 Practice Session.",
  robots: { index: false, follow: false },
};

const levels = Array.from({ length: 9 }, (_, index) => index + 1);

export default async function PracticeSelector({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const rawLevel = (await searchParams).level;
  const selectedLevel = rawLevel && Number.isInteger(Number(rawLevel)) && Number(rawLevel) >= 1 && Number(rawLevel) <= 9 ? Number(rawLevel) : undefined;

  return <>
    <SiteHeader />
    <main className="mx-auto min-h-[calc(100vh-64px)] max-w-5xl px-4 py-12 sm:px-8 sm:py-20">
      <span className="text-xs font-extrabold uppercase tracking-[.2em] text-blue-700">HSK 3.0 Practice</span>
      <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-slate-950 sm:text-6xl">Choose a level</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">Select your learning level first, then choose a published skill. These are bounded Practice sessions with immediate feedback, not full Mock exams.</p>
      <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9" aria-label="Practice levels">
        {levels.map((level) => <Link key={level} href={`/practice?level=${level}`} aria-current={selectedLevel === level ? "step" : undefined} className={`flex min-h-12 items-center justify-center rounded-2xl border-2 font-bold ${selectedLevel === level ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-800 hover:border-blue-300"}`}>Level {level}</Link>)}
      </div>

      <section className="mt-12 border-t border-slate-200 pt-10" aria-labelledby="skill-heading">
        <h2 id="skill-heading" className="font-serif text-3xl font-bold text-slate-950">Choose a skill</h2>
        {!selectedLevel ? <p className="mt-3 text-slate-600">Choose a level above to see its published skill sets.</p> : selectedLevel >= 1 && selectedLevel <= 6 ? <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
            <span className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-800">Published · 3 items</span>
            <h3 className="mt-3 text-2xl font-bold text-slate-950">Vocabulary</h3>
            <p className="mt-2 leading-7 text-slate-700">Immediate feedback, server-side recovery, Mistakes, and due-now Review.</p>
            <Link className="btn mt-5" href={selectedLevel === 1 ? "/practice/1/vocabulary" : `/practice/${selectedLevel}/vocabulary`}>Continue to Level {selectedLevel} vocabulary</Link>
          </article>
        </div> : <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-700"><strong>Level {selectedLevel} has no published Practice set yet.</strong><p className="mt-2">We do not substitute legacy or unapproved questions into the new data contract.</p></div>}
      </section>
      <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-6"><span className="text-xs font-extrabold uppercase tracking-[.16em] text-slate-600">Mock readiness gate</span><h2 className="mt-3 font-serif text-3xl font-bold text-slate-950">Need a timed Mock?</h2><p className="mt-3 max-w-2xl leading-7 text-slate-700">Basic and advanced Mock routes stay gated until their timed structure, question set, authorization, and scoring rules are approved. No Practice set is relabeled as a Mock.</p><Link className="btn secondary mt-5" href="/mock/basic">Check Mock availability</Link></section>
    </main>
    <SiteFooter />
  </>;
}
