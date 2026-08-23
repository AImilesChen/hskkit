import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";
import { listAudioAssets } from "@/lib/learning/audio";
import { ADVANCED_LISTENING_LESSONS } from "@/lib/learning/step7-content";

export const metadata: Metadata = { title: "Listening Practice | HSKKit", alternates: { canonical: "/listen" }, robots: { index: false, follow: false } };

export default function ListenPage() {
  const assets = listAudioAssets();
  return <><SiteHeader/><main className="learn"><header><span className="eyebrow">Audio SRS</span><h1>Listening practice</h1><p>Build separate word and context mastery, then progress through levelled sound discrimination, tones and dictation.</p><nav><Link href="/today">Today</Link><Link href="/review">Review</Link><Link href="/mistakes">Mistakes</Link><Link href="/planner">Planner</Link></nav></header>
    <section className="mb-10"><h2 className="mb-2">Formal listening progression</h2><p className="mb-5 text-slate-500">Nine released tasks move from tone, syllable and basic dictation through sentence, paragraph and context work to formal discourse. Every answer writes to the same Mistakes, SRS and Today loop.</p><div className="grid gap-4 sm:grid-cols-3">{ADVANCED_LISTENING_LESSONS.map((lesson) => <article className="card" key={lesson.slug}><span className="eyebrow">HSK {lesson.level} · {lesson.trainingType.replaceAll("-", " ")}</span><h2>{lesson.title}</h2><p>{lesson.instruction}</p><Link className="btn" href={`/listen/advanced/${lesson.slug}`}>Start task</Link></article>)}</div><p className="step7-alert warning"><strong>Coverage boundary:</strong> these are nine approved release tasks, not an exhaustive official listening corpus.</p></section>
    <section><h2 className="mb-2">Word and context audio</h2><p className="mb-5 text-slate-500">Continue the audio mastery tasks delivered in the previous step.</p><div className="grid gap-4 sm:grid-cols-2">{assets.map((word) => <article className="card" key={word.id}><span className="eyebrow">HSK {word.level}</span><h2>{word.hanzi}</h2><p>{word.pinyin} · {word.meaning}</p><Link className="btn" href={`/listen/${word.id}`}>Start audio session</Link></article>)}</div></section>
  </main><SiteFooter/></>;
}
