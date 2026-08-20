"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { StudyCharacter, StudyWord } from "@/lib/dictionary/catalog";
import { AudioButton } from "./audio-button";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[\s'-]+/g, "");
}

type SearchField = "all" | "hanzi" | "pinyin" | "english";

export function DictionarySearch({ words, characters }: { words: StudyWord[]; characters: StudyCharacter[] }) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("all");
  const [field, setField] = useState<SearchField>("all");
  const needle = normalize(query.trim());

  const wordResults = useMemo(() => {
    if (!needle) return [];
    return words.filter((word) => {
      if (level !== "all" && word.level !== Number(level)) return false;
      const values = field === "hanzi" ? [word.hanzi]
        : field === "pinyin" ? [word.pinyin]
        : field === "english" ? [word.meaning, word.example.meaning]
        : [word.hanzi, word.pinyin, word.meaning, word.example.hanzi, word.example.meaning];
      return values.some((value) => normalize(value).includes(needle));
    });
  }, [field, level, needle, words]);

  const characterResults = useMemo(() => {
    if (!needle) return [];
    return characters.filter((character) => {
      if (level !== "all" && character.level !== Number(level)) return false;
      const values = field === "hanzi" ? [character.hanzi]
        : field === "pinyin" ? character.pinyin
        : field === "english" ? character.meanings
        : [character.hanzi, ...character.pinyin, ...character.meanings];
      return values.some((value) => normalize(value).includes(needle));
    });
  }, [characters, field, level, needle]);

  const resultCount = wordResults.length + characterResults.length;

  return <div className="w-full">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <label className="block text-sm font-semibold text-slate-700" htmlFor="dictionary-query">Search Hanzi, pinyin, or English</label>
      <div className="mt-2 flex gap-2">
        <input id="dictionary-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try 你好, ni hao, or hello" className="min-h-14 min-w-0 flex-1 rounded-lg border border-slate-300 px-4 text-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
        {query && <button type="button" className="min-h-11 rounded-lg px-4 font-semibold text-blue-600 hover:bg-blue-50" onClick={() => setQuery("")}>Clear</button>}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
      </div>
    </div>

    {!query ? <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <h2 className="text-2xl font-semibold">Start with a word, character, or meaning</h2>
      <p className="mt-2 text-slate-600">Search the published study catalog, or <Link href="/levels" className="font-semibold text-blue-600 hover:underline">browse by level</Link>.</p>
    </div> : resultCount === 0 ? <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center" aria-live="polite">
      <h2 className="text-2xl font-semibold">No results found</h2>
      <p className="mt-2 text-slate-600">No published item matched “{query}”. Try another spelling or level.</p>
    </div> : <div className="mt-8 grid gap-7" aria-live="polite">
      {characterResults.length > 0 && <section aria-labelledby="character-results">
        <h2 id="character-results" className="mb-3 text-xl font-semibold">Characters ({characterResults.length})</h2>
        <div className="grid gap-4 sm:grid-cols-2">{characterResults.map((character) => <article key={character.hanzi} className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div><Link href={`/character/${encodeURIComponent(character.hanzi)}`} className="text-4xl font-bold text-blue-600 hover:underline">{character.hanzi}</Link><p className="mt-2 text-slate-600">{character.pinyin.join(" · ")}</p><p className="mt-1 text-sm text-slate-800">{character.meanings.join("; ")}</p><span className="mt-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">Level {character.level}</span></div>
          <AudioButton text={character.hanzi} label="Play" />
        </article>)}</div>
      </section>}
      {wordResults.length > 0 && <section aria-labelledby="word-results">
        <h2 id="word-results" className="mb-3 text-xl font-semibold">Words ({wordResults.length})</h2>
        <div className="grid gap-4">{wordResults.map((word) => <article key={word.id} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div><div className="flex flex-wrap items-baseline gap-3"><Link href={`/word/${word.slug}`} className="text-3xl font-bold text-blue-600 hover:underline">{word.hanzi}</Link><span className="text-lg text-slate-600">{word.pinyin}</span><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">Level {word.level}</span></div><p className="mt-2 text-slate-800">{word.meaning}</p><p className="mt-2 text-sm text-slate-500">{word.example.hanzi} · {word.example.meaning}</p></div>
          <AudioButton text={word.hanzi} label="Play" />
        </article>)}</div>
      </section>}
    </div>}
  </div>;
}
