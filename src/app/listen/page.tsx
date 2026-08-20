import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";
import { listAudioAssets } from "@/lib/learning/audio";

export const metadata: Metadata = { title: "Listening Practice | HSKKit", robots: { index: false, follow: false } };

export default function ListenPage() {
  const assets = listAudioAssets();
  return <><SiteHeader /><main className="learn"><header><span className="eyebrow">Audio SRS</span><h1>Listening practice</h1><p>Hear real Chinese words and sentences, then build audio mastery.</p><nav><Link href="/today">Today</Link><Link href="/review">Review</Link><Link href="/mistakes">Mistakes</Link><Link href="/listen">Listen</Link></nav></header><div className="grid gap-4 sm:grid-cols-2">{assets.map((word) => <article className="card" key={word.id}><span className="eyebrow">HSK {word.level}</span><h2>{word.hanzi}</h2><p>{word.pinyin} · {word.meaning}</p><Link className="btn" href={`/listen/${word.id}`}>Start audio session</Link></article>)}</div></main><SiteFooter /></>;
}
