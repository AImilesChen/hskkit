import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MockExam } from "@/app/components/mock-exam";
import SiteHeader from "@/app/site-header";
import SiteFooter from "@/app/site-footer";
import Link from "next/link";
import { parseMockLevel } from "@/lib/tests/mock-entry";
import "../../hsk-test-prep/test-pages.css";

export const metadata: Metadata = {
  title: "HSK 3.0 Timed Skills Checks | HSKKit",
  description: "Choose a level-specific HSK 1-6 skills check or a short unified HSK 7-9 diagnostic. These are learning checks, not official full-length exams.",
  robots: { index: false, follow: false },
};

export default async function MockPage({ params, searchParams }: { params: Promise<{ band: string }>; searchParams: Promise<{ level?: string | string[]; from?: string | string[] }> }) {
  const { band } = await params;
  if (band !== "basic" && band !== "advanced") notFound();
  const query = await searchParams;
  const initialLevel = band === "advanced" ? 7 : parseMockLevel(query.level) ?? 3;
  const entrySource = query.from === "level-page" ? "level_landing" : "direct";
  return <>
    <SiteHeader />
    <div className="test-page-surface"><main className="test-public-page test-runner-page">
      <nav className="test-breadcrumb" aria-label="Breadcrumb"><Link href="/hsk-test-prep">Practice tests</Link><span aria-hidden="true">/</span><Link href={`/hsk-test-prep/hsk-${initialLevel === 7 ? "7-9" : initialLevel}`}>{initialLevel === 7 ? "Advanced 7–9" : `HSK ${initialLevel}`}</Link><span aria-hidden="true">/</span><span>Skills check</span></nav>
      <MockExam key={`${band}:${initialLevel}`} band={band} initialLevel={initialLevel} entrySource={entrySource} />
    </main></div>
    <SiteFooter />
  </>;
}
