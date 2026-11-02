import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";
import { listAudioAssets } from "@/lib/learning/audio";
import { LISTENING_LIBRARY_COUNTS } from "@/lib/learning/listening-library";
import { ListeningResume } from "@/app/components/listening-session-state";
import LearningLoopNav from "@/app/components/learning-loop-nav";
import ListeningLibraryPicker from "./listening-library-picker";
import "./listening-library.css";

export const metadata: Metadata = { title: "Listening Practice | HSKKit", alternates: { canonical: "/listen" }, robots: { index: false, follow: false } };

export default function ListenPage() {
  const assets = listAudioAssets();
  return <><SiteHeader/><main className="learn listening-library"><header><span className="eyebrow">Hear a little. Learn a little.</span><h1>Listening practice</h1><p>Build your listening confidence with a short session at your HSK level.</p><LearningLoopNav active="Listen"/></header>
    <ListeningResume/><section className="mb-10" aria-label="Listening library"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-slate-500">{LISTENING_LIBRARY_COUNTS.audioGroups} approved audio sets · {LISTENING_LIBRARY_COUNTS.questions} scored questions</p></div></div><ListeningLibraryPicker levels={LISTENING_LIBRARY_COUNTS.byLevel} /><p className="step7-alert warning mt-5"><strong>Coverage boundary:</strong> HSKKit-authored practice based on the HSK 3.0 standard; this is not an official exam question bank.</p></section>
    <details><summary className="cursor-pointer font-semibold text-slate-800">Word and context audio mastery</summary><section className="mt-5"><p className="mb-5 text-slate-500">Continue individual word and context audio tasks.</p><div className="grid gap-4 sm:grid-cols-2">{assets.map((word) => <article className="card" key={word.id}><span className="eyebrow">HSK {word.level}</span><h2>{word.hanzi}</h2><p>{word.pinyin} · {word.meaning}</p><Link className="btn" href={`/listen/${word.id}`}>Start audio session</Link></article>)}</div></section></details>
  </main><SiteFooter/></>;
}
