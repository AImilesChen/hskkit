"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type LevelOption = { readonly level: number; readonly label: string };

export function VocabularyLevelNavigation({ level, options, preserveFlashcards }: {
  level: number;
  options: readonly LevelOption[];
  preserveFlashcards?: boolean;
}) {
  const searchParams = useSearchParams();
  const flashcards = preserveFlashcards ?? searchParams.get("mode") === "flashcards";

  return <nav className="mt-[12px] flex flex-col gap-2 lg:flex-row lg:items-center" aria-label="HSK vocabulary levels">
    <p className="shrink-0 text-sm font-semibold text-slate-800">Choose a level</p>
    <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
      {options.map((option) => {
        const current = option.level === level;
        return <Link
          key={option.level}
          href={`/vocabulary/${option.level}${flashcards ? "?mode=flashcards#vocabulary-activities" : ""}`}
          aria-current={current ? "page" : undefined}
          className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${current ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"}`}
        >{option.label}</Link>;
      })}
    </div>
  </nav>;
}
