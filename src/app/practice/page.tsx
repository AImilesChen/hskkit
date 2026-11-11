import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";
import PracticeSelectorClient from "./practice-selector-client";
import PracticeGuidance from "./practice-guidance";
import { practiceHubExamples } from "@/lib/practice/hub-examples";
import styles from "./practice-hub.module.css";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "HSK Practice Online by Level & Skill | HSKKit",
  description: "Practise HSK vocabulary, grammar, reading and listening by level. Complete eight-question sessions with immediate feedback and answer explanations.",
  alternates: { canonical: "/practice" },
  robots: { index: true, follow: true },
};

export default function PracticeSelector() {
  const examples = practiceHubExamples();
  return <>
    <SiteHeader />
    <main className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>HSK PRACTICE · LEVELS 1–6 &amp; 7–9</p>
          <h1>HSK practice,<br />one skill at a time.</h1>
          <p className={styles.heroCopy}>Choose your level and practise vocabulary, grammar, reading or listening. Answer eight questions, check the explanations and revisit your mistakes.</p>
          <ul className={styles.facts} aria-label="Practice features">
            <li><span aria-hidden="true">✓</span>8 questions per session</li>
            <li><span aria-hidden="true">✓</span>Immediate feedback</li>
            <li><span aria-hidden="true">✓</span>Answer explanations</li>
          </ul>
        </div>
        <aside className={styles.heroAside} aria-label="Return to your learning">
          <strong>A little practice. A clearer next step.</strong>
          <p>Keep your focus small, then return to the parts you found difficult.</p>
          <Link href="/mistakes" className={styles.textLink}>Revisit your mistakes <span aria-hidden="true">→</span></Link>
        </aside>
      </header>
      <PracticeSelectorClient examples={examples} />
      <PracticeGuidance listening={examples[1].listening} vocabulary={examples[1].vocabulary} reading={examples[1].reading} />
    </main>
    <SiteFooter />
  </>;
}
