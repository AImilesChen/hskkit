import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MockExam } from "@/app/components/mock-exam";
import SiteHeader from "@/app/site-header";
import SiteFooter from "@/app/site-footer";

export const metadata: Metadata = {
  title: "HSK 3.0 Basic and Advanced Mock — HSKKit",
  description: "Take a timed, autosaved HSKKit Basic Mock or assess the unified HSK 7–9 advanced ability band with versioned learning feedback.",
  robots: { index: false, follow: false },
};

export default async function MockPage({ params }: { params: Promise<{ band: string }> }) {
  const { band } = await params;
  if (band !== "basic" && band !== "advanced") notFound();
  return <>
    <SiteHeader />
    <main className="mx-auto min-h-[calc(100vh-64px)] max-w-5xl px-4 py-8 sm:px-8 sm:py-14">
      <MockExam band={band} />
    </main>
    <SiteFooter />
  </>;
}
