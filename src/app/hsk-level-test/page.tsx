import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";

export const metadata: Metadata = {
  title: "HSK Level Test Guide | HSKKit",
  description:
    "Estimate your starting HSK study level with beginner self-check questions, a readiness checklist, and practical next steps.",
  alternates: {
    canonical: "https://hskkit.com/hsk-level-test",
  },
};

const selfCheckQuestions = [
  { prompt: "Can you recognize a basic greeting such as 你好 without pausing?", lookFor: "A confident yes suggests your first beginner vocabulary is becoming familiar." },
  { prompt: "Can you connect a simple word you see with its pinyin and meaning?", lookFor: "If one layer is missing, vocabulary review may help before harder practice." },
  { prompt: "Can you follow a short beginner sentence when the key words are familiar?", lookFor: "This checks whether word recognition is starting to work inside context." },
  { prompt: "Can you notice what caused a missed practice answer?", lookFor: "Separating a missing word from rushed reading gives a clearer next step." },
];

const readinessChecklist = [
  "I can recognize 50+ common words",
  "I can read short sentences with familiar vocabulary",
  "I can understand basic questions in context",
  "I can identify why I missed a practice question",
];

const confidenceSteps = [
  { title: "Low confidence", detail: "Start with HSK 1 vocabulary and build a small base of words, pinyin, and meanings.", href: "/hsk-1-vocabulary", label: "Start with vocabulary" },
  { title: "Some confidence", detail: "Try HSK 1 practice so familiar words appear inside short prompts and choices.", href: "/hsk-1-practice-test", label: "Try HSK 1 practice" },
  { title: "Ready for HSK 2", detail: "Use HSK 2 vocabulary and practice test guidance when HSK 1 questions feel manageable but longer beginner phrases still need work.", href: "/hsk-2-practice-test", label: "Try HSK 2 practice" },
  { title: "Moving toward HSK 3", detail: "Start HSK 3 vocabulary when HSK 2 practice feels manageable and longer sentences need more word coverage.", href: "/hsk-3-vocabulary", label: "Study HSK 3 vocabulary" },
  { title: "Testing HSK 3 readiness", detail: "Use an HSK 3 practice test guide when vocabulary study needs a realistic listening and reading check.", href: "/hsk-3-practice-test", label: "Try HSK 3 practice" },
  { title: "Moving toward HSK 4", detail: "Start HSK 4 vocabulary when HSK 3 practice is manageable and intermediate reading needs more abstract word coverage.", href: "/hsk-4-vocabulary", label: "Study HSK 4 vocabulary" },
  { title: "Testing HSK 4 readiness", detail: "Use an HSK 4 practice test guide when intermediate vocabulary needs a realistic listening, reading, and pacing check.", href: "/hsk-4-practice-test", label: "Try HSK 4 practice" },
  { title: "Moving toward HSK 5", detail: "Start HSK 5 vocabulary when HSK 4 practice is manageable and advanced reading needs more abstract word coverage.", href: "/hsk-5-vocabulary", label: "Study HSK 5 vocabulary" },
  { title: "Planning ahead", detail: "Read the HSK levels guide when you want to compare the wider study path.", href: "/hsk-levels", label: "Read HSK levels guide" },
  { title: "Framework questions", detail: "Use the New HSK 3.0 guide for separate context on newer HSK references.", href: "/new-hsk-3-0", label: "Read New HSK 3.0 guide" },
];

export default function HSKLevelTestPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="section pt-20">
          <div className="section-inner">
            <span className="eyebrow">HSK Level Test Guide</span>
            <h1 className="text-h1 max-sm:text-[32px] mb-6">Estimate your HSK starting point with a simple self-check</h1>
            <p className="text-body-lg text-ink-secondary max-w-[640px] mb-10">
              This page is a study guide, not an official placement test. Use it to judge your beginner confidence, choose a next page, and turn uncertainty into a short review plan.
            </p>
            <div className="flex gap-4 flex-wrap">
              <a href="/hsk-1-vocabulary" className="btn btn-primary">Start with HSK 1 vocabulary</a>
              <a href="/hsk-levels" className="btn btn-secondary">Compare HSK levels</a>
            </div>
          </div>
        </section>

        {/* How to Estimate */}
        <section className="section section-alt">
          <div className="section-inner">
            <span className="eyebrow">Estimate</span>
            <h2 className="text-h2 max-sm:text-[28px] mb-8">How a beginner can estimate their level</h2>
            <div className="card-grid">
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Check recognition</h3>
                <p className="text-body text-ink-secondary">Begin with what you can identify without heavy guessing: common words, simple greetings, and short beginner patterns.</p>
              </article>
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Test context</h3>
                <p className="text-body text-ink-secondary">Try reading short sentences where you know most words. Can you follow the meaning?</p>
              </article>
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Choose a next step</h3>
                <p className="text-body text-ink-secondary">Use your results to pick a vocabulary or practice page that matches your current level.</p>
              </article>
            </div>
          </div>
        </section>

        {/* Self-Check Questions */}
        <section className="section">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">Static questions to ask yourself</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {selfCheckQuestions.map((q) => (
                <article className="card" key={q.prompt}>
                  <p className="chinese-char text-chinese-display mb-2">{q.prompt.match(/[\u4e00-\u9fff]+/)?.[0] || "?"}</p>
                  <h3 className="text-h4 mb-3">{q.prompt}</h3>
                  <p className="text-body text-ink-secondary">{q.lookFor}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Readiness Checklist */}
        <section className="section section-alt">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">A simple level-readiness checklist</h2>
            <div className="max-w-[800px]">
              {readinessChecklist.map((item) => (
                <div key={item} className="flex items-start gap-4 py-4 border-b border-border">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A9B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <p className="text-body text-ink-secondary">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Choose by Confidence */}
        <section className="section">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">Choose the next page by confidence</h2>
            <div className="card-grid">
              {confidenceSteps.map((step) => (
                <article className="card" key={step.title}>
                  <h3 className="text-h3 max-sm:text-xl mb-3">{step.title}</h3>
                  <p className="text-body text-ink-secondary mb-4">{step.detail}</p>
                  <a href={step.href} className="btn-ghost">{step.label}</a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section section-alt">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] text-center mb-12">HSK level self-check questions</h2>
            <div className="faq-list">
              <FaqItem question="Is this an official HSK placement test?" answer="No. This is a static study guide for estimating a useful starting point. Use official or exam-specific resources when you need formal testing information." defaultOpen />
              <FaqItem question="What if my skills do not match one level neatly?" answer="That is common. Vocabulary recognition, listening comfort, reading speed, and test familiarity can develop at different rates." />
              <FaqItem question="Should a complete beginner begin with HSK 1?" answer="HSK 1 material is a practical starting place for a new learner who wants beginner vocabulary and short practice before comparing higher levels." />
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
