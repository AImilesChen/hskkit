"use client";

import Link from "next/link";
import { useState } from "react";
import { MOCK_FORMS, mockPaperHref } from "@/lib/formal-exams/offer";

type Sample = {
  questionNumber: number;
  context: string;
  prompt: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  readingMinutes: number;
};

function ClockIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2" strokeLinecap="round"/></svg>;
}

export function MockExamDemo({ sample }: { sample: Sample }) {
  const [selected, setSelected] = useState<string | null>(null);
  const correctOption = sample.options.find(option => option.key === sample.correctAnswer)!;
  const isCorrect = selected === sample.correctAnswer;
  return <>
    <div className="mock-demo-label"><span className="mock-demo-dot" aria-hidden="true"/><p>Interactive preview <span>· HSK 1 Paper A</span></p></div>
    <div className="mock-demo-grid">
      <article className="mock-demo-card" data-tone="violet" aria-labelledby="mock-answer-title">
        <header className="mock-demo-heading"><span className="mock-demo-step" aria-hidden="true">01</span><div><h3 id="mock-answer-title">Practise with a timer.</h3><p>Try a real question from a complete paper.</p></div></header>
        <div className="mock-question-preview">
          <div className="mock-question-meta"><span>Reading · Q{sample.questionNumber}</span><span className="mock-section-time"><ClockIcon/>{sample.readingMinutes} min section</span></div>
          <p className="mock-preview-context" lang="zh-Hans">{sample.context}</p>
          <p className="mock-preview-prompt" lang="zh-Hans">{sample.prompt}</p>
          <div className="mock-preview-options" role="group" aria-label="Sample answer choices">
            {sample.options.map(option => <button type="button" key={option.key} aria-pressed={selected === option.key} onClick={() => setSelected(selected === option.key ? null : option.key)}><span className="mock-option-letter">{option.key}</span><span lang="zh-Hans">{option.text}</span><span className="mock-option-check" aria-hidden="true">{selected === option.key ? "✓" : ""}</span></button>)}
          </div>
        </div>
        <p className="mock-demo-card-note">{selected ? isCorrect ? "Correct. See the explanation in the answer card." : `You chose ${selected}. See why ${sample.correctAnswer} is correct in the answer card.` : "Pick an option to see the feedback."}</p>
      </article>

      <article className="mock-demo-card" data-tone="green" aria-labelledby="mock-review-title">
        <header className="mock-demo-heading"><span className="mock-demo-step" aria-hidden="true">02</span><div><h3 id="mock-review-title">Review the answer.</h3><p>See the reason behind the right choice.</p></div></header>
        <div className="mock-answer-preview">
          <div className="mock-answer-label"><span className="mock-answer-tick" aria-hidden="true">✓</span><span>Correct answer · {sample.correctAnswer}</span></div>
          <p className="mock-answer-hanzi" lang="zh-Hans">{correctOption.text}</p>
          <p className="mock-answer-explanation">{sample.explanation}</p>
          <p className="mock-choice-feedback" data-state={selected ? isCorrect ? "correct" : "different" : "idle"} role="status" aria-live="polite">{selected ? isCorrect ? `You chose ${selected}. That’s correct.` : `You chose ${selected}. The correct answer is ${sample.correctAnswer}.` : "Choose an answer in the preview to try it."}</p>
        </div>
        <p className="mock-demo-card-note">Full papers also include listening recordings and scripts after submission.</p>
      </article>

      <article className="mock-demo-card" data-tone="amber" aria-labelledby="mock-paper-title">
        <header className="mock-demo-heading"><span className="mock-demo-step" aria-hidden="true">03</span><div><h3 id="mock-paper-title">Try a different paper.</h3><p>Fresh questions at the same HSK level.</p></div></header>
        <div className="mock-paper-preview"><p className="mock-paper-collection-label">Explore HSK 1</p>{MOCK_FORMS.map(form => <Link href={mockPaperHref(1, form)} prefetch={false} key={form} className="mock-preview-paper" data-form={form}><span className="mock-paper-cover" aria-hidden="true">{form.toUpperCase()}</span><span className="mock-paper-copy"><strong>Paper {form.toUpperCase()}</strong><span>{form === "a" ? "Your first complete run" : "A different question set"}</span></span><span className="mock-paper-access">{form === "a" ? "Free" : "Pro"}</span><span className="mock-paper-arrow" aria-hidden="true">↗</span></Link>)}</div>
        <p className="mock-demo-card-note">Paper A is free at every level. Pro includes A, B and C.</p>
      </article>
    </div>
    <div className="mock-demo-full-sample"><p>A preview question. Your full paper starts when you’re ready.</p><Link href={mockPaperHref(1, "a")} prefetch={false}>Try full Paper A <span aria-hidden="true">→</span></Link></div>
  </>;
}
