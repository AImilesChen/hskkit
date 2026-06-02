import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import HSK1VocabularyClient from "./hsk-1-vocabulary-client";

export const metadata: Metadata = {
  title: "HSK 1 Vocabulary List | HSKKit",
  description:
    "Master all 150 HSK 1 words with pinyin, English meaning, and example sentences. Search, filter, and use flashcards to build a strong foundation in beginner Chinese.",
  alternates: {
    canonical: "https://hskkit.com/hsk-1-vocabulary",
  },
  openGraph: {
    title: "HSK 1 Vocabulary List | HSKKit",
    description:
      "Master all 150 HSK 1 words with pinyin, English meaning, and example sentences. Search, filter, and use flashcards to build a strong foundation in beginner Chinese.",
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
