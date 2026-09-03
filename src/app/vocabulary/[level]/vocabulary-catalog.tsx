"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AudioButton } from "../../components/audio-button";

type AudioFilter = "all" | "formal";
type SortOrder = "catalog" | "pinyin";
type CatalogRequest = {
  query: string;
  partOfSpeech: string;
  audio: AudioFilter;
  sort: SortOrder;
  page: number;
};
type CatalogWord = {
  id: string;
  level: number;
  levelBand: string;
  formalAudioAvailable: boolean;
  formalAudioUrl: string | null;
  payload: {
    hanzi: string;
    traditional: string;
    pinyin: string;
    meaning: string;
    partOfSpeech: string;
  };
};
type CatalogResponse = {
  contentAssets: CatalogWord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
};

type PageItem = number | "ellipsis-left" | "ellipsis-right";

const partOfSpeechOptions = [
  ["", "All parts of speech"],
  ["N", "Noun"],
  ["V", "Verb"],
  ["Adj", "Adjective"],
  ["Adv", "Adverb"],
  ["Pron", "Pronoun"],
  ["Num", "Numeral"],
  ["M", "Measure word"],
  ["Prep", "Preposition"],
  ["Conj", "Conjunction"],
  ["Aux", "Auxiliary"],
  ["unspecified", "Unspecified"],
] as const;

function visiblePages(current: number, total: number): PageItem[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set([1, total, current - 1, current, current + 1].filter((page) => page >= 1 && page <= total));
  const ordered = [...pages].sort((a, b) => a - b);
  const result: PageItem[] = [];
  ordered.forEach((page, index) => {
    const previous = ordered[index - 1];
    if (index > 0 && page - previous > 1) result.push(index === 1 ? "ellipsis-left" : "ellipsis-right");
    result.push(page);
  });
  return result;
}

export function VocabularyCatalog({ level, levelLabel, publishedCount }: { level: number; levelLabel: string; publishedCount: number }) {
  const [query, setQuery] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [audio, setAudio] = useState<AudioFilter>("all");
  const [sort, setSort] = useState<SortOrder>("catalog");
  const [request, setRequest] = useState<CatalogRequest>({ query: "", partOfSpeech: "", audio: "all", sort: "catalog", page: 1 });
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const resultsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ level: String(level), page: String(request.page), pageSize: "50" });
    if (request.query.trim()) params.set("q", request.query.trim());
    if (request.partOfSpeech) params.set("pos", request.partOfSpeech);
    if (request.audio !== "all") params.set("audio", request.audio);
    if (request.sort !== "catalog") params.set("sort", request.sort);

    setLoading(true);
    setError("");
    void fetch(`/api/v1/catalog/words?${params.toString()}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as CatalogResponse & { message?: string };
        if (!response.ok) throw new Error(body.message || "Vocabulary is temporarily unavailable.");
        setData(body);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "Vocabulary is temporarily unavailable.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [level, request, retryToken]);

  const pages = useMemo(() => visiblePages(data?.pagination.page ?? 1, data?.pagination.totalPages ?? 0), [data]);
  const hasDraftFilters = Boolean(query.trim() || partOfSpeech || audio !== "all" || sort !== "catalog");
  const hasAppliedFilters = Boolean(request.query || request.partOfSpeech || request.audio !== "all");

  function submit(event: FormEvent) {
    event.preventDefault();
    setData(null);
    setRequest({ query: query.trim(), partOfSpeech, audio, sort, page: 1 });
  }

  function clearFilters() {
    setQuery("");
    setPartOfSpeech("");
    setAudio("all");
    setSort("catalog");
    setData(null);
    setRequest({ query: "", partOfSpeech: "", audio: "all", sort: "catalog", page: 1 });
  }

  function changePage(page: number) {
    if (loading || page === request.page) return;
    setRequest((current) => ({ ...current, page }));
    window.requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const start = data && data.contentAssets.length ? (data.pagination.page - 1) * data.pagination.pageSize + 1 : 0;
  const end = data ? start + data.contentAssets.length - 1 : 0;
  const resultTotal = data?.pagination.total ?? publishedCount;

  return <section ref={resultsRef} className="scroll-mt-24" aria-labelledby="vocabulary-list-heading">
    <form className="rounded-xl border border-slate-200 bg-white p-[16px]" onSubmit={submit}>
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(9rem,.75fr)_minmax(9rem,.75fr)_minmax(11rem,.9fr)] lg:items-end">
        <div className="min-w-0">
          <label htmlFor="vocabulary-query" className="text-sm font-semibold text-slate-800">Search this level</label>
          <div className="mt-[6px] flex min-w-0 flex-col gap-2 sm:flex-row">
            <input
              id="vocabulary-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Chinese, pinyin, or English"
              className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
            <button type="submit" className="min-h-11 w-full rounded-lg bg-blue-600 px-4 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 sm:w-auto">Search</button>
          </div>
        </div>
        <label className="min-w-0 text-sm font-semibold text-slate-700">Part of speech
          <select value={partOfSpeech} onChange={(event) => setPartOfSpeech(event.target.value)} className="mt-[6px] min-h-11 w-full min-w-0 max-w-full rounded-lg border border-slate-300 bg-white px-3 font-normal">
            {partOfSpeechOptions.map(([value, label]) => <option key={value || "all"} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="min-w-0 text-sm font-semibold text-slate-700">Audio
          <select value={audio} onChange={(event) => setAudio(event.target.value as AudioFilter)} className="mt-[6px] min-h-11 w-full min-w-0 max-w-full rounded-lg border border-slate-300 bg-white px-3 font-normal">
            <option value="all">All words</option>
            <option value="formal">Words with audio</option>
          </select>
        </label>
        <label className="min-w-0 text-sm font-semibold text-slate-700">Sort
          <select value={sort} onChange={(event) => setSort(event.target.value as SortOrder)} className="mt-[6px] min-h-11 w-full min-w-0 max-w-full rounded-lg border border-slate-300 bg-white px-3 font-normal">
            <option value="catalog">Official catalog order</option>
            <option value="pinyin">Pinyin A–Z</option>
          </select>
        </label>
      </div>
      {hasDraftFilters && <div className="mt-[8px] flex justify-end"><button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center rounded-lg px-4 font-semibold text-blue-700 transition hover:bg-blue-50">Clear filters</button></div>}
    </form>

    <div className="mt-[24px] flex flex-col gap-3 border-b border-slate-200 pb-[16px] sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 id="vocabulary-list-heading" className="text-2xl font-bold tracking-tight text-slate-950">{levelLabel} word list</h2>
        <p className="mt-1 text-sm text-slate-600">
          {data && data.contentAssets.length > 0
            ? <>Showing <strong className="font-semibold text-slate-900">{start.toLocaleString("en-US")}–{end.toLocaleString("en-US")}</strong> of <strong className="font-semibold text-slate-900">{resultTotal.toLocaleString("en-US")}</strong> words{hasAppliedFilters ? " matching your filters" : ""}.</>
            : <>Browse all {publishedCount.toLocaleString("en-US")} published words in pages of 50.</>}
        </p>
      </div>
      <Link href="/content-license" className="inline-flex min-h-11 items-center font-semibold text-blue-700 hover:underline">Verified sources and licenses →</Link>
    </div>

    {loading && !data ? <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-8 text-center" aria-live="polite"><p className="font-semibold text-blue-950">Loading {levelLabel} vocabulary…</p></div>
      : error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-8 text-center" role="alert"><h3 className="text-xl font-semibold text-red-950">Vocabulary unavailable</h3><p className="mt-2 text-red-900">{error}</p><button type="button" className="mt-5 min-h-11 rounded-lg bg-red-700 px-5 font-semibold text-white" onClick={() => setRetryToken((value) => value + 1)}>Try again</button></div>
      : data && data.contentAssets.length === 0 ? <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-8 text-center" aria-live="polite"><h3 className="text-xl font-semibold">No words found</h3><p className="mt-2 text-slate-600">Try another spelling or remove one of the filters.</p><button type="button" onClick={clearFilters} className="mt-5 min-h-11 rounded-lg border border-blue-600 px-5 font-semibold text-blue-700">Clear filters</button></div>
      : data ? <div aria-live="polite" aria-busy={loading}>
        <div className="mt-5 hidden grid-cols-[minmax(9rem,.75fr)_minmax(9rem,.7fr)_minmax(0,2fr)_7rem_9rem] gap-4 px-5 text-xs font-bold uppercase tracking-[.08em] text-slate-500 lg:grid">
          <span>Chinese</span><span>Pinyin</span><span>English meaning</span><span>POS</span><span className="text-right">Audio</span>
        </div>
        <ul className={`mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white transition ${loading ? "opacity-55" : ""}`} aria-label={`${levelLabel} vocabulary results`}>
          {data.contentAssets.map((word) => <li key={word.id} className="grid gap-3 border-b border-slate-200 px-[16px] py-[14px] last:border-b-0 sm:px-[20px] lg:grid-cols-[minmax(9rem,.75fr)_minmax(9rem,.7fr)_minmax(0,2fr)_7rem_9rem] lg:items-center lg:gap-4">
            <div className="flex items-start justify-between gap-3 lg:block">
              <div className="flex flex-wrap items-baseline gap-2"><span className="text-2xl font-bold text-slate-950">{word.payload.hanzi}</span>{word.payload.traditional && word.payload.traditional !== word.payload.hanzi && <span className="text-sm text-slate-500">{word.payload.traditional}</span>}</div>
              <div className="lg:hidden">
                {word.formalAudioUrl
                  ? <AudioButton text={word.payload.hanzi} src={word.formalAudioUrl} label={`Play pronunciation for ${word.payload.hanzi}`} variant="icon" />
                  : <AudioButton text={word.payload.hanzi} variant="icon" unavailable />}
              </div>
            </div>
            <p className="text-base font-medium text-blue-700">{word.payload.pinyin}</p>
            <p className="text-sm leading-6 text-slate-700 sm:text-base">{word.payload.meaning}</p>
            <p><span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">{word.payload.partOfSpeech || "—"}</span></p>
            <div className="hidden items-center justify-end lg:flex">
              {word.formalAudioUrl
                ? <AudioButton text={word.payload.hanzi} src={word.formalAudioUrl} label={`Play pronunciation for ${word.payload.hanzi}`} variant="icon" />
                : <AudioButton text={word.payload.hanzi} variant="icon" unavailable />}
            </div>
          </li>)}
        </ul>

        {data.pagination.totalPages > 1 && <nav className="mt-[24px] flex flex-wrap items-center justify-center gap-3" aria-label="Vocabulary result pages">
          <button type="button" disabled={!data.pagination.hasPrevious || loading} onClick={() => changePage(data.pagination.page - 1)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
          <div className="flex flex-wrap items-center justify-center gap-1">
            {pages.map((item) => typeof item === "number" ? <button key={item} type="button" aria-current={item === data.pagination.page ? "page" : undefined} aria-label={`Page ${item}`} onClick={() => changePage(item)} disabled={loading} className={`min-h-11 min-w-11 rounded-lg px-3 text-sm font-semibold transition ${item === data.pagination.page ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"}`}>{item}</button> : <span key={item} className="px-1 text-slate-400" aria-hidden="true">…</span>)}
          </div>
          <button type="button" disabled={!data.pagination.hasNext || loading} onClick={() => changePage(data.pagination.page + 1)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
        </nav>}
      </div> : null}
  </section>;
}
