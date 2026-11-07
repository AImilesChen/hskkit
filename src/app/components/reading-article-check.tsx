"use client";

import { useState } from "react";
import type { ReadingArticleQuestion } from "@/lib/learning/reading-articles";
import { paragraphAnchor, type ReadingEvidence } from "@/lib/learning/reading-article-guidance";
import styles from "./reading-article-check.module.css";

export default function ReadingArticleCheck({ questions }: { questions: Array<ReadingArticleQuestion & { evidence?: ReadingEvidence }> }) {
  const [answers, setAnswers] = useState<Array<number | null>>(() => questions.map(() => null));
  const completed = answers.every((answer) => answer !== null);
  const correct = answers.filter((answer, index) => answer === questions[index].answer).length;
  return <section className={styles.check} aria-labelledby="comprehension-heading" id="comprehension-check">
    <div className={styles.heading}><span>04 · COMPREHENSION CHECK</span><h2 id="comprehension-heading">What did you understand?</h2><p>Answer, check the explanation, then find the evidence in the story.</p><p className={styles.scope}>This self-check does not change your saved review schedule.</p></div>
    <div className={styles.questions}>{questions.map((question, index) => <fieldset key={question.prompt} className={styles.question}>
      <legend>{index + 1}. {question.prompt}</legend>
      <div className={styles.options}>{question.options.map((option, optionIndex) => <button type="button" key={option} className={answers[index] === optionIndex ? styles.chosen : ""} disabled={answers[index] !== null} onClick={() => setAnswers((current) => current.map((value, itemIndex) => itemIndex === index ? optionIndex : value))}>{String.fromCharCode(65 + optionIndex)}. {option}</button>)}</div>
      {answers[index] !== null && <div className={answers[index] === question.answer ? styles.correct : styles.incorrect} role="status"><strong>{answers[index] === question.answer ? "Correct" : `Answer: ${question.options[question.answer]}`}</strong><p>{question.explanation}</p>{question.evidence && <div className={styles.evidence}><span>From the story · Paragraph {question.evidence.paragraph + 1}</span><blockquote lang="zh-Hans">{question.evidence.quote}</blockquote><a href={`#${paragraphAnchor(question.evidence.paragraph)}`}>Find this in the article <span aria-hidden="true">↑</span></a></div>}</div>}
    </fieldset>)}</div>
    {completed && <div className={styles.result} role="status"><p>You answered {correct} of {questions.length} correctly. Re-read the article or try the questions again.</p><button type="button" onClick={() => setAnswers(questions.map(() => null))}>Try again</button></div>}
  </section>;
}
