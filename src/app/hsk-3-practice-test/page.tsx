import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import PracticeTest from "../components/practice-test";
import questions from "../../lib/data/hsk3.json";

export const metadata: Metadata = {
  title: "HSK 3 Practice Test | HSKKit",
  description:
    "Take an interactive HSK 3 practice test with 10 random questions from a 35-question bank. Instant scoring, explanations, and personalized next steps.",
  alternates: {
    canonical: "https://hskkit.com/hsk-3-practice-test",
  },
};

export default function HSK3PracticeTestPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh]">
        <PracticeTest
          level={3}
          questions={questions}
          sampleCount={10}
          title="HSK 3 Practice Test"
          description="10 random questions from a 35-question bank"
          vocabHref="/hsk-3-vocabulary"
        />
      </main>
      <SiteFooter />
    </>
  );
}
