"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import SiteHeader from "../../site-header";
import SiteFooter from "../../site-footer";

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
    a: "Currently, the generator outputs a browser-optimized print page. You can \"Print to PDF\" using your browser's built-in feature. A dedicated PDF download option is planned for a future release.",
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

/* ────────── Tian Zi Ge Cell ────────── */
function TianZiGeCell({ char }: { char: string }) {
  return (
    <div className="relative w-[80px] h-[80px] max-sm:w-[60px] max-sm:h-[60px] border border-[#0F172A] flex items-center justify-center flex-shrink-0 bg-white">
      {/* Horizontal dashed center line */}
      <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dashed border-[#94A3B8]" />
      {/* Vertical dashed center line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px border-l border-dashed border-[#94A3B8]" />
      {/* Character */}
      <span className="text-[36px] max-sm:text-[28px] font-normal text-[#0F172A] chinese-char relative z-10">
        {char}
      </span>
    </div>
  );
}

/* ────────── Grid Preview ────────── */
function GridPreview({ chars }: { chars: string[] }) {
  const desktopCols = 8;
  const mobileCols = 4;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 max-sm:p-4">
      <div className="text-sm font-semibold text-[#0F172A] mb-4">
        Practice Sheet Preview
      </div>
      <div className="flex flex-wrap gap-2 max-sm:gap-1.5">
        {chars.map((char, i) => (
          <TianZiGeCell key={i} char={char} />
        ))}
      </div>
    </div>
  );
}

/* ────────── Main Page ────────── */
export default function WorksheetGeneratorPage() {
  const [inputText, setInputText] = useState("");
  const [generatedChars, setGeneratedChars] = useState<string[] | null>(null);
  const [gridStyle, setGridStyle] = useState<"tianzige">("tianzige");

  const charCount = inputText.length;
  const isOver50 = charCount > 50;
  const isOver200 = charCount > 200;

  const handleGenerate = useCallback(() => {
    const chars = inputText.trim().split("");
    if (chars.length === 0) return;
    setGeneratedChars(chars);
  }, [inputText]);

  const handleReset = useCallback(() => {
    setInputText("");
    setGeneratedChars(null);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <>
      <SiteHeader />

      <main>
        {/* ═════ HERO ═════ */}
        <section className="py-20 bg-gradient-to-b from-[#EFF6FF] to-white max-sm:py-12">
          <div className="max-w-[800px] mx-auto px-8 max-sm:px-4 text-center">
            <h1 className="text-[40px] font-bold leading-[1.1] tracking-tight text-[#0F172A] mb-5 max-sm:text-[28px]">
              Chinese Character Practice Sheet Generator
            </h1>
            <p className="text-lg leading-relaxed text-[#64748B] mb-8 max-sm:text-[15px]">
              Type any Chinese characters, choose your grid style, and print a clean practice sheet in seconds. Perfect for HSK 1 learners, teachers, and parents.
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
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 max-sm:p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
              {/* Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                  Enter Chinese characters to practice
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="例如：我爱学习汉语"
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg font-normal text-lg chinese-char resize-y min-h-[80px] outline-none transition-all duration-150 ${
                    isOver200
                      ? "border-[#DC2626] ring-2 ring-[#DC2626]/20"
                      : "border-[#E2E8F0] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                  }`}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-[#64748B]">
                    Tip: Start with 5–10 characters for one page. You can generate multiple sheets.
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      isOver200
                        ? "text-[#DC2626]"
                        : isOver50
                          ? "text-[#F59E0B]"
                          : "text-[#64748B]"
                    }`}
                  >
                    {charCount} / 200
                  </span>
                </div>
                {isOver200 && (
                  <p className="text-xs text-[#DC2626] mt-1">
                    Input exceeds 200 characters. For best results, split into multiple sheets.
                  </p>
                )}
              </div>

              {/* Grid Selector */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                  Grid Style
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setGridStyle("tianzige")}
                    className={`px-4 py-3 rounded-lg border-2 cursor-pointer text-sm font-medium transition-all duration-150 ${
                      gridStyle === "tianzige"
                        ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                        : "border-[#E2E8F0] bg-white text-[#334155] hover:border-[#2563EB]"
                    }`}
                  >
                    Tian Zi Ge (田字格) — recommended for beginners
                  </button>
                  <button
                    disabled
                    className="px-4 py-3 rounded-lg border-2 border-[#E2E8F0] bg-white text-[#94A3B8] text-sm font-medium cursor-not-allowed opacity-50"
                  >
                    Mi Zi Ge — Coming soon
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-8">
                <button
                  onClick={handleGenerate}
                  disabled={charCount === 0}
                  className="inline-flex items-center justify-center gap-2 bg-[#2563EB] text-white px-6 py-3 rounded-full text-base font-semibold transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#1D4ED8] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2563EB]"
                >
                  Generate Practice Sheet
                </button>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 bg-transparent text-[#64748B] px-6 py-3 rounded-full text-base font-semibold border-[1.5px] border-[#E2E8F0] transition-all duration-200 hover:bg-[#F8FAFC] hover:border-[#94A3B8] active:scale-[0.98]"
                >
                  Clear & Start Over
                </button>
                <button
                  onClick={handlePrint}
                  disabled={!generatedChars || generatedChars.length === 0}
                  className="inline-flex items-center justify-center gap-2 bg-transparent text-[#2563EB] px-6 py-3 rounded-full text-base font-semibold border-[1.5px] border-[#2563EB] transition-all duration-200 hover:bg-[#EFF6FF] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  Print
                </button>
              </div>

              {/* Preview */}
              <div className="print-area">
                {generatedChars && generatedChars.length > 0 ? (
                  <GridPreview chars={generatedChars} />
                ) : (
                  <div className="bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-xl p-12 text-center">
                    <svg
                      viewBox="0 0 24 24"
                      width="48"
                      height="48"
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mx-auto mb-4"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    <p className="text-sm text-[#94A3B8]">
                      Enter characters and click Generate to see your practice sheet preview
                    </p>
                  </div>
                )}
              </div>
            </div>
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
                <li>Enable "Background graphics" in print settings if grids do not appear</li>
                <li>For best practice experience, use slightly thicker paper (90gsm+)</li>
              </ul>
              <p className="text-sm text-[#64748B]">
                Most browsers support clean printing. Press Ctrl+P (Windows) or Cmd+P (Mac), then select "Save as PDF" if you want a digital copy.
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
              HSKKit is an independent study tool and is not affiliated with, endorsed by, or operated by the official
              HSK test organizers. This worksheet generator is provided as a supplementary learning resource.
            </p>
            <p className="text-xs text-[#94A3B8] text-center leading-relaxed">
              This tool generates practice sheets for personal or classroom study. It does not provide official HSK materials or guarantee test results.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
