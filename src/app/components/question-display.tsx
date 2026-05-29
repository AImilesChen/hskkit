"use client";

import { useMemo } from "react";

export type OptionDisplayMode =
  | "english_only"
  | "chinese_with_hint"
  | "chinese_only";

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

/* ────────── helpers ────────── */

/** 从 "我很好，谢谢。 / I'm fine, thank you." 中分离中文和英文 */
function splitBilingual(text: string): { cn: string; en: string } {
  const parts = text.split(" / ");
  if (parts.length >= 2) {
    return { cn: parts[0].trim(), en: parts.slice(1).join(" / ").trim() };
  }
  // 如果没有 " / " 分隔符，尝试判断是中文还是英文开头
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const hasEnglish = /[a-zA-Z]/.test(text);
  if (hasChinese && !hasEnglish) return { cn: text, en: "" };
  if (!hasChinese && hasEnglish) return { cn: "", en: text };
  return { cn: text, en: "" };
}

/** 从 question_en 提取拼音（括号内内容）和英文翻译 */
function parseQuestionEn(questionEn: string): { pinyin: string; en: string } {
  // 匹配括号内的拼音，如 "Nǐ hǎo ma?" 或 "(shuǐ)"
  const pinyinMatch = questionEn.match(/\(([^)]+)\)/);
  if (pinyinMatch) {
    const pinyin = pinyinMatch[1].trim();
    const en = questionEn.replace(pinyinMatch[0], "").trim().replace(/\s+/g, " ");
    return { pinyin, en };
  }
  // 如果整个字符串看起来像拼音（带声调符号），则当作拼音
  if (/^[\u0100-\u017Fa-zA-Z\s\?\.\,\!\']+$/.test(questionEn.trim()) && /[\u0100-\u017F]/.test(questionEn)) {
    return { pinyin: questionEn.trim(), en: "" };
  }
  return { pinyin: "", en: questionEn.trim() };
}

/** 根据题型和级别决定选项显示模式 */
export function getOptionDisplayMode(
  type: string,
  level: number
): OptionDisplayMode {
  const t = type.toLowerCase();
  if (t === "vocabulary") return "english_only";
  if (t === "reading") return "chinese_only";
  if (t === "listening" || t === "grammar") {
    return level <= 2 ? "chinese_with_hint" : "chinese_only";
  }
  return "chinese_only";
}

/** 按模式渲染选项文本 */
export function formatOption(
  rawOption: string,
  mode: OptionDisplayMode
): string {
  const { cn, en } = splitBilingual(rawOption);
  switch (mode) {
    case "english_only":
      return en || cn;
    case "chinese_with_hint":
      if (cn && en) return `${cn} (${en})`;
      return cn || en || rawOption;
    case "chinese_only":
      return cn || rawOption;
    default:
      return rawOption;
  }
}

/** 按模式渲染解析文本（优先英文） */
export function formatExplanation(
  rawExplanation: string
): string {
  // 如果 explanation 包含 " / "，优先取英文部分
  const parts = rawExplanation.split(" / ");
  if (parts.length >= 2) {
    // 取最后一个英文部分
    return parts[parts.length - 1].trim();
  }
  // 如果没有分隔符，判断是中文还是英文
  const hasChinese = /[\u4e00-\u9fff]/.test(rawExplanation);
  const hasEnglish = /[a-zA-Z]{3,}/.test(rawExplanation);
  if (hasEnglish && !hasChinese) return rawExplanation;
  if (hasChinese && !hasEnglish) return rawExplanation;
  // 混合内容，优先返回英文部分（如果有明显英文句子）
  const enMatch = rawExplanation.match(/[A-Z][a-zA-Z\s,.'"-]+[.!?]/);
  if (enMatch) return enMatch[0].trim();
  return rawExplanation;
}

/* ────────── components ────────── */

/** 题目显示：中文主标题 + 拼音 + 英文小字 */
export function QuestionTitle({
  questionCn,
  questionEn,
  passageCn,
  passageEn,
}: {
  questionCn: string;
  questionEn: string;
  passageCn?: string;
  passageEn?: string;
}) {
  const { pinyin, en } = useMemo(
    () => parseQuestionEn(questionEn),
    [questionEn]
  );

  return (
    <div className="mb-6">
      {passageCn && (
        <div className="bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl px-5 py-4 mb-5">
          <p className="text-[14px] leading-relaxed text-[#475569] mb-2">{passageCn}</p>
          {passageEn && (
            <p className="text-[13px] leading-relaxed text-[#64748B]">{passageEn}</p>
          )}
        </div>
      )}
      <h2 className="text-[24px] font-semibold leading-snug text-[#0F172A] mb-1">
        {questionCn}
      </h2>
      {pinyin && (
        <p className="text-base text-[#64748B] mb-1 font-medium">
          {pinyin}
        </p>
      )}
      {en && (
        <p className="text-sm text-[#94A3B8]">{en}</p>
      )}
      {!pinyin && !en && questionEn && (
        <p className="text-sm text-[#94A3B8]">{questionEn}</p>
      )}
    </div>
  );
}

/** 选项按钮 */
export function OptionButton({
  letter,
  rawOption,
  mode,
  isSelected,
  isCorrectAnswer,
  hasChecked,
  onClick,
}: {
  letter: string;
  rawOption: string;
  mode: OptionDisplayMode;
  isSelected: boolean;
  isCorrectAnswer: boolean;
  hasChecked: boolean;
  onClick: () => void;
}) {
  const displayText = useMemo(
    () => formatOption(rawOption, mode),
    [rawOption, mode]
  );

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
      onClick={onClick}
      disabled={hasChecked}
      className={btnClass}
    >
      <span className="inline-block w-8 font-bold">{letter})</span>
      {displayText}
    </button>
  );
}

/** 反馈区域（对错 + 解析） */
export function FeedbackBox({
  isCorrect,
  rawExplanation,
}: {
  isCorrect: boolean;
  rawExplanation: string;
}) {
  const explanation = useMemo(
    () => formatExplanation(rawExplanation),
    [rawExplanation]
  );

  return (
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
      <p className="text-sm text-[#334155]">{explanation}</p>
    </div>
  );
}

/** 错题回顾卡片 */
export function ReviewCard({
  q,
  userAnswer,
  index,
}: {
  q: Question;
  userAnswer: string;
  index: number;
}) {
  const mode = getOptionDisplayMode(q.type, q.level);
  const correctDisplay = formatOption(q.options[q.correct_answer], mode);
  const explanation = formatExplanation(q.explanation);
  const { pinyin, en } = parseQuestionEn(q.question_en);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      {q.passage_cn && (
        <div className="bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl px-4 py-3 mb-4">
          <p className="text-[14px] leading-relaxed text-[#475569] mb-1">{q.passage_cn}</p>
          {q.passage_en && (
            <p className="text-[12px] leading-relaxed text-[#64748B]">{q.passage_en}</p>
          )}
        </div>
      )}
      <p className="text-sm font-semibold text-[#EF4444] mb-2">
        Question {index + 1} · HSK {q.level} · Your answer: {userAnswer}
      </p>
      <p className="text-base font-medium text-[#0F172A] mb-1">
        {q.question_cn}
      </p>
      {pinyin && (
        <p className="text-sm text-[#64748B] mb-0.5">{pinyin}</p>
      )}
      {en && (
        <p className="text-sm text-[#94A3B8] mb-3">{en}</p>
      )}
      {!pinyin && !en && q.question_en && (
        <p className="text-sm text-[#94A3B8] mb-3">{q.question_en}</p>
      )}
      <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-lg px-4 py-3 mb-2">
        <p className="text-sm font-medium text-[#166534]">
          Correct: {q.correct_answer}) {correctDisplay}
        </p>
      </div>
      <p className="text-sm text-[#334155]">{explanation}</p>
    </div>
  );
}
