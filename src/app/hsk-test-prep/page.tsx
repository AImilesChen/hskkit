import type { Metadata } from "next";
import Link from "next/link";
import { StudyPage } from "../components/study-shell";
import { TEST_LEVELS, testLevelHref } from "@/lib/tests/test-levels";
import { TestLandingEvents } from "./test-landing-events";
import "./test-pages.css";

export const metadata: Metadata = {
  title: "Free HSK Practice Tests by Level | HSKKit",
  description: "Choose HSK 1–6 or the unified Advanced 7–9 band. Preview real sample questions, check grammar, reading and listening, and get practical feedback. Free to take.",
  alternates: { canonical: "/hsk-test-prep" },
  robots: { index: true, follow: true },
  openGraph: { title: "Free HSK Practice Tests by Level | HSKKit", description: "Choose your level, explore sample questions and start a free skills check.", url: "/hsk-test-prep", type: "website" },
};

export default function TestPrepPage() {
  const advanced = TEST_LEVELS[6];
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Free HSK practice tests", url: "https://hskkit.com/hsk-test-prep", hasPart: TEST_LEVELS.map(level => ({ "@type": "WebPage", name: `${level.label} practice test`, url: `https://hskkit.com${testLevelHref(level)}` })) };
  return <StudyPage><div className="test-page-surface"><main className="test-public-page test-center-page">
    <TestLandingEvents page="test_center" />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <header className="test-public-hero">
      <nav className="test-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Practice tests</span></nav>
      <p className="test-eyebrow">A little practice. A clearer next step.</p>
      <h1>Free HSK <span className="test-title-accent">practice tests</span></h1>
      <p>Choose your level. Check your grammar, reading and listening.</p>
      <p className="test-free-note">Free to take · No account needed</p>
    </header>

    <section id="choose-test" className="test-public-section test-level-choice" aria-labelledby="choose-test-title">
      <div className="test-section-heading"><div><h2 id="choose-test-title">Choose your HSK level</h2><p>Preview the questions and format before starting.</p></div><Link href="/hsk-placement-test" className="test-text-link">Not sure of your level? Find it here →</Link></div>
      <div className="test-level-grid">{TEST_LEVELS.slice(0, 6).map(level => <article className="test-level-card" key={level.slug}>
        <p className="test-card-kicker">Level-specific skills check</p><h3>{level.label}</h3>
        <p>{level.lead}</p>
        <ul className="test-card-facts"><li>15 questions</li><li>{level.minutes} minutes</li></ul>
        <Link href={testLevelHref(level)} className="test-level-action" data-test-entry="level-introduction" data-test-level={level.level}>View {level.label} test <span aria-hidden="true">→</span></Link>
      </article>)}</div>
      <article className="test-advanced-strip"><div><p className="test-card-kicker">One unified advanced band</p><h3>Advanced HSK 7–9</h3><p>15 questions · 35 minutes · Grammar, reading and listening</p></div><Link href={testLevelHref(advanced)} className="test-secondary-link" data-test-entry="level-introduction" data-test-level="7-9">View Advanced 7–9 test →</Link></article>
    </section>

    <section className="test-placement-invitation" aria-labelledby="find-level-title"><div><p className="test-eyebrow">New to HSK or returning after a break?</p><h2 id="find-level-title">Find a starting point first.</h2><p>Our adaptive placement checks four skills and suggests where to begin.</p></div><Link href="/hsk-placement-test" className="test-primary-link" data-test-entry="placement-landing">Find my HSK level →</Link></section>

    <section className="test-public-section test-format-summary" aria-labelledby="format-title"><div><p className="test-eyebrow">Know what you’re taking</p><h2 id="format-title">A focused check, with useful feedback.</h2></div><div><p>Each level check includes five grammar, five reading and five listening tasks. Review your answers and see a breakdown by skill when you finish.</p><p className="test-boundary-note">These are independent HSKKit learning checks, not official scores or full-length HSK exam simulations. They do not assess speaking, writing or translation.</p></div></section>

    <section className="test-public-section test-faq" aria-labelledby="test-faq-title"><div className="test-section-intro"><h2 id="test-faq-title">Before you start</h2></div>
      <details><summary>Which test should I choose?</summary><p>Choose the level you’re studying for a focused skills check. If you don’t know where to begin, use <Link href="/hsk-placement-test">Find my HSK level</Link> for a starting-level suggestion.</p></details>
      <details><summary>Are the tests free?</summary><p>Yes. You can start as a guest without payment or registration. Keep using the same browser to return to your progress.</p></details>
      <details><summary>How is Advanced 7–9 different?</summary><p>It is one unified advanced band, with 15 tasks and a 35-minute limit. Its practice pool draws on source levels 7, 8 and 9.</p></details>
      <details><summary>Which HSK version does HSKKit use?</summary><p>Our current learning path follows the 2025 HSK exam syllabus vocabulary. Practice tasks are independent HSKKit study material. <Link href="/hsk-3-0">Read the exam guide.</Link></p></details>
    </section>
  </main></div></StudyPage>;
}

