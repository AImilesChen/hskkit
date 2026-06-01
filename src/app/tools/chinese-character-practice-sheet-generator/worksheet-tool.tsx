"use client";

import { useState, useCallback } from "react";

const MAX_CHARS = 200;
const WARNING_CHARS = 50;

function extractChineseChars(input: string): string[] {
  // Extract CJK Unified Ideographs (common Chinese characters)
  const cjkRegex = /[\u4e00-\u9fff]/gu;
  return input.match(cjkRegex) || [];
}

function TianZiGeCell({ char }: { char: string }) {
  return (
    <div className="relative w-[80px] h-[80px] border border-[#0F172A] flex items-center justify-center max-sm:w-[60px] max-sm:h-[60px]">
      {/* Horizontal dashed center line */}
      <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dashed border-[#94A3B8] pointer-events-none" />
      {/* Vertical dashed center line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px border-l border-dashed border-[#94A3B8] pointer-events-none" />
      {/* Character */}
      <span
        className="text-[36px] text-[#0F172A] relative z-10 max-sm:text-[28px]"
        style={{ fontFamily: "'Noto Serif SC', STSong, serif" }}
      >
        {char}
      </span>
    </div>
  );
}

export function WorksheetTool() {
  const [input, setInput] = useState("");
  const [generated, setGenerated] = useState(false);
  const [chars, setChars] = useState<string[]>([]);

  const rawCount = input.length;
  const chineseChars = extractChineseChars(input);
  const chineseCount = chineseChars.length;

  const handleGenerate = useCallback(() => {
    if (chineseCount === 0) return;
    setChars(chineseChars);
    setGenerated(true);
  }, [chineseChars, chineseCount]);

  const handleReset = useCallback(() => {
    setInput("");
    setGenerated(false);
    setChars([]);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const counterColor =
    chineseCount > MAX_CHARS
      ? "text-[#DC2626]"
      : chineseCount > WARNING_CHARS
        ? "text-[#F59E0B]"
        : "text-[#64748B]";

  const isOverLimit = chineseCount > MAX_CHARS;

  return (
    <>
      {/* Input Section */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 mb-6 max-sm:p-4">
        <label className="block text-sm font-semibold text-[#0F172A] mb-2">
          Enter Chinese characters to practice
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="例如：我爱学习汉语"
          rows={3}
          className={`w-full px-4 py-3 border rounded-lg text-lg resize-y min-h-[80px] transition-all duration-200 outline-none focus:ring-2 ${
            isOverLimit
              ? "border-[#DC2626] focus:ring-[#DC2626]/20"
              : "border-[#E2E8F0] focus:border-[#2563EB] focus:ring-[#2563EB]/20"
          }`}
          style={{ fontFamily: "'Noto Serif SC', STSong, serif" }}
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-[#64748B]">
            Tip: Start with 5–10 characters for one page. You can generate multiple sheets.
          </p>
          <p className={`text-xs ${counterColor} font-medium`}>
            {chineseCount} / {MAX_CHARS} characters
          </p>
        </div>
        {isOverLimit && (
          <p className="text-xs text-[#DC2626] mt-1">
            Input exceeds recommended limit. Output may span multiple pages.
          </p>
        )}

        {/* Grid Selector */}
        <div className="mt-5">
          <label className="block text-sm font-semibold text-[#0F172A] mb-2">
            Grid Style
          </label>
          <div className="flex gap-3 flex-wrap">
            <div className="px-4 py-3 border-2 border-[#2563EB] bg-[#EFF6FF] rounded-lg text-sm font-medium text-[#2563EB] cursor-default">
              Tian Zi Ge (田字格) — recommended for beginners
            </div>
            <div className="px-4 py-3 border-2 border-[#E2E8F0] rounded-lg text-sm font-medium text-[#94A3B8] opacity-50 cursor-not-allowed">
              Mi Zi Ge — coming soon
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 flex-wrap">
          <button
            onClick={handleGenerate}
            disabled={chineseCount === 0}
            className="inline-flex items-center gap-2 bg-[#2563EB] text-white px-6 py-3 rounded-full text-base font-semibold transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#1D4ED8] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2563EB]"
          >
            Generate Practice Sheet
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 bg-transparent text-[#334155] px-6 py-3 rounded-full text-base font-semibold border-[1.5px] border-[#E2E8F0] transition-all duration-200 hover:border-[#94A3B8] hover:text-[#0F172A]"
          >
            Clear & Start Over
          </button>
          <button
            onClick={handlePrint}
            disabled={!generated}
            className="inline-flex items-center gap-2 bg-transparent text-[#2563EB] px-6 py-3 rounded-full text-base font-semibold border-[1.5px] border-[#2563EB] transition-all duration-200 hover:bg-[#EFF6FF] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            Print
          </button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 max-sm:p-4 print:border-0 print:p-0">
        {!generated ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto mb-4 text-[#CBD5E1]"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
            <p className="text-base text-[#64748B]">
              Enter characters and click Generate to preview your practice sheet
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h3 className="text-lg font-semibold text-[#0F172A]">
                Practice Sheet Preview
              </h3>
              <p className="text-sm text-[#64748B]">
                Press Ctrl+P (or Cmd+P) to print
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {chars.map((c, idx) => (
                <TianZiGeCell key={idx} char={c} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
