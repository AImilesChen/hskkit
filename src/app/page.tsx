"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import SiteHeader from "./site-header";
import SiteFooter from "./site-footer";

/* ────────── FAQ data ────────── */
const faqs = [
  {
    q: "What is HSKKit?",
    a: "HSKKit is an online resource for HSK (Hanyu Shuiping Kaoshi) Chinese learners. We offer self-check level guides, vocabulary lists, and sample questions for HSK 1 through HSK 5.",
  },
  {
    q: "Is HSKKit free?",
    a: "Core study guides — vocabulary lists, sample tests, and level checks — are free. Advanced tools and features may require a Pro plan or credits in the future.",
  },
  {
    q: "Is HSKKit an official HSK test?",
    a: "No. HSKKit is an independent study tool. Our level check is a self-assessment tool, not an official placement exam. For official HSK registration, visit the Hanban/CTI website.",
  },
  {
    q: "Which HSK level should I start with?",
    a: "Take our quick level check. It asks you to recognize common Chinese words and sentences, then suggests a starting level based on your answers.",
  },
  {
    q: "Does HSKKit cover HSK 3.0?",
    a: "We currently cover HSK 1–5 under the traditional 6-level system. HSK 6 is planned. We also have a guide explaining the New HSK 3.0 framework and how it compares to the old levels.",
  },
  {
    q: "Can I use HSKKit on my phone?",
    a: "Yes. HSKKit works on any device with a web browser — phone, tablet, or desktop. Study during your commute, lunch break, or before bed.",
  },
];

/* ────────── FAQPage JSON-LD ────────── */
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.a,
    },
  })),
};

/* ────────── Icons (inline SVG, Lucide-style) ────────── */
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="#10B981" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    stroke="#64748B"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-transform duration-300 ease-out flex-shrink-0 ${open ? "rotate-180" : ""}`}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/* ────────── Study Path Data ────────── */
const studyPathLevels = [
  { n: 1, t: "HSK 1", l: "150 words · Beginner", href: "/hsk-1-vocabulary" },
  { n: 2, t: "HSK 2", l: "300 words · Elementary", href: "/hsk-2-vocabulary" },
  { n: 3, t: "HSK 3", l: "600 words · Intermediate", href: "/hsk-3-vocabulary" },
  { n: 4, t: "HSK 4", l: "1,200 words · Upper-Int", href: "/hsk-4-vocabulary" },
  { n: 5, t: "HSK 5", l: "2,500 words · Advanced", href: "/hsk-5-vocabulary" },
];

/* ────────── Components ────────── */

function FaqAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="max-w-[800px] mx-auto bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] overflow-hidden">
      {faqs.map((faq, i) => {
        const isOpen = openIdx === i;
        return (
          <div key={i} className="border-b border-[#E2E8F0] last:border-b-0">
            <button
              className="w-full flex items-center justify-between px-6 py-5 text-left bg-none border-none cursor-pointer transition-colors duration-150 hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
              onClick={() => setOpenIdx(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${i}`}
            >
              <span className="text-base font-semibold text-[#0F172A] pr-4">{faq.q}</span>
              <ChevronIcon open={isOpen} />
            </button>
            <div
              id={`faq-answer-${i}`}
              className={`overflow-hidden transition-all duration-300 ease-out ${isOpen ? "max-h-[300px] pb-5" : "max-h-0"}`}
              aria-hidden={!isOpen}
            >
              <p className="px-6 text-base leading-relaxed text-[#334155]">{faq.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StudyPathCard({ s, isLast }: { s: typeof studyPathLevels[0]; isLast: boolean }) {
  return (
    <div>
      <Link
        href={s.href}
        className="flex items-center gap-4 p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] transition-all duration-200 hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:shadow-[0_4px_12px_rgba(37,99,235,0.08)] active:scale-[0.98] no-underline group"
      >
        <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-sm font-bold flex-shrink-0 group-hover:bg-[#1D4ED8]">
          {s.n}
        </div>
        <div>
          <div className="text-sm font-semibold text-[#0F172A]">{s.t}</div>
          <div className="text-xs text-[#64748B]">{s.l}</div>
        </div>
        <svg
          className="ml-auto w-4 h-4 text-[#94A3B8] transition-transform duration-150 group-hover:translate-x-1 group-hover:text-[#2563EB]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>
      {!isLast && <div className="w-[2px] h-5 bg-[#DBEAFE] ml-[23px]" />}
    </div>
  );
}

function StudyPathBlock() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-[0_12px_32px_rgba(0,0,0,0.08)] max-lg:max-w-[500px] max-lg:mx-auto max-sm:p-5 max-sm:rounded-xl">
      <div className="text-sm font-semibold text-[#64748B] mb-6 text-center uppercase tracking-wider max-sm:mb-4">
        Your HSK Study Path
      </div>
      <div className="flex flex-col gap-4 max-sm:gap-3">
        {studyPathLevels.map((s, idx) => (
          <StudyPathCard key={s.n} s={s} isLast={idx === studyPathLevels.length - 1} />
        ))}
        <div className="flex items-center gap-4 p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] opacity-50">
          <div className="w-8 h-8 rounded-full bg-[#94A3B8] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">6</div>
          <div className="text-sm font-semibold text-[#0F172A]">HSK 6</div>
          <span className="ml-auto text-[11px] font-semibold text-[#F59E0B] bg-[#FEF3C7] px-2 py-0.5 rounded-full">Planned</span>
        </div>
      </div>
    </div>
  );
}

/* ────────── Page ────────── */
export default function HomePage() {
  return (
    <>
      {/* FAQ Schema */}
      <Script id="faq-schema" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(faqSchema)}
      </Script>

      <SiteHeader />

      <main>
        {/* ═════ BLOCK 1: HERO ═════ */}
        <section className="py-24 bg-gradient-to-b from-[#EFF6FF] to-white max-sm:py-8">
          <div className="max-w-[1200px] mx-auto px-8 max-sm:px-4">
            <div className="grid grid-cols-2 gap-10 items-center max-lg:grid-cols-1 max-lg:text-center">
              {/* Text */}
              <div className="max-w-[560px] max-lg:max-w-full">
                <h1 className="text-[48px] font-bold leading-[1.1] tracking-tight text-[#0F172A] mb-5 max-sm:text-[28px] max-sm:mb-3 max-sm:leading-[1.15]">
                  Prepare for the HSK with Free Vocabulary, Practice Tests &amp; Level Guides
                </h1>
                <p className="text-lg leading-relaxed text-[#64748B] mb-8 max-sm:text-[15px] max-sm:leading-relaxed max-sm:mb-5">
                  HSKKit gives you level-by-level vocabulary lists, sample questions, and a quick self-check — so you stop guessing and start studying what actually matters.
                </p>

                {/* Mobile-first CTA stack: 3 primary actions */}
                <div className="flex flex-col gap-3 mb-6 max-sm:mb-5">
                  <Link
                    href="/hsk-1-practice-test"
                    className="inline-flex items-center justify-center gap-2 bg-[#2563EB] text-white px-8 py-4 rounded-full text-lg font-semibold no-underline transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#1D4ED8] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:scale-[0.98] max-sm:px-6 max-sm:py-3.5 max-sm:text-base"
                  >
                    Start Today’s HSK 1 Practice
                  </Link>
                  <Link
                    href="/hsk-level-test"
                    className="inline-flex items-center justify-center gap-2 bg-[#EFF6FF] text-[#2563EB] px-8 py-4 rounded-full text-lg font-semibold no-underline border-[1.5px] border-[#2563EB] transition-all duration-200 hover:bg-[#DBEAFE] active:scale-[0.98] max-sm:px-6 max-sm:py-3.5 max-sm:text-base"
                  >
                    Take the Quick Level Check
                  </Link>
                  <Link
                    href="/hsk-1-vocabulary"
                    className="inline-flex items-center justify-center gap-2 bg-transparent text-[#2563EB] px-8 py-4 rounded-full text-lg font-semibold no-underline border-[1.5px] border-[#2563EB] transition-all duration-200 hover:bg-[#EFF6FF] active:scale-[0.98] max-sm:px-6 max-sm:py-3.5 max-sm:text-base"
                  >
                    Browse HSK 1 Vocabulary
                  </Link>
                </div>

                <div className="flex gap-5 flex-wrap text-[13px] font-medium text-[#64748B] max-lg:justify-center max-sm:gap-3 max-sm:text-[12px]">
                  <span className="flex items-center gap-2"><CheckIcon />Core guides are free</span>
                  <span className="flex items-center gap-2"><CheckIcon />No signup required</span>
                  <span className="flex items-center gap-2"><CheckIcon />HSK 1–5 available now</span>
                </div>
              </div>

              {/* Visual — Study Path (desktop: side, mobile: below CTAs) */}
              <div>
                <StudyPathBlock />
              </div>
            </div>
          </div>
        </section>

        {/* ═════ BLOCK 1B: DAILY LOOP ═════ */}
        <section className="py-16 bg-white max-sm:py-10">
          <div className="max-w-[1200px] mx-auto px-8 max-sm:px-4">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-8 max-sm:p-5">
              <div className="flex items-start justify-between gap-6 mb-6 max-lg:flex-col">
                <div className="max-w-[680px]">
                  <p className="text-sm font-semibold text-[#2563EB] uppercase tracking-wider mb-2">Daily study path</p>
                  <h2 className="text-[32px] font-bold leading-tight text-[#0F172A] mb-3 max-sm:text-[26px]">Today’s 10-Minute HSK 1 Loop</h2>
                  <p className="text-base leading-relaxed text-[#64748B]">
                    One beginner-friendly loop connects vocabulary, flashcards, practice questions, reading, handwriting, and a progress summary — so learners always know the next step.
                  </p>
                </div>
                <Link
                  href="/hsk-1-practice-test"
                  className="inline-flex items-center justify-center bg-[#2563EB] text-white px-6 py-3 rounded-full text-base font-semibold no-underline transition-all duration-200 hover:bg-[#1D4ED8]"
                >
                  Start the loop
                </Link>
              </div>
              <div className="grid grid-cols-6 gap-3 max-lg:grid-cols-3 max-sm:grid-cols-1">
                {[
                  { step: "1", title: "Learn", href: "/hsk-1-vocabulary", text: "Review 5 HSK 1 words" },
                  { step: "2", title: "Flashcards", href: "/hsk-1-vocabulary#flashcards", text: "Flip hanzi → pinyin + meaning" },
                  { step: "3", title: "Test", href: "/hsk-1-practice-test", text: "Answer 10 random questions" },
                  { step: "4", title: "Read", href: "/hsk-1-reading-practice", text: "Complete one short story" },
                  { step: "5", title: "Write", href: "/tools/chinese-character-practice-sheet-generator", text: "Generate Tian Zi Ge practice" },
                  { step: "6", title: "Summary", href: "/hsk-1-practice-test", text: "Save score and review misses" },
                ].map((item) => (
                  <Link
                    key={item.step}
                    href={item.href}
                    className="block bg-white border border-[#E2E8F0] rounded-2xl p-4 no-underline transition-all duration-200 hover:border-[#2563EB] hover:shadow-[0_8px_24px_rgba(37,99,235,0.08)]"
                  >
                    <span className="inline-flex w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] items-center justify-center text-sm font-bold mb-3">{item.step}</span>
                    <h3 className="text-base font-bold text-[#0F172A] mb-1">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-[#64748B]">{item.text}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═════ BLOCK 2: PROBLEM ═════ */}
        <section className="py-20 bg-[#F8FAFC] max-sm:py-12">
          <div className="max-w-[1200px] mx-auto px-8 max-sm:px-4">
            <div className="text-center max-w-[640px] mx-auto mb-10">
              <h2 className="text-[36px] font-bold leading-[1.2] tracking-tight text-[#0F172A] mb-4 max-sm:text-[28px]">
                Studying for HSK? Most Learners Waste Time on the Wrong Things
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
              {[
                {
                  icon: (
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="#DC2626" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  ),
                  title: "Scattered resources, no plan",
                  text: "You jump between apps, PDFs, and YouTube videos. Every session starts with \"what should I study today?\" instead of actual learning.",
                },
                {
                  icon: (
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="#DC2626" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                    </svg>
                  ),
                  title: "No idea where you actually stand",
                  text: "You might be reviewing HSK 1 words when you should be tackling HSK 3. Or the opposite — jumping too fast and burning out.",
                },
                {
                  icon: (
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="#DC2626" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  ),
                  title: "Vocabulary without practice",
                  text: "You memorize words and forget them fast. Without sample questions and review loops, studying feels like running in place.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:border-[#DBEAFE]"
                >
                  <div className="w-12 h-12 bg-[#FEF2F2] rounded-xl flex items-center justify-center mb-4">{card.icon}</div>
                  <h3 className="text-xl font-semibold leading-snug text-[#0F172A] mb-3">{card.title}</h3>
                  <p className="text-base leading-relaxed text-[#334155]">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═════ BLOCK 3: SOLUTION ═════ */}
        <section className="py-20 bg-gradient-to-b from-white via-[#EFF6FF] to-white max-sm:py-12">
          <div className="max-w-[1200px] mx-auto px-8 max-sm:px-4">
            <div className="text-center max-w-[640px] mx-auto mb-10">
              <h2 className="text-[36px] font-bold leading-[1.2] tracking-tight text-[#0F172A] mb-4 max-sm:text-[28px]">
                HSKKit: A Clear Path from Your First Word to Exam Day
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
              {[
                {
                  icon: (
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="#2563EB" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  ),
                  title: "Know your level in minutes",
                  text: "Answer a few quick self-check questions. Get a suggested starting level (HSK 1–5) and a simple study path.",
                },
                {
                  icon: (
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="#2563EB" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  ),
                  title: "Learn the right words in the right order",
                  text: "Each level has a curated vocabulary list with pinyin and English meaning. No more random word lists.",
                },
                {
                  icon: (
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="#2563EB" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                    </svg>
                  ),
                  title: "Test yourself, find your gaps",
                  text: "Sample questions for HSK 1–4. Check your answers, see what you missed, and review before the next attempt.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:border-[#DBEAFE]"
                >
                  <div className="w-12 h-12 bg-[#EFF6FF] rounded-xl flex items-center justify-center mb-4">{card.icon}</div>
                  <h3 className="text-xl font-semibold leading-snug text-[#0F172A] mb-3">{card.title}</h3>
                  <p className="text-base leading-relaxed text-[#334155]">{card.text}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-10 p-4 px-6 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <p className="text-[13px] font-medium text-[#64748B]">
                Core study guides are free. No account needed. Advanced tools may require a Pro plan.
              </p>
            </div>
          </div>
        </section>

        {/* ═════ BLOCK 4: HOW IT WORKS ═════ */}
        <section className="py-20 bg-[#F8FAFC] max-sm:py-12">
          <div className="max-w-[1200px] mx-auto px-8 max-sm:px-4">
            <div className="text-center max-w-[640px] mx-auto mb-10">
              <h2 className="text-[36px] font-bold leading-[1.2] tracking-tight text-[#0F172A] mb-4 max-sm:text-[28px]">Start Studying in 3 Steps</h2>
            </div>
            <div className="relative flex gap-6 max-lg:flex-col">
              {/* Connector line (desktop only) */}
              <div className="absolute top-7 left-[10%] right-[10%] h-[2px] bg-[#DBEAFE] z-0 max-lg:hidden" />

              {[
                {
                  n: "1",
                  title: "Take the Level Check",
                  text: "A short self-check with common Chinese words and sentences. Get a suggested HSK level based on what you recognize.",
                },
                {
                  n: "2",
                  title: "Pick Your Level",
                  text: "Choose from HSK 1–5 vocabulary guides and HSK 1–4 sample tests. Each page tells you what to learn next.",
                },
                {
                  n: "3",
                  title: "Study, Practice, Repeat",
                  text: "Review vocabulary with pinyin and meaning. Try sample questions. Come back and review what you missed.",
                },
              ].map((step) => (
                <div key={step.n} className="flex-1 text-center relative z-[1] max-lg:text-left max-lg:flex gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[22px] font-bold mx-auto mb-5 shadow-[0_0_0_6px_#F8FAFC] flex-shrink-0 max-lg:mx-0 max-lg:w-12 max-lg:h-12 max-lg:text-lg">
                    {step.n}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold leading-snug text-[#0F172A] mb-3">{step.title}</h3>
                    <p className="text-base leading-relaxed text-[#64748B]">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                href="/hsk-level-test"
                className="inline-flex items-center gap-2 bg-[#2563EB] text-white px-8 py-4 rounded-full text-lg font-semibold no-underline transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#1D4ED8] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:scale-[0.98]"
              >
                Start with Step 1 — Take the Level Check
              </Link>
            </div>
          </div>
        </section>

        {/* ═════ BLOCK 5: PROOF ═════ */}
        <section className="py-20 max-sm:py-12">
          <div className="max-w-[1200px] mx-auto px-8 max-sm:px-4">
            <div className="text-center max-w-[640px] mx-auto mb-10">
              <h2 className="text-[36px] font-bold leading-[1.2] tracking-tight text-[#0F172A] mb-4 max-sm:text-[28px]">What You Get with HSKKit</h2>
            </div>
            <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
              {[
                {
                  icon: (
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="#10B981" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  ),
                  title: "Level-by-Level Vocabulary",
                  text: "Curated word lists from HSK 1 through HSK 5. Each word includes pinyin and English meaning.",
                },
                {
                  icon: (
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="#10B981" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                    </svg>
                  ),
                  title: "Sample Test Questions",
                  text: "Practice with sample questions for HSK 1–4. Check answers and review mistakes at your own pace.",
                },
                {
                  icon: (
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="#10B981" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v4" />
                      <path d="M12 18v4" />
                      <path d="M4.93 4.93l2.83 2.83" />
                      <path d="M16.24 16.24l2.83 2.83" />
                      <path d="M2 12h4" />
                      <path d="M18 12h4" />
                      <path d="M4.93 19.07l2.83-2.83" />
                      <path d="M16.24 7.76l2.83-2.83" />
                    </svg>
                  ),
                  title: "Simple Level Check",
                  text: "A quick self-check to estimate your starting level. No timer, no pressure — just honest guidance.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:border-[#DBEAFE]"
                >
                  <div className="w-12 h-12 bg-[#F0FDF4] rounded-xl flex items-center justify-center mb-4">{card.icon}</div>
                  <h3 className="text-xl font-semibold leading-snug text-[#0F172A] mb-3">{card.title}</h3>
                  <p className="text-base leading-relaxed text-[#334155]">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═════ BLOCK 6: CONTENT PREVIEW ═════ */}
        <section className="py-20 bg-[#F8FAFC] max-sm:py-12">
          <div className="max-w-[1200px] mx-auto px-8 max-sm:px-4">
            <div className="text-center max-w-[640px] mx-auto mb-10">
              <h2 className="text-[36px] font-bold leading-[1.2] tracking-tight text-[#0F172A] mb-4 max-sm:text-[28px]">Popular Starting Points</h2>
            </div>
            <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
              {[
                {
                  title: "HSK Level Check",
                  text: "Not sure where to start? Answer a few quick questions and get a suggested HSK level.",
                  href: "/hsk-level-test",
                  label: "Take the Level Check",
                },
                {
                  title: "HSK 1 Vocabulary",
                  text: "Essential beginner words with pinyin and English meaning. Perfect if you're just starting Mandarin.",
                  href: "/hsk-1-vocabulary",
                  label: "Start HSK 1 Vocabulary",
                },
                {
                  title: "HSK 1 Flashcards",
                  text: "Flip beginner cards: front shows hanzi; back shows pinyin, English meaning, and an example sentence.",
                  href: "/hsk-1-vocabulary#flashcards",
                  label: "Start Flashcards",
                },
                {
                  title: "HSK 1 Sample Practice Questions",
                  text: "Sample questions with answer keys. Test what you've learned and find your weak spots.",
                  href: "/hsk-1-practice-test",
                  label: "Try Sample Practice Questions",
                },
                {
                  title: "HSK 1 Reading with Pinyin",
                  text: "Read 5 original short stories with pinyin support, highlighted vocabulary, and comprehension questions. 5 minutes per story.",
                  href: "/hsk-1-reading-practice",
                  label: "Start Reading",
                },
                {
                  title: "Character Practice Sheets",
                  text: "Generate printable Tian Zi Grids for any Chinese characters. Type, preview, and print in seconds. Great for handwriting practice.",
                  href: "/tools/chinese-character-practice-sheet-generator",
                  label: "Generate Worksheet",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:border-[#DBEAFE]"
                >
                  <div className="h-2 bg-[#2563EB]" />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold leading-snug text-[#0F172A] mb-3">{card.title}</h3>
                    <p className="text-base leading-relaxed text-[#64748B] mb-4">{card.text}</p>
                    <Link
                      href={card.href}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] no-underline group"
                    >
                      {card.label}
                      <span className="transition-transform duration-150 group-hover:translate-x-1">→</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═════ BLOCK 7: TRUST ═════ */}
        <section className="py-20 max-sm:py-12">
          <div className="max-w-[1200px] mx-auto px-8 max-sm:px-4">
            <div className="text-center max-w-[720px] mx-auto p-10 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] max-sm:p-6">
              <h2 className="text-[28px] font-bold leading-[1.2] tracking-tight text-[#0F172A] mb-5 max-sm:text-[24px]">
                Independent, Transparent, and Honest
              </h2>
              <p className="text-base leading-relaxed text-[#64748B] mb-6">
                HSKKit is an independent study tool. We are not affiliated with, endorsed by, or operated by any HSK test organizer. Core study guides are free. Advanced features may require a Pro plan in the future.
              </p>
              <div className="flex justify-center gap-6 flex-wrap max-sm:flex-col max-sm:items-center">
                <span className="flex items-center gap-2 text-[13px] font-semibold text-[#64748B]">
                  <CheckIcon /> Core Guides Free
                </span>
                <span className="flex items-center gap-2 text-[13px] font-semibold text-[#64748B]">
                  <CheckIcon /> No Account Needed
                </span>
                <span className="flex items-center gap-2 text-[13px] font-semibold text-[#64748B]">
                  <CheckIcon /> Study at Your Own Pace
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ═════ BLOCK 8: FAQ ═════ */}
        <section className="py-20 bg-[#F8FAFC] max-sm:py-12" id="faq">
          <div className="max-w-[1200px] mx-auto px-8 max-sm:px-4">
            <div className="text-center max-w-[640px] mx-auto mb-10">
              <h2 className="text-[36px] font-bold leading-[1.2] tracking-tight text-[#0F172A] mb-4 max-sm:text-[28px]">
                Common Questions About HSKKit
              </h2>
            </div>
            <FaqAccordion />
          </div>
        </section>

        {/* ═════ BLOCK 9: FINAL CTA ═════ */}
        <section className="py-20 bg-[#0F172A] text-center max-sm:py-12">
          <div className="max-w-[1200px] mx-auto px-8 max-sm:px-4">
            <h2 className="text-[36px] font-bold leading-[1.2] tracking-tight text-white mb-4 max-sm:text-[28px]">
              Ready to Stop Guessing and Start Studying?
            </h2>
            <p className="text-lg leading-relaxed text-white/70 mb-8 max-w-[520px] mx-auto">
              Take the quick level check. Get a suggested HSK level. Start learning the right words today.
            </p>
            <Link
              href="/hsk-level-test"
              className="inline-flex items-center gap-2 bg-[#2563EB] text-white px-8 py-4 rounded-full text-lg font-semibold no-underline transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#1D4ED8] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:scale-[0.98]"
            >
              Take the Level Check
            </Link>
            <p className="text-[13px] font-medium text-white/50 mt-6">
              Core guides are free. No signup. Works on phone and desktop.
            </p>
          </div>
        </section>
      </main>

      {/* ═════ FOOTER ═════ */}
      <SiteFooter />
    </>
  );
}
