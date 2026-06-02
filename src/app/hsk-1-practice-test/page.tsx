import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import PracticeTest from "../components/practice-test";
import questions from "../../lib/data/hsk1.json";

export const metadata: Metadata = {
  title: "HSK 1 Practice Test | HSKKit",
  description:
    "Take an interactive HSK 1 practice test with 10 random questions from a 50-question bank. Instant scoring, explanations, and personalized next steps.",
  alternates: {
    canonical: "https://hskkit.com/hsk-1-practice-test",
  },
  openGraph: {
    title: "HSK 1 Practice Test | HSKKit",
    description:
      "Take an interactive HSK 1 practice test with 10 random questions from a 50-question bank. Instant scoring, explanations, and personalized next steps.",
    url: "https://hskkit.com/hsk-1-practice-test",
    siteName: "HSKKit",
    type: "website",
  },
};

export default function HSK1PracticeTestPage() {
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
