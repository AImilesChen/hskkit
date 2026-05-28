"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";

interface Question {
  id: string;
  level: number;
  type: string;
  question_cn: string;
  question_en: string;
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

  const currentQuestion = questions[currentIndex];
  const total = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / total) * 100);

  const correctCount = useMemo(() => {
    return questions.filter((q, i) => answers[i] === q.correct_answer).length;
  }, [questions, answers]);

  const handleAnswer = useCallback(
    (letter: string) => {
      if (checked[currentIndex]) return;
      setAnswers((prev) => ({ ...prev, [currentIndex]: letter }));
      setChecked((prev) => ({ ...prev, [currentIndex]: true }));
    },
    [currentIndex, checked]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowResult(true);
    }
  }, [currentIndex, total]);

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
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={nextHref}
              className="inline-flex items-center justify-center gap-2 bg-[#2563EB] text-white px-6 py-3 rounded-full text-base font-semibold no-underline transition-all duration-200 hover:bg-[#1D4ED8]"
            >
              {nextLabel}
            </Link>
            <button
              onClick={handleRestart}
              className="inline-flex items-center justify-center gap-2 bg-transparent text-[#2563EB] px-6 py-3 rounded-full text-base font-semibold border-[1.5px] border-[#2563EB] cursor-pointer transition-all duration-200 hover:bg-[#EFF6FF]"
            >
              Retake Practice Test
            </button>
          </div>
        </div>

        {wrongQuestions.length > 0 && (
          <div className="mb-8">
            <h3 className="text-[20px] font-bold text-[#0F172A] mb-4">
              Review Mistakes ({wrongQuestions.length})
            </h3>
            <div className="flex flex-col gap-4">
              {wrongQuestions.map((q) => (
                <div
                  key={q.id}
                  className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                >
                  <p className="text-sm font-semibold text-[#EF4444] mb-2">
                    Question {q.index + 1} · Your answer: {q.userAnswer}
                  </p>
                  <p className="text-base font-medium text-[#0F172A] mb-2">
                    {q.question_cn}
                  </p>
                  <p className="text-sm text-[#64748B] mb-3">{q.question_en}</p>
                  <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-lg px-4 py-3 mb-2">
                    <p className="text-sm font-medium text-[#166534]">
                      Correct: {q.correct_answer}) {q.options[q.correct_answer]}
                    </p>
                  </div>
                  <p className="text-sm text-[#334155]">{q.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto px-8 max-sm:px-4 py-16 max-sm:py-10">
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
        <h2 className="text-[24px] font-semibold leading-snug text-[#0F172A] mb-2">
          {currentQuestion.question_cn}
        </h2>
        <p className="text-base text-[#64748B]">{currentQuestion.question_en}</p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3 mb-6">
        {LETTERS.map((letter) => {
          const isSelected = answers[currentIndex] === letter;
          const isCorrectAnswer = currentQuestion.correct_answer === letter;
          const hasChecked = checked[currentIndex];

          let btnClass =
            "w-full text-left px-6 py-4 bg-white border border-[#E2E8F0] rounded-xl text-base font-medium text-[#334155] cursor-pointer transition-all duration-200 hover:border-[#2563EB] hover:bg-[#EFF6FF]";

          if (hasChecked) {
            if (isCorrectAnswer) {
              btnClass =
                "w-full text-left px-6 py-4 bg-[#F0FDF4] border-2 border-[#22C55E] rounded-xl text-base font-semibold text-[#166534] cursor-default";
            } else if (isSelected) {
              btnClass =
                "w-full text-left px-6 py-4 bg-[#FEF2F2] border-2 border-[#EF4444] rounded-xl text-base font-semibold text-[#991B1B] cursor-default";
            } else {
              btnClass =
                "w-full text-left px-6 py-4 bg-white border border-[#E2E8F0] rounded-xl text-base font-medium text-[#94A3B8] cursor-default opacity-70";
            }
          }

          return (
            <button
              key={letter}
              onClick={() => handleAnswer(letter)}
              disabled={hasChecked}
              className={btnClass}
            >
              <span className="inline-block w-8 font-bold">{letter})</span>
              {currentQuestion.options[letter]}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {checked[currentIndex] && (
        <div
          className={`rounded-xl px-6 py-4 mb-6 ${
            isCorrect
              ? "bg-[#F0FDF4] border border-[#86EFAC]"
              : "bg-[#FEF2F2] border border-[#FECACA]"
          }`}
        >
          <p
            className={`text-base font-semibold mb-1 ${
              isCorrect ? "text-[#166534]" : "text-[#991B1B]"
            }`}
          >
            {isCorrect ? "Correct!" : "Incorrect"}
          </p>
          <p className="text-sm text-[#334155]">{currentQuestion.explanation}</p>
        </div>
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
