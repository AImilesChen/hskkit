import type { Metadata } from "next";
import Link from "next/link";
import { StudyPage } from "@/app/components/study-shell";
import { strokeCounts } from "@/lib/strokes/domain";
import StrokeTool from "./stroke-tool";
import StrokeLessons from "./stroke-lessons";
export const metadata: Metadata = {
  title: "Chinese Stroke Order: Animated Guides & Writing Practice | HSKKit",
  description: "Look up Chinese character stroke order, play an animation, practise drawing each stroke and create a printable handwriting worksheet.",
  alternates: { canonical: "/tools/chinese-stroke-order" },
};
export default function StrokeOrderPage() {
  return <StudyPage><main className="stroke-page">
    <nav aria-label="Breadcrumb" className="stroke-breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/learn">Learning Guides</Link><span>/</span><span>Stroke Order</span></nav>
    <header className="stroke-hero"><div><p className="stroke-kicker">A little practice. A more familiar character.</p><h1>Chinese stroke order.<br/><span>See it. Write it.</span></h1><p>Watch how a character takes shape, follow each stroke, then take your practice onto paper.</p><div className="stroke-hero-tags"><span>Watch in purple</span><span>Follow in orange</span><span>Practise in green</span></div></div><div className="stroke-hero-character" aria-hidden="true"><span>一笔一画</span><strong>学</strong><small>One stroke at a time.</small></div></header>
    <StrokeTool/>
    <StrokeLessons/>
    <section className="stroke-faq" aria-labelledby="stroke-faq-heading"><p className="stroke-kicker">More answers</p><h2 id="stroke-faq-heading">Chinese stroke order: frequently asked questions.</h2><details><summary>Which characters are supported?</summary><p>This release provides {Object.keys(strokeCounts).length.toLocaleString("en-US")} character guides matched to HSKKit’s active character catalog. Some source forms differ in stroke count from our catalog and are withheld pending review. An unavailable character is shown honestly rather than replaced with another form.</p></details><details><summary>Does this support simplified and traditional Chinese?</summary><p>Coverage is by the exact character entered, not by an automatic script conversion. Many catalog entries are simplified. A traditional form is available only if it is in this release; the tool will not silently substitute a simplified form.</p></details><details><summary>Where is my practice stored?</summary><p>Recent characters and completed writing rounds are saved only in this browser when storage is available. They are not synced to your account and do not mark a vocabulary word as mastered. Clearing this site’s browser data removes them.</p></details><details><summary>Can I print a handwriting worksheet?</summary><p>Yes. Create a worksheet opens our existing tool with your character set filled in. Preview the sheet, then use its Print button. You can also choose Save as PDF in a supported browser’s print dialog.</p></details><details><summary>Why might a writing guide fail to load?</summary><p>A network interruption can stop a file from loading; use Try loading again. If a character is outside this release, choose a supported example. Animations and writing checks run on your device using files hosted by HSKKit.</p></details><details><summary>Are the stroke forms an official HSK requirement?</summary><p>No. These are learning references from the credited source, not an official HSK handwriting assessment. Printed shapes and accepted stroke forms can differ across regions. The entire source collection has not been manually reviewed by HSKKit.</p></details></section>
    <nav className="stroke-related" aria-label="Related character resources"><Link href="/blog/chinese-radicals-guide">Understand radicals →</Link><Link href="/blog/how-to-memorize-chinese-characters">Remember characters →</Link><Link href="/dictionary?mode=characters">Browse characters →</Link><Link href="/content-license">Data sources & licences →</Link></nav>
  </main></StudyPage>;
}
