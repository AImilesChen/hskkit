import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import LevelTest from "../components/level-test";

export const metadata: Metadata = {
  title: "HSK Level Test | HSKKit",
  description:
    "Take a quick HSK level check with 8 questions across all levels. Get a personalized HSK level recommendation and next steps.",
  alternates: {
    canonical: "https://hskkit.com/hsk-level-test",
  },
};

function loadQuestions() {
  const path = join(process.cwd(), "docs", "content", "questions", "level_test.json");
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw);
}

export default function HSKLevelTestPage() {
  const questions = loadQuestions();

  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh]">
        <LevelTest
          questions={questions}
          title="Quick HSK Level Check"
          description="8 short questions across HSK 1–6. No timer. Get a suggested HSK level and a personalized next step."
        />
      </main>
      <SiteFooter />
    </>
  );
}
