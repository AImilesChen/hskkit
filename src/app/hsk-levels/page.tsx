import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";

export const metadata: Metadata = {
  title: "HSK Levels Explained | HSKKit",
  description:
    "Compare HSK 1 to HSK 6 and find a practical beginner path for Chinese vocabulary, practice tests, and level checking.",
  alternates: {
    canonical: "https://hskkit.com/hsk-levels",
  },
};

const levels = [
  { level: "HSK 1", stage: "First steps", overview: "A starting point for learners building recognition of essential words, short phrases, and very simple everyday exchanges.", practice: "Focus on pronunciation, pinyin support, basic characters, and quick recall of beginner vocabulary.", color: "#4A9B6B" },
  { level: "HSK 2", stage: "Early routine", overview: "Extends beginner study into more familiar daily situations and a wider set of sentence patterns.", practice: "Review common question forms, time and quantity expressions, and short listening or reading tasks.", color: "#5BA88A" },
  { level: "HSK 3", stage: "Developing independence", overview: "Moves beyond survival phrases toward handling a broader range of personal, study, travel, and daily-life topics.", practice: "Strengthen grammar control, read longer passages carefully, and notice gaps that slow comprehension.", color: "#D4A03E" },
  { level: "HSK 4", stage: "Broader communication", overview: "Represents a more capable intermediate stage with more connected language and less reliance on isolated phrases.", practice: "Work on speed, context clues, longer answers, and vocabulary review across related topics.", color: "#D4634E" },
  { level: "HSK 5", stage: "Advanced study", overview: "Requires comfort with richer vocabulary, denser reading, and more sustained understanding across topics.", practice: "Use longer texts and audio to test comprehension, then review unfamiliar words in context.", color: "#B85440" },
  { level: "HSK 6", stage: "High proficiency", overview: "Targets learners working with complex language, nuanced meaning, and demanding comprehension tasks.", practice: "Prioritize accuracy under pressure, careful reading, and active review of weak areas.", color: "#8B3A3A" },
];

const beginnerSteps = [
  "Start with HSK 1 vocabulary until the most common beginner words feel familiar in both sound and meaning.",
  "Use short practice sessions to connect pinyin, characters, and English meaning instead of memorizing one layer alone.",
  "Take a level check when you need a rough starting point, then use practice results to choose what to review next.",
  "Move into HSK 1 practice questions early so vocabulary review supports real reading and test-style decisions.",
];

const relatedPages = [
  { title: "Check your level", text: "Use a level test page when you want a starting recommendation before choosing study material.", href: "/hsk-level-test", label: "Open HSK level test" },
  { title: "Practice HSK 1", text: "Work through beginner-style questions and see which topics need review after a practice attempt.", href: "/hsk-1-practice-test", label: "Open HSK 1 practice test" },
  { title: "Review vocabulary", text: "Start with HSK 1 words when your foundation needs clearer recall before longer practice.", href: "/hsk-1-vocabulary", label: "Open HSK 1 vocabulary" },
  { title: "Grow into HSK 2", text: "Move into beginner-plus vocabulary when HSK 1 words feel familiar and short phrases are easier to follow.", href: "/hsk-2-vocabulary", label: "Open HSK 2 vocabulary" },
  { title: "Practice HSK 2", text: "Use a practice test guide when you want HSK 2 mock test structure, sample-test methods, and mistake review advice.", href: "/hsk-2-practice-test", label: "Open HSK 2 practice test" },
  { title: "Build HSK 3 vocabulary", text: "Start HSK 3 words when HSK 2 practice is manageable and longer beginner-intermediate sentences need clearer vocabulary.", href: "/hsk-3-vocabulary", label: "Open HSK 3 vocabulary" },
  { title: "Practice HSK 3", text: "Try HSK 3 mock test guidance when vocabulary, reading, and listening need a more realistic practice check.", href: "/hsk-3-practice-test", label: "Open HSK 3 practice test" },
  { title: "Build HSK 4 vocabulary", text: "Move into HSK 4 words when HSK 3 practice is manageable and intermediate reading needs broader vocabulary.", href: "/hsk-4-vocabulary", label: "Open HSK 4 vocabulary" },
  { title: "Practice HSK 4", text: "Use HSK 4 mock test guidance when vocabulary, listening, reading, and pacing need a more intermediate check.", href: "/hsk-4-practice-test", label: "Open HSK 4 practice test" },
  { title: "Build HSK 5 vocabulary", text: "Move into HSK 5 words when HSK 4 practice is manageable and advanced reading needs broader word coverage.", href: "/hsk-5-vocabulary", label: "Open HSK 5 vocabulary" },
  { title: "Read about HSK 3.0", text: "For newer HSK framework questions and transition context, use the dedicated guide instead of assuming every resource uses the same level structure.", href: "/new-hsk-3-0", label: "Open New HSK 3.0 guide" },
];

export default function HSKLevelsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="section pt-20">
          <div className="section-inner">
            <span className="eyebrow">HSK Levels</span>
            <h1 className="text-h1 max-sm:text-[32px] mb-6">HSK levels explained for Chinese learners</h1>
            <p className="text-body-lg text-ink-secondary max-w-[640px] mb-10">
              HSK levels help organize Chinese study from beginner foundations to advanced comprehension. Use them as a practical map: check your starting point, build vocabulary and reading habits, and review the skills your next level expects.
            </p>
            <div className="flex gap-4 flex-wrap">
              <a href="/hsk-level-test" className="btn btn-primary">Try the HSK level test</a>
              <a href="/hsk-1-vocabulary" className="btn btn-secondary">Study HSK 1 vocabulary</a>
            </div>
          </div>
        </section>

        {/* How to Use */}
        <section className="section section-alt">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">How to use HSK levels</h2>
            <div className="card-grid">
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Choose a starting point</h3>
                <p className="text-body text-ink-secondary">Pick a level that matches your current comfort with Chinese characters and basic sentences.</p>
              </article>
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Build connected skills</h3>
                <p className="text-body text-ink-secondary">Work on vocabulary, reading, and listening together rather than in isolation.</p>
              </article>
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Review by evidence</h3>
                <p className="text-body text-ink-secondary">Use practice results to decide when you&apos;re ready to move to the next level.</p>
              </article>
            </div>
          </div>
        </section>

        {/* HSK 1-6 Cards */}
        <section className="section">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">HSK 1 to HSK 6 at a glance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {levels.map((item) => (
                <article key={item.level} className="card border-l-4" style={{ borderLeftColor: item.color }}>
                  <span className="eyebrow text-xs">{item.stage}</span>
                  <h3 className="text-h3 max-sm:text-xl mb-3">{item.level}</h3>
                  <p className="text-body text-ink-secondary mb-4">{item.overview}</p>
                  <p className="text-small text-ink-muted bg-primary-light px-3 py-2 rounded-md">{item.practice}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Beginner Path */}
        <section className="section section-alt">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">A simple path for a new learner</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {beginnerSteps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">{i + 1}</div>
                  <p className="text-body text-ink-secondary">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related Pages */}
        <section className="section">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">Continue with a focused page</h2>
            <div className="card-grid">
              {relatedPages.map((item) => (
                <article className="card" key={item.title}>
                  <h3 className="text-h3 max-sm:text-xl mb-3">{item.title}</h3>
                  <p className="text-body text-ink-secondary mb-4">{item.text}</p>
                  <a href={item.href} className="btn-ghost">{item.label}</a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section section-alt">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] text-center mb-12">Common HSK level questions</h2>
            <div className="faq-list">
              <FaqItem question="Which HSK level should a beginner start with?" answer="HSK 1 is a sensible starting point for a new learner. If you have already studied Chinese, a level check and a short practice session can help you avoid reviewing material that is too easy." defaultOpen />
              <FaqItem question="Does one HSK level describe every Chinese skill?" answer="Not perfectly. Learners often progress unevenly across vocabulary, listening, reading, character recognition, and test familiarity. Use the level as a guide and let practice results shape review." />
              <FaqItem question="Should I study HSK 3.0 separately?" answer="Check the resource you are using and the exam or study goal you care about. For HSKKit context, start with the New HSK 3.0 guide before making strong assumptions about newer level references." />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function FaqItem({ question, answer, defaultOpen = false }: { question: string; answer: string; defaultOpen?: boolean }) {
  return (
    <details className="faq-item" open={defaultOpen}>
      <summary className="faq-question list-none">
        <span>{question}</span>
        <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="faq-answer">{answer}</div>
    </details>
  );
}
