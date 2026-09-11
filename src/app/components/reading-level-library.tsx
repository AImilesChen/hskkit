"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReadingArticleSummary } from "@/lib/learning/reading-articles";
import type { ReadingProgressMap } from "@/lib/learning/reading-progress-client";
import { loadMergedReadingProgress, READING_PROGRESS_EVENT } from "@/lib/learning/reading-progress-client";
import styles from "./reading-library-experience.module.css";

export default function ReadingLevelLibrary({ level, articles }: { level: number; articles: ReadingArticleSummary[] }) {
  const [progress, setProgress] = useState<ReadingProgressMap>({});
  const [topic, setTopic] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [duration, setDuration] = useState("all");
  const [status, setStatus] = useState("all");
  const [audio, setAudio] = useState("all");
  const [sort, setSort] = useState("recommended");

  useEffect(() => {
    const refresh = () => void loadMergedReadingProgress().then((result) => setProgress(result.progress));
    refresh();
    window.addEventListener(READING_PROGRESS_EVENT, refresh);
    return () => window.removeEventListener(READING_PROGRESS_EVENT, refresh);
  }, []);

  const topics = [...new Set(articles.map((article) => article.topic))].sort();
  const difficulties = [...new Set(articles.map((article) => article.difficulty))];
  const filtered = useMemo(() => {
    const rows = articles.filter((article) =>
      (topic === "all" || article.topic === topic)
      && (difficulty === "all" || article.difficulty === difficulty)
      && (duration === "all" || (duration === "short" ? article.minutes <= 5 : duration === "medium" ? article.minutes > 5 && article.minutes <= 10 : article.minutes > 10))
      && (status === "all" || (status === "read" ? progress[article.slug]?.completed : status === "saved" ? progress[article.slug]?.favorite : !progress[article.slug]?.completed))
      && (audio === "all" || Boolean(article.audioSrc)),
    );
    if (sort === "shortest") return [...rows].sort((a, b) => a.minutes - b.minutes || a.title.localeCompare(b.title, "zh"));
    if (sort === "latest") return [...rows].reverse();
    return [...rows].sort((a, b) => Number(Boolean(progress[b.slug]?.lastViewedAt)) - Number(Boolean(progress[a.slug]?.lastViewedAt)) || Number(Boolean(progress[a.slug]?.completed)) - Number(Boolean(progress[b.slug]?.completed)));
  }, [articles, audio, difficulty, duration, progress, sort, status, topic]);

  const completed = articles.filter((article) => progress[article.slug]?.completed).length;
  return <div className={styles.root}>
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link href="/reading">Reading</Link><span>/</span><span>HSK {level}</span></nav>
    <header className={styles.levelHero}><p className={styles.sectionEyebrow}>Levelled articles</p><h1>HSK {level} article library</h1><p>Choose one complete article. Read first, then answer questions from the same text.</p><div><strong>{completed} / {articles.length} read</strong><progress max={articles.length} value={completed}/></div></header>
    <section className={styles.filterPanel} aria-label="Filter articles">
      <p className={styles.filterHint}>Difficulty is relative within HSK {level}: easier, standard, or stretch.</p>
      <label>Topic<select value={topic} onChange={(event) => setTopic(event.target.value)}><option value="all">All topics</option>{topics.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="all">All difficulties</option>{difficulties.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Reading time<select value={duration} onChange={(event) => setDuration(event.target.value)}><option value="all">Any length</option><option value="short">Up to 5 min</option><option value="medium">6–10 min</option><option value="long">11+ min</option></select></label>
      <label>Progress<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All states</option><option value="unread">Unread</option><option value="read">Read</option><option value="saved">Saved</option></select></label>
      <label>Audio<select value={audio} onChange={(event) => setAudio(event.target.value)}><option value="all">Any</option><option value="available">With audio</option></select></label>
      <label>Order<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">Recommended</option><option value="latest">Latest</option><option value="shortest">Shortest first</option></select></label>
    </section>
    <p className={styles.resultCount} aria-live="polite">{filtered.length} article{filtered.length === 1 ? "" : "s"}</p>
    <section className={styles.articleList} aria-label={`HSK ${level} articles`}>{filtered.map((article, index) => {
      const record = progress[article.slug];
      return <article key={article.slug} className={styles.articleRow}><span className={styles.articleNumber}>{String(index + 1).padStart(2, "0")}</span><div><div className={styles.articleMeta}><span>{article.topic}</span><span>{article.minutes} min</span><span>{article.wordCount} words</span><span>{article.difficulty}</span><span>3 questions</span>{article.audioSrc ? <span>Audio</span> : null}{record?.completed ? <span className={styles.done}>Read</span> : record?.scrollPercent ? <span>{record.scrollPercent}% read</span> : null}{record?.favorite ? <span>Saved</span> : null}</div><h2 lang="zh-Hans">{article.title}</h2><p lang="zh-Hans">{article.summary}</p></div><Link href={`/reading/article/${article.slug}`}>{record?.completed ? "Read again" : record?.scrollPercent ? "Continue article" : "Read article"} →</Link></article>;
    })}{filtered.length === 0 ? <div className={styles.emptyState}><h2>No matching articles</h2><p>Clear one or more filters to see this level again.</p><button type="button" onClick={() => { setTopic("all"); setDifficulty("all"); setDuration("all"); setStatus("all"); setAudio("all"); }}>Clear filters</button></div> : null}</section>
  </div>;
}
