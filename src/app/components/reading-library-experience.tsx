"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ReadingResume } from "@/app/components/reading-session-state";

type IconName = "book" | "question" | "levels" | "feedback" | "arrow" | "check";
type ReadingExample = {
  slug: string;
  title: string;
  passage: string;
  prompt: string;
  explanation: string;
  questionType: string;
  options: string[];
};
type ReadingLevel = {
  level: number;
  passages: number;
  questions: number;
  descriptor: string;
  examples: ReadingExample[];
};

function ReadingIcon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.8 };
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" {...common}>
    {name === "book" && <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z"/></>}
    {name === "question" && <><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 1 1 3.1 2.3c-.7.3-.9.8-.9 1.7"/><path d="M12 16.5h.01"/></>}
    {name === "levels" && <><path d="M5 19V9"/><path d="M12 19V5"/><path d="M19 19v-7"/><path d="M3 19h18"/></>}
    {name === "feedback" && <><path d="M20 11.5a8 8 0 1 1-4.7-7.3"/><path d="m9 11 2 2 6-7"/></>}
    {name === "arrow" && <><path d="M5 12h14"/><path d="m15 8 4 4-4 4"/></>}
    {name === "check" && <path d="m5 12 4 4L19 6"/>}
  </svg>;
}

const PROOF = [
  { icon: "book" as const, value: "90", label: "verified passages" },
  { icon: "question" as const, value: "270", label: "scored questions" },
  { icon: "levels" as const, value: "9", label: "independent HSK levels" },
  { icon: "feedback" as const, value: "Immediate", label: "feedback & explanations" },
];

export default function ReadingLibraryExperience({ levels }: { levels: ReadingLevel[] }) {
  const [selectedLevel, setSelectedLevel] = useState(3);
  const active = useMemo(() => levels.find((level) => level.level === selectedLevel) ?? levels[0], [levels, selectedLevel]);
  const example = active.examples[0];

  return <div className="reading-library-experience">
    <section className="mb-8 grid items-stretch gap-6 lg:grid-cols-[0.9fr_1.1fr]" aria-labelledby="reading-hero-title">
      <div className="flex flex-col justify-center rounded-[24px] bg-slate-950 p-7 text-white sm:p-9">
        <span className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-blue-300">HSK 1–9 · Reading practice</span>
        <h1 id="reading-hero-title" className="max-w-xl text-3xl font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-4xl">Read at your level. Know why every answer is right.</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">Choose one HSK level, practise with real Chinese passages, and stay inside that level for every next question.</p>
        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold text-slate-200">Choose your HSK level</p>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Choose your reading level">
            {levels.map((level) => <button
              type="button"
              key={level.level}
              aria-pressed={selectedLevel === level.level}
              onClick={() => setSelectedLevel(level.level)}
              className="min-h-11 rounded-lg border border-slate-600 bg-slate-900 px-2 text-sm font-bold text-slate-200 transition hover:border-blue-300 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 motion-reduce:transition-none aria-pressed:border-blue-300 aria-pressed:bg-blue-500 aria-pressed:text-white"
            >HSK {level.level}</button>)}
          </div>
          <p className="mt-3 text-sm text-blue-200" aria-live="polite"><span className="inline-flex items-center gap-1.5"><ReadingIcon name="check" className="h-4 w-4"/>HSK {active.level} selected</span></p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 font-bold text-white transition hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none" href={`/reading/start?level=${active.level}&size=10`}>Start 10 questions <ReadingIcon name="arrow"/></Link>
          <Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-500 px-5 py-2.5 font-bold text-slate-100 transition hover:border-white hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none" href={`/reading/${example.slug}`}>Open this passage</Link>
        </div>
      </div>

      <article className="self-start overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.08)]" aria-label={`Real HSK ${active.level} practice preview`}>
        <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50 px-6 py-4">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-blue-700"><ReadingIcon name="book"/>Real practice preview</span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">HSK {active.level}</span>
        </div>
        <div className="p-6 sm:p-7">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-600">{example.title}</p>
          <p className="font-[var(--font-chinese)] text-xl leading-9 text-slate-900">{example.passage}</p>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">{example.prompt}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">{example.options.map((option, index) => <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" key={option}>{String.fromCharCode(65 + index)}. {option}</span>)}</div>
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              <ReadingIcon name="feedback" className="mt-0.5 h-5 w-5 shrink-0"/><div><strong>Example feedback</strong><p className="mt-1 text-emerald-800">{example.explanation}</p></div>
            </div>
          </div>
        </div>
      </article>
    </section>

    <ReadingResume/>

    <section className="mb-8 overflow-hidden rounded-[20px] border border-slate-200 bg-white" aria-label="Reading library proof">
      <div className="grid grid-cols-2 lg:grid-cols-4">{PROOF.map((item) => <div className="flex min-h-24 min-w-0 items-center gap-3 border-b border-slate-200 p-4 odd:border-r lg:border-b-0 lg:border-r lg:last:border-r-0" key={item.label}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"><ReadingIcon name={item.icon}/></span><div className="min-w-0"><strong className="block break-normal text-base text-slate-950 sm:text-lg">{item.value}</strong><span className="block break-normal text-sm leading-5 text-slate-500">{item.label}</span></div></div>)}</div>
    </section>

    <section className="mb-8 grid gap-6 rounded-[24px] border border-slate-200 bg-white p-6 lg:grid-cols-[0.8fr_1.2fr] lg:p-8" aria-labelledby="selected-reading-level">
      <div>
        <span className="eyebrow">Selected practice</span>
        <h2 id="selected-reading-level" className="text-3xl font-extrabold tracking-[-0.02em]">HSK {active.level} reading</h2>
        <p className="mt-3 text-slate-600">{active.descriptor}</p>
        <dl className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Passages</dt><dd className="mt-1 text-xl font-bold text-slate-950">{active.passages}</dd></div>
          <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Questions</dt><dd className="mt-1 text-xl font-bold text-slate-950">{active.questions}</dd></div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-3"><Link className="btn" href={`/reading/start?level=${active.level}&size=10`}>Start 10 questions</Link><Link className="inline-flex min-h-11 items-center rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 motion-reduce:transition-none" href={`/reading/start?level=${active.level}&size=20`}>Start 20 questions</Link></div>
      </div>
      <div>
        <div className="mb-3 flex items-end justify-between gap-3"><div><span className="eyebrow">Inside this level</span><h3 className="text-xl font-bold">Real passage examples</h3></div><span className="text-sm text-slate-500">3 of {active.passages}</span></div>
        <div className="grid gap-3">{active.examples.map((item, index) => <Link key={item.slug} href={`/reading/${item.slug}`} aria-label={`Open HSK ${active.level} passage: ${item.title}`} className="group rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 motion-reduce:transition-none"><article className="flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-600 group-hover:bg-white group-hover:text-blue-600">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 grow"><div className="mb-1 flex flex-wrap items-center gap-2"><p className="font-bold text-slate-950">{item.title}</p><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">{item.questionType.replace("-", " ")}</span></div><p className="line-clamp-2 text-sm leading-6 text-slate-600">{item.passage}</p><span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-blue-700">Preview passage <ReadingIcon name="arrow" className="h-4 w-4"/></span></div></article></Link>)}</div>
      </div>
    </section>
  </div>;
}
