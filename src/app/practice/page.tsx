import type { Metadata } from "next";
import { Suspense } from "react";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";
import PracticeSelectorClient from "./practice-selector-client";

export const metadata: Metadata = {
  title: "Choose HSK 3.0 Practice — HSKKit",
  description: "Choose a level and skill for a versioned, resumable HSK 3.0 Practice Session.",
  alternates: { canonical: "/practice" },
  robots: { index: false, follow: false },
};

export default function PracticeSelector() {
  return <>
    <SiteHeader />
    <Suspense fallback={<main className="mx-auto min-h-[calc(100vh-64px)] max-w-5xl px-4 py-12 sm:px-8 sm:py-20"><p role="status">Loading Practice…</p></main>}>
      <PracticeSelectorClient />
    </Suspense>
    <SiteFooter />
  </>;
}
