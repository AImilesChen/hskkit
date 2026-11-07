"use client";

import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";
import { createPreviewSession, ratePreview, repeatUncertain, shufflePreview, type PreviewRating } from "@/lib/learning/flashcard-preview";
import FlashcardIcon from "./flashcard-icon";
import FlashcardAudio from "./flashcard-audio";
import "./aqua-flashcards.css";

type DemoCard = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  partOfSpeech?: string;
  audioSrc?: string;
  example?: { hanzi: string; pinyin: string; meaning: string };
};

const wordTypes: Record<string, string> = { V: "Verb", N: "Noun", Num: "Number", Aux: "Particle", Adj: "Adjective", Adv: "Adverb", Pron: "Pronoun", M: "Measure word", Phrase: "Phrase" };

export default function HomeQuickFlashcards({ cards }: { cards: DemoCard[] }) {
  const [session, setSession] = useState(() => createPreviewSession(cards.length));
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState("");
  const flipTarget = useRef<HTMLButtonElement>(null);
  const workspace = useRef<HTMLDivElement>(null);
  if (cards.length !== 5) return null;

  const card = cards[session.order[session.cursor] ?? 0];
  const known = Object.values(session.ratings).filter((rating) => rating === "known").length;
  const uncertain = cards.length - known;

  function rate(rating: PreviewRating) {
    const next = ratePreview(session, rating);
    setMessage(next.round > session.round ? "Let's give those words another look." : "");
    setSession(next);
    setRevealed(false);
    if (next.complete) workspace.current?.focus({ preventScroll: true });
    else flipTarget.current?.focus({ preventScroll: true });
  }

  function previous() {
    if (!session.cursor || session.complete) return;
    setSession({ ...session, cursor: session.cursor - 1 });
    setRevealed(false);
    setMessage("");
  }

  function reset() {
    setSession(createPreviewSession(cards.length));
    setRevealed(false);
    setMessage("");
  }

  function shuffle() {
    setSession(shufflePreview(session, Math.random));
    setRevealed(false);
    setMessage("Remaining cards shuffled.");
  }

  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || session.complete) return;
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, select, [contenteditable=true]")) return;
    if (event.code === "Space" && event.target === event.currentTarget) {
      event.preventDefault(); setRevealed((value) => !value);
    } else if (event.key === "1" && revealed) {
      event.preventDefault(); rate("retry");
    } else if (event.key === "2" && revealed) {
      event.preventDefault(); rate("known");
    } else if (event.key === "ArrowLeft") {
      event.preventDefault(); previous();
    } else if (event.key === "ArrowRight") {
      event.preventDefault(); rate("retry");
    }
  }

  return <section id="quick-flashcards-demo" className="home-section home-demo" aria-labelledby="home-demo-title">
    <div className="home-demo-copy">
      <p className="home-eyebrow">A little practice. A real start.</p>
      <h2 id="home-demo-title" aria-label="Try your first five words.">Try your first<br /> <span className="home-demo-title-accent">five words.</span></h2>
      <p>Five HSK 1 flashcards. No sign-up needed.</p>
      <p className="home-demo-instruction">Reveal the meaning, listen, and choose what to review.</p>
      <Link className="home-demo-full-link" href="/vocabulary/1?mode=flashcards#vocabulary-activities">Open full flashcards <FlashcardIcon name="arrow-up-right" /></Link>
      <p className="home-demo-full-note">Choose 10, 20, or 50 cards. No sign-in required.</p>
    </div>

    <div className="aqua-demo" ref={workspace} tabIndex={0} onKeyDown={keyboard} aria-label="Five-word flashcard preview">
      {session.complete ? <div className="aqua-summary" aria-live="polite">
        <span className="aqua-summary-check"><FlashcardIcon name="check" /></span>
        <p className="aqua-eyebrow">A little progress, made.</p>
        <h3>You reviewed all five words.</h3>
        <p><strong>{known}</strong> remembered <span aria-hidden="true">·</span> <strong>{uncertain}</strong> to practise</p>
        <p className="aqua-summary-note">Your choices are for this preview only; they do not update your saved learning progress.</p>
        <Link className="aqua-button aqua-button-primary" href="/vocabulary/1?mode=flashcards#vocabulary-activities">Continue learning <FlashcardIcon name="arrow-right" /></Link>
        {uncertain > 0 ? <button type="button" className="aqua-button aqua-button-secondary" onClick={() => { setSession(repeatUncertain(session)); setMessage(""); }}>Practise {uncertain} {uncertain === 1 ? "word" : "words"} again</button> : null}
        <button type="button" className="aqua-reset" onClick={reset}>Repeat this demo</button>
      </div> : <>
        <div className="aqua-toolbar" aria-label="Flashcard progress">
          <span className="aqua-level-label">HSK 1</span>
          <span className="aqua-progress-dots" aria-hidden="true">{session.order.map((index, position) => <span key={`${position}-${index}`} className={position === session.cursor ? "is-current" : position < session.cursor ? "is-visited" : ""} />)}</span>
          <span className="aqua-counter" aria-label={`Card ${session.cursor + 1} of ${session.order.length}`}>{session.cursor + 1} / {session.order.length}</span>
          <button type="button" className="aqua-icon-button aqua-shuffle" onClick={shuffle} aria-label="Shuffle remaining cards" title="Shuffle remaining cards"><FlashcardIcon name="shuffle" /></button>
        </div>
        <p className="aqua-round" role="status">{session.round > 1 ? `Practice round ${session.round} · ${message || "A second look helps it stick."}` : message || "Read. Recall. Reveal."}</p>

        <div className={`aqua-stack ${revealed ? "is-revealed" : ""}`}>
          <div className="aqua-paper aqua-paper-back" aria-hidden="true" />
          <div className="aqua-paper aqua-paper-middle" aria-hidden="true" />
          <article className="aqua-card" aria-label={revealed ? "Word meaning" : "Word recall"}>
            <span className="aqua-card-rail" aria-hidden="true">HSK 1</span>
            <button ref={flipTarget} type="button" className="aqua-flip-target" onClick={() => setRevealed((value) => !value)} aria-pressed={revealed} aria-label={`${revealed ? "Hide" : "Show"} answer for ${card.hanzi}`} />
            <div className="aqua-card-content">
              <div className="aqua-card-heading"><p className="aqua-eyebrow">{revealed ? "Word meaning" : "Word recall"}</p><FlashcardAudio key={card.id} text={card.hanzi} src={card.audioSrc} /></div>
              {revealed ? <div className="aqua-answer" key={`${card.id}-answer`} aria-live="polite">
                <div className="aqua-word-heading"><strong lang="zh-Hans">{card.hanzi}</strong><div><p>{card.pinyin}</p>{card.partOfSpeech ? <span className="aqua-pos">{wordTypes[card.partOfSpeech] ?? card.partOfSpeech}</span> : null}</div></div>
                <p className="aqua-definition">{card.meaning}</p>
                {card.example ? <div className="aqua-example"><p className="aqua-eyebrow">In a sentence</p><p lang="zh-Hans">{card.example.hanzi}</p><p className="aqua-example-pinyin">{card.example.pinyin}</p><p className="aqua-example-meaning">{card.example.meaning}</p></div> : null}
              </div> : <div className="aqua-recall" key={`${card.id}-recall`}>
                <div className="aqua-word-stage"><img className="aqua-writing-grid" src="/flashcards/aqua-writing-grid.png" alt="" width="480" height="480" /><strong lang="zh-Hans" className={card.hanzi.length > 1 ? "aqua-multiword" : ""}>{card.hanzi}</strong><span className="aqua-recall-label" aria-hidden="true">Recall</span></div>
                <p>What does this word mean?</p>
              </div>}
              <div className="aqua-card-footer">{revealed ? <Link href={`/word/${card.id}`} className="aqua-word-link">Explore this word <FlashcardIcon name="arrow-up-right" /></Link> : <><span><FlashcardIcon name="arrows-clockwise" /> Tap to reveal</span><kbd>Space</kbd></>}</div>
            </div>
          </article>
        </div>

        {revealed ? <div className="aqua-rating-actions"><button type="button" className="aqua-button aqua-button-secondary" onClick={() => rate("retry")}><FlashcardIcon name="arrows-clockwise" /> Practice again</button><button type="button" className="aqua-button aqua-button-primary" onClick={() => rate("known")}><FlashcardIcon name="check" /> Remembered</button></div> : <nav className="aqua-navigation" aria-label="Flashcard navigation"><button type="button" className="aqua-icon-button" disabled={session.cursor === 0} onClick={previous} aria-label="Previous card"><FlashcardIcon name="arrow-left" /></button><span>Card {session.cursor + 1} of {session.order.length}</span><button type="button" className="aqua-icon-button" onClick={() => rate("retry")} aria-label="Next card, skip for now" title="Skip for now; revisit this word"><FlashcardIcon name="arrow-right" /></button></nav>}
        <p className="aqua-keyboard-hint">{revealed ? <><kbd>1</kbd> Practice again <kbd>2</kbd> Remembered</> : "Click the card or focus it and press Space to flip."}</p>
      </>}
    </div>
  </section>;
}
