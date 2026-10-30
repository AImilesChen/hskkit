"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AudioButton } from "./audio-button";
import { detectDictionaryQueryType, type DictionaryQueryType } from "@/lib/dictionary/search-intent";

export type CharacterBrowseFacets = { radicals: string[]; strokes: number[]; structures: string[]; initials: string[]; finals: string[]; tones: number[] };
type DictionaryMode = "words" | "levels" | "characters" | "pinyin";
type CatalogWord = { id: string; level: number; levelBand: string; formalAudioAvailable: boolean; formalAudioUrl?: string; payload: { hanzi: string; traditional: string; pinyin: string; meaning: string; partOfSpeech: string } };
export type CatalogResponse = { contentAssets: CatalogWord[]; pagination: Pagination };
type CharacterRecord = { hanzi: string; traditional?: string; simplified?: string; pinyin: string[]; meanings: string[]; radical: string; strokes: number; structure: string; decomposition: string; firstLevel: number; levels: number[]; wordCount: number };
type CharacterResponse = { characters: CharacterRecord[]; pagination: Pagination };
type Pagination = { page: number; pageSize: number; total: number; totalPages: number; hasPrevious: boolean; hasNext: boolean };
type Alternative = { slug: string; hanzi: string; pinyin: string; meaning: string };
type LearningView = { recentDictionarySearches: Array<{ query: string; level?: number; searchedAt: string }>; queueBinding: string; revision: number; message?: string };

const detailSlugs: Record<string, string> = { "学习": "xue-xi", "旅行": "lu-xing", "习惯": "xi-guan", "环境": "huan-jing", "经验": "jing-yan", "交流": "jiao-liu", "责任": "ze-ren", "改善": "gai-shan", "趋势": "qu-shi", "贡献": "gong-xian", "资源": "zi-yuan", "倡导": "chang-dao", "买": "mai" };
const partOfSpeechOptions = [["", "All word types"], ["N", "Nouns"], ["V", "Verbs"], ["Adj", "Adjectives"], ["Adv", "Adverbs"], ["Pron", "Pronouns"], ["Num", "Numbers"], ["M", "Measure words"]] as const;
const structureLabels: Record<string, string> = {
  "left-right": "Left–right",
  "top-bottom": "Top–bottom",
  "three-part": "Three-part",
  enclosure: "Enclosure",
  overlaid: "Overlaid",
  "single-component": "Single component",
  unknown: "Structure unavailable",
};
const levelOptions = [
  { value: "1", label: "HSK 1" }, { value: "2", label: "HSK 2" },
  { value: "3", label: "HSK 3" }, { value: "4", label: "HSK 4" },
  { value: "5", label: "HSK 5" }, { value: "6", label: "HSK 6" },
  { value: "7", label: "HSK 7–9" },
] as const;
const intentLabels: Record<DictionaryQueryType, string> = { empty: "Hanzi, pinyin, or English", hanzi: "Chinese characters detected", pinyin: "Pinyin detected", english: "English detected" };
const DICTIONARY_REQUEST_TIMEOUT_MS = 8_000;
const modeCopy: Record<DictionaryMode, { label: string; placeholder: string; description: string; action: string }> = {
  words: { label: "Words", placeholder: "Search 学习, xue xi, or to study", description: "Search published words by Hanzi, pinyin or English.", action: "Search words" },
  levels: { label: "HSK levels", placeholder: "Search within an HSK level", description: "Browse the complete published vocabulary from HSK 1 through the unified HSK 7–9 band.", action: "Search level" },
  characters: { label: "Characters", placeholder: "Search 学, xué, or learning", description: "Search characters found in the published HSK vocabulary.", action: "Search characters" },
  pinyin: { label: "Pinyin", placeholder: "Search xue, xué, or xue2", description: "Find characters by syllable, initial, final and tone.", action: "Search pinyin" },
};

function safePage(value: string | null) { const page = Number(value ?? "1"); return Number.isInteger(page) && page > 0 ? page : 1; }
function wordSlug(word: CatalogWord) { return detailSlugs[word.payload.hanzi] ?? word.id; }
function levelLabel(level: string | number) { return Number(level) >= 7 ? "7–9" : String(level); }

export function DictionarySearch({ characterFacets, initialWords }: { characterFacets: CharacterBrowseFacets; initialWords: CatalogResponse }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const applied = useMemo(() => {
    const rawMode = searchParams.get("mode");
    const mode: DictionaryMode = rawMode === "levels" || rawMode === "characters" || rawMode === "pinyin" ? rawMode : "words";
    const hasLevel = searchParams.has("level");
    const rawLevel = searchParams.get("level");
    const rawPartOfSpeech = searchParams.get("pos") ?? "";
    const rawRadical = searchParams.get("radical") ?? "";
    const rawStrokes = searchParams.get("strokes") ?? "";
    const rawStructure = searchParams.get("structure") ?? "";
    const rawInitial = searchParams.get("initial") ?? "";
    const rawFinal = searchParams.get("final") ?? "";
    const rawTone = searchParams.get("tone") ?? "";
    const normalizedLevel = rawLevel === "8" || rawLevel === "9" ? "7" : rawLevel;
    const validLevels = new Set(["all", ...levelOptions.map((item) => item.value)]);
    return {
      mode,
      query: searchParams.get("q")?.trim().slice(0, 100) ?? "",
      level: !hasLevel ? "default" : (normalizedLevel !== null && validLevels.has(normalizedLevel) ? normalizedLevel : "all"),
      partOfSpeech: partOfSpeechOptions.some(([value]) => value === rawPartOfSpeech) ? rawPartOfSpeech : "",
      audio: searchParams.get("audio") === "formal" ? "formal" : "all",
      radical: characterFacets.radicals.includes(rawRadical) ? rawRadical : "",
      strokes: characterFacets.strokes.some((value) => String(value) === rawStrokes) ? rawStrokes : "",
      structure: characterFacets.structures.includes(rawStructure) ? rawStructure : "",
      initial: characterFacets.initials.includes(rawInitial) ? rawInitial : "",
      final: characterFacets.finals.includes(rawFinal) ? rawFinal : "",
      tone: characterFacets.tones.some((value) => String(value) === rawTone) ? rawTone : "",
      page: safePage(searchParams.get("page")),
    };
  }, [characterFacets, searchParams]);
  const [query, setQuery] = useState(applied.query);
  const [words, setWords] = useState<CatalogResponse | null>(initialWords);
  const [characters, setCharacters] = useState<CharacterResponse | null>(null);
  const [suggestions, setSuggestions] = useState<CatalogWord[]>([]);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const [learning, setLearning] = useState<LearningView | null>(null);
  const [script, setScript] = useState<"simplified" | "traditional">("simplified");
  const recordedSearch = useRef("");
  const firstRequest = useRef(true);
  const intent = detectDictionaryQueryType(query);

  useEffect(() => setQuery(applied.query), [applied.query]);
  useEffect(() => {
    const controller = new AbortController();
    const loadLearning = () => { void fetch("/api/v1/learning", { cache: "no-store", signal: controller.signal }).then(async (response) => { const body = await response.json() as LearningView; if (response.ok) setLearning(body); }).catch(() => undefined); };
    const idleApi = window as unknown as {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const idleId = idleApi.requestIdleCallback
      ? idleApi.requestIdleCallback(loadLearning, { timeout: 1_500 })
      : window.setTimeout(loadLearning, 500);
    return () => {
      controller.abort();
      if (idleApi.cancelIdleCallback) idleApi.cancelIdleCallback(idleId as number);
      else window.clearTimeout(idleId);
    };
  }, []);
  useEffect(() => {
    if (!learning || !applied.query) return;
    const level = applied.level !== "all" && applied.level !== "default" ? Number(applied.level) : undefined;
    const signature = `${applied.query.toLocaleLowerCase()}|${level ?? "all"}`;
    if (recordedSearch.current === signature) return;
    recordedSearch.current = signature;
    const controller = new AbortController();
    void fetch("/api/v1/learning", { method: "POST", headers: { "content-type": "application/json" }, signal: controller.signal, body: JSON.stringify({ action: "dictionary_search", queueBinding: learning.queueBinding, clientRevision: learning.revision, payload: { query: applied.query, level, idempotencyKey: `dictionary-search-${crypto.randomUUID()}` } }) }).then(async (response) => { const body = await response.json() as LearningView; if (response.ok) setLearning(body); }).catch(() => undefined);
    return () => controller.abort();
  }, [applied.level, applied.query, learning]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutSignal = AbortSignal.timeout(DICTIONARY_REQUEST_TIMEOUT_MS);
    const signal = AbortSignal.any([controller.signal, timeoutSignal]);
    const keepInitialVisible = firstRequest.current && applied.mode === "words" && !applied.query && applied.level === "default" && !applied.partOfSpeech && applied.audio === "all";
    firstRequest.current = false;
    setLoading(!keepInitialVisible); setError(""); setAlternatives([]);
    if (applied.mode === "words" || applied.mode === "levels") {
      setCharacters(null);
      if (!keepInitialVisible) setWords(null);
      const params = new URLSearchParams({ page: String(applied.page), pageSize: "12" });
      if (applied.query) params.set("q", applied.query);
      if (applied.level !== "all" && applied.level !== "default") params.set("level", applied.level);
      else if (applied.level === "default" && !applied.query) params.set("level", "1");
      if (applied.partOfSpeech) params.set("pos", applied.partOfSpeech);
      if (applied.audio === "formal") params.set("audio", "formal");
      void fetch(`/api/v1/catalog/words?${params.toString()}`, { signal, cache: "default" }).then(async (response) => {
        const body = await response.json() as CatalogResponse & { message?: string };
        if (!response.ok) throw new Error(body.message || "The dictionary is temporarily unavailable.");
        if (signal.aborted) return;
        setWords(body); setCharacters(null);
        if (body.contentAssets.length === 0 && applied.query) {
          const suggestionParams = new URLSearchParams({ q: applied.query });
          return fetch(`/api/v1/dictionary/suggestions?${suggestionParams.toString()}`, { signal, cache: "default" }).then((result) => result.ok ? result.json() as Promise<{ suggestions: Alternative[] }> : { suggestions: [] }).then((result) => setAlternatives(result.suggestions));
        }
      }).catch((reason: unknown) => { if (!controller.signal.aborted && !keepInitialVisible) setError(reason instanceof DOMException && reason.name === "TimeoutError" ? "The dictionary took too long to respond. Please try again." : reason instanceof Error ? reason.message : "The dictionary is temporarily unavailable."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    } else {
      setWords(null);
      setCharacters(null);
      const params = new URLSearchParams({ page: String(applied.page), pageSize: "48" });
      if (applied.query) params.set("q", applied.query);
      if (applied.level !== "all" && applied.level !== "default") params.set("level", applied.level);
      if (applied.radical) params.set("radical", applied.radical);
      if (applied.strokes) params.set("strokes", applied.strokes);
      if (applied.structure) params.set("structure", applied.structure);
      if (applied.initial) params.set("initial", applied.initial);
      if (applied.final) params.set("final", applied.final);
      if (applied.tone) params.set("tone", applied.tone);
      void fetch(`/api/v1/dictionary/characters?${params.toString()}`, { signal, cache: "default" }).then(async (response) => { const body = await response.json() as CharacterResponse & { message?: string }; if (!response.ok) throw new Error(body.message || "The character index is temporarily unavailable."); if (signal.aborted) return; setCharacters(body); setWords(null); }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof DOMException && reason.name === "TimeoutError" ? "The character index took too long to respond. Please try again." : reason instanceof Error ? reason.message : "The character index is temporarily unavailable."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }
    return () => controller.abort();
  }, [applied.audio, applied.final, applied.initial, applied.level, applied.mode, applied.page, applied.partOfSpeech, applied.query, applied.radical, applied.strokes, applied.structure, applied.tone, retryToken]);

  useEffect(() => {
    const value = query.trim();
    if (applied.mode !== "words" || !value) { setSuggestions([]); setSuggestionsOpen(false); setSuggesting(false); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ q: value, page: "1", pageSize: "6" });
      const detected = detectDictionaryQueryType(value); if (detected !== "empty") params.set("field", detected);
      setSuggesting(true);
      void fetch(`/api/v1/catalog/words?${params.toString()}`, { signal: controller.signal, cache: "default" }).then((response) => response.ok ? response.json() as Promise<CatalogResponse> : Promise.reject(new Error("suggestions unavailable"))).then((body) => { setSuggestions(body.contentAssets); setSuggestionsOpen(true); setActiveSuggestion(-1); }).catch((reason: unknown) => { if (!(reason instanceof DOMException && reason.name === "AbortError")) setSuggestions([]); }).finally(() => { if (!controller.signal.aborted) setSuggesting(false); });
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [applied.mode, query]);

  function navigate(next: Partial<typeof applied> & { query?: string; page?: number }) {
    const values = { ...applied, ...next };
    const params = new URLSearchParams();
    if (values.mode !== "words") params.set("mode", values.mode);
    if (values.query.trim()) params.set("q", values.query.trim());
    const nextLevel = values.level;
    if (nextLevel !== "default") params.set("level", nextLevel);
    if (values.mode === "words" || values.mode === "levels") {
      if (values.partOfSpeech) params.set("pos", values.partOfSpeech);
      if (values.audio === "formal") params.set("audio", "formal");
    } else {
      if (values.radical) params.set("radical", values.radical);
      if (values.strokes) params.set("strokes", values.strokes);
      if (values.structure) params.set("structure", values.structure);
      if (values.initial) params.set("initial", values.initial);
      if (values.final) params.set("final", values.final);
      if (values.tone) params.set("tone", values.tone);
    }
    if (values.page > 1) params.set("page", String(values.page));
    setSuggestionsOpen(false);
    router.push(`${pathname}${params.size ? `?${params.toString()}` : ""}`, { scroll: false });
  }
  function switchMode(mode: DictionaryMode) { navigate({ mode, page: 1, radical: "", strokes: "", structure: "", initial: "", final: "", tone: "", partOfSpeech: "", audio: "all" }); }
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
    try { const response = await fetch("/api/v1/learning", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "clear_dictionary_searches", queueBinding: learning.queueBinding, clientRevision: learning.revision, payload: { idempotencyKey: `dictionary-clear-searches-${crypto.randomUUID()}` } }) }); const body = await response.json() as LearningView; if (response.ok) setLearning(body); } catch { /* Results remain usable if history cannot be cleared. */ }
  }

  const wordResultMode = applied.mode === "words" || applied.mode === "levels";
  const selectedLevel = applied.level === "default" ? (wordResultMode ? "1" : "all") : applied.level;
  const defaultBrowse = applied.mode === "words" && !applied.query && applied.level === "default" && !applied.partOfSpeech && applied.audio === "all";
  const hasConditions = Boolean(applied.query || applied.level !== "default" || applied.partOfSpeech || applied.audio === "formal" || applied.radical || applied.strokes || applied.structure || applied.initial || applied.final || applied.tone);
  const activeData = wordResultMode ? words : characters;

  return <div className="min-h-[640px] w-full">
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_-38px_rgba(15,23,42,.55)]" aria-label="Dictionary search and browse controls">
      <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50" role="group" aria-label="Dictionary task">
        {(Object.keys(modeCopy) as DictionaryMode[]).map((mode) => <button key={mode} type="button" aria-pressed={applied.mode === mode} onClick={() => switchMode(mode)} className={`min-h-12 border-b-2 px-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 sm:px-3 sm:text-sm ${applied.mode === mode ? "border-blue-600 bg-white text-blue-700" : "border-transparent text-slate-600 hover:bg-white hover:text-slate-950"}`}>{modeCopy[mode].label}</button>)}
      </div>
      <form className="p-3 sm:p-4" onSubmit={submit}>
        <div className="relative">
          <label className="sr-only" htmlFor="dictionary-query">Search the Chinese dictionary</label>
          <div className="flex gap-2 sm:flex-row"><input id="dictionary-query" value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => query.trim() && setSuggestionsOpen(true)} onKeyDown={onQueryKeyDown} placeholder={modeCopy[applied.mode].placeholder} maxLength={applied.mode === "words" ? 100 : 40} className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 text-base outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100" role="combobox" aria-autocomplete="list" aria-expanded={suggestionsOpen} aria-controls="dictionary-suggestions" aria-activedescendant={activeSuggestion >= 0 ? `dictionary-suggestion-${activeSuggestion}` : undefined} /><button type="submit" className="min-h-11 shrink-0 rounded-xl bg-blue-600 px-3 text-sm font-bold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus:ring-blue-200 sm:px-5 sm:text-base">{modeCopy[applied.mode].action}</button></div>
          <div className="mt-1.5 flex min-h-5 items-center justify-between gap-3 text-xs text-slate-500"><span>{applied.mode === "words" && query.trim() ? intentLabels[intent] : modeCopy[applied.mode].description}</span>{suggesting ? <span aria-live="polite">Finding matches…</span> : null}</div>
          {suggestionsOpen && query.trim() ? <div id="dictionary-suggestions" role="listbox" className="absolute left-0 right-0 top-[64px] z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl sm:right-[118px]">{suggestions.length > 0 ? suggestions.map((word, index) => <button id={`dictionary-suggestion-${index}`} role="option" aria-selected={activeSuggestion === index} key={word.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => chooseSuggestion(word)} className={`grid min-h-16 w-full grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 ${activeSuggestion === index ? "bg-blue-50" : "hover:bg-slate-50"}`}><strong className="text-xl text-slate-950">{word.payload.hanzi}</strong><span className="min-w-0"><span className="block text-sm text-blue-700">{word.payload.pinyin}</span><span className="block truncate text-sm text-slate-600">{word.payload.meaning}</span></span><span className="text-xs font-bold text-slate-500">HSK {levelLabel(word.level)}</span></button>) : !suggesting ? <p className="p-5 text-sm text-slate-600">No close matches yet. Press Search to see the full result.</p> : null}</div> : null}
        </div>

        {(learning?.recentDictionarySearches.length ?? 0) > 0 ? <div className="mt-3 border-t border-slate-100 pt-3">
          {(learning?.recentDictionarySearches.length ?? 0) > 0 ? <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="text-xs font-bold uppercase tracking-[.1em] text-slate-500">Recent searches</p><button type="button" onClick={() => void clearRecentSearches()} className="min-h-11 px-2 text-xs font-bold text-blue-700 hover:underline">Clear</button></div><div className="mt-2 flex max-w-full flex-wrap gap-2">{learning?.recentDictionarySearches.slice(0, 6).map((item) => <button type="button" key={`${item.query}-${item.level ?? "all"}`} onClick={() => { setQuery(item.query); navigate({ query: item.query, level: item.level ? String(item.level) : "all", page: 1 }); }} className="min-h-11 max-w-full truncate rounded-full bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-800">{item.query}{item.level ? ` · HSK ${levelLabel(item.level)}` : ""}</button>)}</div></div> : null}
        </div> : null}

        <div className="mt-3 border-t border-slate-100 pt-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold text-slate-800">Browse by HSK level</p><div className="flex flex-wrap items-center gap-2"><div className="inline-flex rounded-lg bg-slate-100 p-1" role="group" aria-label="Result script"><button type="button" aria-pressed={script === "simplified"} onClick={() => setScript("simplified")} className={`min-h-11 rounded-md px-3 text-sm font-bold ${script === "simplified" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>Simplified</button><button type="button" aria-pressed={script === "traditional"} onClick={() => setScript("traditional")} className={`min-h-11 rounded-md px-3 text-sm font-bold ${script === "traditional" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>Traditional</button></div>{hasConditions ? <button type="button" className="min-h-11 rounded-lg px-3 text-sm font-bold text-blue-700 hover:bg-blue-50" onClick={() => { setQuery(""); router.push(applied.mode === "words" ? pathname : `${pathname}?mode=${applied.mode}`, { scroll: false }); }}>Reset</button> : null}</div></div><div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-8"><button type="button" onClick={() => navigate({ level: "all", page: 1 })} aria-pressed={selectedLevel === "all"} className={`min-h-11 rounded-lg border px-1 text-xs font-bold sm:text-sm ${selectedLevel === "all" ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 text-slate-700 hover:border-blue-400"}`}>All</button>{levelOptions.map((item) => <button type="button" key={item.value} onClick={() => navigate({ level: item.value, page: 1 })} aria-pressed={selectedLevel === item.value} className={`min-h-11 rounded-lg border px-1 text-xs font-bold sm:text-sm ${selectedLevel === item.value ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 text-slate-700 hover:border-blue-400"}`}>{item.label}</button>)}</div></div>

        {applied.mode === "words" ? <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-end sm:justify-between"><div className="flex flex-col gap-2 sm:flex-row"><label className="text-sm font-semibold text-slate-700">Part of speech<select value={applied.partOfSpeech} onChange={(event) => navigate({ partOfSpeech: event.target.value, page: 1 })} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 sm:w-auto">{partOfSpeechOptions.map(([value, label]) => <option key={value || "all"} value={value}>{label}</option>)}</select></label><label className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={applied.audio === "formal"} onChange={(event) => navigate({ audio: event.target.checked ? "formal" : "all", page: 1 })} /> Published synthesized audio only</label></div>{selectedLevel !== "all" ? <Link href={`/vocabulary/${selectedLevel}`} className="inline-flex min-h-11 items-center text-sm font-bold text-blue-700 hover:underline">Open HSK {levelLabel(selectedLevel)} vocabulary →</Link> : null}</div> : null}

        {applied.mode === "characters" ? <div className="mt-3 border-t border-slate-100 pt-3"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-bold text-slate-900 sm:sr-only">Browse by radical, stroke count or structure</h2><div className="flex gap-3 text-sm font-bold"><Link href="/dictionary/radicals" className="inline-flex min-h-11 items-center text-blue-700 hover:underline">All 214 radicals</Link><Link href="/dictionary/strokes" className="inline-flex min-h-11 items-center text-blue-700 hover:underline">All stroke counts</Link></div></div><div className="mt-2 grid grid-cols-2 gap-3 [&>label:last-child]:col-span-2 sm:grid-cols-3 sm:[&>label:last-child]:col-span-1"><Facet label="Browse by radical" value={applied.radical} options={characterFacets.radicals} onChange={(value) => navigate({ radical: value, page: 1 })} /><Facet label="Browse by stroke count" value={applied.strokes} options={characterFacets.strokes} onChange={(value) => navigate({ strokes: value, page: 1 })} /><Facet label="Browse by structure" value={applied.structure} options={characterFacets.structures} onChange={(value) => navigate({ structure: value, page: 1 })} labels={structureLabels} /></div></div> : null}
        {applied.mode === "pinyin" ? <div className="mt-4 border-t border-slate-100 pt-4"><h2 className="text-sm font-bold text-slate-900">Browse by pinyin</h2><div className="mt-3 grid gap-3 sm:grid-cols-3"><Facet label="Initial" value={applied.initial} options={characterFacets.initials} onChange={(value) => navigate({ initial: value, page: 1 })} /><Facet label="Final" value={applied.final} options={characterFacets.finals} onChange={(value) => navigate({ final: value, page: 1 })} /><Facet label="Tone" value={applied.tone} options={characterFacets.tones} onChange={(value) => navigate({ tone: value, page: 1 })} tone /></div></div> : null}
      </form>
    </section>

    {loading && !activeData ? <StatePanel title="Loading dictionary results…" /> : error ? <StatePanel title="Dictionary unavailable" body={error} action={<button type="button" className="mt-4 min-h-11 rounded-lg bg-red-700 px-5 font-bold text-white" onClick={() => setRetryToken((value) => value + 1)}>Try again</button>} error /> : null}
    {!loading && wordResultMode && words?.contentAssets.length === 0 ? <StatePanel title="No exact matches" body="Check the spelling, remove a filter, or choose a real alternative below." action={alternatives.length ? <div className="mt-4 flex flex-wrap justify-center gap-2"><strong className="sr-only">Did you mean?</strong>{alternatives.map((item) => <Link key={item.slug} href={`/word/${encodeURIComponent(item.slug)}`} className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-left"><strong className="block">{item.hanzi} · {item.pinyin}</strong><span className="text-sm text-slate-600">{item.meaning}</span></Link>)}</div> : undefined} /> : null}
    {!loading && !wordResultMode && characters?.characters.length === 0 ? <StatePanel title="No character matches" body="Clear one filter or try a different reading." /> : null}

    {words?.contentAssets.length ? <section className="mt-[28px]" aria-live="polite" aria-busy={loading}><ResultHeader eyebrow={defaultBrowse ? "Start here" : "Dictionary results"} title={defaultBrowse ? "Beginner words to explore" : `${words.pagination.total.toLocaleString()} matching words`} pagination={words.pagination} /><div className={`mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white ${loading ? "opacity-60" : ""}`}>{words.contentAssets.map((word) => <article key={word.id} className="flex min-w-0 items-stretch transition hover:bg-blue-50 active:bg-blue-50"><Link data-dictionary-word-link href={`/word/${encodeURIComponent(wordSlug(word))}`} className="grid min-w-0 flex-1 grid-cols-[minmax(76px,auto)_minmax(0,1fr)] gap-3 px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 sm:grid-cols-[140px_150px_minmax(0,1fr)_auto] sm:items-center"><span className="truncate text-2xl font-bold text-slate-950">{script === "traditional" && word.payload.traditional ? word.payload.traditional : word.payload.hanzi}</span><span className="truncate font-semibold text-blue-700">{word.payload.pinyin}</span><span className="col-span-2 line-clamp-2 text-sm leading-5 text-slate-700 sm:col-span-1">{word.payload.meaning}</span><span className="flex flex-wrap gap-1.5 sm:justify-end"><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">HSK {levelLabel(word.level)}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{word.payload.partOfSpeech}</span></span></Link>{word.formalAudioAvailable && word.formalAudioUrl ? <div className="hidden items-center border-l border-slate-100 px-3 sm:flex"><AudioButton text={word.payload.hanzi} label="Listen" src={word.formalAudioUrl} /></div> : null}</article>)}</div><Pager pagination={words.pagination} loading={loading} onPage={(page) => navigate({ page })} /></section> : null}

    {characters?.characters.length ? <section className="mt-5" aria-live="polite" aria-busy={loading}><ResultHeader eyebrow={applied.mode === "pinyin" ? "Pinyin index" : "Character index"} title={`${characters.pagination.total.toLocaleString()} matching characters`} pagination={characters.pagination} /><div className={`mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 ${loading ? "opacity-60" : ""}`}>{characters.characters.map((item) => <Link data-dictionary-character-link key={item.hanzi} href={`/character/${encodeURIComponent(item.hanzi)}`} aria-label={`Open ${item.hanzi}, ${item.pinyin.join(", ")}, ${item.strokes} ${item.strokes === 1 ? "stroke" : "strokes"}`} className="group min-w-0 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-500 hover:bg-blue-50 hover:shadow-sm active:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"><span className="flex items-start justify-between gap-2"><strong className="text-3xl text-slate-950 group-hover:text-blue-800">{script === "traditional" && item.traditional ? item.traditional : item.hanzi}</strong><span className="rounded bg-slate-100 px-1.5 py-1 text-[11px] font-bold text-slate-600">{item.strokes} {item.strokes === 1 ? "stroke" : "strokes"}</span></span><span className="mt-2 block truncate text-sm font-semibold text-blue-700">{item.pinyin.join(" · ")}</span><span className="mt-1 block min-h-[32px] line-clamp-2 text-sm leading-4 text-slate-700">{item.meanings[0]}</span><span className="mt-2 flex items-center justify-between gap-2 text-xs font-bold text-slate-600"><span className="shrink-0">Radical: 「{item.radical}」</span><span className="shrink-0">HSK {levelLabel(item.firstLevel)}</span></span></Link>)}</div><Pager pagination={characters.pagination} loading={loading} onPage={(page) => navigate({ page })} /></section> : null}
  </div>;
}

function Facet({ label, value, options, onChange, tone = false, labels }: { label: string; value: string; options: Array<string | number>; onChange: (value: string) => void; tone?: boolean; labels?: Record<string, string> }) { return <label className="text-sm font-semibold text-slate-700">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3"><option value="">All</option>{options.map((option) => <option key={String(option)} value={String(option)}>{tone && option === 5 ? "Neutral" : labels?.[String(option)] ?? option}</option>)}</select></label>; }
function ResultHeader({ eyebrow, title, pagination }: { eyebrow: string; title: string; pagination: Pagination }) { return <div className="flex flex-wrap items-end justify-between gap-3"><div className="sm:flex sm:items-baseline sm:gap-2"><p className="text-xs font-bold uppercase tracking-[.14em] text-blue-700">{eyebrow}</p><h2 className="mt-1 text-xl font-bold text-slate-950 sm:mt-0">{title}</h2></div><p className="text-sm text-slate-500">Page {pagination.page} of {pagination.totalPages}</p></div>; }
function Pager({ pagination, loading, onPage }: { pagination: Pagination; loading: boolean; onPage: (page: number) => void }) { return <nav className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3" aria-label="Dictionary result pages"><button type="button" disabled={!pagination.hasPrevious || loading} onClick={() => onPage(pagination.page - 1)} className="min-h-11 justify-self-start rounded-lg border border-blue-600 px-4 font-semibold text-blue-700 disabled:border-slate-300 disabled:text-slate-400">Previous</button><span className="text-sm text-slate-600">{pagination.page} / {pagination.totalPages}</span><button type="button" disabled={!pagination.hasNext || loading} onClick={() => onPage(pagination.page + 1)} className="min-h-11 justify-self-end rounded-lg border border-blue-600 px-4 font-semibold text-blue-700 disabled:border-slate-300 disabled:text-slate-400">Next</button></nav>; }
function StatePanel({ title, body, action, error = false }: { title: string; body?: string; action?: ReactNode; error?: boolean }) { return <div className={`mt-6 rounded-2xl border p-6 text-center ${error ? "border-red-200 bg-red-50 text-red-950" : "border-slate-200 bg-white text-slate-950"}`} role={error ? "alert" : "status"}><h2 className="text-xl font-bold">{title}</h2>{body ? <p className="mt-2 text-sm opacity-80">{body}</p> : null}{action}</div>; }
