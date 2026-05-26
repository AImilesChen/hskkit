"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";

/* ────────── 8-question self-check ────────── */
const questions = [
  {
    q: "What does 你好 mean?",
    options: ["Goodbye", "Hello", "Thank you", "Sorry"],
    correct: 1, // Hello
    level: 1,
  },
  {
    q: "Which word means 'water'?",
    options: ["火 (huǒ)", "水 (shuǐ)", "木 (mù)", "土 (tǔ)"],
    correct: 1,
    level: 1,
  },
  {
    q: "Choose the correct sentence: 'I like to drink tea.'",
    options: [
      "我喜欢喝茶。",
      "我不喜欢吃茶。",
      "我喜欢吃茶。",
      "我不喜欢喝茶。",
    ],
    correct: 0,
    level: 2,
  },
  {
    q: "What does 昨天 mean?",
    options: ["Today", "Tomorrow", "Yesterday", "Next week"],
    correct: 2,
    level: 2,
  },
  {
    q: "Which sentence means 'He has been to Beijing before'?",
    options: [
      "他没去过北京。",
      "他去过北京。",
      "他要去北京。",
      "他在北京。",
    ],
    correct: 1,
    level: 3,
  },
  {
    q: "What does 方便 mean in this sentence: '你什么时候方便?'",
    options: ["Convenient / available", "Convenient store", "Direction", "Method"],
    correct: 0,
    level: 3,
  },
  {
    q: "Choose the word that means 'to postpone / delay':",
    options: ["提前 (tíqián)", "推迟 (tuīchí)", "准时 (zhǔnshí)", "按时 (ànshí)"],
    correct: 1,
    level: 4,
  },
  {
    q: "What does 尽管 mean?",
    options: ["Because", "Although / despite", "Therefore", "However"],
    correct: 1,
    level: 4,
  },
];

/* ────────── Results data ────────── */
const resultCards = [
  {
    maxScore: 2,
    level: "HSK 1",
    title: "Start with HSK 1",
    desc: "You recognize some basic words, but building a solid foundation will help you progress faster.",
    href: "/hsk-1-vocabulary",
    label: "Study HSK 1 Vocabulary",
  },
  {
    maxScore: 4,
    level: "HSK 2",
    title: "Build on HSK 2",
    desc: "You know beginner basics. Time to expand into elementary sentences and daily topics.",
    href: "/hsk-2-vocabulary",
    label: "Study HSK 2 Vocabulary",
  },
  {
    maxScore: 6,
    level: "HSK 3",
    title: "Move into HSK 3",
    desc: "You handle elementary Chinese well. Intermediate vocabulary and longer texts are your next step.",
    href: "/hsk-3-vocabulary",
    label: "Study HSK 3 Vocabulary",
  },
  {
    maxScore: 8,
    level: "HSK 4+",
    title: "Challenge HSK 4–5",
    desc: "You have a strong intermediate base. Advanced vocabulary and complex reading await.",
    href: "/hsk-4-vocabulary",
    label: "Study HSK 4 Vocabulary",
  },
];

/* ────────── FAQ Schema ────────── */
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is this an official HSK placement test?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. This is a self-assessment tool for estimating a useful starting point. Use official or exam-specific resources when you need formal testing information.",
      },
    },
    {
      "@type": "Question",
      name: "What if my skills do not match one level neatly?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "That is common. Vocabulary recognition, listening comfort, reading speed, and test familiarity can develop at different rates.",
      },
    },
    {
      "@type": "Question",
      name: "Should a complete beginner begin with HSK 1?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "HSK 1 material is a practical starting place for a new learner who wants beginner vocabulary and short practice before comparing higher levels.",
      },
    },
  ],
};

export default function HSKLevelTestPage() {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (idx: number) => {
    const next = [...answers, idx];
    setAnswers(next);
    if (next.length >= questions.length) {
      setShowResult(true);
    } else {
      setCurrent(current + 1);
    }
  };

  const correctCount = answers.filter((a, i) => a === questions[i].correct).length;

  const resultCard = resultCards.find((r) => correctCount <= r.maxScore) || resultCards[resultCards.length - 1];

  const progress = Math.round(((answers.length) / questions.length) * 100);

  return (
    <>
      <Script id="faq-schema" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(faqSchema)}
      </Script>

      {/* ─── Nav ─── */}
      <SiteHeader />

      <main className="min-h-[60vh]">
        {/* ─── Intro ─── */}
        {!started && !showResult && (
          <section className="py-20 max-sm:py-12">
            <div className="max-w-[720px] mx-auto px-8 text-center max-sm:px-4">
              <h1 className="text-[48px] font-bold leading-[1.1] tracking-tight text-[#0F172A] mb-5 max-sm:text-[32px]">
                Quick HSK Level Check
              </h1>
              <p className="text-lg leading-relaxed text-[#64748B] mb-8">
                8 short questions. No timer. Get a suggested HSK level and a personalized next step.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setStarted(true)}
                  className="inline-flex items-center justify-center gap-2 bg-[#2563EB] text-white px-8 py-4 rounded-full text-lg font-semibold border-none cursor-pointer transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#1D4ED8] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:scale-[0.98]"
                >
                  Start the Level Check
                </button>
                <Link
                  href="/hsk-levels"
                  className="inline-flex items-center justify-center gap-2 bg-transparent text-[#2563EB] px-8 py-4 rounded-full text-lg font-semibold no-underline border-[1.5px] border-[#2563EB] transition-all duration-200 hover:bg-[#EFF6FF]"
                >
                  Compare HSK Levels
                </Link>
              </div>
              <p className="text-[13px] font-medium text-[#64748B] mt-6">
                This is a self-assessment tool, not an official HSK test.
              </p>
            </div>
          </section>
        )}

        {/* ─── Quiz ─── */}
        {started && !showResult && (
          <section className="py-16 max-sm:py-10">
            <div className="max-w-[640px] mx-auto px-8 max-sm:px-4">
              {/* Progress */}
              <div className="mb-8">
                <div className="flex justify-between text-sm font-medium text-[#64748B] mb-2">
                  <span>Question {current + 1} of {questions.length}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2563EB] rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <h2 className="text-[24px] font-semibold leading-snug text-[#0F172A] mb-6">
                {questions[current].q}
              </h2>

              <div className="flex flex-col gap-3">
                {questions[current].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className="w-full text-left px-6 py-4 bg-white border border-[#E2E8F0] rounded-xl text-base font-medium text-[#334155] cursor-pointer transition-all duration-200 hover:border-[#2563EB] hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── Result ─── */}
        {showResult && (
          <section className="py-20 max-sm:py-12">
            <div className="max-w-[640px] mx-auto px-8 text-center max-sm:px-4">
              <div className="text-[64px] font-bold text-[#2563EB] mb-2">{correctCount}/{questions.length}</div>
              <p className="text-lg text-[#64748B] mb-8">questions correct</p>

              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-[0_4px_12px_rgba(0,0,0,0.06)] mb-8 text-left">
                <div className="text-sm font-semibold text-[#2563EB] uppercase tracking-wider mb-2">
                  Suggested Level
                </div>
                <h2 className="text-[32px] font-bold text-[#0F172A] mb-3">{resultCard.title}</h2>
                <p className="text-base leading-relaxed text-[#334155] mb-6">{resultCard.desc}</p>
                <Link
                  href={resultCard.href}
                  className="inline-flex items-center gap-2 bg-[#2563EB] text-white px-6 py-3 rounded-full text-base font-semibold no-underline transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#1D4ED8] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                >
                  {resultCard.label}
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    setStarted(false);
                    setCurrent(0);
                    setAnswers([]);
                    setShowResult(false);
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-transparent text-[#2563EB] px-6 py-3 rounded-full text-base font-semibold border-[1.5px] border-[#2563EB] cursor-pointer transition-all duration-200 hover:bg-[#EFF6FF]"
                >
                  Retake the Level Check
                </button>
                <Link
                  href="/hsk-1-practice-test"
                  className="inline-flex items-center justify-center gap-2 bg-[#0F172A] text-white px-6 py-3 rounded-full text-base font-semibold no-underline transition-all duration-200 hover:bg-[#1e293b]"
                >
                  Try Sample Practice Questions
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ─── FAQ ─── */}
        {!showResult && (
          <section className="py-16 bg-[#F8FAFC] max-sm:py-10">
            <div className="max-w-[800px] mx-auto px-8 max-sm:px-4">
              <h2 className="text-[28px] font-bold text-[#0F172A] text-center mb-8">Common Questions</h2>
              <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] overflow-hidden">
                {faqSchema.mainEntity.map((faq: any, i: number) => (
                  <details key={i} className="border-b border-[#E2E8F0] last:border-b-0">
                    <summary className="flex items-center justify-between px-6 py-5 text-base font-semibold text-[#0F172A] cursor-pointer list-none hover:bg-[#F8FAFC]">
                      <span>{faq.name}</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" stroke="#64748B" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </summary>
                    <div className="px-6 pb-5 text-base leading-relaxed text-[#334155]">
                      {faq.acceptedAnswer.text}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ─── Footer ─── */}
      <SiteFooter />
    </>
  );
}
