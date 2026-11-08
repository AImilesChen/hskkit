"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
type Entry = { id: string; form: string; status: string; startedAt: string; correct?: number };
export function FormalHistory() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [failed, setFailed] = useState(false);
  const load = () => { setFailed(false); fetch("/api/v1/formal-exams/hsk4", { cache: "no-store" }).then(async r => { if (!r.ok) throw new Error(); setEntries((await r.json()).history); }).catch(() => setFailed(true)); };
  useEffect(load, []);
  if (!entries.length && !failed) return null;
  return <section className="formal-history"><h2>Your recent attempts</h2>{failed ? <p>Attempts could not load. <button type="button" onClick={load}>Try again</button></p> : <ul>{entries.filter(e => /^[abc]$/.test(e.form)).map(e => <li key={e.id}><div><strong>Paper {e.form.toUpperCase()}</strong><span>{new Date(e.startedAt).toLocaleDateString()} · {e.status === "submitted" ? `${e.correct} / 64 objective` : "In progress"}</span></div><Link prefetch={false} href={`/hsk-test-prep/hsk-4/mock/${e.form}?session=${encodeURIComponent(e.id)}`}>{e.status === "submitted" ? "View result" : "Resume"} →</Link></li>)}</ul>}</section>;
}
