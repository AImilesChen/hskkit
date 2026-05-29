import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import LevelTest from "../components/level-test";
import questions from "../../lib/data/level_test.json";

export const metadata: Metadata = {
  title: "HSK Level Test | HSKKit",
  description:
    "Take a quick HSK level check with 8 questions across all levels. Get a personalized HSK level recommendation and next steps.",
  alternates: {
    canonical: "https://hskkit.com/hsk-level-test",
  },
};

export default function HSKLevelTestPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh]">
        <LevelTest
          questions={questions}
          title="Quick HSK Level Check"
          description="15 short questions across HSK 1–6. No timer. Get a suggested HSK level and a personalized next step."
        />
      </main>
      <SiteFooter />
    </>
  );
}
