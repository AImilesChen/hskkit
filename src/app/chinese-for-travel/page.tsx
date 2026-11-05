import type { Metadata } from "next";
import Link from "next/link";
import { StudyPage } from "../components/study-shell";
import { getTravelCards } from "@/lib/travel/server";
import TravelPhrasebook from "./travel-phrasebook";
import "./travel.css";

export const metadata: Metadata = {
  title: "Essential Chinese Words & Phrases for Travel | HSKKit",
  description: "50 essential Mandarin words and phrases for your China trip. Search by situation, show Chinese in large text, save favourites and practise for free. No account needed.",
  alternates: { canonical: "https://hskkit.com/chinese-for-travel" },
  openGraph: { title: "Essential Chinese Words & Phrases for Travel", description: "Your free, practical Mandarin phrasebook for a China trip.", url: "https://hskkit.com/chinese-for-travel", type: "website" },
};

export default function ChineseForTravelPage() {
  return <StudyPage><main className="travel-page">
    <nav className="travel-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/topics/travel-transport">Travel topics</Link><span aria-hidden="true">/</span><span>Travel phrasebook</span></nav>
    <header className="travel-hero">
      <p className="travel-kicker">A little Chinese. A smoother trip.</p>
      <h1>Essential Chinese Words<br className="travel-desktop-break" /> &amp; Phrases for Travel</h1>
      <p>Find what to say, show it on your phone, or practise before you go.</p>
      <div className="travel-benefits"><span>50 useful words &amp; phrases</span><span>Free · No account needed</span><span>Mandarin · Simplified Chinese</span></div>
    </header>
    <TravelPhrasebook entries={getTravelCards()} />
    <aside className="rounded-xl border border-orange-200 bg-orange-50 p-5 text-sm text-orange-950"><strong>Catch the price. Confirm the time.</strong><p className="mt-2">Read and hear amounts, dates and times, then try a short listening round.</p><Link className="mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-4" href="/tools/chinese-number-converter?mode=prices">Explore Chinese numbers &amp; listening →</Link></aside>
    <section className="travel-guide" aria-labelledby="travel-tips"><div><p className="travel-kicker">Before you go</p><h2 id="travel-tips">A few things worth knowing</h2></div><div>
      <details open><summary>Do I need to read Chinese?</summary><p>No. Each entry includes pinyin and an English meaning. Use “Show Chinese” to display an entry in large text for someone to read. Keep your destination’s Chinese address with you too.</p></details>
      <details><summary>How do I pronounce these phrases?</summary><p>The marks above pinyin vowels indicate tones. Word audio uses published synthesized pronunciation where available. Phrase audio is not included; an individual word recording is never used as a recording of a whole sentence. <Link href="/dictionary">Look up word pronunciation</Link>.</p></details>
      <details><summary>Does this work offline?</summary><p>This page needs an internet connection to load, and audio needs a connection to play. Saved favourites stay in this browser, but do not make the page available offline. Before a trip, print a copy or take screenshots of the phrases you need.</p></details>
      <details><summary>What should I learn first?</summary><p>Start with greetings, “I don’t understand”, asking the price and finding the restroom. Then choose the situation you expect to use most. Short practice sessions help you recall the words without looking.</p></details>
    </div></section>
    <noscript><p>All words and phrases are listed above. Enable JavaScript to use search, saved favourites, large-text display and practice.</p></noscript>
  </main></StudyPage>;
}
