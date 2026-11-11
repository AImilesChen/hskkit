"use client";

import Link from "next/link";
import { useState } from "react";
import type { PracticeHubExamples } from "@/lib/practice/hub-examples";
import styles from "./practice-hub.module.css";

const LEVELS = [
  { value: 1, label: "HSK 1", display: "1", detail: "Foundation" },
  { value: 2, label: "HSK 2", display: "2", detail: "Foundation" },
  { value: 3, label: "HSK 3", display: "3", detail: "Intermediate" },
  { value: 4, label: "HSK 4", display: "4", detail: "Intermediate" },
  { value: 5, label: "HSK 5", display: "5", detail: "Upper intermediate" },
  { value: 6, label: "HSK 6", display: "6", detail: "Upper intermediate" },
  { value: 7, label: "HSK 7–9", display: "7–9", detail: "Advanced 7–9 unified band" },
] as const;

const SKILLS = [
  { slug: "vocabulary", label: "Vocabulary", mark: "字", detail: "Meaning and word recognition", support: "Connect a Chinese word with its meaning.", color: "teal" },
  { slug: "grammar", label: "Grammar", mark: "句", detail: "Natural Chinese word order", support: "Find the words and patterns that fit.", color: "violet" },
  { slug: "reading", label: "Reading", mark: "文", detail: "Passage comprehension", support: "Find the detail that supports your answer.", color: "amber" },
  { slug: "listening", label: "Listening", mark: "听", detail: "Audio comprehension", support: "Connect what you hear with the right meaning.", color: "rose" },
] as const;

export default function PracticeSelectorClient({ examples }: { examples: PracticeHubExamples }) {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const level = LEVELS.find((item) => item.value === selectedLevel)!;

  return <section className={styles.workspace} id="choose-practice" aria-label="Choose HSK practice">
    <div className={styles.levelPanel}>
      <div className={styles.panelHeading}>
        <div><p className={styles.eyebrow}>01 · FIND YOUR LEVEL</p><h2 id="choose-level">Choose your HSK level</h2></div>
        <Link href="/hsk-placement-test" className={styles.textLink}>Not sure? Find a starting level <span aria-hidden="true">↗</span></Link>
      </div>
      <div className={`${styles.levels} grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7`} aria-labelledby="choose-level">{LEVELS.map((item) => <button
        aria-label={`${item.label} — ${item.detail}`}
        aria-pressed={selectedLevel === item.value}
        className={`${styles.levelButton} min-h-12 ${selectedLevel === item.value ? styles.levelSelected : ""}`}
        key={item.value}
        onClick={() => setSelectedLevel(item.value)}
        type="button"
      >
        <span>{item.label}</span><span aria-hidden="true" className={styles.levelCheck}>{selectedLevel === item.value ? "✓" : ""}</span>
      </button>)}</div>
      <div className={styles.levelStatus}>
        <p aria-live="polite"><span aria-hidden="true">✓</span> HSK {level.display} selected · Choose a skill below</p>
        <p>HSK 7–9 shares one advanced band.</p>
      </div>
    </div>

    <div className={styles.skillsHeading}>
      <div><p className={styles.eyebrow}>02 · CHOOSE YOUR FOCUS</p><h2 id="choose-skill">What would you like to practise?</h2></div>
      <p>HSK {level.display} · 8 questions per session</p>
    </div>
    <div className={styles.skills} aria-labelledby="choose-skill">{SKILLS.map((item) => <Link
      aria-label={`View HSK ${level.display} ${item.label} practice`}
      className={`${styles.skillCard} ${styles[item.color]}`}
      href={`/practice/${selectedLevel}/${item.slug}`}
      key={item.slug}
    >
      <div className={styles.skillHeading}><span className={styles.skillMark} lang="zh-Hans" aria-hidden="true">{item.mark}</span><div><h3>{item.label}</h3><p>{item.detail}</p></div><span className={styles.cardArrow} aria-hidden="true">↗</span></div>
      <p className={styles.skillSupport}>{item.support}</p>
      <div className={styles.preview} data-preview-id={examples[selectedLevel][item.slug].id}>
        <span className={styles.previewLabel}>FROM THE HSK {level.display} SET</span>
        <p lang="zh-Hans" className={styles.previewChinese}>{examples[selectedLevel][item.slug].excerpt}</p>
        <p className={styles.previewPrompt}>{examples[selectedLevel][item.slug].prompt}</p>
      </div>
      <span className={styles.skillCta}>View HSK {level.display} {item.label} <span aria-hidden="true">→</span></span>
    </Link>)}</div>
    <p className={styles.overviewNote}>Each card opens its practice overview. Start the session when you are ready.</p>
  </section>;
}
