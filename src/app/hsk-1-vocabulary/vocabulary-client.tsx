"use client";

import { useState, useMemo } from "react";
import InfoBanner from "../components/info-banner";
import LearningPath from "../components/learning-path";
import words from "../../lib/data/hsk1_vocab.json";

interface Word {
  chinese: string;
  pinyin: string;
  meaning: string;
  example_cn: string;
  example_pinyin: string;
  example_en: string;
}

const typedWords = words as Word[];

const studyTips = [
  "Review 10 words daily rather than 50 once a week",
  "Say each word aloud while reading the pinyin",
  "Write characters by hand to build muscle memory",
  "Test yourself without looking at the meaning first",
];

export default function VocabularyClient() {
  const [search, setSearch] = useState("");
  const [flashIndex, setFlashIndex] = useState(0);
  const [flashFlipped, setFlashFlipped] = useState(false);
  const [flashMode, setFlashMode] = useState(false);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return typedWords;
    return typedWords.filter(
      (w) =>
        w.chinese.includes(s) ||
        w.pinyin.toLowerCase().includes(s) ||
        w.meaning.toLowerCase().includes(s)
    );
  }, [search]);

  const currentFlash = filtered[flashIndex];

  const handleNextFlash = () => {
    setFlashFlipped(false);
    setFlashIndex((prev) => (prev + 1) % filtered.length);
  };

  const handlePrevFlash = () => {
    setFlashFlipped(false);
    setFlashIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
  };

  return (
    <>
      {/* Hero */}
      <section className="section pt-20">
        <div className="section-inner">
          <span className="eyebrow">HSK 1 Vocabulary</span>
          <h1 className="text-h1 max-sm:text-[32px] mb-6">
            Build a clear HSK 1 vocabulary foundation
          </h1>
          <InfoBanner level={1} />
          <p className="text-body-lg text-ink-secondary max-w-[640px] mb-10">
            Start with the most common words in daily Chinese. Each word
            includes pinyin, meaning, and a simple example to help you
            recognize and remember.
          </p>
          <div className="flex gap-4 flex-wrap">
            <a href="/hsk-1-practice-test" className="btn btn-primary">
              Try HSK 1 practice
            </a>
            <a href="/hsk-level-test" className="btn btn-secondary">
              Check your level
            </a>
          </div>
        </div>
      </section>

      {/* Purpose */}
      <section className="section section-alt">
        <div className="section-inner">
          <h2 className="text-h2 max-sm:text-[28px] mb-8">
            What HSK 1 vocabulary is for
          </h2>
          <div className="card-grid">
            <article className="card">
              <h3 className="text-h3 max-sm:text-xl mb-3">
                Starting recognition
              </h3>
              <p className="text-body text-ink-secondary">
                Build confidence by identifying the most common characters and
                words first.
              </p>
            </article>
            <article className="card">
              <h3 className="text-h3 max-sm:text-xl mb-3">
                Pronunciation practice
              </h3>
              <p className="text-body text-ink-secondary">
                Use pinyin to connect what you see with how it sounds.
              </p>
            </article>
            <article className="card">
              <h3 className="text-h3 max-sm:text-xl mb-3">Useful context</h3>
              <p className="text-body text-ink-secondary">
                See words in short phrases so you understand how they work
                together.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Search + Toggle */}
      <section className="section">
        <div className="section-inner">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
            <h2 className="text-h2 max-sm:text-[28px]">
              HSK 1 Vocabulary List ({filtered.length} words)
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => setFlashMode(false)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                  !flashMode
                    ? "bg-[#2563EB] text-white border-[#2563EB]"
                    : "bg-white text-[#334155] border-[#E2E8F0] hover:border-[#2563EB]"
                }`}
              >
                List
              </button>
              <button
                onClick={() => {
                  setFlashMode(true);
                  setFlashFlipped(false);
                  setFlashIndex(0);
                }}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                  flashMode
                    ? "bg-[#2563EB] text-white border-[#2563EB]"
                    : "bg-white text-[#334155] border-[#E2E8F0] hover:border-[#2563EB]"
                }`}
              >
                Flashcards
              </button>
            </div>
          </div>

          <div className="mb-8">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setFlashIndex(0);
                setFlashFlipped(false);
              }}
              placeholder="Search by Chinese, pinyin, or English meaning..."
              className="w-full max-w-[480px] px-5 py-3 rounded-full border border-[#E2E8F0] bg-white text-[#0F172A] text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          {flashMode ? (
            <div className="max-w-[560px] mx-auto">
              {currentFlash ? (
                <>
                  <div className="text-center mb-4 text-sm text-[#64748B]">
                    Card {flashIndex + 1} of {filtered.length}
                  </div>
                  <div
                    onClick={() => setFlashFlipped((v) => !v)}
                    className="bg-white border border-[#E2E8F0] rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] min-h-[280px] flex flex-col justify-center"
                  >
                    {!flashFlipped ? (
                      <>
                        <p className="chinese-char text-[64px] mb-4">
                          {currentFlash.chinese}
                        </p>
                        <p className="text-sm text-[#94A3B8]">
                          Tap to flip
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[28px] font-semibold text-[#0F172A] mb-2">
                          {currentFlash.pinyin}
                        </p>
                        <p className="text-lg text-[#64748B] mb-4">
                          {currentFlash.meaning}
                        </p>
                        <div className="border-t border-[#E2E8F0] pt-4 mt-2">
                          <p className="text-base text-[#334155] mb-1">
                            {currentFlash.example_cn}
                          </p>
                          <p className="text-sm text-[#64748B] mb-1">
                            {currentFlash.example_pinyin}
                          </p>
                          <p className="text-sm text-[#94A3B8]">
                            {currentFlash.example_en}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-6">
                    <button
                      onClick={handlePrevFlash}
                      className="px-5 py-2.5 rounded-full text-sm font-semibold border border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => {
                        setFlashFlipped(false);
                        setFlashIndex(
                          Math.floor(Math.random() * filtered.length)
                        );
                      }}
                      className="px-5 py-2.5 rounded-full text-sm font-semibold border border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                    >
                      Shuffle
                    </button>
                    <button
                      onClick={handleNextFlash}
                      className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                    >
                      Next →
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-center text-[#64748B]">
                  No words match your search.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((word) => (
                <article
                  className="card text-center"
                  key={word.chinese + word.pinyin}
                >
                  <p className="chinese-char text-[48px] mb-2">
                    {word.chinese}
                  </p>
                  <p className="text-small text-ink-muted mb-2">
                    {word.pinyin}
                  </p>
                  <p className="text-body text-ink-secondary mb-3">
                    {word.meaning}
                  </p>
                  <div className="border-t border-[#E2E8F0] pt-3 mt-2">
                    <p className="text-sm text-[#334155] mb-1">
                      {word.example_cn}
                    </p>
                    <p className="text-xs text-[#64748B] mb-0.5">
                      {word.example_pinyin}
                    </p>
                    <p className="text-xs text-[#94A3B8]">
                      {word.example_en}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Study Tips */}
      <section className="section section-alt">
        <div className="section-inner">
          <h2 className="text-h2 max-sm:text-[28px] mb-8">
            Keep beginner vocabulary practice active
          </h2>
          <div className="max-w-[800px]">
            {studyTips.map((tip) => (
              <div
                key={tip}
                className="flex items-start gap-4 py-4 border-b border-border"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4A9B6B"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0 mt-0.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p className="text-body text-ink-secondary">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Path */}
      <section className="section">
        <div className="section-inner">
          <LearningPath level={1} />
        </div>
      </section>
    </>
  );
}
