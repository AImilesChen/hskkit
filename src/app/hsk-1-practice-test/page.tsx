import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import PracticeTest from "../components/practice-test";

export const metadata: Metadata = {
  title: "HSK 1 Practice Test | HSKKit",
  description:
    "Take an interactive HSK 1 practice test with 10 random questions from a 50-question bank. Instant scoring, explanations, and personalized next steps.",
  alternates: {
    canonical: "https://hskkit.com/hsk-1-practice-test",
  },
};

function loadQuestions() {
  const path = join(process.cwd(), "docs", "content", "questions", "hsk1.json");
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw);
}

export default function HSK1PracticeTestPage() {
  const questions = loadQuestions();

  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh]">
        <PracticeTest
          level={1}
          questions={questions}
          sampleCount={10}
          title="HSK 1 Practice Test"
          description="10 random questions from a 50-question bank"
          vocabHref="/hsk-1-vocabulary"
        />
      </main>
      <SiteFooter />
    </>
  );
}
