import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import PracticeTest from "../components/practice-test";

export const metadata: Metadata = {
  title: "HSK 2 Practice Test | HSKKit",
  description:
    "Take an interactive HSK 2 practice test with 10 random questions from a 35-question bank. Instant scoring, explanations, and personalized next steps.",
  alternates: {
    canonical: "https://hskkit.com/hsk-2-practice-test",
  },
};

function loadQuestions() {
  const path = join(process.cwd(), "docs", "content", "questions", "hsk2.json");
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw);
}

export default function HSK2PracticeTestPage() {
  const questions = loadQuestions();

  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh]">
        <PracticeTest
          level={2}
          questions={questions}
          sampleCount={10}
          title="HSK 2 Practice Test"
          description="10 random questions from a 35-question bank"
          vocabHref="/hsk-2-vocabulary"
        />
      </main>
      <SiteFooter />
    </>
  );
}
