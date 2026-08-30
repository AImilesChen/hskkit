"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AudioButton } from "./audio-button";
import { detectDictionaryQueryType, type DictionaryQueryType } from "@/lib/dictionary/search-intent";

export type CharacterBrowseRecord = {
  hanzi: string;
  pinyin: string[];
  meanings: string[];
  radical: string;
  strokes: number;
  structure: string;
  initial: string;
  final: string;
  tone: number;
};
export type CharacterBrowseFacets = {
  radicals: string[];
  strokes: number[];
  initials: string[];
  finals: string[];
  tones: number[];
};
type CatalogWord = {
  id: string;
  level: number;
  levelBand: string;
  formalAudioAvailable: boolean;
  formalAudioUrl?: string;
  payload: { hanzi: string; traditional: string; pinyin: string; meaning: string; partOfSpeech: string };
};
type CatalogResponse = {
  contentAssets: CatalogWord[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number; hasPrevious: boolean; hasNext: boolean };
};
type Alternative = { slug: string; hanzi: string; pinyin: string; meaning: string };
type LearningView = {
  recentDictionarySearches: Array<{ query: string; level?: number; searchedAt: string }>;
  queueBinding: string;
  revision: number;
  message?: string;
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
  empty: "Hanzi, pinyin, or English", hanzi: "Chinese characters detected", pinyin: "Pinyin detected", english: "English detected",
};

function safePage(value: string | null) {
  const page = Number(value ?? "1");
  return Number.isInteger(page) && page > 0 ? page : 1;
}
function wordSlug(word: CatalogWord) { return detailSlugs[word.payload.hanzi] ?? word.id; }

export function DictionarySearch({ characterRecords, characterFacets }: { characterRecords: CharacterBrowseRecord[]; characterFacets: CharacterBrowseFacets }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const applied = useMemo(() => {
    const hasLevel = searchParams.has("level");
    const rawLevel = searchParams.get("level");
    const rawPartOfSpeech = searchParams.get("pos") ?? "";
    const rawRadical = searchParams.get("radical") ?? "";
    const rawStrokes = searchParams.get("strokes") ?? "";
    const rawInitial = searchParams.get("initial") ?? "";
    const rawFinal = searchParams.get("final") ?? "";
    const rawTone = searchParams.get("tone") ?? "";
    const validLevels = new Set(["all", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
    return {
      query: searchParams.get("q")?.trim().slice(0, 100) ?? "",
      level: !hasLevel ? "default" : (rawLevel !== null && validLevels.has(rawLevel) ? rawLevel : "all"),
      partOfSpeech: partOfSpeechOptions.some(([value]) => value === rawPartOfSpeech) ? rawPartOfSpeech : "",
      audio: searchParams.get("audio") === "formal" ? "formal" : "all",
      radical: characterFacets.radicals.includes(rawRadical) ? rawRadical : "",
      strokes: characterFacets.strokes.some((value) => String(value) === rawStrokes) ? rawStrokes : "",
      initial: characterFacets.initials.includes(rawInitial) ? rawInitial : "",
      final: characterFacets.finals.includes(rawFinal) ? rawFinal : "",
      tone: characterFacets.tones.some((value) => String(value) === rawTone) ? rawTone : "",
      page: safePage(searchParams.get("page")),
    };
  }, [characterFacets, searchParams]);
  const [query, setQuery] = useState(applied.query);
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [suggestions, setSuggestions] = useState<CatalogWord[]>([]);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [previewId, setPreviewId] = useState("");
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const [learning, setLearning] = useState<LearningView | null>(null);
  const [script, setScript] = useState<"simplified" | "traditional">("simplified");
  const recordedSearch = useRef("");
  const intent = detectDictionaryQueryType(query);

  useEffect(() => setQuery(applied.query), [applied.query]);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/v1/learning", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as LearningView;
        if (response.ok) setLearning(body);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!learning || !applied.query) return;
    const level = applied.level !== "all" && applied.level !== "default" ? Number(applied.level) : undefined;
    const signature = `${applied.query.toLocaleLowerCase()}|${level ?? "all"}`;
    if (recordedSearch.current === signature) return;
    recordedSearch.current = signature;
    const controller = new AbortController();
    void fetch("/api/v1/learning", {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        action: "dictionary_search",
        queueBinding: learning.queueBinding,
        clientRevision: learning.revision,
        payload: { query: applied.query, level, idempotencyKey: `dictionary-search-${crypto.randomUUID()}` },
      }),
    }).then(async (response) => {
      const body = await response.json() as LearningView;
      if (response.ok) setLearning(body);
    }).catch(() => undefined);
    return () => controller.abort();
  }, [applied.level, applied.query, learning]);
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(applied.page), pageSize: "12" });
    if (applied.query) params.set("q", applied.query);
    if (applied.level !== "all" && applied.level !== "default") params.set("level", applied.level);
    else if (applied.level === "default" && !applied.query) params.set("level", "1");
    if (applied.partOfSpeech) params.set("pos", applied.partOfSpeech);
    if (applied.audio === "formal") params.set("audio", "formal");
    setLoading(true); setError(""); setAlternatives([]);
    void fetch(`/api/v1/catalog/words?${params.toString()}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as CatalogResponse & { message?: string };
        if (!response.ok) throw new Error(body.message || "The dictionary is temporarily unavailable.");
        setData(body);
        setPreviewId((current) => body.contentAssets.some((word) => word.id === current) ? current : (body.contentAssets[0]?.id ?? ""));
        if (body.contentAssets.length === 0 && applied.query) {
          const suggestionParams = new URLSearchParams({ q: applied.query });
          if (applied.level !== "all" && applied.level !== "default") suggestionParams.set("level", applied.level);
          if (applied.partOfSpeech) suggestionParams.set("pos", applied.partOfSpeech);
          if (applied.audio === "formal") suggestionParams.set("audio", "formal");
          return fetch(`/api/v1/dictionary/suggestions?${suggestionParams.toString()}`, { signal: controller.signal, cache: "no-store" })
            .then((suggestionResponse) => suggestionResponse.ok ? suggestionResponse.json() as Promise<{ suggestions: Alternative[] }> : { suggestions: [] })
            .then((suggestionBody) => setAlternatives(suggestionBody.suggestions));
        }
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "The dictionary is temporarily unavailable.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [applied.audio, applied.level, applied.page, applied.partOfSpeech, applied.query, retryToken]);

  useEffect(() => {
    const value = query.trim();
    if (!value) { setSuggestions([]); setSuggestionsOpen(false); setSuggesting(false); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ q: value, page: "1", pageSize: "6" });
      const detected = detectDictionaryQueryType(value);
      if (detected !== "empty") params.set("field", detected);
      if (applied.level !== "all" && applied.level !== "default") params.set("level", applied.level);
      if (applied.audio === "formal") params.set("audio", "formal");
      setSuggesting(true);
      void fetch(`/api/v1/catalog/words?${params.toString()}`, { signal: controller.signal, cache: "no-store" })
        .then((response) => response.ok ? response.json() as Promise<CatalogResponse> : Promise.reject(new Error("suggestions unavailable")))
        .then((body) => { setSuggestions(body.contentAssets); setSuggestionsOpen(true); setActiveSuggestion(-1); })
        .catch((reason: unknown) => { if (!(reason instanceof DOMException && reason.name === "AbortError")) setSuggestions([]); })
        .finally(() => { if (!controller.signal.aborted) setSuggesting(false); });
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [applied.audio, applied.level, query]);

  function navigate(next: Partial<typeof applied> & { query?: string; page?: number }) {
    const values = { ...applied, ...next };
    const params = new URLSearchParams();
    if (values.query.trim()) params.set("q", values.query.trim());
    const nextLevel = values.level;
    if (nextLevel !== "default") params.set("level", nextLevel);
    if (values.partOfSpeech) params.set("pos", values.partOfSpeech);
    if (values.audio === "formal") params.set("audio", "formal");
    if (values.radical) params.set("radical", values.radical);
    if (values.strokes) params.set("strokes", values.strokes);
    if (values.initial) params.set("initial", values.initial);
    if (values.final) params.set("final", values.final);
    if (values.tone) params.set("tone", values.tone);
    if (values.page > 1) params.set("page", String(values.page));
    setSuggestionsOpen(false);
    router.push(`${pathname}${params.size ? `?${params.toString()}` : ""}`, { scroll: false });
  }
  function submit(event: FormEvent) { event.preventDefault(); navigate({ query, page: 1 }); }
  function chooseSuggestion(word: CatalogWord) { setQuery(word.payload.hanzi); navigate({ query: word.payload.hanzi, page: 1 }); }
  function onQueryKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!suggestionsOpen || suggestions.length === 0) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveSuggestion((value) => (value + 1) % suggestions.length); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActiveSuggestion((value) => value <= 0 ? suggestions.length - 1 : value - 1); }
    else if (event.key === "Enter" && activeSuggestion >= 0) { event.preventDefault(); chooseSuggestion(suggestions[activeSuggestion]); }
    else if (event.key === "Escape") setSuggestionsOpen(false);
  }

  async function clearRecentSearches() {
    if (!learning) return;
    try {
      const response = await fetch("/api/v1/learning", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "clear_dictionary_searches", queueBinding: learning.queueBinding, clientRevision: learning.revision, payload: { idempotencyKey: `dictionary-clear-searches-${crypto.randomUUID()}` } }),
      });
      const body = await response.json() as LearningView;
      if (response.ok) setLearning(body);
    } catch { /* The results remain usable when history cannot be cleared. */ }
  }

  const selectedLevel = applied.level === "default" ? "1" : applied.level;
  const defaultBrowse = !applied.query && applied.level === "default" && !applied.partOfSpeech && applied.audio === "all";
  const hasConditions = Boolean(applied.query || applied.level !== "default" || applied.partOfSpeech || applied.audio === "formal" || applied.radical || applied.strokes || applied.initial || applied.final || applied.tone);
  const characters = characterRecords.filter((character) => (!applied.radical || character.radical === applied.radical)
    && (!applied.strokes || character.strokes === Number(applied.strokes))
    && (!applied.initial || character.initial === applied.initial)
    && (!applied.final || character.final === applied.final)
    && (!applied.tone || character.tone === Number(applied.tone)));
  const hasCharacterFacet = Boolean(applied.radical || applied.strokes || applied.initial || applied.final || applied.tone);
  const preview = data?.contentAssets.find((word) => word.id === previewId) ?? null;

  return <div className="w-full">
    <form className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.45)] sm:p-6" onSubmit={submit}>
      <div className="relative">
        <label className="sr-only" htmlFor="dictionary-query">Search Chinese words</label>
        <div className="flex flex-col gap-3 sm:flex-row"><div className="relative min-w-0 flex-1">
          <input id="dictionary-query" value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => query.trim() && setSuggestionsOpen(true)} onKeyDown={onQueryKeyDown} placeholder="Search 学习, xue xi, or to study" className="min-h-14 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 pr-12 text-lg outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100" role="combobox" aria-autocomplete="list" aria-expanded={suggestionsOpen} aria-controls="dictionary-suggestions" aria-activedescendant={activeSuggestion >= 0 ? `dictionary-suggestion-${activeSuggestion}` : undefined} />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">⌕</span>
        </div><button type="submit" className="min-h-14 rounded-xl bg-blue-600 px-7 font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200">Search</button></div>
        <div className="mt-2 flex min-h-5 items-center justify-between gap-3 text-xs text-slate-500"><span>{intentLabels[intent]}</span>{suggesting && <span aria-live="polite">Finding matches…</span>}</div>
        {suggestionsOpen && query.trim() && <div id="dictionary-suggestions" role="listbox" className="absolute left-0 right-0 top-[72px] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:right-[123px]">
          {suggestions.length > 0 ? suggestions.map((word, index) => <button id={`dictionary-suggestion-${index}`} role="option" aria-selected={activeSuggestion === index} key={word.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => chooseSuggestion(word)} className={`grid min-h-16 w-full grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 ${activeSuggestion === index ? "bg-blue-50" : "hover:bg-slate-50"}`}><strong className="text-xl text-slate-950">{script === "traditional" && word.payload.traditional ? word.payload.traditional : word.payload.hanzi}</strong><span className="min-w-0"><span className="block text-sm text-blue-700">{word.payload.pinyin}</span><span className="block truncate text-sm text-slate-600">{word.payload.meaning}</span></span><span className="text-xs font-bold text-slate-500">{word.levelBand === "7-9" ? "7–9" : `HSK ${word.level}`}</span></button>) : !suggesting && <p className="p-5 text-sm text-slate-600">No close matches yet. Press Search to see the full result.</p>}
        </div>}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Recent searches</p>{(learning?.recentDictionarySearches.length ?? 0) > 0 ? <button type="button" onClick={() => void clearRecentSearches()} className="min-h-9 px-2 text-xs font-bold text-blue-700 hover:underline">Clear</button> : null}</div>
          <div className="mt-2 flex max-w-full flex-wrap gap-2">{learning?.recentDictionarySearches.slice(0, 8).map((item) => <button type="button" key={`${item.query}-${item.level ?? "all"}`} onClick={() => { setQuery(item.query); navigate({ query: item.query, level: item.level ? String(item.level) : "all", page: 1 }); }} className="min-h-9 max-w-full truncate rounded-full bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-800">{item.query}{item.level ? ` · HSK ${item.level >= 7 ? "7–9" : item.level}` : ""}</button>)}{learning && learning.recentDictionarySearches.length === 0 ? <span className="text-sm text-slate-500">Your completed searches will appear here.</span> : null}</div>
        </div>
        <div className="shrink-0"><p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Result script</p><div className="mt-2 inline-flex rounded-lg bg-slate-100 p-1" role="group" aria-label="Result script"><button type="button" aria-pressed={script === "simplified"} onClick={() => setScript("simplified")} className={`min-h-9 rounded-md px-3 text-sm font-bold ${script === "simplified" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>Simplified</button><button type="button" aria-pressed={script === "traditional"} onClick={() => setScript("traditional")} className={`min-h-9 rounded-md px-3 text-sm font-bold ${script === "traditional" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>Traditional</button></div></div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-bold text-slate-700">Browse by HSK level</p>{hasConditions && <button type="button" className="min-h-11 rounded-lg px-3 text-sm font-bold text-blue-700 hover:bg-blue-50" onClick={() => { setQuery(""); router.push(pathname, { scroll: false }); }}>Reset</button>}</div>
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10"><button type="button" onClick={() => navigate({ level: "all", page: 1 })} aria-pressed={selectedLevel === "all"} className={`min-h-11 whitespace-nowrap rounded-lg border px-1 text-xs font-bold sm:px-2 sm:text-sm ${selectedLevel === "all" ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-400"}`}>All</button>{Array.from({ length: 9 }, (_, index) => String(index + 1)).map((item) => <button type="button" key={item} onClick={() => navigate({ level: item, page: 1 })} aria-pressed={selectedLevel === item} className={`min-h-11 whitespace-nowrap rounded-lg border px-1 text-xs font-bold sm:px-2 sm:text-sm ${selectedLevel === item ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-400"}`}>HSK {item}</button>)}</div>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><p className="text-sm text-slate-600">Levels 7–9 share one unified advanced vocabulary band.</p><div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-700">Part of speech <select value={applied.partOfSpeech} onChange={(event) => navigate({ partOfSpeech: event.target.value, page: 1 })} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3">{partOfSpeechOptions.map(([value, label]) => <option key={value || "all"} value={value}>{label}</option>)}</select></label>
          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={applied.audio === "formal"} onChange={(event) => navigate({ audio: event.target.checked ? "formal" : "all", page: 1 })} /> Formal audio only</label>
        </div></div>
        {selectedLevel !== "all" && <Link href={`/vocabulary/${selectedLevel}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-blue-700 hover:underline">Open HSK {Number(selectedLevel) >= 7 ? "7–9" : selectedLevel} vocabulary →</Link>}
      </div>
    </form>

    <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5" aria-labelledby="character-browse-title">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-blue-700">Published character guides</p><h2 id="character-browse-title" className="mt-1 text-xl font-bold text-slate-950">Browse character guides by shape or sound</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Filter the {characterRecords.length} character guides currently available, then open one for structure, radical notes, and related words.</p></div>{hasCharacterFacet && <button type="button" className="min-h-11 rounded-lg px-3 text-sm font-bold text-blue-700 hover:bg-blue-100" onClick={() => navigate({ radical: "", strokes: "", initial: "", final: "", tone: "", page: 1 })}>Clear character filters</button>}</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[{ label: "Radical", key: "radical", value: applied.radical, options: characterFacets.radicals }, { label: "Stroke count", key: "strokes", value: applied.strokes, options: characterFacets.strokes }, { label: "Initial", key: "initial", value: applied.initial, options: characterFacets.initials }, { label: "Final", key: "final", value: applied.final, options: characterFacets.finals }, { label: "Tone", key: "tone", value: applied.tone, options: characterFacets.tones }].map((facet) => <label key={facet.key} className="text-sm font-semibold text-slate-700">{facet.label}<select value={facet.value} onChange={(event) => navigate({ [facet.key]: event.target.value, page: 1 })} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3"><option value="">All</option>{facet.options.map((option) => <option key={String(option)} value={String(option)}>{facet.key === "tone" ? `${option === 5 ? "Neutral" : option}` : option}</option>)}</select></label>)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{characters.map((character) => <Link key={character.hanzi} href={`/character/${encodeURIComponent(character.hanzi)}`} className="min-w-20 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center hover:border-blue-400 hover:bg-blue-50"><span className="block text-2xl font-bold text-slate-950">{character.hanzi}</span><span className="text-xs text-blue-700">{character.pinyin[0]}</span></Link>)}{characters.length === 0 && <p className="text-sm text-slate-600">No character matches every selected facet. Clear one filter and try again.</p>}</div>
    </section>

    {loading && !data ? <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50 p-7 text-center" aria-live="polite"><p className="font-semibold text-blue-950">Loading real dictionary words…</p></div>
      : error ? <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-7 text-center" role="alert"><h2 className="text-xl font-semibold text-red-950">Dictionary unavailable</h2><p className="mt-2 text-red-900">{error}</p><button type="button" className="mt-5 min-h-11 rounded-lg bg-red-700 px-5 font-semibold text-white" onClick={() => setRetryToken((value) => value + 1)}>Try again</button></div>
      : data && data.contentAssets.length === 0 ? <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-7 text-center" aria-live="polite"><h2 className="text-2xl font-semibold">No exact matches</h2><p className="mt-2 text-slate-600">Check the spelling, remove a filter, or choose a real alternative below.</p>{alternatives.length > 0 && <div className="mt-5"><h3 className="font-bold text-slate-900">Did you mean?</h3><div className="mt-3 flex flex-wrap justify-center gap-2">{alternatives.map((item) => <Link key={item.slug} href={`/word/${encodeURIComponent(item.slug)}`} className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-left hover:border-blue-500"><strong className="block text-lg">{item.hanzi} <span className="text-sm font-medium text-blue-700">{item.pinyin}</span></strong><span className="text-sm text-slate-600">{item.meaning}</span></Link>)}</div></div>}</div>
      : data ? <section className="mt-8" aria-live="polite" aria-busy={loading}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">{defaultBrowse ? "Start here" : "Dictionary results"}</p><h2 className="mt-1 text-2xl font-bold text-slate-950">{defaultBrowse ? "Beginner words to explore" : `${data.pagination.total.toLocaleString()} matching words`}</h2></div><p className="text-sm text-slate-500">Page {data.pagination.page} of {data.pagination.totalPages}</p></div>
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-5"><div className={`grid gap-3 md:grid-cols-2 lg:grid-cols-1 ${loading ? "opacity-60" : ""}`}>{data.contentAssets.map((word) => <article key={word.id} className={`group grid min-w-0 grid-cols-[1fr_auto] items-center gap-4 rounded-2xl border bg-white p-5 transition hover:border-blue-300 hover:shadow-md ${previewId === word.id ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"}`}><div className="min-w-0"><div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><Link href={`/word/${encodeURIComponent(wordSlug(word))}`} className="inline-flex min-h-11 min-w-11 items-center text-3xl font-bold text-slate-950 hover:text-blue-700 hover:underline">{script === "traditional" && word.payload.traditional ? word.payload.traditional : word.payload.hanzi}</Link><span className="text-base font-medium text-blue-700">{word.payload.pinyin}</span></div><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-700">{word.payload.meaning}</p><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{word.levelBand === "7-9" ? "HSK 7–9" : `HSK ${word.level}`}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{word.payload.partOfSpeech}</span>{word.formalAudioAvailable && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Formal audio</span>}</div><button type="button" onClick={() => setPreviewId(word.id)} aria-pressed={previewId === word.id} className="mt-3 hidden min-h-11 text-sm font-bold text-blue-700 hover:underline lg:inline-flex lg:items-center">{previewId === word.id ? "Previewing" : "Quick preview"}</button></div>{word.formalAudioAvailable && word.formalAudioUrl ? <AudioButton text={word.payload.hanzi} label={`Listen to ${word.payload.hanzi}`} src={word.formalAudioUrl} /> : null}</article>)}</div>
          <aside className="sticky top-24 hidden h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:block" aria-label="Quick preview" aria-live="polite"><p className="text-xs font-bold uppercase tracking-[.14em] text-blue-700">Quick preview</p>{preview ? <><div className="mt-4 flex items-start justify-between gap-3"><div><h3 className="text-4xl font-bold text-slate-950">{script === "traditional" && preview.payload.traditional ? preview.payload.traditional : preview.payload.hanzi}</h3><p className="mt-1 font-semibold text-blue-700">{preview.payload.pinyin}</p></div>{preview.formalAudioAvailable && preview.formalAudioUrl ? <AudioButton text={preview.payload.hanzi} label={`Listen to ${preview.payload.hanzi}`} src={preview.formalAudioUrl} /> : null}</div><p className="mt-4 leading-7 text-slate-700">{preview.payload.meaning}</p><p className="mt-4 text-sm text-slate-500">{preview.levelBand === "7-9" ? "HSK 7–9" : `HSK ${preview.level}`} · {preview.payload.partOfSpeech}</p><Link href={`/word/${encodeURIComponent(wordSlug(preview))}`} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-4 font-bold text-white hover:bg-blue-700">Open full entry →</Link></> : <p className="mt-4 text-sm text-slate-600">Choose Preview on a result.</p>}</aside>
        </div>
        <nav className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3" aria-label="Dictionary result pages"><button type="button" disabled={!data.pagination.hasPrevious || loading} onClick={() => navigate({ page: data.pagination.page - 1 })} className="min-h-11 justify-self-start rounded-lg border border-blue-600 px-4 font-semibold text-blue-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400">Previous</button><span className="text-sm text-slate-600">{data.pagination.page} / {data.pagination.totalPages}</span><button type="button" disabled={!data.pagination.hasNext || loading} onClick={() => navigate({ page: data.pagination.page + 1 })} className="min-h-11 justify-self-end rounded-lg border border-blue-600 px-4 font-semibold text-blue-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400">Next</button></nav>
      </section> : null}
  </div>;
}
