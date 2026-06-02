import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import PracticeTest from "../components/practice-test";
import questions from "../../lib/data/hsk5.json";

export const metadata: Metadata = {
  title: "HSK 5 Practice Test | HSKKit",
  description:
    "Take an interactive HSK 5 practice test with 10 random questions from a 35-question bank. Instant scoring, explanations, and personalized next steps.",
  alternates: {
    canonical: "https://hskkit.com/hsk-5-practice-test",
  },
  openGraph: {
    title: "HSK 5 Practice Test | HSKKit",
    description:
      "Take an interactive HSK 5 practice test with 10 random questions from a 35-question bank. Instant scoring, explanations, and personalized next steps.",
    url: "https://hskkit.com/hsk-5-practice-test",
    siteName: "HSKKit",
    type: "website",
  },
};

export default function HSK5PracticeTestPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh]">
        <PracticeTest
          level={5}
          questions={questions}
          sampleCount={10}
          title="HSK 5 Practice Test"
          description="10 random questions from a 35-question bank"
          vocabHref="/hsk-5-vocabulary"
        />
      </main>
      <SiteFooter />
    </>
  );
}
