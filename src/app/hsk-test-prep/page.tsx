import type { Metadata } from "next";
import Link from "next/link";
import { StudyPage } from "../components/study-shell";
import { TEST_LEVELS, testLevelHref } from "@/lib/tests/test-levels";
import { TestLandingEvents } from "./test-landing-events";
import "./test-pages.css";
import "../components/mock-offer.css";
import { MockPaperLinks } from "../components/mock-paper-links";
import { FREE_MOCK_COUNT, TOTAL_MOCK_COUNT, EXTRA_MOCK_COUNT, MOCK_LEVEL_RANGE, MOCK_LEVELS, mockPaperHref } from "@/lib/formal-exams/offer";

export const metadata: Metadata = {
  title: "HSK Mock Exams & Free Skills Checks by Level | HSKKit",
  description: `Try ${FREE_MOCK_COUNT} free complete HSK mock papers or unlock all ${TOTAL_MOCK_COUNT} across ${MOCK_LEVEL_RANGE} with Pro. Choose a timed paper or a free 15-question skills check.`,
  alternates: { canonical: "/hsk-test-prep" },
  robots: { index: true, follow: true },
  openGraph: { title: "HSK Mock Exams & Free Skills Checks by Level | HSKKit", description: `Explore ${FREE_MOCK_COUNT} free A papers, ${TOTAL_MOCK_COUNT} complete papers with Pro, and free quick skills checks.`, url: "/hsk-test-prep", type: "website" },
};

export default function TestPrepPage() {
  const advanced = TEST_LEVELS[6];
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: "HSK mock exams and skills checks", url: "https://hskkit.com/hsk-test-prep", hasPart: [...MOCK_LEVELS.map(({ level }) => ({ "@type": "WebPage", name: `HSK ${level} complete mock papers`, url: `https://hskkit.com${mockPaperHref(level)}` })), ...TEST_LEVELS.map(level => ({ "@type": "WebPage", name: `${level.label} skills check`, url: `https://hskkit.com${testLevelHref(level)}` }))] };
  return <StudyPage><div className="test-page-surface"><main className="test-public-page test-center-page">
    <TestLandingEvents page="test_center" />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <header className="test-public-hero">
      <nav className="test-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Practice tests</span></nav>
      <p className="test-eyebrow">A little practice. A clearer next step.</p>
      <h1>HSK mock exams <span className="test-title-accent">and skills checks</span></h1>
      <p>Take a complete timed paper, or start with a short check of your grammar, reading and listening.</p>
      <p className="test-free-note">Paper A and quick skills checks are free · No account needed</p>
    </header>

    <section id="full-length-exams" className="test-public-section" aria-labelledby="full-mock-title"><div className="test-section-heading"><div><p className="test-eyebrow">Complete papers · {MOCK_LEVEL_RANGE}</p><h2 id="full-mock-title">One level. Three complete papers.</h2><p>{FREE_MOCK_COUNT} free A papers. Pro includes all {TOTAL_MOCK_COUNT}, with {EXTRA_MOCK_COUNT} additional B/C papers for fresh practice. Choose your level below.</p></div><Link href="/pricing#plans" className="test-text-link">Compare Pro →</Link></div><MockPaperLinks/></section>
    <section className="test-placement-invitation" aria-labelledby="ap-chinese-entry-title"><div><p className="test-card-kicker">AP Chinese · 2027 format practice</p><h2 id="ap-chinese-entry-title">Bring all four skills together.</h2><p>Three complete AP Chinese papers. Try A free; Pro adds B and C. Includes speaking, writing, 25 listening and 30 reading questions.</p></div><Link href="/ap-chinese-practice-test" className="test-primary-link">Explore AP Chinese →</Link></section>
    <section id="choose-test" className="test-public-section test-level-choice" aria-labelledby="choose-test-title">
      <div className="test-section-heading"><div><h2 id="choose-test-title">Quick skills checks · 15 questions</h2><p>Choose your level for a shorter practice session.</p></div><Link href="/hsk-placement-test" className="test-text-link">Not sure of your level? Find it here →</Link></div>
      <div className="test-level-grid">{TEST_LEVELS.slice(0, 6).map(level => <article className="test-level-card" key={level.slug}>
        <p className="test-card-kicker">Level-specific skills check</p><h3>{level.label}</h3>
        <p>{level.lead}</p>
        <ul className="test-card-facts"><li>15 questions</li><li>{level.minutes} minutes</li></ul>
        <Link href={testLevelHref(level)} className="test-level-action" data-test-entry="level-introduction" data-test-level={level.level}>View {level.label} test <span aria-hidden="true">→</span></Link>
      </article>)}</div>
      <article className="test-advanced-strip"><div><p className="test-card-kicker">One unified advanced band</p><h3>Advanced HSK 7–9</h3><p>15 questions · 35 minutes · Grammar, reading and listening</p></div><Link href={testLevelHref(advanced)} className="test-secondary-link" data-test-entry="level-introduction" data-test-level="7-9">View Advanced 7–9 test →</Link></article>
    </section>

    <section className="test-placement-invitation" aria-labelledby="find-level-title"><div><p className="test-eyebrow">New to HSK or returning after a break?</p><h2 id="find-level-title">Find a starting point first.</h2><p>Our adaptive placement checks four skills and suggests where to begin.</p></div><Link href="/hsk-placement-test" className="test-primary-link" data-test-entry="placement-landing">Find my HSK level →</Link></section>

    <section className="test-public-section test-format-summary" aria-labelledby="format-title"><div><p className="test-eyebrow">About the quick skills checks</p><h2 id="format-title">A focused check, with useful feedback.</h2></div><div><p>Each 15-question check includes five grammar, five reading and five listening tasks. Review your answers and see a breakdown by skill when you finish.</p><p className="test-boundary-note">Quick skills checks are independent HSKKit learning checks, not full-length mock papers or official scores. They do not assess speaking, writing or translation. For a complete timed paper, choose a level in the mock exams section above.</p></div></section>

    <section className="test-public-section test-faq" aria-labelledby="test-faq-title"><div className="test-section-intro"><h2 id="test-faq-title">Before you start</h2></div>
      <details><summary>Which test should I choose?</summary><p>Choose the level you’re studying for a focused skills check. If you don’t know where to begin, use <Link href="/hsk-placement-test">Find my HSK level</Link> for a starting-level suggestion.</p></details>
      <details><summary>Are the tests free?</summary><p>The 15-question skills checks and Paper A at each level are free, with no account required. Complete Papers B and C require Pro access. Keep using the same browser to return to your saved attempt.</p></details>
      <details><summary>How is Advanced 7–9 different?</summary><p>It is one unified advanced band, with 15 tasks and a 35-minute limit. Its practice pool draws on source levels 7, 8 and 9.</p></details>
      <details><summary>Which HSK version does HSKKit use?</summary><p>Our current learning path follows the 2025 HSK exam syllabus vocabulary. Practice tasks are independent HSKKit study material. <Link href="/hsk-3-0">Read the exam guide.</Link></p></details>
    </section>
  </main></div></StudyPage>;
}

