import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import HSK1VocabularyClient from "./hsk-1-vocabulary-client";

export const metadata: Metadata = {
  title: "HSK 1 Vocabulary List (Traditional HSK 2.0) | HSKKit",
  description:
    "Explore a 150-word Traditional HSK 2.0 HSK 1 list with pinyin, meanings, examples and flashcards. For current HSK 3.0 vocabulary, use the Level 1 catalog.",
  alternates: {
    canonical: "https://hskkit.com/hsk-1-vocabulary",
  },
  openGraph: {
    title: "HSK 1 Vocabulary List (Traditional HSK 2.0) | HSKKit",
    description:
      "Explore a 150-word Traditional HSK 2.0 HSK 1 list with pinyin, meanings, examples and flashcards. For current HSK 3.0 vocabulary, use the Level 1 catalog.",
    url: "https://hskkit.com/hsk-1-vocabulary",
    siteName: "HSKKit",
    type: "website",
  },
};

export default function HSK1VocabularyPage() {
  return (
    <>
      <SiteHeader />
      <HSK1VocabularyClient />
      <SiteFooter />
    </>
  );
}
