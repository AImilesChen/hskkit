import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import PracticeTest from "../components/practice-test";
import questions from "../../lib/data/hsk2.json";

export const metadata: Metadata = {
  title: "HSK 2 Practice Test | HSKKit",
  description:
    "Take an interactive HSK 2 practice test with 10 random questions from a 35-question bank. Instant scoring, explanations, and personalized next steps.",
  alternates: {
    canonical: "https://hskkit.com/hsk-2-practice-test",
  },
};

export default function HSK2PracticeTestPage() {
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
