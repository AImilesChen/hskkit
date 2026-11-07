"use client";

import { useState } from 'react';
import { paragraphAnchor, readingWordSegments, type ReadingWord } from '@/lib/learning/reading-article-guidance';
import styles from './reading-article-text.module.css';

export default function ReadingArticleText({ title, paragraphs, words }: { title: string; paragraphs: string[]; words: ReadingWord[] }) {
  const [wordHelp, setWordHelp] = useState(false);
  const [large, setLarge] = useState(false);
  const [selected, setSelected] = useState<{ paragraph: number; word: ReadingWord } | null>(null);
  return <article className={styles.paper} aria-label={title} id="article-text">
    <div className={styles.toolbar}>
      <div><span className={styles.kicker}>01 · Read the story</span><h2>Read for the main idea.</h2></div>
      <div className={styles.controls}>
        <label><input type="checkbox" checked={wordHelp} onChange={event => { setWordHelp(event.target.checked); setSelected(null); }}/> Word help</label>
        <label><span>Text size</span><select value={large ? 'large' : 'standard'} onChange={event => setLarge(event.target.value === 'large')}><option value="standard">Standard</option><option value="large">Larger</option></select></label>
      </div>
    </div>
    <p className={styles.hint}>Word help adds pinyin to key words. Select a highlighted word for its meaning.</p>
    <div className={`${styles.text} ${large ? styles.large : ''}`}>
      {paragraphs.map((paragraph, index) => <div key={paragraph} className={styles.paragraphGroup}>
        <p id={paragraphAnchor(index)} tabIndex={-1} lang="zh-Hans" className={styles.paragraph}>
          {wordHelp ? readingWordSegments(paragraph, words).map((segment, position) => segment.word ? <button type="button" key={position} className={styles.word} aria-pressed={selected?.paragraph === index && selected.word.word === segment.word.word} aria-label={`${segment.word.word}: ${segment.word.pinyin}, ${segment.word.meaning}`} onClick={() => setSelected(current => current?.paragraph === index && current.word.word === segment.word!.word ? null : { paragraph: index, word: segment.word! })}><ruby>{segment.text}<rt>{segment.word.pinyin}</rt></ruby></button> : segment.text) : paragraph}
        </p>
        {wordHelp && selected?.paragraph === index && <aside className={styles.definition} aria-live="polite"><div><strong lang="zh-Hans">{selected.word.word}</strong><span>{selected.word.pinyin}</span><p>{selected.word.meaning}</p></div><button type="button" onClick={() => setSelected(null)}>Close meaning</button></aside>}
      </div>)}
    </div>
    <a href="#key-vocabulary" className={styles.continue}>Explore the key words <span aria-hidden="true">↓</span></a>
  </article>;
}
