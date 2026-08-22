"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const LEVELS = [
  { value: 1, label: "Level 1", detail: "Foundation" },
  { value: 2, label: "Level 2", detail: "Foundation" },
  { value: 3, label: "Level 3", detail: "Intermediate" },
  { value: 4, label: "Level 4", detail: "Intermediate" },
  { value: 5, label: "Level 5", detail: "Upper intermediate" },
  { value: 6, label: "Level 6", detail: "Upper intermediate" },
  { value: 7, label: "Advanced 7–9", detail: "Unified advanced band" },
] as const;
const SKILLS = [
  { slug: "vocabulary", label: "Vocabulary", detail: "Meaning and recognition" },
  { slug: "grammar", label: "Grammar", detail: "Natural word order" },
  { slug: "reading", label: "Reading", detail: "Passage comprehension" },
  { slug: "listening", label: "Listening", detail: "Approved audio comprehension" },
] as const;

export default function PracticeSelectorClient() {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [selectedSkill, setSelectedSkill] = useState<(typeof SKILLS)[number]["slug"]>("vocabulary");
  const level = useMemo(() => LEVELS.find((item) => item.value === selectedLevel)!, [selectedLevel]);
  const skill = useMemo(() => SKILLS.find((item) => item.slug === selectedSkill)!, [selectedSkill]);

  return <div className="space-y-8">
    <section aria-labelledby="choose-level" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-black text-slate-950" id="choose-level">Choose a level</h2>
      <p className="mt-2 text-slate-600">Levels 1–6 follow their published band. HSK 7–9 uses one honest Advanced 7–9 band rather than pretending there are separate official lists.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{LEVELS.map((item) => <button aria-pressed={selectedLevel === item.value} className={`min-h-20 rounded-2xl border p-4 text-left transition ${selectedLevel === item.value ? "border-blue-600 bg-blue-50 text-blue-950" : "border-slate-200 bg-white text-slate-800 hover:border-blue-300"}`} key={item.value} onClick={() => setSelectedLevel(item.value)} type="button"><strong className="block">{item.label}</strong><span className="mt-1 block text-sm opacity-75">{item.detail}</span></button>)}</div>
    </section>

    <section aria-labelledby="choose-skill" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-black text-slate-950" id="choose-skill">Choose a skill</h2>
      <p className="mt-2 text-slate-600">Every available set has eight formally published, versioned questions with answer explanations and QA/source records.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">{SKILLS.map((item) => <button aria-pressed={selectedSkill === item.slug} className={`min-h-20 rounded-2xl border p-4 text-left transition ${selectedSkill === item.slug ? "border-blue-600 bg-blue-50 text-blue-950" : "border-slate-200 bg-white text-slate-800 hover:border-blue-300"}`} key={item.slug} onClick={() => setSelectedSkill(item.slug)} type="button"><strong className="block">{item.label}</strong><span className="mt-1 block text-sm opacity-75">{item.detail}</span></button>)}</div>
    </section>

    <section className="flex flex-col gap-4 rounded-3xl bg-slate-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div><p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-300">Ready</p><h2 className="mt-2 text-2xl font-black">{level.label} · {skill.label}</h2><p className="mt-1 text-slate-300">Eight questions · immediate feedback · Mistakes and SRS saved</p></div>
      {selectedSkill === "vocabulary"
        ? <Link className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-500 px-6 font-bold text-white hover:bg-blue-400" href={`/practice/${selectedLevel}/vocabulary`}>Start vocabulary practice</Link>
        : <Link className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-500 px-6 font-bold text-white hover:bg-blue-400" href={`/practice/${selectedLevel}/${selectedSkill}`}>Start {skill.label.toLowerCase()} practice</Link>}
    </section>
  </div>;
}
