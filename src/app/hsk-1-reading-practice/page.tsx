import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import readingData from "../../lib/data/reading-hsk1.json";

export const metadata: Metadata = {
  metadataBase: new URL("https://hskkit.com"),
  title: "HSK 1 Reading Practice with Pinyin — Free Short Stories | HSKKit",
  description:
    "Practice HSK 1 reading with pinyin support. 5 original short stories with highlighted vocabulary, comprehension questions, and study tips. Free — no login needed.",
  alternates: {
    canonical: "https://hskkit.com/hsk-1-reading-practice",
  },
  openGraph: {
    title: "HSK 1 Reading Practice with Pinyin — Free Short Stories",
    description:
      "Practice HSK 1 reading with pinyin support. 5 original short stories with highlighted vocabulary, comprehension questions, and study tips.",
    url: "https://hskkit.com/hsk-1-reading-practice",
    siteName: "HSKKit",
    type: "website",
  },
};

/* ────────── FAQ data ────────── */
const faqs = [
  {
    q: "Is HSK 1 reading practice free?",
    a: "Yes. All 5 reading stories are free to use. No account or payment is required.",
  },
  {
    q: "Do the stories use only HSK 1 vocabulary?",
    a: "The stories are written with HSK 1 vocabulary only. Every character in the Chinese text appears in the official HSK 1 word list. Pinyin and English support are provided for all highlighted words.",
  },
  {
    q: "Can I read without pinyin?",
    a: "Pinyin is displayed by default to support beginners. In future updates, we may add a toggle to hide pinyin for extra challenge.",
  },
  {
    q: "How many stories are available?",
    a: "P0 Full launches with 5 original stories. More stories will be added in future updates.",
  },
  {
    q: "Can I use these stories in my classroom?",
    a: "Yes, teachers are welcome to use these stories for classroom instruction. A Teacher Pack with printable versions and additional materials will be available in a future release.",
  },
];

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

/* ────────── Types ────────── */
interface VocabItem {
  hanzi: string;
  pinyin: string;
  meaning: string;
}

interface QuestionItem {
  qCN: string;
  qEN: string;
  aCN: string;
  aEN: string;
}

interface Story {
  id: number;
  titleCN: string;
  titleEN: string;
  theme: string;
  targetVocab: VocabItem[];
  chineseText: string;
  pinyinText: string;
  englishSummary: string;
  questions: QuestionItem[];
  studyTip: string;
}

const stories = readingData as Story[];

/* ────────── Components ────────── */

function VocabChip({ vocab }: { vocab: VocabItem }) {
  return (
    <div className="inline-flex flex-col items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 min-w-[64px] transition-all duration-150 hover:bg-[#EFF6FF] hover:border-[#2563EB] hover:-translate-y-px hover:shadow-sm cursor-pointer group">
      <span className="text-lg font-semibold text-[#C23A30] chinese-char">{vocab.hanzi}</span>
      <span className="text-[11px] text-[#64748B] mt-0.5">{vocab.pinyin}</span>
      <span className="text-[10px] text-[#94A3B8] mt-0.5 hidden group-hover:inline-block max-w-[120px] text-center leading-tight">
        {vocab.meaning}
      </span>
    </div>
  );
}

function StoryCard({ story }: { story: Story }) {
  return (
    <article
      id={`story-${story.id}`}
      className="bg-white border border-[#E2E8F0] rounded-2xl p-8 max-sm:p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] mb-12 max-sm:mb-8 scroll-mt-24"
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
          {String(story.id).padStart(2, "0")}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A] chinese-char leading-tight">{story.titleCN}</h2>
          <p className="text-lg font-semibold text-[#64748B] mt-1">{story.titleEN}</p>
          <span className="inline-block text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full mt-2">
            {story.theme}
          </span>
        </div>
      </div>

      {/* Target Vocabulary */}
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-3">
          Target Vocabulary ({story.targetVocab.length} words)
        </div>
        <div className="flex flex-wrap gap-2">
          {story.targetVocab.map((v) => (
            <VocabChip key={v.hanzi} vocab={v} />
          ))}
        </div>
      </div>

      {/* Chinese Text */}
      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-3">Chinese Text</div>
        <p className="text-lg leading-[1.8] text-[#0F172A] chinese-char">{story.chineseText}</p>
      </div>

      {/* Pinyin */}
      <div className="bg-[#F8FAFC] rounded-lg p-4 mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2">Pinyin</div>
        <p className="text-sm leading-[1.6] text-[#64748B] tracking-wide">{story.pinyinText}</p>
      </div>

      {/* English Summary */}
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-3">English Summary</div>
        <p className="text-base leading-[1.7] text-[#334155] italic">{story.englishSummary}</p>
      </div>

      {/* Comprehension Questions */}
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-3">Comprehension Questions</div>
        <div className="divide-y divide-[#E2E8F0]">
          {story.questions.map((q, i) => (
            <div key={i} className="py-4 first:pt-0 last:pb-0">
              <p className="text-base font-semibold text-[#0F172A] mb-1">
                <span className="text-[#2563EB] font-bold mr-2">Q:</span>
                <span className="chinese-char mr-2">{q.qCN}</span>
                <span className="text-[#64748B] font-normal">/ {q.qEN}</span>
              </p>
              <p className="text-base text-[#334155] pl-6">
                <span className="text-[#10B981] font-bold mr-2">A:</span>
                <span className="chinese-char mr-2">{q.aCN}</span>
                <span className="text-[#64748B]">/ {q.aEN}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Study Tip */}
      <div className="bg-[#FEF3C7] border-l-4 border-[#F59E0B] rounded-r-lg p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2">Study Tip</div>
        <p className="text-base leading-[1.7] text-[#334155]">{story.studyTip}</p>
      </div>
    </article>
  );
}

/* ────────── Page ────────── */
export default function ReadingPracticePage() {
  return (
    <>
      <Script id="faq-schema-reading" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(faqSchema)}
      </Script>

      <SiteHeader />

      <main>
        {/* ═════ HERO ═════ */}
        <section className="py-20 bg-gradient-to-b from-[#EFF6FF] to-white max-sm:py-12">
          <div className="max-w-[800px] mx-auto px-8 max-sm:px-4 text-center">
            <h1 className="text-[40px] font-bold leading-[1.1] tracking-tight text-[#0F172A] mb-5 max-sm:text-[28px]">
              HSK 1 Reading Practice with Pinyin
            </h1>
            <p className="text-lg leading-relaxed text-[#64748B] mb-8 max-sm:text-[15px]">
              Read real Chinese short stories at HSK 1 level. Every story includes pinyin, highlighted vocabulary,
              comprehension questions, and study tips — so you actually learn while you read.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="#story-1"
                className="inline-flex items-center justify-center gap-2 bg-[#2563EB] text-white px-8 py-4 rounded-full text-lg font-semibold no-underline transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#1D4ED8] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:scale-[0.98]"
              >
                Start Reading — Story 1
              </Link>
              <Link
                href="/hsk-1-practice-test"
                className="inline-flex items-center justify-center gap-2 bg-transparent text-[#2563EB] px-8 py-4 rounded-full text-lg font-semibold no-underline border-[1.5px] border-[#2563EB] transition-all duration-200 hover:bg-[#EFF6FF] active:scale-[0.98]"
              >
                Try HSK 1 Practice Test
              </Link>
            </div>
          </div>
        </section>

        {/* ═════ HOW IT WORKS ═════ */}
        <section className="py-16 bg-white max-sm:py-10">
          <div className="max-w-[800px] mx-auto px-8 max-sm:px-4">
            <div className="text-center mb-10">
              <h2 className="text-[28px] font-bold leading-[1.2] tracking-tight text-[#0F172A] mb-3 max-sm:text-[24px]">
                How It Works
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-6 max-sm:grid-cols-1">
              {[
                {
                  n: "1",
                  title: "Read the story",
                  text: "Each story shows Chinese text with pinyin underneath, so you can follow along without guessing pronunciation.",
                },
                {
                  n: "2",
                  title: "Review vocabulary",
                  text: "Target words are highlighted as chips. Hover or tap to see pinyin and English meaning.",
                },
                {
                  n: "3",
                  title: "Answer questions",
                  text: "Three comprehension questions per story help you check understanding and reinforce learning.",
                },
              ].map((step) => (
                <div key={step.n} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">
                    {step.n}
                  </div>
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-2">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-[#64748B]">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═════ STORY LIST NAV ═════ */}
        <section className="py-8 bg-[#F8FAFC]">
          <div className="max-w-[800px] mx-auto px-8 max-sm:px-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-4">Jump to Story</div>
            <div className="flex flex-wrap gap-3">
              {stories.map((s) => (
                <Link
                  key={s.id}
                  href={`#story-${s.id}`}
                  className="inline-flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-lg px-4 py-2 text-sm font-medium text-[#334155] no-underline transition-all duration-150 hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
                >
                  <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold">
                    {s.id}
                  </span>
                  <span className="chinese-char">{s.titleCN}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ═════ STORY SECTIONS ═════ */}
        <section className="py-12 bg-white">
          <div className="max-w-[800px] mx-auto px-8 max-sm:px-4">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>

        {/* ═════ WHY READ WITH PINYIN ═════ */}
        <section className="py-16 bg-[#F8FAFC] max-sm:py-10">
          <div className="max-w-[800px] mx-auto px-8 max-sm:px-4">
            <div className="text-center mb-10">
              <h2 className="text-[28px] font-bold leading-[1.2] tracking-tight text-[#0F172A] mb-3 max-sm:text-[24px]">
                Why Read with Pinyin?
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-6 max-sm:grid-cols-1">
              {[
                {
                  title: "Builds confidence",
                  text: "Pinyin removes the guesswork from pronunciation. You can focus on meaning instead of struggling with tones.",
                },
                {
                  title: "Reinforces vocabulary",
                  text: "Seeing words in real context helps them stick better than isolated flashcard review alone.",
                },
                {
                  title: "Prepares for HSK 1",
                  text: "HSK 1 reading comprehension tests short passages. These stories match that format and difficulty level.",
                },
              ].map((b) => (
                <div
                  key={b.title}
                  className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                >
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-2">{b.title}</h3>
                  <p className="text-sm leading-relaxed text-[#64748B]">{b.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═════ CTA BANNER ═════ */}
        <section className="py-16 bg-gradient-to-b from-white via-[#EFF6FF] to-white max-sm:py-10">
          <div className="max-w-[800px] mx-auto px-8 max-sm:px-4 text-center">
            <h2 className="text-[28px] font-bold leading-[1.2] tracking-tight text-[#0F172A] mb-4 max-sm:text-[24px]">
              Ready to test your HSK 1 level?
            </h2>
            <p className="text-base leading-relaxed text-[#64748B] mb-6">
              Take the free HSK Level Test and find out which level matches your current skills.
            </p>
            <Link
              href="/hsk-level-test"
              className="inline-flex items-center gap-2 bg-[#2563EB] text-white px-8 py-4 rounded-full text-lg font-semibold no-underline transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#1D4ED8] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:scale-[0.98]"
            >
              Take the Free HSK Level Test
            </Link>
          </div>
        </section>

        {/* ═════ FAQ ═════ */}
        <section className="py-16 bg-[#F8FAFC] max-sm:py-10" id="faq">
          <div className="max-w-[800px] mx-auto px-8 max-sm:px-4">
            <div className="text-center mb-10">
              <h2 className="text-[28px] font-bold leading-[1.2] tracking-tight text-[#0F172A] mb-3 max-sm:text-[24px]">
                Common Questions
              </h2>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] overflow-hidden">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="border-b border-[#E2E8F0] last:border-b-0 group"
                >
                  <summary className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer list-none transition-colors duration-150 hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
                    <span className="text-base font-semibold text-[#0F172A] pr-4">{faq.q}</span>
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      stroke="#64748B"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0 transition-transform duration-300 group-open:rotate-180"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-5">
                    <p className="text-base leading-relaxed text-[#334155]">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ═════ DISCLAIMER ═════ */}
        <section className="py-8 bg-white">
          <div className="max-w-[800px] mx-auto px-8 max-sm:px-4">
            <p className="text-xs text-[#94A3B8] text-center leading-relaxed">
              HSKKit is an independent study tool and is not affiliated with, endorsed by, or operated by the official
              HSK test organizers.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
