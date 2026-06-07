"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { trackEvent, AnalyticsEvents } from "../../lib/analytics";

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

export function StoryCard({ story }: { story: Story }) {
  const [activeChip, setActiveChip] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const handleVocabTap = (idx: number, hanzi: string) => {
    const next = activeChip === idx ? null : idx;
    setActiveChip(next);
    if (next !== null) {
      trackEvent(AnalyticsEvents.reading_vocab_tap, {
        story_id: story.id,
        vocab: hanzi,
      });
    }
  };

  const handleComplete = () => {
    setIsComplete(true);
    try {
      const key = "hskkit.reading.progress";
      const saved = JSON.parse(localStorage.getItem(key) || "{}");
      localStorage.setItem(
        key,
        JSON.stringify({
          ...saved,
          [`story-${story.id}`]: new Date().toISOString(),
        })
      );
    } catch {
      // Local progress is optional; the completion UI still works.
    }
    trackEvent(AnalyticsEvents.reading_story_complete, {
      story_id: story.id,
      target_vocab_count: story.targetVocab.length,
    });
  };

  const renderHighlightedChineseText = () => {
    const vocabByLength = story.targetVocab
      .map((v, idx) => ({ ...v, idx }))
      .sort((a, b) => b.hanzi.length - a.hanzi.length);
    const parts: ReactNode[] = [];
    let i = 0;

    while (i < story.chineseText.length) {
      const match = vocabByLength.find((v) =>
        story.chineseText.startsWith(v.hanzi, i)
      );

      if (!match) {
        parts.push(<span key={`text-${i}`}>{story.chineseText[i]}</span>);
        i += 1;
        continue;
      }

      const isActive = activeChip === match.idx;
      parts.push(
        <button
          key={`vocab-${i}-${match.hanzi}`}
          type="button"
          onClick={() => handleVocabTap(match.idx, match.hanzi)}
          className={`relative inline-flex items-baseline rounded-md px-1 py-0.5 mx-0.5 border transition-colors duration-150 ${
            isActive
              ? "bg-[#DBEAFE] border-[#2563EB] text-[#1D4ED8]"
              : "bg-[#FEF3C7] border-[#F59E0B] text-[#0F172A] hover:bg-[#DBEAFE] hover:border-[#2563EB]"
          }`}
          aria-label={`${match.hanzi}, ${match.pinyin}, ${match.meaning}`}
        >
          <span>{match.hanzi}</span>
          {isActive && (
            <span className="ml-1 text-xs text-[#2563EB] font-sans">
              {match.pinyin} · {match.meaning}
            </span>
          )}
        </button>
      );
      i += match.hanzi.length;
    }

    return parts;
  };

  return (
    <article
      id={`story-${story.id}`}
      className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-[0_4px_12px_rgba(0,0,0,0.06)] mb-12 max-sm:p-5 max-sm:mb-8 scroll-mt-24"
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-6 max-sm:gap-3">
        <div className="w-10 h-10 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
          {String(story.id).padStart(2, "0")}
        </div>
        <div>
          <h2
            className="text-2xl font-bold text-[#0F172A] max-sm:text-xl"
            style={{ fontFamily: "var(--font-chinese)" }}
          >
            {story.titleCN}
          </h2>
          <p className="text-lg font-semibold text-[#64748B] mt-1 max-sm:text-base">
            {story.titleEN}
          </p>
          <span className="inline-block mt-2 text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full">
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
          {story.targetVocab.map((v, idx) => (
            <button
              key={idx}
              className={`inline-flex flex-col items-center bg-[#F8FAFC] border rounded-lg px-3 py-2 transition-all duration-200 min-w-[64px] cursor-pointer ${
                activeChip === idx
                  ? "bg-[#EFF6FF] border-[#2563EB] shadow-[0_4px_12px_rgba(37,99,235,0.08)]"
                  : "border-[#E2E8F0] hover:bg-[#EFF6FF] hover:border-[#2563EB]"
              }`}
              onClick={() => handleVocabTap(idx, v.hanzi)}
            >
              <span
                className="text-lg font-semibold text-[#C23A30]"
                style={{ fontFamily: "var(--font-chinese)" }}
              >
                {v.hanzi}
              </span>
              <span className="text-xs text-[#64748B] mt-0.5">{v.pinyin}</span>
              {activeChip === idx && (
                <span className="text-xs text-[#334155] mt-1 text-center">
                  {v.meaning}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chinese Text */}
      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-3">
          Chinese Text
        </div>
        <p
          className="text-lg leading-[1.8] text-[#0F172A] max-sm:text-base"
          style={{ fontFamily: "var(--font-chinese)" }}
        >
          {renderHighlightedChineseText()}
        </p>
      </div>

      {/* Pinyin */}
      <div className="bg-[#F8FAFC] rounded-lg p-4 mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2">
          Pinyin
        </div>
        <p
          className="text-sm leading-[1.6] text-[#64748B]"
          style={{
            fontFamily: "var(--font-body)",
            letterSpacing: "0.02em",
          }}
        >
          {story.pinyinText}
        </p>
      </div>

      {/* English Summary */}
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-3">
          English Summary
        </div>
        <p className="text-base leading-[1.7] text-[#334155] italic">
          {story.englishSummary}
        </p>
      </div>

      {/* Questions */}
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-3">
          Comprehension Questions
        </div>
        <div className="divide-y divide-[#E2E8F0]">
          {story.questions.map((q, idx) => (
            <div key={idx} className="py-4 first:pt-0 last:pb-0">
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
      <div className="bg-[#FEF3C7] border-l-4 border-[#F59E0B] rounded-lg p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#92400E] mb-2">
          Study Tip
        </div>
        <p className="text-base leading-relaxed text-[#78350F]">
          {story.studyTip}
        </p>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleComplete}
          className="inline-flex items-center justify-center bg-[#2563EB] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 hover:bg-[#1D4ED8]"
        >
          {isComplete ? "Story complete ✓" : "Mark story complete"}
        </button>
        <Link
          href="/hsk-1-practice-test"
          className="inline-flex items-center justify-center bg-[#EFF6FF] text-[#2563EB] px-5 py-2.5 rounded-full text-sm font-semibold no-underline border border-[#DBEAFE] hover:bg-[#DBEAFE]"
        >
          Continue to HSK 1 Practice
        </Link>
        <Link
          href={`/tools/chinese-character-practice-sheet-generator?text=${encodeURIComponent(
            story.targetVocab.map((v) => v.hanzi).join("")
          )}`}
          className="inline-flex items-center justify-center bg-white text-[#2563EB] px-5 py-2.5 rounded-full text-sm font-semibold no-underline border border-[#DBEAFE] hover:bg-[#EFF6FF]"
        >
          Generate worksheet from this story
        </Link>
      </div>
    </article>
  );
}
