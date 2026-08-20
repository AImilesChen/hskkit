"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { StudyWord } from "@/lib/dictionary/catalog";
import { AudioButton } from "./audio-button";

export function VocabularyExplorer({ words }: { words: StudyWord[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"release" | "hanzi" | "pinyin">("release");
  const filtered = useMemo(() => {
    const needle = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s/g, "");
    const result = words.filter((word) => [word.hanzi, word.pinyin, word.meaning].some((value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s/g, "").includes(needle)));
    return sort === "release" ? result : [...result].sort((a, b) => a[sort].localeCompare(b[sort], sort === "hanzi" ? "zh-CN" : "en"));
  }, [query, sort, words]);

  return (
    <section aria-label="Vocabulary list">
      <div className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_220px]">
        <label className="text-sm font-semibold text-slate-700">Search this level
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Hanzi, pinyin, or English" className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-4 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
        </label>
        <label className="text-sm font-semibold text-slate-700">Sort
          <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-blue-600">
            <option value="release">Study order</option><option value="hanzi">Hanzi</option><option value="pinyin">Pinyin</option>
          </select>
        </label>
      </div>
      <p className="mb-4 text-sm text-slate-500" aria-live="polite">{filtered.length} published {filtered.length === 1 ? "word" : "words"}</p>
      {filtered.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><h2 className="text-2xl font-semibold">No matching words</h2><p className="mt-2 text-slate-600">Try another Hanzi, pinyin spelling, or English meaning.</p></div> :
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-4">Hanzi</th><th className="p-4">Pinyin</th><th className="p-4">Meaning</th><th className="p-4">Audio</th></tr></thead>
            <tbody>{filtered.map((word) => <tr key={word.id} className="border-t border-slate-200 even:bg-slate-50">
              <td className="p-4"><Link className="text-2xl font-bold text-blue-600 hover:underline" href={`/word/${word.slug}`}>{word.hanzi}</Link></td><td className="p-4 text-slate-600">{word.pinyin}</td><td className="p-4">{word.meaning}</td><td className="p-4"><AudioButton text={word.hanzi} label="Play" /></td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>}
    </section>
  );
}
