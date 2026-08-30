"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AudioButton } from "./audio-button";
import { detectDictionaryQueryType, type DictionaryQueryType } from "@/lib/dictionary/search-intent";

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
  ["", "All word types"], ["N", "Nouns"], ["V", "Verbs"], ["Adj", "Adjectives"],
  ["Adv", "Adverbs"], ["Pron", "Pronouns"], ["Num", "Numbers"], ["M", "Measure words"],
] as const;
const intentLabels: Record<DictionaryQueryType, string> = {
  empty: "Hanzi, pinyin, or English",
  hanzi: "Chinese characters detected",
  pinyin: "Pinyin detected",
  english: "English detected",
};

function safePage(value: string | null) {
  const page = Number(value ?? "1");
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function DictionarySearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const applied = useMemo(() => ({
    query: searchParams.get("q")?.trim() ?? "",
    level: searchParams.has("level") ? (searchParams.get("level") ?? "all") : "default",
    partOfSpeech: searchParams.get("pos") ?? "",
    page: safePage(searchParams.get("page")),
  }), [searchParams]);
  const [query, setQuery] = useState(applied.query);
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [suggestions, setSuggestions] = useState<CatalogWord[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const intent = detectDictionaryQueryType(query);

  useEffect(() => setQuery(applied.query), [applied.query]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(applied.page), pageSize: "12" });
    if (applied.query) params.set("q", applied.query);
    if (applied.level !== "all" && applied.level !== "default") params.set("level", applied.level);
    else if (applied.level === "default" && !applied.query) params.set("level", "1");
    if (applied.partOfSpeech) params.set("pos", applied.partOfSpeech);
    setLoading(true);
    setError("");
    void fetch(`/api/v1/catalog/words?${params.toString()}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as CatalogResponse & { message?: string };
        if (!response.ok) throw new Error(body.message || "The dictionary is temporarily unavailable.");
        setData(body);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "The dictionary is temporarily unavailable.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [applied.level, applied.page, applied.partOfSpeech, applied.query, retryToken]);

  useEffect(() => {
    const value = query.trim();
    if (!value) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      setSuggesting(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ q: value, page: "1", pageSize: "6" });
      const detected = detectDictionaryQueryType(value);
      if (detected !== "empty") params.set("field", detected);
      if (applied.level !== "all" && applied.level !== "default") params.set("level", applied.level);
      setSuggesting(true);
      void fetch(`/api/v1/catalog/words?${params.toString()}`, { signal: controller.signal, cache: "no-store" })
        .then(async (response) => response.ok ? response.json() as Promise<CatalogResponse> : Promise.reject(new Error("suggestions unavailable")))
        .then((body) => {
          setSuggestions(body.contentAssets);
          setSuggestionsOpen(true);
          setActiveSuggestion(-1);
        })
        .catch((reason: unknown) => {
          if (!(reason instanceof DOMException && reason.name === "AbortError")) setSuggestions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSuggesting(false);
        });
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [applied.level, query]);

  function navigate(next: { query?: string; level?: string; partOfSpeech?: string; page?: number }) {
    const params = new URLSearchParams();
    const nextQuery = next.query ?? applied.query;
    const nextLevel = next.level ?? applied.level;
    const nextPartOfSpeech = next.partOfSpeech ?? applied.partOfSpeech;
    const nextPage = next.page ?? 1;
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextLevel !== "default") params.set("level", nextLevel);
    if (nextPartOfSpeech) params.set("pos", nextPartOfSpeech);
    if (nextPage > 1) params.set("page", String(nextPage));
    setSuggestionsOpen(false);
    router.push(`${pathname}${params.size ? `?${params.toString()}` : ""}`, { scroll: false });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    navigate({ query, page: 1 });
  }

  function chooseSuggestion(word: CatalogWord) {
    setQuery(word.payload.hanzi);
    navigate({ query: word.payload.hanzi, page: 1 });
  }

  function onQueryKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!suggestionsOpen || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((value) => (value + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((value) => value <= 0 ? suggestions.length - 1 : value - 1);
    } else if (event.key === "Enter" && activeSuggestion >= 0) {
      event.preventDefault();
      chooseSuggestion(suggestions[activeSuggestion]);
    } else if (event.key === "Escape") {
      setSuggestionsOpen(false);
    }
  }

  const selectedLevel = applied.level === "default" ? "1" : applied.level;
  const defaultBrowse = !applied.query && applied.level === "default" && !applied.partOfSpeech;
  const hasConditions = Boolean(applied.query || applied.level !== "default" || applied.partOfSpeech);

  return <div className="w-full">
    <form className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.45)] sm:p-6" onSubmit={submit}>
      <div className="relative">
        <label className="sr-only" htmlFor="dictionary-query">Search Chinese words</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <input
              id="dictionary-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => query.trim() && setSuggestionsOpen(true)}
              onKeyDown={onQueryKeyDown}
              placeholder="Search 学习, xue xi, or to study"
              className="min-h-14 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 pr-12 text-lg outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={suggestionsOpen}
              aria-controls="dictionary-suggestions"
              aria-activedescendant={activeSuggestion >= 0 ? `dictionary-suggestion-${activeSuggestion}` : undefined}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">⌕</span>
          </div>
          <button type="submit" className="min-h-14 rounded-xl bg-blue-600 px-7 font-bold text-white transition hover:bg-blue-700 active:translate-y-px focus:outline-none focus:ring-4 focus:ring-blue-200">Search</button>
        </div>
        <div className="mt-2 flex min-h-5 items-center justify-between gap-3 text-xs text-slate-500">
          <span>{intentLabels[intent]}</span>
          {suggesting && <span aria-live="polite">Finding matches…</span>}
        </div>
        {suggestionsOpen && query.trim() && <div id="dictionary-suggestions" role="listbox" className="absolute left-0 right-0 top-[72px] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:right-[123px]">
          {suggestions.length > 0 ? suggestions.map((word, index) => <button
            id={`dictionary-suggestion-${index}`}
            role="option"
            aria-selected={activeSuggestion === index}
            key={word.id}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => chooseSuggestion(word)}
            className={`grid min-h-16 w-full grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 ${activeSuggestion === index ? "bg-blue-50" : "hover:bg-slate-50"}`}
          >
            <strong className="text-xl text-slate-950">{word.payload.hanzi}</strong>
            <span className="min-w-0"><span className="block text-sm text-blue-700">{word.payload.pinyin}</span><span className="block truncate text-sm text-slate-600">{word.payload.meaning}</span></span>
            <span className="text-xs font-bold text-slate-500">{word.levelBand === "7-9" ? "7–9" : `HSK ${word.level}`}</span>
          </button>) : !suggesting && <p className="p-5 text-sm text-slate-600">No close matches yet. Press Search to see the full result.</p>}
        </div>}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-slate-700">Browse by HSK level</p>
          {hasConditions && <button type="button" className="min-h-11 rounded-lg px-3 text-sm font-bold text-blue-700 hover:bg-blue-50" onClick={() => { setQuery(""); router.push(pathname, { scroll: false }); }}>Reset</button>}
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
          <button type="button" onClick={() => navigate({ level: "all", page: 1 })} className={`min-h-11 whitespace-nowrap rounded-lg border px-1 text-xs font-bold sm:px-2 sm:text-sm ${selectedLevel === "all" ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-400"}`}>All</button>
          {Array.from({ length: 9 }, (_, index) => String(index + 1)).map((item) => <button type="button" key={item} onClick={() => navigate({ level: item, page: 1 })} aria-pressed={selectedLevel === item} className={`min-h-11 whitespace-nowrap rounded-lg border px-1 text-xs font-bold sm:px-2 sm:text-sm ${selectedLevel === item ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-400"}`}>HSK {item}</button>)}
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">Levels 7–9 share one unified advanced vocabulary band.</p>
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-700"><span className="sr-only">Part of speech. </span>Word type
            <select value={applied.partOfSpeech} onChange={(event) => navigate({ partOfSpeech: event.target.value, page: 1 })} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3">
              {partOfSpeechOptions.map(([value, label]) => <option key={value || "all"} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
      </div>
    </form>

    {loading && !data ? <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50 p-7 text-center" aria-live="polite"><p className="font-semibold text-blue-950">Loading real dictionary words…</p></div>
      : error ? <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-7 text-center" role="alert"><h2 className="text-xl font-semibold text-red-950">Dictionary unavailable</h2><p className="mt-2 text-red-900">{error}</p><button type="button" className="mt-5 min-h-11 rounded-lg bg-red-700 px-5 font-semibold text-white" onClick={() => setRetryToken((value) => value + 1)}>Try again</button></div>
      : data && data.contentAssets.length === 0 ? <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-7 text-center" aria-live="polite"><h2 className="text-2xl font-semibold">No exact matches</h2><p className="mt-2 text-slate-600">Try another spelling, remove the word-type filter, or browse an HSK level.</p></div>
      : data ? <section className="mt-8" aria-live="polite" aria-busy={loading}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">{defaultBrowse ? "Start here" : "Dictionary results"}</p><h2 className="mt-1 text-2xl font-bold text-slate-950">{defaultBrowse ? "Beginner words to explore" : `${data.pagination.total.toLocaleString()} matching words`}</h2></div>
          <p className="text-sm text-slate-500">Page {data.pagination.page} of {data.pagination.totalPages}</p>
        </div>
        <div className={`grid gap-3 md:grid-cols-2 ${loading ? "opacity-60" : ""}`}>{data.contentAssets.map((word) => {
          const slug = detailSlugs[word.payload.hanzi] ?? word.id;
          return <article key={word.id} className="group grid min-w-0 grid-cols-[1fr_auto] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md">
            <div className="min-w-0"><div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><Link href={`/word/${encodeURIComponent(slug)}`} className="text-3xl font-bold text-slate-950 hover:text-blue-700 hover:underline">{word.payload.hanzi}</Link><span className="text-base font-medium text-blue-700">{word.payload.pinyin}</span></div><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-700">{word.payload.meaning}</p><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{word.levelBand === "7-9" ? "HSK 7–9" : `HSK ${word.level}`}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{word.payload.partOfSpeech}</span></div></div>
            <AudioButton text={word.payload.hanzi} label={`Listen to ${word.payload.hanzi}`} />
          </article>;
        })}</div>
        <nav className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3" aria-label="Dictionary result pages">
          <button type="button" disabled={!data.pagination.hasPrevious || loading} onClick={() => navigate({ page: data.pagination.page - 1 })} className="min-h-11 justify-self-start rounded-lg border border-blue-600 px-4 font-semibold text-blue-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400">Previous</button>
          <span className="text-sm text-slate-600">{data.pagination.page} / {data.pagination.totalPages}</span>
          <button type="button" disabled={!data.pagination.hasNext || loading} onClick={() => navigate({ page: data.pagination.page + 1 })} className="min-h-11 justify-self-end rounded-lg border border-blue-600 px-4 font-semibold text-blue-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400">Next</button>
        </nav>
      </section> : null}
  </div>;
}
