import type { Metadata } from "next";
import Link from "next/link";
import { StudyPage } from "../components/study-shell";
import { PlacementEntry } from "../hsk-test-prep/placement-entry";
import { TestLandingEvents } from "../hsk-test-prep/test-landing-events";
import "../hsk-test-prep/test-pages.css";

export const metadata: Metadata = {
  title: "Free HSK Placement Test – Find Your Starting Level | HSKKit",
  description: "Take a free HSK placement test with 18–24 adaptive questions across four skills. Find a suggested Chinese learning level and practical next steps. No account needed.",
  alternates: { canonical: "/hsk-placement-test" },
  robots: { index: true, follow: true },
  openGraph: { title: "Free HSK Placement Test | HSKKit", description: "Find a practical starting level with an adaptive Chinese placement test across four skill areas.", url: "/hsk-placement-test", type: "website" },
};

export default function HskPlacementTestPage() {
  const schema = { "@context": "https://schema.org", "@type": "WebPage", name: "Free HSK placement test", url: "https://hskkit.com/hsk-placement-test", description: "An adaptive HSKKit diagnostic that suggests a Chinese learning starting level." };
  return <StudyPage><div className="test-page-surface"><main className="test-public-page test-placement-page">
    <TestLandingEvents page="placement_landing" />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <nav className="test-breadcrumb" aria-label="Breadcrumb"><Link href="/hsk-test-prep">Test center</Link><span aria-hidden="true">/</span><span aria-current="page">Placement</span></nav>
    <header className="test-placement-hero">
      <h1>Free HSK <span className="test-title-accent">placement test</span></h1>
      <p className="test-placement-lead">Find your starting point in Chinese.</p>
      <PlacementEntry />
      <Link href="/hsk-test-prep#choose-test" className="test-text-link test-known-level">Choose a level instead →</Link>
    </header>
    <details className="test-about"><summary>About this test</summary><div className="test-about-content">
    <p>Answer 18–24 adaptive questions across vocabulary, grammar, reading and listening. Check your volume before starting. Your answers are saved as you go.</p>
    <section className="test-public-section" aria-labelledby="placement-process-title"><div className="test-section-intro"><p className="test-eyebrow">A clear path forward</p><h2 id="placement-process-title">From a few questions to your next step</h2></div><ol className="test-process"><li><span aria-hidden="true">01</span><h3>Begin with a balanced set</h3><p>The first 12 questions sample skills and difficulty. The following questions adapt to your answers.</p></li><li><span aria-hidden="true">02</span><h3>See your learning suggestion</h3><p>Review your starting-level suggestion, the evidence behind it and any uncertainty.</p></li><li><span aria-hidden="true">03</span><h3>Start where it helps</h3><p>Follow the result’s next steps into suitable vocabulary and practice, then build your learning routine.</p></li></ol></section>

    <section className="test-public-section test-placement-outcomes" aria-labelledby="placement-result-title"><div><p className="test-eyebrow">Useful guidance</p><h2 id="placement-result-title">A starting point you can act on.</h2><p>Use placement when you’re new to HSK, returning after a break, or unsure where to begin. It helps you choose your next learning material.</p><p className="test-boundary-note">This is a learning-level suggestion, not an official HSK score or certificate. It does not assess speaking or writing, and a short diagnostic cannot measure every part of your Chinese ability.</p></div><ul><li><strong>A suggested learning level</strong><span>A practical place to begin, with uncertainty made clear.</span></li><li><strong>Evidence across four skills</strong><span>See what your answers tell you about your current learning needs.</span></li><li><strong>Connected next steps</strong><span>Move from the result to suitable HSKKit learning and practice.</span></li></ul></section>

    <section className="test-public-section test-faq" aria-labelledby="placement-faq-title"><div className="test-section-intro"><h2 id="placement-faq-title">HSK placement test questions</h2></div>
      <details><summary>Is the HSK placement test free?</summary><p>Yes. You can take the placement test without payment or creating an account. Retakes follow the current 24-hour cooldown after submission.</p></details>
      <details><summary>How many questions are there, and how long does it take?</summary><p>The test finishes in 18–24 questions, depending on your answers. There is no countdown timer. Allow time to read carefully and listen to the audio; the time you need depends on your pace.</p></details>
      <details><summary>Can I leave and continue later?</summary><p>Answers are saved as you go. Return in the same browser and choose Continue my test. An unfinished placement session remains available for seven days. Avoid clearing browser cookies while you are completing it.</p></details>
      <details><summary>Can I retake the placement test?</summary><p>You can retake it 24 hours after submitting your last result. Your result and the placement screen show the current availability. You can keep learning and practising during that time.</p></details>
      <details><summary>Does this tell me my official HSK exam level?</summary><p>No. Placement provides a starting-level suggestion for learning. It is not an official exam, a pass prediction or a certificate. <Link href="/hsk-3-0">Read the exam guide</Link> for the exam and syllabus context.</p></details>
      <details><summary>What if I already know which HSK level I’m studying?</summary><p>A level-specific skills check may be more useful. <Link href="/mock/basic" prefetch={false} data-test-entry="basic-skills">Choose HSK 1–6</Link>, or <Link href="/mock/advanced" prefetch={false} data-test-entry="advanced-skills">explore the unified Advanced 7–9 check</Link>.</p></details>
    </section>
    </div></details>
  </main></div></StudyPage>;
}
