"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { filterTravelEntries, travelCategories, type TravelEntry } from "@/lib/travel/phrasebook";
import { createPreviewSession, ratePreview, type PreviewSession } from "@/lib/learning/flashcard-preview";
import FlashcardIcon from "../components/flashcard-icon";

type Card = TravelEntry & { audioSrc?: string; dictionaryId?: string };
const savedKey = "hskkit:travel:favourites:v1";

export default function TravelPhrasebook({ entries }: { entries: Card[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [shown, setShown] = useState<Card | null>(null);
  const [practice, setPractice] = useState<{ cards: Card[]; session: PreviewSession } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [audioError, setAudioError] = useState("");
  const [slow, setSlow] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const answerButton = useRef<HTMLButtonElement>(null);
  const visible = useMemo(() => filterTravelEntries(entries, query, category, savedOnly ? new Set(saved) : undefined) as Card[], [entries, query, category, savedOnly, saved]);
  const activeCategory = travelCategories.find((item) => item.id === category);
  const practiceCard = practice?.cards[practice.session.order[practice.session.cursor] ?? 0];

  useEffect(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(savedKey) ?? "[]");
      if (Array.isArray(value)) setSaved([...new Set(value.filter((id): id is string => typeof id === "string" && entries.some((item) => item.id === id)))]);
    } catch { setNotice("Saved items could not be loaded. You can still use the phrasebook."); }
    return () => { audio.current?.pause(); };
  }, [entries]);

  function stopAudio() { audio.current?.pause(); audio.current = null; setPlaying(null); setAudioError(""); }
  function save(card: Card) {
    const next = saved.includes(card.id) ? saved.filter((id) => id !== card.id) : [...saved, card.id];
    setSaved(next);
    try { localStorage.setItem(savedKey, JSON.stringify(next)); setNotice(next.includes(card.id) ? "Saved on this device." : "Removed from saved items."); }
    catch { setNotice("Updated for this visit. Browser storage is unavailable, so this change will not survive a reload."); }
  }
  async function play(card: Card) {
    if (!card.audioSrc) return;
    if (playing === card.id) { stopAudio(); return; }
    stopAudio();
    const player = new Audio(card.audioSrc);
    audio.current = player;
    player.playbackRate = slow ? .75 : 1;
    setPlaying(card.id);
    player.onended = () => { if (audio.current === player) setPlaying(null); };
    player.onerror = () => { if (audio.current === player) { setPlaying(null); setAudioError("Audio could not play. Check your connection and try again."); } };
    try { await player.play(); } catch { if (audio.current === player) { setPlaying(null); setAudioError("Audio could not play. Check your connection and try again."); } }
  }
  function openChinese(card: Card) { stopAudio(); setPractice(null); setShown(card); dialog.current?.showModal(); }
  function openPractice(cards: Card[]) {
    if (!cards.length) return;
    stopAudio(); setShown(null); setRevealed(false); setPractice({ cards: [...cards], session: createPreviewSession(cards.length) }); dialog.current?.showModal();
  }
  function closeDialog() { dialog.current?.close(); stopAudio(); setShown(null); setPractice(null); }
  function rate(rating: "known" | "retry") {
    stopAudio(); setRevealed(false);
    setPractice((current) => current ? { ...current, session: ratePreview(current.session, rating) } : null);
    answerButton.current?.focus();
  }
  async function copy(card: Card) {
    try { await navigator.clipboard.writeText(card.hanzi); setNotice("Chinese copied."); }
    catch { setNotice("Copy is unavailable. Select the Chinese text to copy it manually."); }
  }
  function resetFilters() { setQuery(""); setCategory("all"); setSavedOnly(false); stopAudio(); }
  function audioButton(card: Card) {
    return card.audioSrc ? <button type="button" className="travel-icon-button" onClick={() => void play(card)} aria-label={`${playing === card.id ? "Stop" : "Play"} pronunciation for ${card.hanzi}`} aria-pressed={playing === card.id} title="Synthesized word pronunciation"><FlashcardIcon name="speaker-high" /></button> : null;
  }
  function changeCategory(value: string) { setCategory(value); stopAudio(); }

  return <>
    <section className="travel-workspace" aria-labelledby="travel-find-title">
      <div className="travel-filter-panel">
        <div className="travel-search"><label htmlFor="travel-search" id="travel-find-title">What do you need to say?</label><div><input id="travel-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try taxi, toilet, water, or nǐ hǎo" autoComplete="off" aria-describedby="travel-search-hint" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">Clear</button>}</div><p id="travel-search-hint">Search in English, Chinese or pinyin. Tone marks are optional.</p></div>
        <div className="travel-categories" role="group" aria-label="Travel situation"><button type="button" aria-pressed={category === "all"} onClick={() => changeCategory("all")}>All situations</button>{travelCategories.map((item) => <button type="button" key={item.id} onClick={() => changeCategory(item.id)} aria-pressed={category === item.id}>{item.title}</button>)}</div>
        <div className="travel-tools"><label><input type="checkbox" checked={savedOnly} onChange={(event) => setSavedOnly(event.target.checked)} /> Saved on this device ({saved.length})</label><label><input type="checkbox" checked={slow} onChange={(event) => { const value = event.target.checked; setSlow(value); if (audio.current) audio.current.playbackRate = value ? .75 : 1; }} /> Slower audio · 0.75×</label><button type="button" onClick={() => window.print()}>Print phrasebook</button></div>
      </div>
      <div className="travel-results-heading" id="travel-results"><div><h2>{activeCategory?.title ?? "Your pocket phrasebook"}</h2><p>{visible.length} matching {visible.length === 1 ? "item" : "items"}{savedOnly ? " · Saved on this device" : " · Choose a phrase to show or practise"}</p></div><button type="button" className="travel-primary" onClick={() => openPractice(visible)} disabled={!visible.length}>{`Practise ${visible.length} ${visible.length === 1 ? "item" : "items"}`}<FlashcardIcon name="arrow-right" /></button></div>
      <p className="travel-audio-note">Speaker icons play synthesized word audio where available. Full-phrase audio is not included.</p>
      <p className={notice ? "travel-status" : "sr-only"} role="status">{`${visible.length} matching ${visible.length === 1 ? "item" : "items"}. ${notice}`}</p>
      {audioError && <p role="alert" className="travel-error">{audioError}</p>}
      {!visible.length && <div className="travel-empty"><h3>{savedOnly && !saved.length ? "Your travel essentials, all in one place" : "No matching words or phrases"}</h3><p>{savedOnly && !saved.length ? "Use Save beside an entry to keep it handy in this browser." : "Try a shorter search, another situation, or clear your filters."}</p><button className="travel-primary" type="button" onClick={resetFilters}>Browse all 50 items</button></div>}
      {travelCategories.map((group) => {
        const cards = visible.filter((item) => item.category === group.id);
        if (!cards.length) return null;
        return <section key={group.id} className="travel-group" aria-labelledby={`travel-${group.id}`}><header><div><h3 id={`travel-${group.id}`}>{group.title}<span>{cards.length}</span></h3><p>{group.description}</p></div><button type="button" onClick={() => openPractice(cards)}>Practise this group <FlashcardIcon name="arrow-right" /></button></header>
          <div className="travel-entry-list">{cards.map((card) => <article className="travel-entry" key={card.id}>
            <div className="travel-entry-meaning"><span className="travel-kind">{card.kind === "word" ? "Word / expression" : "Useful phrase"}</span><h4>{card.english}</h4><p>{card.note}</p></div>
            <div className="travel-entry-chinese"><p lang="zh-Hans">{card.hanzi}</p><p className="travel-pinyin">{card.pinyin}</p></div>
            <div className="travel-entry-actions">{audioButton(card)}<button type="button" onClick={() => openChinese(card)} aria-label={`Show Chinese for ${card.english}`}>Show Chinese</button><button type="button" onClick={() => save(card)} aria-label={`${saved.includes(card.id) ? "Unsave" : "Save"} ${card.english}`} aria-pressed={saved.includes(card.id)}>{saved.includes(card.id) ? "Saved" : "Save"}</button></div>
          </article>)}</div><footer><Link href={group.topic}>{group.topicLabel} <FlashcardIcon name="arrow-up-right" /></Link></footer>
        </section>;
      })}
    </section>
    <dialog className="travel-dialog" ref={dialog} aria-labelledby="travel-dialog-title" onCancel={closeDialog} onClose={() => { stopAudio(); setPractice(null); setShown(null); }} onClick={(event) => { if (event.target === dialog.current) closeDialog(); }}>
      <div className="travel-dialog-content"><header><span className="travel-kicker">{shown ? "Show this to someone" : "A little practice"}</span><button type="button" onClick={closeDialog} aria-label="Close phrasebook dialog">Close</button></header>
        {shown && <><h2 id="travel-dialog-title">{shown.english}</h2><p className={`travel-show-hanzi ${shown.hanzi.length > 8 ? "travel-show-long" : ""}`} lang="zh-Hans">{shown.hanzi}</p><p className="travel-show-pinyin">{shown.pinyin}</p><p>{shown.note}</p><div className="travel-dialog-actions">{audioButton(shown)}<button type="button" className="travel-primary" onClick={() => void copy(shown)}>Copy Chinese</button><button type="button" onClick={() => save(shown)}>{saved.includes(shown.id) ? "Remove from saved" : "Save on this device"}</button></div>{shown.dictionaryId && <Link href={`/word/${shown.dictionaryId}`}>Full dictionary entry</Link>}</>}
        {practice && (practice.session.complete ? <><h2 id="travel-dialog-title">A little more ready for your trip.</h2><p className="travel-score">{Object.values(practice.session.ratings).filter((rating) => rating === "known").length} / {practice.cards.length}</p><p>remembered · This practice is not added to your account progress.</p><div className="travel-dialog-actions"><button type="button" className="travel-primary" onClick={() => { setRevealed(false); setPractice({ cards: practice.cards, session: createPreviewSession(practice.cards.length) }); }}>Practise again</button><button type="button" onClick={closeDialog}>Back to phrasebook</button></div></> : practiceCard && <>
          <p className="travel-practice-progress">{practice.session.round === 1 ? "First pass" : "One more look"} · {practice.session.cursor + 1} of {practice.session.order.length}</p>
          <h2 id="travel-dialog-title">How would you say this?</h2><p className="travel-practice-english">{practiceCard.english}</p>
          <div className="travel-answer" aria-live="polite">{revealed ? <><p lang="zh-Hans">{practiceCard.hanzi}</p><p className="travel-show-pinyin">{practiceCard.pinyin}</p><p>{practiceCard.note}</p>{audioButton(practiceCard)}</> : <p>Say it out loud, then reveal the Chinese.</p>}</div>
          <button ref={answerButton} className="travel-primary travel-reveal" type="button" onClick={() => setRevealed((value) => !value)}>{revealed ? "Hide answer" : "Reveal Chinese"}</button>
          {revealed && <div className="travel-dialog-actions"><button type="button" onClick={() => rate("retry")}>Needs practice</button><button type="button" onClick={() => rate("known")}>Remembered <FlashcardIcon name="check" /></button></div>}
          <p className="travel-audio-note">Items that need practice return once at the end.</p>
        </>)}
        <p className="travel-status" role="status">{notice}</p>{audioError && <p role="alert" className="travel-error">{audioError}</p>}
      </div>
    </dialog>
  </>;
}
