import type { Metadata } from "next";
import Link from "next/link";
import { StudyPage } from "../components/study-shell";
import { getHsk3LevelStatuses } from "@/lib/content/level-status";

export const metadata: Metadata = {
  title: "HSK Levels 1–9 Vocabulary Study Catalog | HSKKit",
  description: "Explore HSKKit's 2025-aligned HSK 1–5 exam-syllabus vocabulary and its separately labelled Level 6 and Advanced 7–9 study vocabulary.",
  alternates: { canonical: "/levels" },
};

const descriptions = [
  "Build essential greetings and everyday study language.",
  "Handle familiar routines, travel, and common habits.",
  "Discuss experience, study, and everyday environments.",
  "Communicate more precisely about ideas and responsibilities.",
  "Follow broader topics, changes, and developing trends.",
  "Work with abstract topics, resources, and formal discussion.",
  "Enter the unified advanced path with analytical language.",
  "Develop precise interpretation and deliberate expression.",
  "Use nuanced and strategic language in the advanced path.",
];

export default function LevelsPage() {
  const levels = getHsk3LevelStatuses();
  return (
    <StudyPage>
      <main className="mx-auto w-full max-w-[1140px] flex-1 px-5 py-12 md:px-16 md:py-16">
        <header className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.15em] text-blue-600">Published vocabulary · source by level</p><h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Choose a Level 1–9 study path</h1><p className="mt-5 text-lg leading-8 text-slate-600">HSK 1–5 now have 300, 200, 500, 1,000 and 1,600 distinct words aligned with the official 2025 exam syllabus. Level 6 and the Advanced 7–9 band still follow the 2021 Chinese Proficiency Grading Standards (GF0025-2021) while their migration is prepared. Levels 7–9 share one advanced ability band.</p><p className="mt-3 text-sm text-slate-600">Preparing for an exam? <Link href="/hsk-3-0" className="font-semibold text-blue-700 underline">Check the HSK 3.0 exam transition and official syllabus.</Link></p></header>
        <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-950"><strong>Published study content is available.</strong><p className="mt-1 leading-7">The counts below describe distinct approved entries in the currently published catalog. HSK 1–5 use the 2025 exam word lists; Level 6 and Advanced 7–9 still use the 2021 study standard. English explanations are HSKKit study content, not official exam material. Audio is available only on entries with an approved recording.</p></div>
        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="HSK 3.0 levels">
          {levels.map((entry, index) => (
            <article key={entry.level} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-blue-600">{entry.isAdvancedPath ? "ADVANCED PATH" : "FOUNDATION PATH"}</span><span className={`rounded-full px-3 py-1 text-xs font-bold ${entry.availability === "ready" || entry.level >= 8 ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}>{entry.level >= 8 ? "Unified HSK 7–9 advanced ability band" : entry.availability === "ready" ? `${entry.contentCount} published` : "Content gap"}</span></div>
              <h2 className="mt-4 text-3xl font-bold">Level {entry.level}</h2><p className="mt-3 flex-1 leading-7 text-slate-600">{descriptions[index]}</p><p className="mt-4 text-sm text-slate-500">{entry.level >= 8 ? "Levels 7–9 share the Level 7 catalog as one unified HSK 7–9 advanced ability band." : entry.message}</p>
              <Link href={`/vocabulary/${entry.level >= 8 ? 7 : entry.level}`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg border border-blue-600 px-5 py-3 font-semibold text-blue-700 hover:bg-blue-50">{entry.level >= 8 ? "View HSK 7–9 ability-band catalog" : `View Level ${entry.level} vocabulary`}</Link>
            </article>
          ))}
        </section>
        <section className="mt-12 rounded-2xl border border-blue-100 bg-blue-50 p-7"><h2 className="text-2xl font-semibold">Not sure where to begin?</h2><p className="mt-3 max-w-3xl text-slate-700">Use Placement for a suggested starting point. It is learning guidance, not an official examination result.</p><Link href="/placement" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">Start Placement</Link></section>
      </main>
    </StudyPage>
  );
}

