import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";
import { listAudioAssets } from "@/lib/learning/audio";
import { LISTENING_LIBRARY_COUNTS } from "@/lib/learning/listening-library";
import { ListeningResume } from "@/app/components/listening-session-state";

export const metadata: Metadata = { title: "Listening Practice | HSKKit", alternates: { canonical: "/listen" }, robots: { index: false, follow: false } };

export default function ListenPage() {
  const assets = listAudioAssets();
  return <><SiteHeader/><main className="learn"><header><span className="eyebrow">HSK 1–9 · Audio SRS</span><h1>HSKKit levelled listening practice library</h1><p>Choose a level and complete a 10- or 20-question session. Questions stay inside the selected level; results, Mistakes and SRS remain connected.</p><nav><Link href="/today">Today</Link><Link href="/review">Review</Link><Link href="/mistakes">Mistakes</Link><Link href="/planner">Planner</Link></nav></header>
    <ListeningResume/><section className="mb-10" aria-labelledby="library-heading"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 id="library-heading" className="mb-1">Choose your listening level</h2><p className="text-slate-500">{LISTENING_LIBRARY_COUNTS.audioGroups} approved audio sets · {LISTENING_LIBRARY_COUNTS.questions} scored questions</p></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{LISTENING_LIBRARY_COUNTS.byLevel.map((row) => {
      const advanced = row.level >= 7;
      return <article className="card flex flex-col" key={row.level}><span className="eyebrow">{advanced ? `Advanced 7–9 · HSKKit difficulty ${row.level}` : `HSK ${row.level}`}</span><h2>HSK {row.level} listening</h2><p className="grow">{row.audioGroups} audio sets · {row.questions} questions{advanced ? " · unified advanced exam preparation" : ""}</p><div className="mt-4 flex flex-wrap gap-2"><Link className="btn" href={`/listen/start?level=${row.level}&size=10`}>10 questions</Link><Link className="btn secondary" href={`/listen/start?level=${row.level}&size=20`}>20 questions</Link></div></article>;
    })}</div><p className="step7-alert warning mt-5"><strong>Coverage boundary:</strong> HSKKit-authored practice based on the HSK 3.0 standard; this is not an official exam question bank.</p></section>
    <details><summary className="cursor-pointer font-semibold text-slate-800">Word and context audio mastery</summary><section className="mt-5"><p className="mb-5 text-slate-500">Continue individual word and context audio tasks.</p><div className="grid gap-4 sm:grid-cols-2">{assets.map((word) => <article className="card" key={word.id}><span className="eyebrow">HSK {word.level}</span><h2>{word.hanzi}</h2><p>{word.pinyin} · {word.meaning}</p><Link className="btn" href={`/listen/${word.id}`}>Start audio session</Link></article>)}</div></section></details>
  </main><SiteFooter/></>;
}
