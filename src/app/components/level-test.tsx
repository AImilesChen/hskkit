"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  QuestionTitle,
  OptionButton,
  FeedbackBox,
  ReviewCard,
  getOptionDisplayMode,
} from "./question-display";

interface LevelQuestion {
  id: string;
  level: number;
  type: string;
  question_cn: string;
  question_en: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation: string;
}

interface LevelTestProps {
  questions: LevelQuestion[];
  title?: string;
  description?: string;
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

function pickQuestions(all: LevelQuestion[]): LevelQuestion[] {
  const byLevel: Record<number, LevelQuestion[]> = {};
  all.forEach((q) => {
    if (!byLevel[q.level]) byLevel[q.level] = [];
    byLevel[q.level].push(q);
  });

  const picked: LevelQuestion[] = [];
  const distribution = [2, 2, 2, 2, 1, 1];
  for (let i = 0; i < 6; i++) {
    const level = i + 1;
    const pool = byLevel[level] || [];
    const count = Math.min(distribution[i], pool.length);
    picked.push(...shuffleArray(pool).slice(0, count));
  }

  if (picked.length < 8) {
    const remaining = shuffleArray(
      all.filter((q) => !picked.includes(q))
    ).slice(0, 8 - picked.length);
    picked.push(...remaining);
  }

  return shuffleArray(picked).slice(0, 8);
}

function getRecommendedLevel(
  questions: LevelQuestion[],
  answers: Record<number, string>
): { level: number; label: string; desc: string; href: string; vocabLabel: string } {
  const levelScores: Record<number, { correct: number; total: number }> = {};
  questions.forEach((q, i) => {
    if (!levelScores[q.level]) levelScores[q.level] = { correct: 0, total: 0 };
    levelScores[q.level].total++;
    if (answers[i] === q.correct_answer) {
      levelScores[q.level].correct++;
    }
  });

  let recommended = 1;
  for (let l = 1; l <= 6; l++) {
    const s = levelScores[l];
    if (s && s.total > 0 && s.correct / s.total >= 0.6) {
      recommended = l;
    }
  }

  const labels: Record<number, { label: string; desc: string }> = {
    1: {
      label: "HSK 1",
      desc: "Start with the basics. Build your foundation with beginner vocabulary and simple sentence patterns.",
    },
    2: {
      label: "HSK 2",
      desc: "You know beginner basics. Expand into elementary sentences and daily topics.",
    },
    3: {
      label: "HSK 3",
      desc: "You handle elementary Chinese well. Intermediate vocabulary and longer texts are your next step.",
    },
    4: {
      label: "HSK 4",
      desc: "You have a solid intermediate base. Work on advanced vocabulary and complex reading passages.",
    },
    5: {
      label: "HSK 5",
      desc: "You are approaching advanced level. Focus on abstract topics, inference, and nuanced grammar.",
    },
    6: {
      label: "HSK 6",
      desc: "You have a strong advanced foundation. Keep refining your skills with native-level content.",
    },
  };

  const info = labels[recommended] || labels[1];
  return {
    level: recommended,
    label: info.label,
    desc: info.desc,
    href: `/hsk-${Math.min(recommended, 5)}-vocabulary`,
    vocabLabel: `Study ${info.label} Vocabulary`,
  };
}

export default function LevelTest({
  questions: allQuestions,
  title = "Quick HSK Level Check",
  description = "8 short questions. No timer. Get a suggested HSK level and a personalized next step.",
}: LevelTestProps) {
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<LevelQuestion[]>(() =>
    pickQuestions(allQuestions)
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

  const result = useMemo(() => {
    if (!showResult) return null;
    return getRecommendedLevel(questions, answers);
  }, [showResult, questions, answers]);

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
    setQuestions(pickQuestions(allQuestions));
    setCurrentIndex(0);
    setAnswers({});
    setChecked({});
    setShowResult(false);
    setStarted(false);
  }, [allQuestions]);

  const isCorrect =
    answers[currentIndex] === currentQuestion?.correct_answer;
  const optionMode = getOptionDisplayMode(
    currentQuestion?.type || "",
    currentQuestion?.level || 1
  );

  if (!started) {
    return (
      <div className="max-w-[720px] mx-auto px-8 max-sm:px-4 py-20 max-sm:py-12 text-center">
        <h1 className="text-[48px] font-bold leading-[1.1] tracking-tight text-[#0F172A] mb-5 max-sm:text-[32px]">
          {title}
        </h1>
        <p className="text-lg leading-relaxed text-[#64748B] mb-8">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => setStarted(true)}
            className="inline-flex items-center justify-center gap-2 bg-[#2563EB] text-white px-8 py-4 rounded-full text-lg font-semibold border-none cursor-pointer transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#1D4ED8] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:scale-[0.98]"
          >
            Start the Level Check
          </button>
          <Link
            href="/hsk-levels"
            className="inline-flex items-center justify-center gap-2 bg-transparent text-[#2563EB] px-8 py-4 rounded-full text-lg font-semibold no-underline border-[1.5px] border-[#2563EB] transition-all duration-200 hover:bg-[#EFF6FF]"
          >
            Compare HSK Levels
          </Link>
        </div>
        <p className="text-[13px] font-medium text-[#64748B] mt-6">
          This is a self-assessment tool, not an official HSK test.
        </p>
      </div>
    );
  }

  if (showResult && result) {
    const accuracy = Math.round((correctCount / total) * 100);
    const wrongQuestions = questions
      .map((q, i) => ({ ...q, index: i, userAnswer: answers[i] }))
      .filter((q) => q.userAnswer !== q.correct_answer);

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
          <div className="text-sm font-semibold text-[#2563EB] uppercase tracking-wider mb-2">
            Suggested Level
          </div>
          <h2 className="text-[32px] font-bold text-[#0F172A] mb-3">
            {result.label}
          </h2>
          <p className="text-base leading-relaxed text-[#334155] mb-6">
            {result.desc}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={result.href}
              className="inline-flex items-center justify-center gap-2 bg-[#2563EB] text-white px-6 py-3 rounded-full text-base font-semibold no-underline transition-all duration-200 hover:bg-[#1D4ED8]"
            >
              {result.vocabLabel}
            </Link>
            <Link
              href={`/hsk-${Math.min(result.level, 5)}-practice-test`}
              className="inline-flex items-center justify-center gap-2 bg-[#0F172A] text-white px-6 py-3 rounded-full text-base font-semibold no-underline transition-all duration-200 hover:bg-[#1e293b]"
            >
              Try {result.label} Practice Test
            </Link>
          </div>
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

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRestart}
            className="inline-flex items-center justify-center gap-2 bg-transparent text-[#2563EB] px-6 py-3 rounded-full text-base font-semibold border-[1.5px] border-[#2563EB] cursor-pointer transition-all duration-200 hover:bg-[#EFF6FF]"
          >
            Retake the Level Check
          </button>
          <Link
            href="/hsk-1-practice-test"
            className="inline-flex items-center justify-center gap-2 bg-[#0F172A] text-white px-6 py-3 rounded-full text-base font-semibold no-underline transition-all duration-200 hover:bg-[#1e293b]"
          >
            Try Sample Practice Questions
          </Link>
        </div>
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
          HSK {currentQuestion.level} · {currentQuestion.type}
        </p>
        <QuestionTitle
          questionCn={currentQuestion.question_cn}
          questionEn={currentQuestion.question_en}
        />
      </div>

      {/* Options */}
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
          <span className="text-sm text-[#94A3B8]">
            Select an answer to continue
          </span>
        )}
      </div>
    </div>
  );
}
