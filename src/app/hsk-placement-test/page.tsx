import type { Metadata } from "next";
import Link from "next/link";
import { StudyPage } from "../components/study-shell";
import { PlacementEntry } from "../hsk-test-prep/placement-entry";
import { TestLandingEvents } from "../hsk-test-prep/test-landing-events";
import "../hsk-test-prep/test-pages.css";

export const metadata: Metadata = {
  title: "Free HSK Placement Test – Find Your Starting Level | HSKKit",
  description: "Find your Chinese learning starting point with 18–24 adaptive questions across vocabulary, grammar, reading and listening. Free, with no account required.",
  alternates: { canonical: "/hsk-placement-test" }, robots: { index: true, follow: true },
  openGraph: { title: "Find Your HSK Level | HSKKit", description: "An adaptive learning diagnostic with a practical next step.", url: "/hsk-placement-test", type: "website" },
};
const skills = [
  { name: "Vocabulary", detail: "Recognise words and their meanings." },
  { name: "Grammar", detail: "Understand how a sentence works." },
  { name: "Reading", detail: "Find meaning in a short text." },
  { name: "Listening", detail: "Follow information in a recording." },
];
export default function HskPlacementTestPage() {
  const schema = { "@context": "https://schema.org", "@type": "WebPage", name: "Free HSK placement test", url: "https://hskkit.com/hsk-placement-test", description: "An adaptive learning diagnostic that suggests a starting level." };
  return <StudyPage><div className="test-page-surface"><main className="test-public-page test-placement-page">
    <TestLandingEvents page="placement_landing" />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <nav className="test-breadcrumb" aria-label="Breadcrumb"><Link href="/hsk-test-prep">Practice tests</Link><span aria-hidden="true">/</span><span aria-current="page">Find my HSK level</span></nav>
    <header className="test-placement-hero" id="placement-start"><div>
      <p className="test-eyebrow">Free HSK placement test</p>
      <h1>Find your <span className="test-title-accent">starting point.</span></h1>
      <p className="test-placement-lead">Not sure which HSK level to study? Answer a few questions and get a practical place to begin.</p>
      <PlacementEntry />
      <Link href="/hsk-test-prep#choose-test" className="test-text-link test-known-level">Know your level? Choose a practice test →</Link>
    </div><aside className="test-skill-snapshot" aria-labelledby="skills-preview-title"><p className="test-eyebrow">Four skills. One starting suggestion.</p><h2 id="skills-preview-title">A broader picture of your Chinese</h2><ul>{skills.map(skill => <li key={skill.name}><strong>{skill.name}</strong><span>{skill.detail}</span></li>)}</ul></aside></header>

    <section className="test-public-section" aria-labelledby="placement-audience-title"><div className="test-section-intro"><h2 id="placement-audience-title">Start where it makes sense for you.</h2></div><div className="test-three-column">
      <article><h3>New to HSK?</h3><p>Get a learning-level suggestion before choosing your first word list.</p></article>
      <article><h3>Coming back to Chinese?</h3><p>Check what still feels familiar and where you may need a refresh.</p></article>
      <article><h3>Between two levels?</h3><p>Use the evidence from your answers to choose a sensible next step.</p></article>
    </div></section>

    <section className="test-public-section test-process-section" aria-labelledby="placement-process-title"><div className="test-section-intro"><p className="test-eyebrow">How it works</p><h2 id="placement-process-title">From questions to a learning plan.</h2></div><ol className="test-process">
      <li><span aria-hidden="true">01</span><h3>Answer at your pace</h3><p>The first 12 questions sample skills and difficulty. Follow-up questions adapt to your answers, finishing in 18–24 questions.</p></li>
      <li><span aria-hidden="true">02</span><h3>Understand your suggestion</h3><p>See a starting level, the evidence behind it and any uncertainty.</p></li>
      <li><span aria-hidden="true">03</span><h3>Take your next step</h3><p>Follow the result into suitable vocabulary and focused practice.</p></li>
    </ol></section>

    <section className="test-public-section test-result-explainer" aria-labelledby="placement-result-title"><div><p className="test-eyebrow">What you’ll get</p><h2 id="placement-result-title">More than a level label.</h2><p>A useful starting point, with context you can act on.</p></div><ul>
      <li><strong>A suggested learning level</strong><span>Choose study material with a clearer idea of where to begin.</span></li>
      <li><strong>Evidence across four skills</strong><span>Understand what your answers suggest about your current needs.</span></li>
      <li><strong>Connected learning choices</strong><span>Move into suitable HSKKit vocabulary and practice.</span></li>
    </ul></section>
    <p className="test-boundary-note">Placement gives learning guidance, not an official HSK score or certificate. Speaking and writing are not assessed. A short diagnostic cannot measure every part of your Chinese.</p>

    <section className="test-public-section test-faq" aria-labelledby="placement-faq-title"><div className="test-section-intro"><h2 id="placement-faq-title">Your placement questions</h2></div>
      <details><summary>Is the HSK placement test free?</summary><p>Yes. You can take it without payment or creating an account.</p></details>
      <details><summary>How long does it take?</summary><p>It finishes in 18–24 questions, depending on your answers. There is no countdown timer. Allow time to read carefully and listen to some questions; check your volume before starting.</p></details>
      <details><summary>Can I leave and continue later?</summary><p>Answers are saved as you go. Return in the same browser and choose Continue my test. An unfinished session remains available for seven days. Avoid clearing browser cookies while completing it.</p></details>
      <details><summary>Can I retake it?</summary><p>You can retake it 24 hours after submitting your last result. Your result and the placement screen show current availability.</p></details>
      <details><summary>What if I already know my HSK level?</summary><p><Link href="/hsk-test-prep#choose-test">Choose a level-specific practice test</Link> to check grammar, reading and listening at the level you’re studying.</p></details>
    </section>
    <section className="test-bottom-cta"><div><h2>Ready for a clearer starting point?</h2><p>Free to take. No account needed.</p></div><a href="#placement-start" className="test-primary-link">Go to test start ↑</a></section>
  </main></div></StudyPage>;
}

