import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import SiteHeader from "../../site-header";
import SiteFooter from "../../site-footer";
import { WorksheetTool } from "./worksheet-tool";

export const metadata: Metadata = {
  metadataBase: new URL("https://hskkit.com"),
  title:
    "Chinese Character Practice Sheet Generator — Tian Zi Ge (田字格) | HSKKit",
  description:
    "Generate free Chinese character practice sheets with Tian Zi Ge (田字格) grids. Type any Chinese text, preview, and print in seconds. Perfect for HSK 1 learners, teachers, and parents.",
  alternates: {
    canonical:
      "https://hskkit.com/tools/chinese-character-practice-sheet-generator",
  },
  openGraph: {
    title:
      "Chinese Character Practice Sheet Generator — Tian Zi Ge (田字格)",
    description:
      "Generate free Chinese character practice sheets with Tian Zi Ge grids. Type any Chinese text, preview, and print in seconds.",
    url: "https://hskkit.com/tools/chinese-character-practice-sheet-generator",
    siteName: "HSKKit",
    type: "website",
  },
};

/* ────────── FAQ data ────────── */
const faqs = [
  {
    q: "Is this practice sheet generator free?",
    a: "Yes. You can generate and print practice sheets without creating an account. A daily soft limit may apply to prevent abuse.",
  },
  {
    q: "What is Tian Zi Ge (田字格)?",
    a: "Tian Zi Ge is a traditional Chinese writing grid with a cross in the middle. It helps learners balance character strokes and maintain proper proportions.",
  },
  {
    q: "Can I download a PDF instead of printing?",
    a: 'Currently, the generator outputs a browser-optimized print page. You can "Print to PDF" using your browser\'s built-in feature. A dedicated PDF download option is planned for a future release.',
  },
  {
    q: "Is there a limit to how many characters I can enter?",
    a: "For best print results, we recommend 5–10 characters per sheet. Longer inputs may be split across multiple pages automatically.",
  },
  {
    q: "Can teachers use this for their classes?",
    a: "Yes. Teachers can generate unlimited sheets for classroom use. A Teacher Pack with batch generation and custom templates will be available in a future release.",
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

/* ────────── Page ────────── */
export default function WorksheetGeneratorPage() {
  return (
    <>
      <Script
        id="faq-schema-worksheet"
        type="application/ld+json"
        strategy="beforeInteractive"
      >
        {JSON.stringify(faqSchema)}
      </Script>

      <SiteHeader />

      <main>
        {/* ═════ HERO ═════ */}
        <section className="py-20 bg-gradient-to-b from-[#EFF6FF] to-white max-sm:py-12">
          <div className="max-w-[800px] mx-auto px-8 max-sm:px-4 text-center">
            <h1 className="text-[40px] font-bold leading-[1.1] tracking-tight text-[#0F172A] mb-5 max-sm:text-[28px]">
              Chinese Character Practice Sheet Generator
            </h1>
            <p className="text-lg leading-relaxed text-[#64748B] mb-8 max-sm:text-[15px]">
              Type any Chinese characters, choose your grid style, and print a
              clean practice sheet in seconds. Perfect for HSK 1 learners,
              teachers, and parents.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="#generator"
                className="inline-flex items-center justify-center gap-2 bg-[#2563EB] text-white px-8 py-4 rounded-full text-lg font-semibold no-underline transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#1D4ED8] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:scale-[0.98]"
              >
                Generate Practice Sheet
              </a>
              <Link
                href="/hsk-1-vocabulary"
                className="inline-flex items-center justify-center gap-2 bg-transparent text-[#2563EB] px-8 py-4 rounded-full text-lg font-semibold no-underline border-[1.5px] border-[#2563EB] transition-all duration-200 hover:bg-[#EFF6FF] active:scale-[0.98]"
              >
                Browse HSK 1 Vocabulary
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
                  title: "Type Chinese text",
                  text: "Enter the characters you want to practice. You can type directly or paste from a vocabulary list.",
                },
                {
                  n: "2",
                  title: "Choose grid style",
                  text: "Select Tian Zi Ge (田字格) for balanced stroke training. More grid styles coming soon.",
                },
                {
                  n: "3",
                  title: "Preview & print",
                  text: "Preview your sheet in the browser, then print or save as PDF using your browser's print dialog.",
                },
              ].map((step) => (
                <div key={step.n} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">
                    {step.n}
                  </div>
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#64748B]">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═════ GENERATOR TOOL ═════ */}
        <section id="generator" className="py-16 bg-[#F8FAFC] max-sm:py-10">
          <div className="max-w-[800px] mx-auto px-8 max-sm:px-4">
            <WorksheetTool />
          </div>
        </section>

        {/* ═════ PRINT INSTRUCTIONS ═════ */}
        <section className="py-12 bg-white max-sm:py-8">
          <div className="max-w-[800px] mx-auto px-8 max-sm:px-4">
            <h2 className="text-xl font-bold text-[#0F172A] mb-4">
              Print Instructions
            </h2>
            <div className="bg-[#F8FAFC] rounded-xl p-6 max-sm:p-4">
              <p className="text-sm text-[#334155] mb-3">
                <strong>Before you print:</strong>
              </p>
              <ul className="text-sm text-[#334155] space-y-2 mb-4 list-disc pl-5">
                <li>Use A4 or Letter size paper</li>
                <li>Set margins to "Minimum" or "Narrow" for best results</li>
                <li>
                  Enable "Background graphics" in print settings if grids do not
                  appear
                </li>
                <li>
                  For best practice experience, use slightly thicker paper
                  (90gsm+)
                </li>
              </ul>
              <p className="text-sm text-[#64748B]">
                Most browsers support clean printing. Press Ctrl+P (Windows) or
                Cmd+P (Mac), then select "Save as PDF" if you want a digital
                copy.
              </p>
            </div>
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
                    <span className="text-base font-semibold text-[#0F172A] pr-4">
                      {faq.q}
                    </span>
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
                    <p className="text-base leading-relaxed text-[#334155]">
                      {faq.a}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ═════ DISCLAIMER ═════ */}
        <section className="py-8 bg-white">
          <div className="max-w-[800px] mx-auto px-8 max-sm:px-4">
            <p className="text-xs text-[#94A3B8] text-center leading-relaxed mb-3">
              HSKKit is an independent study tool and is not affiliated with,
              endorsed by, or operated by the official HSK test organizers. This
              worksheet generator is provided as a supplementary learning
              resource.
            </p>
            <p className="text-xs text-[#94A3B8] text-center leading-relaxed">
              This tool generates practice sheets for personal or classroom
              study. It does not provide official HSK materials or guarantee
              test results.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
