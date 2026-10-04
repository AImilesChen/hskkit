"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./reading-article-browser.module.css";

export type ReadingBrowseItem = {
  slug: string;
  level: number;
  title: string;
  topic: string;
  characters: number;
  excerpt: string;
  href: string;
};

const PAGE_SIZE = 12;
type Collection = "articles" | "short";

export default function ReadingArticleBrowser({ articles, shortPassages }: { articles: ReadingBrowseItem[]; shortPassages: ReadingBrowseItem[] }) {
  const [collection, setCollection] = useState<Collection>("articles");
  const [level, setLevel] = useState("all");
  const [topic, setTopic] = useState("all");
  const [length, setLength] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const source = collection === "articles" ? articles : shortPassages;
  const topics = [...new Set(source.map((item) => item.topic))].sort();
  const filtered = useMemo(() => source.filter((item) => {
    const query = search.trim().toLocaleLowerCase();
    return (level === "all" || String(item.level) === level)
      && (topic === "all" || item.topic === topic)
      && (length === "all" || length === "short" && item.characters < 120 || length === "medium" && item.characters >= 120 && item.characters < 300 || length === "long" && item.characters >= 300)
      && (!query || `${item.title} ${item.excerpt} ${item.topic}`.toLocaleLowerCase().includes(query));
  }), [source, level, topic, length, search]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  function resetFilters(nextCollection?: Collection) {
    if (nextCollection) setCollection(nextCollection);
    setLevel("all"); setTopic("all"); setLength("all"); setSearch(""); setPage(1);
  }
  function goToPage(nextPage: number) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("reading-results")?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
    setPage(nextPage);
  }

  return <section id="articles" className={styles.browser} aria-labelledby="article-browser-heading">
    <div className={styles.heading}>
      <div><span className={styles.eyebrow}>READING LIBRARY</span><h1 id="article-browser-heading">Find something worth reading</h1><p>Choose a complete, level-guided article or a short comprehension drill. Read at your own pace, then check what you understood.</p></div>
      <Link href="#practice" className={styles.practiceLink}>Go to question practice ↓</Link>
    </div>
    <div className={styles.tabs} role="group" aria-label="Reading collection">
      <button type="button" className={collection === "articles" ? styles.selected : ""} aria-pressed={collection === "articles"} onClick={() => resetFilters("articles")}>Articles <span>{articles.length}</span></button>
      <button type="button" className={collection === "short" ? styles.selected : ""} aria-pressed={collection === "short"} onClick={() => resetFilters("short")}>Short practice passages <span>{shortPassages.length}</span></button>
    </div>
    <p className={styles.collectionNote}>{collection === "articles" ? "Complete texts with several paragraphs and comprehension checks. Level labels guide study; these are HSKKit-authored materials, not official exam papers." : "Includes 180 scored drills and seven earlier published passages. These are brief detail checks; choose Articles for sustained reading."}</p>
    <div className={styles.filters} role="search" aria-label="Filter reading material">
      <label>Search<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Title or text"/></label>
      <label>HSK level<select value={level} onChange={(event) => { setLevel(event.target.value); setPage(1); }}><option value="all">All levels</option>{Array.from({ length: 9 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>HSK {value}</option>)}</select></label>
      <label>Topic<select value={topic} onChange={(event) => { setTopic(event.target.value); setPage(1); }}><option value="all">All topics</option>{topics.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Length<select value={length} onChange={(event) => { setLength(event.target.value); setPage(1); }}><option value="all">Any length</option><option value="short">Under 120 characters</option><option value="medium">120–299 characters</option><option value="long">300+ characters</option></select></label>
    </div>
    <div id="reading-results" className={styles.resultLine}><strong>{filtered.length}</strong> {collection === "articles" ? "articles" : "short passages"} found{filtered.length > PAGE_SIZE ? ` · page ${page} of ${pageCount}` : ""}</div>
    {shown.length ? <div className={styles.grid}>{shown.map((item) => <article className={styles.card} key={`${collection}:${item.slug}`}>
      <div className={styles.meta}><span>HSK {item.level}</span><span>{item.topic}</span><span>{item.characters} Chinese characters</span></div>
      <h2>{item.title}</h2><p lang="zh-CN">{item.excerpt}</p><Link href={item.href}>Read {collection === "articles" ? "article" : "passage"} <span aria-hidden="true">→</span></Link>
    </article>)}</div> : <div className={styles.empty}><h2>No reading matches these filters</h2><p>Try another level, topic, length or search term.</p><button type="button" onClick={() => resetFilters()}>Clear filters</button></div>}
    {pageCount > 1 && <nav className={styles.pagination} aria-label="Reading results pages"><button type="button" disabled={page === 1} onClick={() => goToPage(page - 1)}>Previous</button><span>Page {page} of {pageCount}</span><button type="button" disabled={page === pageCount} onClick={() => goToPage(page + 1)}>Next</button></nav>}
  </section>;
}
