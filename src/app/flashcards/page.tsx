import type { Metadata } from "next";
import Link from "next/link";
import { StudyPage } from "../components/study-shell";
import { getHsk3LevelStatus } from "@/lib/content/level-status";
import { FlashcardsWorkspace } from "./flashcards-workspace";

export const metadata: Metadata = {
  title: "Quick HSK 3.0 Flashcards — HSKKit",
  description: "Choose an HSK 3.0 level and review 10, 20, or 50 random published vocabulary cards without signing in.",
  alternates: { canonical: "/flashcards" },
};

const levelOptions = [1, 2, 3, 4, 5, 6, 7].map((level) => {
  const status = getHsk3LevelStatus(level);
  return {
    level,
    label: level === 7 ? "HSK 7–9" : `HSK ${level}`,
    publishedCount: status.wordCount,
  };
});

export default function FlashcardsPage() {
  return (
    <StudyPage>
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-5 py-6 sm:px-8 md:py-8">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
          <Link href="/" className="inline-flex min-h-11 items-center hover:text-blue-700">Home</Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-slate-700">Quick Flashcards</span>
        </nav>

        <header className="mt-3 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">Quick vocabulary test</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-.035em] text-slate-950 sm:text-5xl">Quick Flashcards</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">Choose your HSK level and set size, then flip through a fresh random set from the published HSK 3.0 catalog. No sign-in required.</p>
        </header>

        <div className="mt-7">
          <FlashcardsWorkspace levels={levelOptions} />
        </div>
      </main>
    </StudyPage>
  );
}
