import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import { GRAMMAR_CURRICULUM } from "@/lib/learning/step7-content";
import GrammarCatalog from "./grammar-catalog";

export const metadata: Metadata = { title: "HSK 3.0 Grammar | HSKKit", description: "Focused grammar lessons, examples and saved practice for HSK Levels 1–6 and the HSK 7–9 advanced band.", alternates: { canonical: "/grammar" } };
export default function GrammarIndex() {
  return <><SiteHeader/><main className="learn step7-page grammar-page"><header><span className="eyebrow">Grammar practice · {GRAMMAR_CURRICULUM.length} lessons</span><h1>Grammar you can use</h1><p>Choose a level, understand when a pattern works, then answer two questions and revisit anything you miss.</p><nav aria-label="Learning navigation"><Link href="/reading">Reading</Link><Link href="/practice">Practice</Link><Link href="/mistakes?skill=grammar">Grammar mistakes</Link><Link href="/today">Today</Link></nav></header><p className="step7-alert warning"><strong>Coverage:</strong> this is a growing collection of selected HSK 3.0 learning patterns, not a complete official grammar syllabus. HSK 7–9 is shown as one advanced band.</p><GrammarCatalog lessons={GRAMMAR_CURRICULUM}/></main><SiteFooter/></>;
}
