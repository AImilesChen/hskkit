"use client";

import { useState } from "react";

type LevelCount = { level: number; audioGroups: number; questions: number };

export default function ListeningLibraryPicker({ levels }: { levels: readonly LevelCount[] }) {
  const [level, setLevel] = useState(1);
  const [size, setSize] = useState(10);
  const selected = levels.find((row) => row.level === level);

  return <form action="/listen/start" method="get" className="listening-picker">
    <fieldset>
      <legend>Choose your listening level</legend>
      <p className="listening-field-note">Pick the level you want to practise today.</p>
      <div className="listening-levels">{levels.map((row) => <label key={row.level} className={`listening-level ${level === row.level ? "is-selected" : ""}`}>
        <input type="radio" name="level" value={row.level} checked={level === row.level} onChange={() => setLevel(row.level)} />
        <span><strong>HSK {row.level}</strong><small>{row.level >= 7 ? `Advanced 7–9 · Difficulty ${row.level}` : `${row.audioGroups} audio sets`}</small></span>
        <span className="listening-radio-mark" aria-hidden="true">{level === row.level ? "✓" : ""}</span>
      </label>)}</div>
    </fieldset>
    <div className="listening-session-setup">
      <fieldset>
        <legend>How much practice?</legend>
        <div className="listening-size-options">{[10, 20].map((count) => <label key={count} className={size === count ? "is-selected" : ""}>
          <input type="radio" name="size" value={count} checked={size === count} onChange={() => setSize(count)} />
          <span>{count} questions</span>
        </label>)}</div>
      </fieldset>
      <div className="listening-start">
        <p aria-live="polite">HSK {level} · {size} questions<small>{selected?.questions} questions available at this level</small></p>
        <button type="submit">Start listening <span aria-hidden="true">→</span></button>
      </div>
    </div>
    <p className="listening-field-note listening-advanced-note">Levels 7–9 share one advanced exam band. Difficulty 7, 8 and 9 are HSKKit practice settings.</p>
  </form>;
}
