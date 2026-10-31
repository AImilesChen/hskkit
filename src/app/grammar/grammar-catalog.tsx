"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { GrammarCurriculumLesson } from "@/lib/learning/step7-content";
import type { GrammarProgress } from "@/lib/learning/grammar-progress";

const bands = ["All", "1", "2", "3", "4", "5", "6", "7-9"] as const;

export default function GrammarCatalog({ lessons }: { lessons: GrammarCurriculumLesson[] }) {
  const [band, setBand] = useState<(typeof bands)[number]>("All");
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState<GrammarProgress | null>(null);
  const [progressState, setProgressState] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/v1/learning?tzOffset=${new Date().getTimezoneOffset()}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("PROGRESS_UNAVAILABLE");
        return response.json() as Promise<{ grammarProgress?: GrammarProgress }>;
      })
      .then((data) => { if (!controller.signal.aborted) { setProgress(data.grammarProgress ?? {}); setProgressState("ready"); } })
      .catch(() => { if (!controller.signal.aborted) setProgressState("unavailable"); });
    return () => controller.abort();
  }, []);

  const normalized = query.trim().toLocaleLowerCase();
  const visible = lessons.filter((lesson) =>
    (band === "All" || lesson.levelBand === band)
    && (!normalized || `${lesson.title} ${lesson.pattern} ${lesson.explanation} ${lesson.examples.map((item) => item.zh).join(" ")}`.toLocaleLowerCase().includes(normalized)));
  const practiced = progress ? visible.filter((lesson) => (progress[lesson.slug]?.practiced ?? 0) === lesson.exercises.length).length : 0;

  return <section className="grammar-catalog" aria-label="Grammar lesson catalog">
    <div className="grammar-catalog-tools">
      <div><span className="eyebrow">Find a pattern</span><h2>Choose your next grammar point</h2><p>{lessons.length} focused lessons · two saved questions per lesson</p></div>
      <label className="grammar-search">Search patterns or examples<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try 比, condition, or 了" /></label>
    </div>
    <div className="grammar-bands" role="group" aria-label="Filter by HSK level">{bands.map((item) => <button key={item} type="button" className={band === item ? "active" : ""} aria-pressed={band === item} onClick={() => setBand(item)}>{item === "All" ? "All levels" : `HSK ${item}`}</button>)}</div>
    <p className="grammar-catalog-count" aria-live="polite">Showing {visible.length} lessons{progressState === "ready" ? ` · ${practiced} of ${visible.length} shown lessons fully practiced` : progressState === "unavailable" ? " · Progress is temporarily unavailable; lessons still work" : " · Loading saved progress…"}</p>
    {visible.length ? <div className="grammar-lesson-list">{visible.map((lesson) => {
      const item = progress?.[lesson.slug];
      const status = item?.openMistakes ? `${item.openMistakes} to correct` : item?.due ? "Review due" : item?.practiced === item?.total ? "Practiced" : item?.practiced ? `${item.practiced}/${item.total} practiced` : "Not started";
      return <article className="grammar-lesson-row" key={lesson.slug}>
        <span className="grammar-level">HSK {lesson.levelBand}</span>
        <div><h3><Link href={`/grammar/${lesson.slug}`}>{lesson.title}</Link></h3><p className="grammar-pattern">{lesson.pattern}</p><p>{lesson.explanation}</p></div>
        <div className="grammar-row-action"><span className={`grammar-status ${item?.openMistakes ? "needs-review" : ""}`}>{progressState === "ready" ? status : "2 questions"}</span><Link className="btn secondary" href={`/grammar/${lesson.slug}`}>Study lesson</Link></div>
      </article>;
    })}</div> : <p className="step7-alert warning">No lessons match. Try another level or search term.</p>}
  </section>;
}
