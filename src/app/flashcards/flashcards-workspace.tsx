"use client";

import { useRef, useState } from "react";
import { QuickFlashcards } from "./quick-flashcards";

const sessionSizes = [10, 20, 50] as const;
type SessionSize = typeof sessionSizes[number];
type LevelOption = { level: number; label: string; publishedCount: number };

export function FlashcardsWorkspace({ levels }: { levels: LevelOption[] }) {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedSize, setSelectedSize] = useState<SessionSize>(20);
  const [session, setSession] = useState<{ level: number; size: SessionSize; run: number } | null>(null);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const selected = levels.find((option) => option.level === selectedLevel) ?? levels[0];
  const active = session ? levels.find((option) => option.level === session.level) : null;

  function startSession() {
    setSession((current) => ({ level: selected.level, size: selectedSize, run: (current?.run ?? 0) + 1 }));
    window.requestAnimationFrame(() => deckRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return <>
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="flashcard-setup-heading">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Set up your cards</p>
        <h2 id="flashcard-setup-heading" className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Choose your HSK level</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Your selected options are highlighted before the set starts.</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7" role="group" aria-label="HSK flashcard level">
        {levels.map((option) => <button
          key={option.level}
          type="button"
          aria-pressed={selectedLevel === option.level}
          onClick={() => setSelectedLevel(option.level)}
          className={`min-h-12 rounded-xl border px-3 py-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${selectedLevel === option.level ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"}`}
        >{option.label}</button>)}
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-bold text-slate-900">Cards in this set</h3>
        <div className="mt-2 grid max-w-sm grid-cols-3 gap-2" role="group" aria-label="Cards per flashcard set">
          {sessionSizes.map((size) => <button
            key={size}
            type="button"
            aria-pressed={selectedSize === size}
            onClick={() => setSelectedSize(size)}
            className={`min-h-12 rounded-xl border px-4 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${selectedSize === size ? "border-blue-600 bg-blue-50 text-blue-800 ring-1 ring-blue-600" : "border-slate-300 bg-white text-slate-700 hover:border-blue-500 hover:text-blue-700"}`}
          >{size}</button>)}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600"><strong className="text-slate-900">{selected.label}</strong> · {selectedSize} random cards · {selected.publishedCount.toLocaleString("en-US")} published words</p>
        <button type="button" onClick={startSession} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-6 font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 sm:w-auto">Start {selected.label} flashcards</button>
      </div>
    </section>

    <div ref={deckRef} className="mt-7 scroll-mt-24">
      {session && active ? <QuickFlashcards key={`${session.level}-${session.size}-${session.run}`} level={active.level} levelLabel={active.label} publishedCount={active.publishedCount} sessionSize={session.size} /> : null}
    </div>
  </>;
}
