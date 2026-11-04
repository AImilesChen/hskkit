import type { Metadata } from "next";
import Link from "next/link";
import { StudyPage } from "../components/study-shell";
import { TestLandingEvents } from "./test-landing-events";
import "./test-pages.css";

export const metadata: Metadata = {
  title: "Free HSK Practice Tests & Chinese Level Checks | HSKKit",
  description: "Find your starting level with free HSK placement, or check grammar, reading and listening at HSK 1–6 and Advanced 7–9. Choose a test and begin.",
  alternates: { canonical: "/hsk-test-prep" },
  robots: { index: true, follow: true },
  openGraph: { title: "Free HSK Tests & Level Checks | HSKKit", description: "Find a starting level or check the skills you are studying. Free HSK placement and timed skills checks.", url: "/hsk-test-prep", type: "website" },
};

const choices = [
  { name: "Placement test", purpose: "Find a practical starting level", questions: "18–24 adaptive questions", skills: "Vocabulary, grammar, reading and listening", timing: "Work at your own pace", href: "/hsk-placement-test" },
  { name: "Basic skills check", purpose: "Check one level you are studying", questions: "15 questions", skills: "5 grammar, 5 reading, 5 listening", timing: "30-minute limit · HSK 1–6", href: "/mock/basic" },
  { name: "Advanced skills check", purpose: "Explore the unified advanced band", questions: "15 questions", skills: "5 grammar, 5 reading, 5 listening", timing: "35-minute limit · HSK 7–9", href: "/mock/advanced" },
];

export default function TestPrepPage() {
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Free HSK practice tests and level checks", url: "https://hskkit.com/hsk-test-prep", description: "Choose between HSK placement and level-specific skills checks." };
  return <StudyPage><div className="test-page-surface"><main className="test-public-page test-center-page">
    <TestLandingEvents page="test_center" />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <header className="test-public-hero">
      <nav className="test-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Test center</span></nav>
      <h1>Free HSK <span className="test-title-accent">practice tests</span></h1>
      <p>Find your starting level, or check the skills you’re studying.</p>
    </header>

    <section id="choose-test" aria-labelledby="choose-test-title" className="test-choice-section">
      <h2 id="choose-test-title" className="sr-only">Choose a test</h2>
      <div className="test-goal-grid">
        <article className="test-goal-card test-goal-placement"><p className="test-card-kicker">Not sure of your level?</p><h3>Placement test</h3><p>Find a starting point with an adaptive check across four skills.</p><ul className="test-card-facts"><li>18–24 questions</li><li>No timer</li></ul><Link href="/hsk-placement-test" className="test-primary-link" data-test-entry="placement-landing">Find my level</Link></article>
        <article className="test-goal-card test-goal-basic"><p className="test-card-kicker">Already studying a level?</p><h3>HSK 1–6 skills check</h3><p>Check your grammar, reading and listening at your chosen level.</p><ul className="test-card-facts"><li>15 questions</li><li>30 minutes</li></ul><Link href="/mock/basic" prefetch={false} className="test-secondary-link" data-test-entry="basic-skills">Choose my level</Link></article>
      </div>
      <aside className="test-advanced-strip"><div><h3>Advanced HSK 7–9</h3><p>15 questions · 35 minutes · One unified band</p></div><Link href="/mock/advanced" prefetch={false} className="test-text-link" data-test-entry="advanced-skills">Try advanced →</Link></aside>
    </section>

    <p className="test-center-note">Free to take. No account needed.</p>
    <details className="test-about"><summary>About these tests</summary><div className="test-about-content">
    <section className="test-public-section" aria-labelledby="compare-title"><div className="test-section-intro"><h2 id="compare-title">Which test is right for you?</h2></div><div className="test-comparison-grid">{choices.map(choice => <article key={choice.name}><h3>{choice.name}</h3><p>{choice.purpose}</p><dl><div><dt>Questions</dt><dd>{choice.questions}</dd></div><div><dt>Skills</dt><dd>{choice.skills}</dd></div><div><dt>Pace &amp; level</dt><dd>{choice.timing}</dd></div></dl><Link href={choice.href} prefetch={false} className="test-text-link" data-test-entry={choice.name === "Placement test" ? "placement-landing" : choice.name === "Basic skills check" ? "basic-skills" : "advanced-skills"}>Explore this test →</Link></article>)}</div><p className="test-boundary-note">These HSKKit learning checks are free to take. They provide learning feedback, not an official HSK score or a full-length exam simulation. The timed skills checks do not assess writing, translation or speaking.</p></section>

    <section className="test-public-section test-next-steps" aria-labelledby="after-title"><div><p className="test-eyebrow">Turn feedback into practice</p><h2 id="after-title">Know what to work on next.</h2><p>Use your result to choose a study level, review answers and open focused practice. You can also explore the vocabulary and grammar before taking a test.</p></div><nav aria-label="Prepare for a skills check"><Link href="/levels">Explore HSK levels →</Link><Link href="/grammar">Practise grammar →</Link><Link href="/listen">Practise listening →</Link><Link href="/hsk-3-0">Read the HSK exam guide →</Link></nav></section>

    <section className="test-public-section test-faq" aria-labelledby="test-faq-title"><div className="test-section-intro"><h2 id="test-faq-title">Before you choose a test</h2></div>
      <details><summary>Should I take placement or a skills check?</summary><p>Choose placement if you need a suggested starting level. Choose a skills check if you already know the level you want to practise and would like feedback on grammar, reading and listening.</p></details>
      <details><summary>Are these official HSK mock exams?</summary><p>No. These are independent HSKKit learning checks. The timed checks contain 15 tasks, not the complete question set or skill coverage of an official HSK examination.</p></details>
      <details><summary>Which version of HSK does HSKKit use?</summary><p>The current learning path uses the 2025 HSK exam syllabus vocabulary. Advanced 7–9 is treated as one band. The diagnostic tasks are HSKKit-authored learning materials. <Link href="/hsk-3-0">Read our exam guide.</Link></p></details>
      <details><summary>Can I start without an account?</summary><p>Yes. You can begin as a guest. Keep using the same browser to return to saved progress; signing in is optional for account-based continuity.</p></details>
    </section>
    </div></details>
  </main></div></StudyPage>;
}
