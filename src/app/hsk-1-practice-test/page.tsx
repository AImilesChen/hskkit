import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";

export const metadata: Metadata = {
  title: "HSK 1 Practice Test Guide | HSKKit",
  description:
    "Prepare for beginner HSK 1 practice with sample questions, review tips, and a simple learning path for vocabulary and mistakes.",
  alternates: {
    canonical: "https://hskkit.com/hsk-1-practice-test",
  },
};

const sampleQuestions = [
  {
    prompt: "Choose the closest English meaning for 你好.",
    choices: ["A) Goodbye", "B) Hello", "C) Thank you", "D) Sorry"],
    answer: "B) Hello",
    note: "Start by checking whether you recognize the whole greeting before translating character by character.",
  },
  {
    prompt: "Which sentence matches the meaning: I am a student?",
    choices: ["A) 我是学生。", "B) 你好吗？", "C) 今天很热。"],
    answer: "A) 我是学生。",
    note: "Watch for familiar pronouns and the simple sentence pattern around 是.",
  },
  {
    prompt: "In 不喝水, what does 不 tell you?",
    choices: ["A) Positive", "B) Negative", "C) Question", "D) Past tense"],
    answer: "B) Negative",
    note: "Small function words can change the meaning of an otherwise familiar phrase.",
  },
];

const preparationTips = [
  "Keep a simple mistake note: missed word, misunderstood pattern, or rushed reading.",
  "Review missed questions the same day while the context is fresh.",
  "Mix vocabulary review with practice questions rather than doing one at a time.",
];

const studyLoop = [
  { step: "Learn vocabulary", detail: "Build recognition of common beginner words, their pinyin, and their everyday meanings.", href: "/hsk-1-vocabulary", label: "Open vocabulary" },
  { step: "Try practice questions", detail: "Use small question sets to see whether vocabulary and simple sentence patterns stay clear in context." },
  { step: "Review mistakes", detail: "Separate words you did not know from answers you missed because you read too quickly or confused a pattern." },
  { step: "Take a level test", detail: "Use a broader level check when you want a practical next-step recommendation.", href: "/hsk-level-test", label: "Open level test" },
];

export default function HSK1PracticeTestPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="section pt-20">
          <div className="section-inner">
            <span className="eyebrow">HSK 1 Practice Test</span>
            <h1 className="text-h1 max-sm:text-[32px] mb-6">Practice HSK 1 questions with a beginner plan</h1>
            <p className="text-body-lg text-ink-secondary max-w-[640px] mb-10">
              HSK 1 practice helps turn beginner vocabulary into decisions you can make inside short prompts. Start small, notice what you miss, and use each question to choose the next review step.
            </p>
            <div className="flex gap-4 flex-wrap">
              <a href="/hsk-1-vocabulary" className="btn btn-primary">Review HSK 1 vocabulary</a>
              <a href="/hsk-level-test" className="btn btn-secondary">Take a level test</a>
            </div>
          </div>
        </section>

        {/* Purpose */}
        <section className="section section-alt">
          <div className="section-inner">
            <span className="eyebrow">Purpose</span>
            <h2 className="text-h2 max-sm:text-[28px] mb-8">What HSK 1 practice helps with</h2>
            <div className="card-grid">
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Recall under context</h3>
                <p className="text-body text-ink-secondary">Practice pulling words from memory when you see them in a sentence.</p>
              </article>
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Reading attention</h3>
                <p className="text-body text-ink-secondary">Train yourself to read the whole sentence before choosing an answer.</p>
              </article>
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Review direction</h3>
                <p className="text-body text-ink-secondary">Each missed question points to a specific vocabulary area to review.</p>
              </article>
            </div>
          </div>
        </section>

        {/* Sample Questions */}
        <section className="section">
          <div className="section-inner">
            <span className="eyebrow">Sample Questions</span>
            <h2 className="text-h2 max-sm:text-[28px] mb-8">A small beginner practice set</h2>
            <p className="text-body text-ink-secondary mb-8">These examples are for study guidance. Try each prompt first, then compare your choice with the answer and review note.</p>
            <div className="grid grid-cols-1 gap-6">
              {sampleQuestions.map((q, i) => (
                <article className="card" key={i}>
                  <p className="text-caption text-accent font-semibold mb-2">Question {i + 1}</p>
                  <h3 className="text-h4 mb-4">{q.prompt}</h3>
                  <div className="space-y-2 mb-4">
                    {q.choices.map((choice) => (
                      <div key={choice} className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" />
                        <span className="text-body text-ink-secondary">{choice}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-success/10 border border-success/20 rounded-lg px-4 py-3">
                    <p className="text-body text-success font-medium">Answer: {q.answer}</p>
                    <p className="text-small text-ink-secondary mt-1">{q.note}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Preparation Tips */}
        <section className="section section-alt">
          <div className="section-inner">
            <span className="eyebrow">Preparation Tips</span>
            <h2 className="text-h2 max-sm:text-[28px] mb-8">Prepare without overcomplicating the first test</h2>
            <div className="max-w-[800px]">
              {preparationTips.map((tip) => (
                <div key={tip} className="flex items-start gap-4 py-4 border-b border-border">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A9B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <p className="text-body text-ink-secondary">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Study Loop */}
        <section className="section">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">A simple HSK 1 study loop</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {studyLoop.map((item, i) => (
                <div key={item.step} className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">{i + 1}</div>
                    {i < studyLoop.length - 1 && (
                      <div className="hidden lg:block flex-1 h-px bg-border" />
                    )}
                  </div>
                  <h3 className="text-h4 mb-2">{item.step}</h3>
                  <p className="text-body text-ink-secondary mb-3">{item.detail}</p>
                  {item.href && <a href={item.href} className="btn-ghost">{item.label}</a>}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
