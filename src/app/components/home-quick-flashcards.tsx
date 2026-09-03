"use client";

import Link from "next/link";
import { useState } from "react";

type DemoCard = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
};

export default function HomeQuickFlashcards({ cards }: { cards: DemoCard[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [complete, setComplete] = useState(false);

  if (cards.length !== 5) return null;
  const card = cards[index];
  const progress = complete ? 100 : ((index + 1) / cards.length) * 100;

  function next() {
    if (!revealed) {
      setRevealed(true);
      return;
    }
    if (index === cards.length - 1) {
      setComplete(true);
      return;
    }
    setIndex((value) => value + 1);
    setRevealed(false);
  }

  function reset() {
    setIndex(0);
    setRevealed(false);
    setComplete(false);
  }

  return <section id="quick-flashcards-demo" className="home-section home-demo" aria-labelledby="home-demo-title">
    <div className="home-demo-copy">
      <p className="home-eyebrow">No-sign-in preview</p>
      <h2 id="home-demo-title">Preview the review experience</h2>
      <p>Try five published HSK 1 cards before creating an account. This short preview demonstrates the interaction; your free trial and daily Free allowance continue beyond it.</p>
      <ul aria-label="Demo details"><li>5 cards</li><li>HSK 1</li><li>Guest start</li></ul>
    </div>

    <div className="home-demo-player">
      <div className="home-demo-progress" aria-label={`Card ${complete ? cards.length : index + 1} of ${cards.length}`}>
        <span>{complete ? "Round complete" : `Card ${index + 1} of ${cards.length}`}</span><span>HSK 1</span>
      </div>
      <div className="home-demo-progress-track" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>

      {complete ? <div className="home-demo-complete" aria-live="polite">
        <span aria-hidden="true">✓</span>
        <h3>You completed all five cards.</h3>
        <p>Continue with a full 10, 20, or 50-card set, or start the complete 7-day Pro trial.</p>
        <div><Link href="/login?returnTo=%2Faccount">Start my 7-day Pro trial</Link><Link href="/vocabulary/1?mode=flashcards#vocabulary-activities">Continue with Free</Link></div>
        <button type="button" onClick={reset}>Repeat this demo</button>
      </div> : <>
        <button type="button" className={`home-demo-card ${revealed ? "is-revealed" : ""}`} onClick={() => setRevealed((value) => !value)} aria-pressed={revealed} aria-label={revealed ? `Hide answer for ${card.hanzi}` : `Show answer for ${card.hanzi}`}>
          <span className="home-demo-prompt">{revealed ? "Answer" : "Recognize the word"}</span>
          <strong lang="zh-Hans">{card.hanzi}</strong>
          {revealed ? <span className="home-demo-answer"><b>{card.pinyin}</b><small>{card.meaning}</small></span> : <span className="home-demo-hint">Show answer</span>}
        </button>
        <button type="button" className="home-demo-next" onClick={next}>{revealed ? (index === cards.length - 1 ? "Finish demo" : "Next card") : "Show answer"}</button>
      </>}
    </div>
  </section>;
}
