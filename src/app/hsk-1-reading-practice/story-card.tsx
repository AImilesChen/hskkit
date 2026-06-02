"use client";

import { useState } from "react";
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
            style={{ fontFamily: "'Noto Serif SC', STSong, serif" }}
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
                style={{ fontFamily: "'Noto Serif SC', STSong, serif" }}
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
          style={{ fontFamily: "'Noto Serif SC', STSong, serif" }}
        >
          {story.chineseText}
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
            fontFamily: "Inter, system-ui, sans-serif",
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
    </article>
  );
}
