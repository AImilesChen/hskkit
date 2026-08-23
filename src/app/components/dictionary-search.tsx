"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AudioButton } from "./audio-button";

type SearchField = "all" | "hanzi" | "pinyin" | "english";
type SearchRequest = { query: string; level: string; field: SearchField; partOfSpeech: string; page: number };
type CatalogWord = {
  id: string;
  level: number;
  levelBand: string;
  payload: { hanzi: string; traditional: string; pinyin: string; meaning: string; partOfSpeech: string };
};
type CatalogResponse = {
  contentAssets: CatalogWord[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number; hasPrevious: boolean; hasNext: boolean };
};

const detailSlugs: Record<string, string> = {
  "学习": "xue-xi", "旅行": "lu-xing", "习惯": "xi-guan", "环境": "huan-jing", "经验": "jing-yan",
  "交流": "jiao-liu", "责任": "ze-ren", "改善": "gai-shan", "趋势": "qu-shi", "贡献": "gong-xian",
  "资源": "zi-yuan", "倡导": "chang-dao", "买": "mai",
};

const partOfSpeechOptions = [
  ["", "All parts of speech"], ["N", "Noun"], ["V", "Verb"], ["Adj", "Adjective"],
  ["Adv", "Adverb"], ["Pron", "Pronoun"], ["Num", "Numeral"], ["M", "Measure word"],
  ["Prep", "Preposition"], ["Conj", "Conjunction"], ["Aux", "Auxiliary"], ["unspecified", "Unspecified"],
] as const;

export function DictionarySearch() {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("all");
  const [field, setField] = useState<SearchField>("all");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [submitted, setSubmitted] = useState<SearchRequest | null>(null);
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!submitted) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(submitted.page), pageSize: "50", field: submitted.field });
    if (submitted.query.trim()) params.set("q", submitted.query.trim());
    if (submitted.level !== "all") params.set("level", submitted.level);
    if (submitted.partOfSpeech) params.set("pos", submitted.partOfSpeech);

    setLoading(true);
    setError("");
    void fetch(`/api/v1/catalog/words?${params.toString()}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as CatalogResponse & { message?: string };
        if (!response.ok) throw new Error(body.message || "Dictionary search is temporarily unavailable.");
        setData(body);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "Dictionary search is temporarily unavailable.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retryToken, submitted]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setData(null);
    setSubmitted({ query, level, field, partOfSpeech, page: 1 });
  }

  function changePage(page: number) {
    if (!submitted || loading) return;
    setSubmitted({ ...submitted, page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const hasConditions = Boolean(query.trim() || level !== "all" || partOfSpeech);
  return <div className="w-full">
    <form className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={submit}>
      <label className="block text-sm font-semibold text-slate-700" htmlFor="dictionary-query">Search Hanzi, pinyin, or English</label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input id="dictionary-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try 学习, xue xi, or learn" className="min-h-14 min-w-0 flex-1 rounded-lg border border-slate-300 px-4 text-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
        <button type="submit" className="min-h-14 rounded-lg bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700">Search</button>
        {hasConditions && <button type="button" className="min-h-11 rounded-lg px-4 font-semibold text-blue-600 hover:bg-blue-50" onClick={() => { setQuery(""); setLevel("all"); setField("all"); setPartOfSpeech(""); setSubmitted(null); setData(null); setError(""); }}>Clear</button>}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-semibold text-slate-700">Search field
          <select value={field} onChange={(event) => setField(event.target.value as SearchField)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3">
            <option value="all">All fields</option><option value="hanzi">Hanzi</option><option value="pinyin">Pinyin</option><option value="english">English</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">HSK level
          <select value={level} onChange={(event) => setLevel(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3">
            <option value="all">All levels</option>{Array.from({ length: 9 }, (_, index) => <option key={index + 1} value={index + 1}>Level {index + 1}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">Part of speech
          <select value={partOfSpeech} onChange={(event) => setPartOfSpeech(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3">
            {partOfSpeechOptions.map(([value, label]) => <option key={value || "all"} value={value}>{label}</option>)}
          </select>
        </label>
      </div>
    </form>

    {!submitted ? <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <h2 className="text-2xl font-semibold">Start with a word, level, or part of speech</h2>
      <p className="mt-2 text-slate-600">The page shell loads first. Search results are requested in pages of 50 only after you choose conditions, or <Link href="/levels" className="inline-flex min-h-11 items-center font-semibold text-blue-600 hover:underline">browse by level</Link>.</p>
    </div> : loading && !data ? <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-8 text-center" aria-live="polite"><p className="font-semibold text-blue-950">Loading dictionary results…</p></div>
      : error ? <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8 text-center" role="alert"><h2 className="text-xl font-semibold text-red-950">Dictionary search unavailable</h2><p className="mt-2 text-red-900">{error}</p><button type="button" className="mt-5 min-h-11 rounded-lg bg-red-700 px-5 font-semibold text-white" onClick={() => setRetryToken((value) => value + 1)}>Try again</button></div>
      : data && data.contentAssets.length === 0 ? <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center" aria-live="polite"><h2 className="text-2xl font-semibold">No results found</h2><p className="mt-2 text-slate-600">No published item matched these conditions. Try another spelling or remove a filter.</p></div>
      : data ? <section className="mt-8" aria-live="polite" aria-busy={loading}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Words ({data.pagination.total})</h2><p className="text-sm text-slate-500">Page {data.pagination.page} of {data.pagination.totalPages}</p></div>
        <div className={`grid gap-4 ${loading ? "opacity-60" : ""}`}>{data.contentAssets.map((word) => {
          const slug = detailSlugs[word.payload.hanzi];
          return <article key={word.id} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div><div className="flex flex-wrap items-baseline gap-3">{slug ? <Link href={`/word/${slug}`} className="text-3xl font-bold text-blue-600 hover:underline">{word.payload.hanzi}</Link> : <span className="text-3xl font-bold text-slate-900">{word.payload.hanzi}</span>}<span className="text-lg text-slate-600">{word.payload.pinyin}</span><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{word.levelBand === "7-9" ? "Levels 7–9" : `Level ${word.level}`}</span></div><p className="mt-2 text-slate-800">{word.payload.meaning}</p><p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{word.payload.partOfSpeech}</p></div>
            <AudioButton text={word.payload.hanzi} label="Play" />
          </article>;
        })}</div>
        <nav className="mt-7 flex items-center justify-between gap-4" aria-label="Dictionary result pages">
          <button type="button" disabled={!data.pagination.hasPrevious || loading} onClick={() => changePage(data.pagination.page - 1)} className="min-h-11 rounded-lg border border-blue-600 px-5 font-semibold text-blue-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400">Previous</button>
          <span className="text-sm text-slate-600">{data.pagination.page} / {data.pagination.totalPages}</span>
          <button type="button" disabled={!data.pagination.hasNext || loading} onClick={() => changePage(data.pagination.page + 1)} className="min-h-11 rounded-lg border border-blue-600 px-5 font-semibold text-blue-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400">Next</button>
        </nav>
      </section> : null}
  </div>;
}
