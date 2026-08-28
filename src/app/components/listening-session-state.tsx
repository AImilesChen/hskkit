"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Resume = { href: string; label: string };
export function ListeningResume() {
  const [resume, setResume] = useState<Resume | undefined>();
  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem("hskkit:listening:resume") ?? "null") as Resume | null;
      if (value?.href.startsWith("/listen/advanced/") && value.label.startsWith("Continue HSK ")) setResume(value);
    } catch { /* ignore invalid local state */ }
  }, []);
  if (!resume) return null;
  return <aside className="card mb-6 border-blue-200 bg-blue-50" aria-label="Resume listening"><span className="eyebrow">Continue where you left off</span><h2 className="mb-2">Your listening session is ready</h2><Link className="btn" href={resume.href}>{resume.label}</Link></aside>;
}

export function ListeningResultSummary({ level, size, seed }: { level: number; size: 10 | 20; seed: string }) {
  const [summary, setSummary] = useState<{ answered: number; correct: number }>();
  useEffect(() => {
    try {
      const key = `hskkit:listening:result:${level}:${size}:${seed}`;
      const values = Object.values(JSON.parse(localStorage.getItem(key) ?? "{}") as Record<string, boolean>);
      setSummary({ answered: values.length, correct: values.filter(Boolean).length });
      if (values.length >= size) localStorage.removeItem("hskkit:listening:resume");
    } catch { setSummary({ answered: 0, correct: 0 }); }
  }, [level, seed, size]);
  if (!summary) return <p role="status">Loading your session result…</p>;
  return <div className="mb-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><span className="eyebrow">Answered</span><strong className="block text-2xl">{summary.answered} / {size}</strong></div><div className="rounded-xl bg-blue-50 p-4"><span className="eyebrow">Correct</span><strong className="block text-2xl">{summary.correct} / {size}</strong></div></div>;
}
