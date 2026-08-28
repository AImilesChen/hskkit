import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import { ListeningResultSummary } from "@/app/components/listening-session-state";

export const metadata: Metadata = { title: "Listening Session Complete | HSKKit", robots: { index: false, follow: false } };
type Props = { searchParams: Promise<{ level?: string; size?: string; seed?: string }> };
export default async function ListeningResultPage({ searchParams }: Props) {
  const query = await searchParams;
  const level = /^[1-9]$/.test(query.level ?? "") ? Number(query.level) : 1;
  const size = query.size === "20" ? 20 as const : 10 as const;
  const seed = /^[a-zA-Z0-9_-]{1,40}$/.test(query.seed ?? "") ? query.seed! : "default";
  return <><SiteHeader/><main className="learn"><header><span className="eyebrow">Session complete · HSK {level}</span><h1>You completed {size} listening questions</h1><p>Your answers are saved to the same learning record. Review missed items now, repeat this level, or return to the full HSK 1–9 library.</p></header><section className="card"><ListeningResultSummary level={level} size={size} seed={seed}/><h2>Choose your next step</h2><div className="mt-4 flex flex-wrap gap-3"><Link className="btn" href="/review">Review this learning</Link><Link className="btn secondary" href="/mistakes">Practise mistakes</Link><Link className="btn secondary" href={`/listen/start?level=${level}&size=${size}`}>Start a new mix</Link><Link className="btn secondary" href="/listen">Choose another level</Link></div></section></main><SiteFooter/></>;
}
