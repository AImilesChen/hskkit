"use client";

import Link from "next/link";
import { useState } from "react";

const LEVELS = [
  { value: 1, label: "HSK 1", display: "1", detail: "Foundation" },
  { value: 2, label: "HSK 2", display: "2", detail: "Foundation" },
  { value: 3, label: "HSK 3", display: "3", detail: "Intermediate" },
  { value: 4, label: "HSK 4", display: "4", detail: "Intermediate" },
  { value: 5, label: "HSK 5", display: "5", detail: "Upper intermediate" },
  { value: 6, label: "HSK 6", display: "6", detail: "Upper intermediate" },
  { value: 7, label: "HSK 7–9", display: "7–9", detail: "Advanced 7–9 unified band" },
] as const;

const SKILLS = [
  {
    slug: "vocabulary",
    label: "Vocabulary",
    detail: "Meaning and word recognition",
    support: "Immediate feedback",
  },
  {
    slug: "grammar",
    label: "Grammar",
    detail: "Natural Chinese word order",
    support: "Answer explanations",
  },
  {
    slug: "reading",
    label: "Reading",
    detail: "Passage comprehension",
    support: "Context-based practice",
  },
  {
    slug: "listening",
    label: "Listening",
    detail: "Audio comprehension",
    support: "Approved audio",
  },
] as const;

export default function PracticeSelectorClient() {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const level = LEVELS.find((item) => item.value === selectedLevel)!;

  return <main className="mx-auto min-h-[calc(100vh-72px)] max-w-6xl px-[16px] py-[24px] sm:px-[32px] sm:py-[40px]">
    <header className="max-w-3xl">
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">HSK 3.0 practice</p>
      <h1 className="mt-[8px] text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Choose your HSK practice</h1>
      <p className="mt-[12px] text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">Choose your HSK level, then open the skill you want to practise. Every session has eight published questions with immediate feedback.</p>
    </header>

    <section aria-labelledby="choose-level" className="mt-[24px] rounded-3xl border border-slate-200 bg-white p-[16px] shadow-sm sm:p-[24px]">
      <div className="flex flex-col gap-[8px] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-blue-700">Step 1</p>
          <h2 className="mt-[4px] text-2xl font-black text-slate-950" id="choose-level">Choose a level</h2>
        </div>
        <p className="text-sm text-slate-500">HSK 7–9 uses one unified advanced band.</p>
      </div>

      <div className="mt-[16px] grid grid-cols-4 gap-[8px] lg:grid-cols-7">{LEVELS.map((item) => <button
        aria-label={`${item.label} — ${item.detail}`}
        aria-pressed={selectedLevel === item.value}
        className={`min-h-12 rounded-xl border px-[8px] py-[8px] text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 motion-reduce:transition-none sm:text-sm ${selectedLevel === item.value ? "border-blue-700 bg-blue-700 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50"}`}
        key={item.value}
        onClick={() => setSelectedLevel(item.value)}
        type="button"
      >
        <span aria-hidden="true" className="mr-[2px] inline-block w-[12px]">{selectedLevel === item.value ? "✓" : ""}</span>
        {item.label}
      </button>)}</div>

      <p aria-live="polite" className="mt-[12px] flex min-h-[24px] items-center gap-[8px] text-sm font-semibold text-blue-900">
        <span aria-hidden="true" className="grid h-[20px] w-[20px] place-items-center rounded-full bg-blue-100 text-xs text-blue-700">✓</span>
        HSK {level.display} selected · Choose a skill to begin
      </p>
    </section>

    <section aria-labelledby="choose-skill" className="mt-[24px]">
      <div>
        <p className="text-sm font-bold text-blue-700">Step 2</p>
        <h2 className="mt-[4px] text-3xl font-black text-slate-950" id="choose-skill">Practice HSK {level.display}</h2>
        <p className="mt-[8px] text-slate-600">Choose a skill. The whole card opens its practice overview.</p>
      </div>

      <div className="mt-[16px] grid gap-[12px] sm:grid-cols-2 sm:gap-[16px]">{SKILLS.map((item) => <Link
        aria-label={`View HSK ${level.display} ${item.label} practice`}
        className="group flex min-h-[156px] flex-col rounded-2xl border border-slate-200 bg-white p-[16px] shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 active:translate-y-0 active:bg-blue-50 motion-reduce:transform-none motion-reduce:transition-none sm:p-[20px]"
        href={`/practice/${selectedLevel}/${item.slug}`}
        key={item.slug}
      >
        <div className="flex items-center justify-between gap-[16px]">
          <h3 className="text-xl font-black text-slate-950">{item.label}</h3>
          <span className="rounded-full bg-slate-100 px-[10px] py-[4px] text-xs font-bold text-slate-600">8 questions</span>
        </div>
        <p className="mt-[12px] text-base font-semibold text-slate-700">{item.detail}</p>
        <p className="mt-[4px] text-sm text-slate-500">{item.support}</p>
        <span className="mt-auto pt-[20px] text-sm font-extrabold text-blue-700 group-hover:text-blue-800">
          View HSK {level.display} {item.label} <span aria-hidden="true">→</span>
        </span>
      </Link>)}</div>
    </section>
  </main>;
}
