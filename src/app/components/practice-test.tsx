"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { trackEvent, AnalyticsEvents } from "../../lib/analytics";
import {
  QuestionTitle,
  OptionButton,
  FeedbackBox,
  ReviewCard,
  getOptionDisplayMode,
} from "./question-display";

interface Question {
  id: string;
  level: number;
  type: string;
  question_cn: string;
  question_en: string;
  passage_cn?: string;
  passage_en?: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation: string;
}

interface PracticeTestProps {
  level: number;
  questions: Question[];
  sampleCount?: number;
  title: string;
  description?: string;
  vocabHref: string;
}

const LETTERS = ["A", "B", "C", "D"];
const PRACTICE_PROGRESS_KEY = "hskkit.practice.progress";
const PROGRESS_TTL_DAYS = 7;

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickQuestions(all: Question[], count: number): Question[] {
  return shuffleArray(all).slice(0, count);
}

export default function PracticeTest({
  level,
  questions: allQuestions,
  sampleCount = 10,
  title,
  description,
  vocabHref,
}: PracticeTestProps) {
  const [questions, setQuestions] = useState<Question[]>(() =>
    pickQuestions(allQuestions, sampleCount)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [savedSummary, setSavedSummary] = useState<string | null>(null);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [saveError, setSaveError] = useState("");
  const attemptKeys = useRef<Record<string, string>>({});

  const currentQuestion = questions[currentIndex];
  const total = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / total) * 100);

  const correctCount = useMemo(() => {
    return questions.filter((q, i) => answers[i] === q.correct_answer).length;
  }, [questions, answers]);

  const handleAnswer = useCallback(
    async (letter: string) => {
      if (checked[currentIndex] || savingAnswer) return;
      setSavingAnswer(true);
      setSaveError("");
      const key = attemptKeys.current[currentQuestion.id] ?? crypto.randomUUID();
      attemptKeys.current[currentQuestion.id] = key;
      const body = JSON.stringify({
        action: "attempt",
        payload: { idempotencyKey: key, questionId: currentQuestion.id, answer: letter },
        tzOffset: new Date().getTimezoneOffset(),
      });
      let saved = false;
      for (let attempt = 0; attempt < 3 && !saved; attempt += 1) {
        try {
          const response = await fetch("/api/v1/learning", { method: "POST", headers: { "content-type": "application/json" }, body });
          saved = response.ok;
        } catch {
          saved = false;
        }
      }
      setSavingAnswer(false);
      if (!saved) {
        setSaveError("Your answer was not saved. Check your connection and try again before continuing.");
        return;
      }
      delete attemptKeys.current[currentQuestion.id];
      setAnswers((prev) => ({ ...prev, [currentIndex]: letter }));
      setChecked((prev) => ({ ...prev, [currentIndex]: true }));
    },
    [currentIndex, checked, currentQuestion, savingAnswer]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      const accuracy = Math.round((correctCount / total) * 100);
      trackEvent(AnalyticsEvents.practice_test_complete, {
        level,
        total_questions: total,
        correct_count: correctCount,
        accuracy,
      });
      try {
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + PROGRESS_TTL_DAYS);
        const wrongQuestionIds = questions
          .filter((q, i) => answers[i] !== q.correct_answer)
          .slice(0, 5)
          .map((q) => q.id);
        localStorage.setItem(
          PRACTICE_PROGRESS_KEY,
          JSON.stringify({
            level,
            completedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            totalQuestions: total,
            correctCount,
            accuracy,
            wrongQuestionIds,
          })
        );
        setSavedSummary(`Saved locally for ${PROGRESS_TTL_DAYS} days on this device.`);
      } catch {
        setSavedSummary("Progress summary is shown here, but this browser blocked local saving.");
      }
      setShowResult(true);
    }
  }, [currentIndex, total, level, correctCount, questions, answers]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleRestart = useCallback(() => {
    setQuestions(pickQuestions(allQuestions, sampleCount));
    setCurrentIndex(0);
    setAnswers({});
    setChecked({});
    setShowResult(false);
  }, [allQuestions, sampleCount]);

  const isCorrect = answers[currentIndex] === currentQuestion?.correct_answer;
  const optionMode = getOptionDisplayMode(
    currentQuestion?.type || "",
    currentQuestion?.level || level
  );

  if (showResult) {
    const accuracy = Math.round((correctCount / total) * 100);
    const wrongQuestions = questions
      .map((q, i) => ({ ...q, index: i, userAnswer: answers[i] }))
      .filter((q) => q.userAnswer !== q.correct_answer);

    let recommendation = "";
    let nextHref = "";
    let nextLabel = "";

    if (accuracy >= 90) {
      recommendation =
        level < 5
          ? `Excellent! You're ready for HSK ${level + 1}.`
          : "Excellent! You have a strong command of HSK 5 material.";
      nextHref = level < 5 ? `/hsk-${level + 1}-practice-test` : `/hsk-5-vocabulary`;
      nextLabel = level < 5 ? `Try HSK ${level + 1} Practice Test` : "Review HSK 5 Vocabulary";
    } else if (accuracy >= 70) {
      recommendation = `Good progress! Keep practicing HSK ${level} to solidify your skills.`;
      nextHref = vocabHref;
      nextLabel = `Review HSK ${level} Vocabulary`;
    } else if (accuracy >= 50) {
      recommendation =
        level > 1
          ? `Keep working on HSK ${level}. You may also want to review HSK ${level - 1} fundamentals.`
          : `Keep working on HSK ${level}. Review the basics and try again.`;
      nextHref = vocabHref;
      nextLabel = `Review HSK ${level} Vocabulary`;
    } else {
      recommendation =
        level > 1
          ? `Consider reviewing HSK ${level - 1} material first to build a stronger foundation.`
          : `Keep practicing! Focus on HSK 1 vocabulary and basic sentence patterns.`;
      nextHref = level > 1 ? `/hsk-${level - 1}-vocabulary` : `/hsk-1-vocabulary`;
      nextLabel = level > 1 ? `Review HSK ${level - 1} Vocabulary` : "Review HSK 1 Vocabulary";
    }

    return (
      <div className="max-w-[720px] mx-auto px-8 max-sm:px-4 py-16 max-sm:py-10">
        <div className="text-center mb-10">
          <div className="text-[64px] font-bold text-[#2563EB] mb-2">
            {correctCount}/{total}
          </div>
          <p className="text-lg text-[#64748B] mb-2">questions correct</p>
          <div className="text-[28px] font-bold text-[#0F172A]">{accuracy}%</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-[0_4px_12px_rgba(0,0,0,0.06)] mb-8">
          <h2 className="text-[24px] font-bold text-[#0F172A] mb-3">Result</h2>
          <p className="text-base leading-relaxed text-[#334155] mb-6">{recommendation}</p>
          <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between gap-4 mb-2 max-sm:flex-col max-sm:items-start">
              <h3 className="text-base font-bold text-[#0F172A]">Today’s progress summary</h3>
              <span className="text-sm font-semibold text-[#2563EB]">{accuracy}% complete</span>
            </div>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden mb-3">
              <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${accuracy}%` }} />
            </div>
            <p className="text-sm leading-relaxed text-[#334155] mb-2">
              Save your progress later: {savedSummary || "Your result is ready to save on this device."}
            </p>
            <p className="text-xs leading-relaxed text-[#64748B]">
              Next loop: review missed words, read one HSK 1 story, then print a Tian Zi Ge worksheet for handwriting practice.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={nextHref}
              className="inline-flex items-center justify-center gap-2 bg-[#2563EB] text-white px-6 py-3 rounded-full text-base font-semibold no-underline transition-all duration-200 hover:bg-[#1D4ED8]"
            >
              {nextLabel}
            </Link>
            {level === 1 && (
              <Link
                href="/hsk-1-reading-practice"
                className="inline-flex items-center justify-center gap-2 bg-[#EFF6FF] text-[#2563EB] px-6 py-3 rounded-full text-base font-semibold no-underline border-[1.5px] border-[#2563EB] transition-all duration-200 hover:bg-[#DBEAFE]"
              >
                Read one HSK 1 story
              </Link>
            )}
            <button
              onClick={handleRestart}
              className="inline-flex items-center justify-center gap-2 bg-transparent text-[#2563EB] px-6 py-3 rounded-full text-base font-semibold border-[1.5px] border-[#2563EB] cursor-pointer transition-all duration-200 hover:bg-[#EFF6FF]"
            >
              Retake Practice Test
            </button>
          </div>
          {level === 1 && (
            <div className="mt-4">
              <Link
                href="/tools/chinese-character-practice-sheet-generator"
                className="text-sm font-semibold text-[#2563EB] no-underline hover:underline"
              >
                Generate a handwriting worksheet from missed words →
              </Link>
            </div>
          )}
        </div>

        {wrongQuestions.length > 0 && (
          <div className="mb-8">
            <h3 className="text-[20px] font-bold text-[#0F172A] mb-4">
              Review Mistakes ({wrongQuestions.length})
            </h3>
            <div className="flex flex-col gap-4">
              {wrongQuestions.map((q) => (
                <ReviewCard
                  key={q.id}
                  q={q}
                  userAnswer={q.userAnswer}
                  index={q.index}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto px-8 max-sm:px-4 py-16 max-sm:py-10">
      {/* H1 */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[#0F172A] max-sm:text-[24px] mb-2">{title}</h1>
        {description && (
          <p className="text-base text-[#64748B]">{description}</p>
        )}
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm font-medium text-[#64748B] mb-2">
          <span>
            Question {currentIndex + 1} of {total}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2563EB] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#2563EB] uppercase tracking-wider mb-2">
          HSK {level} · {currentQuestion.type}
        </p>
        <QuestionTitle
          questionCn={currentQuestion.question_cn}
          questionEn={currentQuestion.question_en}
          passageCn={currentQuestion.passage_cn}
          passageEn={currentQuestion.passage_en}
        />
      </div>

      {/* Options */}
      {savingAnswer && <p className="mb-3 text-sm font-semibold text-[#2563EB]" role="status">Saving your answer…</p>}
      {saveError && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{saveError}</p>}
      <div className="flex flex-col gap-3 mb-6">
        {LETTERS.map((letter) => (
          <OptionButton
            key={letter}
            letter={letter}
            rawOption={currentQuestion.options[letter]}
            mode={optionMode}
            isSelected={answers[currentIndex] === letter}
            isCorrectAnswer={currentQuestion.correct_answer === letter}
            hasChecked={!!checked[currentIndex]}
            onClick={() => handleAnswer(letter)}
          />
        ))}
      </div>

      {/* Feedback */}
      {checked[currentIndex] && (
        <FeedbackBox
          isCorrect={isCorrect}
          rawExplanation={currentQuestion.explanation}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border border-[#E2E8F0] bg-white text-[#334155] cursor-pointer transition-all duration-200 hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        {checked[currentIndex] ? (
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 bg-[#2563EB] text-white px-6 py-2.5 rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-[#1D4ED8]"
          >
            {currentIndex === total - 1 ? "See Results" : "Next →"}
          </button>
        ) : (
          <span className="text-sm text-[#94A3B8]">Select an answer to continue</span>
        )}
      </div>
    </div>
  );
}
