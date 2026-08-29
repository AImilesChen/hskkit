import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import { ReadingResultSummary } from "@/app/components/reading-session-state";

export const metadata: Metadata = { title: "Reading Session Complete | HSKKit", robots: { index: false, follow: false } };
type Props = { searchParams: Promise<{ level?: string; size?: string; seed?: string }> };
export default async function ReadingResultPage({ searchParams }: Props) {
  const query = await searchParams;
  const level = /^[1-9]$/.test(query.level ?? "") ? Number(query.level) : 1;
  const size = query.size === "20" ? 20 as const : 10 as const;
  const seed = /^[a-zA-Z0-9_-]{1,40}$/.test(query.seed ?? "") ? query.seed! : "default";
  return <><SiteHeader/><main className="learn"><header><span className="eyebrow">Session complete · HSK {level}</span><h1>You completed {size} reading questions</h1><p>Review missed items, practise this same level again, or deliberately choose a different learning activity.</p></header><section className="card"><ReadingResultSummary level={level} size={size} seed={seed}/><h2>Choose your next step</h2><div className="mt-4 flex flex-wrap gap-3"><Link className="btn" href={`/reading/start?level=${level}&size=${size}`}>Start a new mix</Link><Link className="btn secondary" href="/mistakes">Practise mistakes</Link><Link className="btn secondary" href="/reading">Choose another reading level</Link></div><details className="mt-6"><summary className="cursor-pointer font-semibold text-slate-700">Choose another skill</summary><div className="mt-3 flex flex-wrap gap-3"><Link className="btn secondary" href="/listen">Listening</Link><Link className="btn secondary" href="/grammar">Grammar</Link><Link className="btn secondary" href="/planner">Planner</Link></div></details></section></main><SiteFooter/></>;
}
