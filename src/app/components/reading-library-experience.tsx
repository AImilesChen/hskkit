"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReadingArticleSummary } from "@/lib/learning/reading-articles";
import type { ReadingProgressMap } from "@/lib/learning/reading-progress-client";
import { loadMergedReadingProgress, READING_PROGRESS_EVENT } from "@/lib/learning/reading-progress-client";
import styles from "./reading-library-experience.module.css";

type Mode = "articles" | "quick";

export default function ReadingLibraryExperience({ articles, coverageNotice }: { articles: ReadingArticleSummary[]; coverageNotice: string }) {
  const [mode, setMode] = useState<Mode>("articles");
  const [quickLevel, setQuickLevel] = useState(1);
  const [progress, setProgress] = useState<ReadingProgressMap>({});

  useEffect(() => {
    const refresh = () => void loadMergedReadingProgress().then((result) => setProgress(result.progress));
    refresh();
    window.addEventListener(READING_PROGRESS_EVENT, refresh);
    return () => window.removeEventListener(READING_PROGRESS_EVENT, refresh);
  }, []);

  const recentArticles = useMemo(() => articles
    .filter((article) => progress[article.slug]?.lastViewedAt)
    .sort((a, b) => (progress[b.slug]?.lastViewedAt ?? "").localeCompare(progress[a.slug]?.lastViewedAt ?? ""))
    .slice(0, 6), [articles, progress]);
  const lastRead = recentArticles[0];
  const recommendation = useMemo(() => articles.find((article) => !progress[article.slug]?.completed) ?? articles[0], [articles, progress]);
  const completedTotal = articles.filter((article) => progress[article.slug]?.completed).length;

  return <div className={styles.root}>
    <header className={styles.hero}><p className={styles.sectionEyebrow}>Reading center</p><h1>Read at your level.</h1><p>Choose complete graded articles for sustained reading, or use the original short passages for a focused practice set.</p></header>
    <div className={styles.modeSwitch} role="group" aria-label="Choose a reading mode"><button type="button" aria-pressed={mode === "articles"} onClick={() => setMode("articles")}>Articles</button><button type="button" aria-pressed={mode === "quick"} onClick={() => setMode("quick")}>Quick Practice</button></div>

    {mode === "articles" ? <>
      <section className={styles.modePanel}><p className={styles.sectionEyebrow}>Articles</p><h2>Browse complete HSK 1–9 readings</h2><p>Each article has continuous Chinese text, narration, optional pinyin and translation, vocabulary, grammar and three questions tied to the article.</p>{lastRead ? <Link className={styles.primaryLink} href={`/reading/article/${lastRead.slug}`}>Continue {lastRead.title} →</Link> : <Link className={styles.primaryLink} href="/reading/level/1">Browse HSK 1 articles →</Link>}</section>
      <section className={styles.progressCard}><p className={styles.sectionEyebrow}>Your progress</p><h2>{completedTotal} of {articles.length} articles read</h2><div className={styles.progressGrid}>{Array.from({ length: 9 }, (_, index) => {
        const level = index + 1;
        const levelArticles = articles.filter((article) => article.level === level);
        const completed = levelArticles.filter((article) => progress[article.slug]?.completed).length;
        return <Link key={level} href={`/reading/level/${level}`} className={styles.progressItem}><strong>HSK {level}</strong><span>{completed} / {levelArticles.length}</span><progress max={levelArticles.length} value={completed}/></Link>;
      })}</div></section>
      <section className={styles.levelBrowse}><div className={styles.levelBrowseHead}><div><p className={styles.sectionEyebrow}>Level libraries</p><h2>Choose one HSK level</h2></div><span>20 articles per level</span></div><div className={styles.levelSwitch}>{Array.from({ length: 9 }, (_, index) => <Link className={styles.secondaryLink} href={`/reading/level/${index + 1}`} key={index + 1}>HSK {index + 1}</Link>)}</div></section>
      {recommendation ? <section className={styles.recentCard}><p className={styles.sectionEyebrow}>Recommended next</p><h2 lang="zh-Hans">{recommendation.title}</h2><p>{recommendation.summary}</p><div className={styles.articleMeta}><span>HSK {recommendation.level}</span><span>{recommendation.topic}</span><span>{recommendation.minutes} min</span><span>{recommendation.wordCount} words</span></div><Link className={styles.primaryLink} href={`/reading/article/${recommendation.slug}`}>Read this article →</Link></section> : null}
      {recentArticles.length ? <section className={styles.recentCard}><p className={styles.sectionEyebrow}>Reading history</p><h2>Continue a recent article</h2><div className={styles.historyList}>{recentArticles.map((article) => <Link key={article.slug} href={`/reading/article/${article.slug}`}><span lang="zh-Hans">{article.title}</span><small>HSK {article.level} · {progress[article.slug]?.completed ? "Completed" : `${progress[article.slug]?.scrollPercent ?? 0}% read`}</small></Link>)}</div></section> : null}
      <p>{coverageNotice}</p>
    </> : <section className={styles.modePanel}><p className={styles.sectionEyebrow}>Quick Practice</p><h2>Short-passage comprehension</h2><p>Keep the original two-to-three-sentence materials for detail, sequence and inference practice. These are exercises, not full articles.</p><label className={styles.quickLevel}>Quick Practice level<select value={quickLevel} onChange={(event) => setQuickLevel(Number(event.target.value))}>{Array.from({ length: 9 }, (_, index) => <option key={index + 1} value={index + 1}>HSK {index + 1}</option>)}</select></label><div className={styles.quickChoice}><Link href={`/reading/start?level=${quickLevel}&size=10`}>10 questions <span>Focused set →</span></Link><Link href={`/reading/start?level=${quickLevel}&size=20`}>20 questions <span>Longer set →</span></Link></div></section>}
  </div>;
}
