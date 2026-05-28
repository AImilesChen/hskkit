import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";

export const metadata: Metadata = {
  title: "HSK 6 Vocabulary — Planned | HSKKit",
  description:
    "HSK 6 vocabulary is not available yet. We are planning to add it in a future update.",
  alternates: {
    canonical: "https://hskkit.com/hsk-6-vocabulary",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function HSK6VocabularyPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section pt-20">
          <div className="section-inner max-w-[560px] mx-auto text-center py-16">
            <div className="w-16 h-16 bg-[#F8FAFC] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-[#64748B]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v4" />
                <path d="M12 18v4" />
                <path d="M4.93 4.93l2.83 2.83" />
                <path d="M16.24 16.24l2.83 2.83" />
                <path d="M2 12h4" />
                <path d="M18 12h4" />
                <path d="M4.93 19.07l2.83-2.83" />
                <path d="M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <h1 className="text-[28px] font-bold text-[#0F172A] mb-3">
              HSK 6 Vocabulary — Planned
            </h1>
            <p className="text-base text-[#64748B] leading-relaxed mb-8">
              HSK 6 vocabulary is not available yet. We are planning to add it in a future update.
            </p>
            <div className="flex flex-col gap-3 items-center">
              <a
                href="/hsk-6-practice-test"
                className="inline-flex items-center gap-2 bg-[#2563EB] text-white px-6 py-3 rounded-full text-[15px] font-semibold no-underline hover:bg-[#1D4ED8] transition-colors"
              >
                Next: HSK 6 Practice Test →
              </a>
              <a
                href="/hsk-level-test"
                className="inline-flex items-center gap-2 bg-transparent text-[#2563EB] border-[1.5px] border-[#2563EB] px-6 py-3 rounded-full text-[15px] font-semibold no-underline hover:bg-[#EFF6FF] transition-colors"
              >
                Take the Level Check →
              </a>
              <a
                href="/new-hsk-3-0"
                className="inline-flex items-center gap-2 text-[#64748B] text-sm font-medium no-underline hover:text-[#334155] transition-colors mt-1"
              >
                Read the New HSK 3.0 Guide →
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
