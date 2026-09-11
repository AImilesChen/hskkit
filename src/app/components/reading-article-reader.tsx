"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReadingArticle, ReadingArticleSummary } from "@/lib/learning/reading-articles";
import type { ReadingArticleProgress } from "@/lib/learning/domain";
import {
  emptyArticleProgress,
  loadMergedReadingProgress,
  readLocalReadingProgress,
  syncReadingProgress,
  writeLocalReadingProgress,
} from "@/lib/learning/reading-progress-client";
import styles from "./reading-library-experience.module.css";

type Feedback = { correct: boolean; correctAnswerText: string; explanation?: string };

export default function ReadingArticleReader({ article, next, higherLevel }: { article: ReadingArticle; next?: ReadingArticleSummary; higherLevel?: ReadingArticleSummary }) {
  const [translationParagraphs, setTranslationParagraphs] = useState<Set<number>>(() => new Set());
  const [showPinyin, setShowPinyin] = useState(false);
  const [selectedWord, setSelectedWord] = useState(0);
  const [openedVocabulary, setOpenedVocabulary] = useState<Set<number>>(() => new Set());
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const [pendingQuestion, setPendingQuestion] = useState<string | undefined>(undefined);
  const [progress, setProgress] = useState<ReadingArticleProgress>(() => emptyArticleProgress(article.slug, article.level));
  const [syncNote, setSyncNote] = useState("Saved on this device");
  const revision = useRef<number | undefined>(undefined);
  const startedAt = useRef(Date.now());
  const lastStoredScroll = useRef(0);

  const saveLocal = useCallback((record: ReadingArticleProgress) => {
    const all = readLocalReadingProgress();
    all[article.slug] = record;
    writeLocalReadingProgress(all);
    setProgress(record);
  }, [article.slug]);

  const sync = useCallback(async (payload: Record<string, unknown>, action: "reading_article_progress" | "reading_article_complete" = "reading_article_progress") => {
    try {
      const result = await syncReadingProgress(action, { articleSlug: article.slug, ...payload }, revision.current);
      revision.current = result.revision;
      setSyncNote(result.scope === "account" ? "Synced to your account" : "Saved for this guest session");
    } catch {
      setSyncNote("Saved on this device; sync will retry later");
    }
  }, [article.slug]);

  useEffect(() => {
    let active = true;
    const openedAt = new Date().toISOString();
    const local = readLocalReadingProgress();
    const opened = { ...(local[article.slug] ?? emptyArticleProgress(article.slug, article.level, openedAt)), lastViewedAt: openedAt };
    saveLocal(opened);
    loadMergedReadingProgress().then((result) => {
      if (!active) return;
      revision.current = result.revision;
      const merged = result.progress[article.slug] ?? opened;
      saveLocal(merged);
      setSyncNote(result.scope === "account" ? "Synced to your account" : result.scope === "guest" ? "Saved for this guest session" : "Saved on this device");
      void sync({ scrollPercent: merged.scrollPercent, readingSeconds: merged.readingSeconds });
    });
    return () => { active = false; };
  }, [article.level, article.slug, saveLocal, sync]);

  useEffect(() => {
    const onScroll = () => {
      const root = document.documentElement;
      const available = Math.max(1, root.scrollHeight - window.innerHeight);
      const percent = Math.min(100, Math.round((window.scrollY / available) * 100));
      if (percent < lastStoredScroll.current + 5) return;
      lastStoredScroll.current = percent;
      saveLocal({ ...progress, scrollPercent: Math.max(progress.scrollPercent, percent), lastViewedAt: new Date().toISOString(), readingSeconds: Math.max(progress.readingSeconds, Math.round((Date.now() - startedAt.current) / 1000)) });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [progress, saveLocal]);

  const answeredCount = Object.keys(feedback).length;
  const correctCount = Object.values(feedback).filter((item) => item.correct).length;
  const accuracy = answeredCount ? Math.round((correctCount / answeredCount) * 100) : 0;
  const selectedVocabulary = article.vocabulary[selectedWord];
  const allAnswered = answeredCount === article.questions.length;
  const wrongQuestions = article.questions.filter((question) => feedback[question.id] && !feedback[question.id].correct);
  const wrongTypes = [...new Set(wrongQuestions.map((question) => question.type ?? "detail"))];

  function toggleParagraphTranslation(index: number) {
    setTranslationParagraphs((current) => {
      const nextSet = new Set(current);
      if (nextSet.has(index)) nextSet.delete(index);
      else nextSet.add(index);
      return nextSet;
    });
  }

  function interactiveParagraph(paragraph: string) {
    const vocabulary = article.vocabulary
      .map((word, index) => ({ ...word, index }))
      .sort((a, b) => b.hanzi.length - a.hanzi.length);
    if (!vocabulary.length) return paragraph;
    const escaped = vocabulary.map((word) => word.hanzi.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const matcher = new RegExp(`(${escaped.join("|")})`, "g");
    const byHanzi = new Map(vocabulary.map((word) => [word.hanzi, word.index]));
    return paragraph.split(matcher).map((part, index) => {
      const wordIndex = byHanzi.get(part);
      return wordIndex === undefined ? part : <button className={styles.inlineWord} type="button" aria-label={`Look up ${part}`} onClick={() => void openVocabulary(wordIndex)} key={`${part}-${index}`}>{part}</button>;
    });
  }

  async function checkAnswer(questionId: string) {
    const answerIndex = answers[questionId];
    if (answerIndex === undefined || feedback[questionId] || pendingQuestion) return;
    setPendingQuestion(questionId);
    try {
      const response = await fetch("/api/v1/learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reading_article_attempt",
          payload: { idempotencyKey: crypto.randomUUID(), articleSlug: article.slug, questionId, answer: String.fromCharCode(65 + answerIndex) },
        }),
      });
      if (!response.ok) throw new Error("submit failed");
      const data = await response.json() as { feedback: Feedback; revision?: number };
      if (data.revision !== undefined) revision.current = data.revision;
      const nextFeedback = { ...feedback, [questionId]: data.feedback };
      setFeedback(nextFeedback);
      const nextAnswered = Object.keys(nextFeedback).length;
      const nextCorrect = Object.values(nextFeedback).filter((item) => item.correct).length;
      const record = {
        ...progress,
        answeredCount: nextAnswered,
        correctCount: nextCorrect,
        accuracy: Math.round((nextCorrect / nextAnswered) * 100),
        needsReview: nextCorrect < nextAnswered,
        lastViewedAt: new Date().toISOString(),
        readingSeconds: Math.max(progress.readingSeconds, Math.round((Date.now() - startedAt.current) / 1000)),
      };
      saveLocal(record);
      void sync({ answeredCount: nextAnswered, correctCount: nextCorrect, readingSeconds: record.readingSeconds });
    } catch {
      setSyncNote("Answer was not recorded. Try again.");
    } finally {
      setPendingQuestion(undefined);
    }
  }

  async function openVocabulary(index: number) {
    setSelectedWord(index);
    setOpenedVocabulary((current) => new Set(current).add(index));
    const word = article.vocabulary[index];
    const record = { ...progress, wordClickCount: progress.wordClickCount + 1, lastViewedAt: new Date().toISOString() };
    saveLocal(record);
    try {
      const result = await syncReadingProgress("reading_article_word", { articleSlug: article.slug, hanzi: word.hanzi }, revision.current);
      revision.current = result.revision;
      setSyncNote(result.scope === "account" ? `${word.hanzi} added to Review` : `${word.hanzi} saved for guest Review`);
    } catch {
      setSyncNote(`${word.hanzi} opened; Review sync will retry later`);
    }
  }

  function toggleFavorite() {
    const record = { ...progress, favorite: !progress.favorite, lastViewedAt: new Date().toISOString() };
    saveLocal(record);
    void sync({ favorite: record.favorite, scrollPercent: record.scrollPercent, answeredCount: record.answeredCount, correctCount: record.correctCount });
  }

  function completeArticle() {
    const seconds = Math.max(progress.readingSeconds, Math.round((Date.now() - startedAt.current) / 1000));
    const record = { ...progress, completed: true, completedAt: progress.completedAt ?? new Date().toISOString(), scrollPercent: 100, answeredCount, correctCount, accuracy, needsReview: correctCount < answeredCount, readingSeconds: seconds, lastViewedAt: new Date().toISOString() };
    saveLocal(record);
    void sync({ completed: true, scrollPercent: 100, answeredCount, correctCount, readingSeconds: seconds }, "reading_article_complete");
  }

  return <article className={styles.readerRoot}>
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link href="/reading">Reading</Link><span>/</span><Link href={`/reading/level/${article.level}`}>HSK {article.level}</Link><span>/</span><span>{article.title}</span></nav>
    <header className={styles.readerHero}>
      <div><p className={styles.sectionEyebrow}>HSK {article.level} · {article.topic}</p><h1 lang="zh-Hans">{article.title}</h1><p>{article.summary}</p></div>
      <dl><div><dt>Words</dt><dd>{article.wordCount}</dd></div><div><dt>Time</dt><dd>{article.minutes} min</dd></div><div><dt>Questions</dt><dd>{article.questions.length}</dd></div><div><dt>Difficulty</dt><dd>{article.difficulty}</dd></div></dl>
      <div className={styles.readerActions}><button type="button" aria-pressed={showPinyin} onClick={() => setShowPinyin((value) => !value)}>Pinyin {showPinyin ? "on" : "off"}</button><button type="button" aria-pressed={progress.favorite} onClick={toggleFavorite}>{progress.favorite ? "★ Saved" : "☆ Save article"}</button><Link href={`/reading/article/${article.slug}`}>Reread from top</Link></div>
      <p className={styles.syncNote} aria-live="polite">{syncNote}</p>
    </header>

    {article.audioSrc ? <section className={styles.audioCard}><div><strong>Article narration</strong><span>{article.audioDisclosure}</span></div><audio controls preload="metadata" src={article.audioSrc}/></section> : null}

    <section className={styles.articleBody} aria-label="Chinese article">{article.paragraphs.map((paragraph, index) => {
      const translationOpen = translationParagraphs.has(index);
      return <div className={styles.articleParagraph} key={`${article.slug}-p-${index}`}><p lang="zh-Hans">{interactiveParagraph(paragraph)}</p>{showPinyin ? <p className={styles.pinyinLine} lang="zh-Latn-pinyin">{article.pinyin[index]}</p> : null}<button className={styles.paragraphTranslationButton} type="button" aria-expanded={translationOpen} onClick={() => toggleParagraphTranslation(index)}>{translationOpen ? `Hide paragraph ${index + 1} translation` : `Show paragraph ${index + 1} translation`}</button>{translationOpen ? <p className={styles.translationLine}>{article.translation[index]}</p> : null}</div>;
    })}</section>

    <section className={styles.vocabularyPanel}><div><p className={styles.sectionEyebrow}>Key vocabulary</p><h2>Tap a word for meaning and Review</h2><div className={styles.wordButtons}>{article.vocabulary.map((word, index) => <button type="button" aria-pressed={selectedWord === index} onClick={() => void openVocabulary(index)} key={word.hanzi}>{word.hanzi}</button>)}</div></div><aside><strong>{selectedVocabulary.hanzi}</strong><span>{selectedVocabulary.pinyin}</span><p>{selectedVocabulary.meaning}</p><Link href={`/dictionary?q=${encodeURIComponent(selectedVocabulary.hanzi)}`}>Open in dictionary →</Link></aside></section>

    <section className={styles.grammarPanel}><p className={styles.sectionEyebrow}>Core grammar</p><h2>Patterns used in this article</h2>{article.grammar.map((item) => <div key={item.pattern}><strong>{item.pattern}</strong><p>{item.explanation}</p><blockquote lang="zh-Hans">{item.example}</blockquote></div>)}</section>

    <section className={styles.articleQuestions}><p className={styles.sectionEyebrow}>Comprehension</p><h2>Answer from this article</h2><p>Check each answer for immediate feedback and the exact supporting evidence.</p>{article.questions.map((question, qIndex) => {
      const result = feedback[question.id];
      return <fieldset key={question.id}><legend>{qIndex + 1}. {question.prompt}</legend>{question.options.map((option, index) => <label key={option} className={answers[question.id] === index ? styles.selectedOption : undefined}><input disabled={Boolean(result)} type="radio" name={question.id} checked={answers[question.id] === index} onChange={() => setAnswers((current) => ({ ...current, [question.id]: index }))}/><span>{String.fromCharCode(65 + index)}. {option}</span></label>)}<button type="button" disabled={answers[question.id] === undefined || Boolean(result) || pendingQuestion === question.id} onClick={() => void checkAnswer(question.id)}>{pendingQuestion === question.id ? "Checking…" : result ? "Answer checked" : "Check answer"}</button>{result ? <div className={result.correct ? styles.correctFeedback : styles.incorrectFeedback} role="status"><strong>{result.correct ? "Correct" : `Review: ${result.correctAnswerText}`}</strong><p>{result.explanation ?? question.explanation}</p><p><b>Evidence:</b> “{question.evidence}”</p></div> : null}</fieldset>;
    })}</section>

    {allAnswered ? <section className={styles.completionCard} aria-live="polite"><p className={styles.sectionEyebrow}>Article summary</p><h2>{accuracy}% correct</h2><dl><div><dt>Reading time</dt><dd>{Math.max(1, Math.round(Math.max(progress.readingSeconds, (Date.now() - startedAt.current) / 1000) / 60))} min</dd></div><div><dt>Vocabulary explored</dt><dd>{openedVocabulary.size || progress.wordClickCount}</dd></div><div><dt>Question types to review</dt><dd>{wrongTypes.length ? wrongTypes.join(", ") : "None"}</dd></div></dl><div className={styles.reviewRecommendation}><strong>Recommended review</strong>{wrongQuestions.length ? <p>Re-read the quoted evidence for: {wrongQuestions.map((question) => question.prompt).join(" · ")}</p> : <p>Your answers were accurate. Continue with the next article.</p>}{openedVocabulary.size ? <p>Review saved words: {[...openedVocabulary].map((index) => article.vocabulary[index].hanzi).join("、")}</p> : <p>Tap unfamiliar words in the article before continuing.</p>}</div><button type="button" disabled={progress.completed} onClick={completeArticle}>{progress.completed ? "Article completed ✓" : "Mark article complete"}</button><div className={styles.nextLinks}><Link href="/review">Review vocabulary →</Link><Link href="/mistakes">Open mistakes →</Link>{next ? <Link href={`/reading/article/${next.slug}`}>Next HSK {article.level} article →</Link> : null}{higherLevel ? <Link href={`/reading/article/${higherLevel.slug}`}>Try HSK {higherLevel.level} →</Link> : null}</div></section> : null}
  </article>;
}
