"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ReadingResume } from "@/app/components/reading-session-state";
import styles from "./reading-library-experience.module.css";

type IconName = "book" | "question" | "levels" | "feedback" | "arrow" | "check";
type ReadingExample = {
  slug: string;
  title: string;
  passage: string;
  prompt: string;
  explanation: string;
  questionType: string;
  options: string[];
};
type ReadingLevel = {
  level: number;
  passages: number;
  questions: number;
  descriptor: string;
  questionTypes: string[];
  examples: ReadingExample[];
};

function ReadingIcon({ name, className }: { name: IconName; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.8 };
  return <svg aria-hidden="true" className={className ?? styles.icon} viewBox="0 0 24 24" {...common}>
    {name === "book" && <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z"/></>}
    {name === "question" && <><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 1 1 3.1 2.3c-.7.3-.9.8-.9 1.7"/><path d="M12 16.5h.01"/></>}
    {name === "levels" && <><path d="M5 19V9"/><path d="M12 19V5"/><path d="M19 19v-7"/><path d="M3 19h18"/></>}
    {name === "feedback" && <><path d="M20 11.5a8 8 0 1 1-4.7-7.3"/><path d="m9 11 2 2 6-7"/></>}
    {name === "arrow" && <><path d="M5 12h14"/><path d="m15 8 4 4-4 4"/></>}
    {name === "check" && <path d="m5 12 4 4L19 6"/>}
  </svg>;
}

const PROOF = [
  { icon: "book" as const, value: "180", label: "short practice passages" },
  { icon: "question" as const, value: "540", label: "scored questions" },
  { icon: "levels" as const, value: "9", label: "independent HSK levels" },
  { icon: "feedback" as const, value: "Immediate", label: "feedback & explanations" },
];

const SESSION_STEPS = [
  { number: "01", title: "Read a level-matched passage", copy: "Every passage and question stays inside the HSK level you choose." },
  { number: "02", title: "Answer 10 or 20 questions", copy: "Start a focused set and see your position throughout the session." },
  { number: "03", title: "Review the answer and explanation", copy: "Get immediate feedback before moving to the next same-level question." },
];

function readableQuestionType(value: string) {
  return value.replaceAll("-", " ");
}

export default function ReadingLibraryExperience({ levels }: { levels: ReadingLevel[] }) {
  const [selectedLevel, setSelectedLevel] = useState(3);
  const active = useMemo(() => levels.find((level) => level.level === selectedLevel) ?? levels[0], [levels, selectedLevel]);
  const example = active.examples[0];

  return <div className={styles.root}>
    <section className={styles.hero} aria-labelledby="reading-hero-title">
      <span className={styles.eyebrow}>HSK 1–9 · Reading practice</span>
      <h2 id="reading-hero-title" className={styles.heroTitle}>Read at your level. Understand every answer.</h2>
      <p className={styles.heroCopy}>Choose one HSK level, practise with real Chinese passages, and stay inside that level for every next question.</p>
      <div className={styles.heroActions}>
        <a className={styles.heroPrimary} href="#build-session">Start reading practice <ReadingIcon name="arrow"/></a>
        <a className={styles.heroSecondary} href="#practice-preview">See a sample question</a>
      </div>
    </section>

    <div className={styles.proofRail} aria-label="Reading library proof">
      {PROOF.map((item) => <div className={styles.proofItem} key={item.label}>
        <span className={styles.proofIcon}><ReadingIcon name={item.icon}/></span>
        <span><strong>{item.value}</strong><small>{item.label}</small></span>
      </div>)}
    </div>

    <ReadingResume/>

    <section id="build-session" className={styles.workspace} aria-labelledby="session-builder-title">
      <header className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionEyebrow}>Choose and start</span>
          <h2 id="session-builder-title">Build your reading session</h2>
        </div>
        <p>Pick a level once. The passage, question, links, and next question update together.</p>
      </header>

      <div className={styles.workspaceGrid}>
        <div className={styles.setupPanel}>
          <span className={styles.panelLabel}>Session setup</span>
          <h3>Choose your HSK level</h3>
          <p className={styles.setupIntro}>{active.descriptor}</p>
          <div className={styles.levelGrid} role="group" aria-label="Choose your reading level">
            {levels.map((level) => <button
              type="button"
              key={level.level}
              aria-pressed={selectedLevel === level.level}
              onClick={() => setSelectedLevel(level.level)}
              className={styles.levelButton}
            >HSK {level.level}</button>)}
          </div>
          <p className={styles.selectedLevel} aria-live="polite"><ReadingIcon name="check"/>HSK {active.level} selected</p>
          <dl className={styles.levelFacts}>
            <div><dt>Passages</dt><dd>{active.passages}</dd></div>
            <div><dt>Questions</dt><dd>{active.questions}</dd></div>
          </dl>
          <Link className={styles.startPrimary} href={`/reading/start?level=${active.level}&size=10`}>Start 10 questions <ReadingIcon name="arrow"/></Link>
          <Link className={styles.startSecondary} href={`/reading/start?level=${active.level}&size=20`}>Start 20 questions</Link>
        </div>

        <article id="practice-preview" className={styles.preview} aria-label={`Real HSK ${active.level} practice preview`}>
          <div className={styles.previewHeader}>
            <span><ReadingIcon name="book"/>Real practice preview</span>
            <span className={styles.levelBadge}>HSK {active.level}</span>
          </div>
          <div className={styles.previewBody}>
            <div className={styles.previewMeta}><span>Sample question · 1 of 10</span><span>{readableQuestionType(example.questionType)}</span></div>
            <h3 lang="zh-CN">{example.title}</h3>
            <p className={styles.chinesePassage} lang="zh-CN">{example.passage}</p>
            <div className={styles.questionBox}>
              <p className={styles.prompt} lang="zh-CN">{example.prompt}</p>
              <div className={styles.options}>{example.options.map((option, index) => <span lang="zh-CN" key={option}>{String.fromCharCode(65 + index)}. {option}</span>)}</div>
              <div className={styles.feedback}><ReadingIcon name="feedback"/><div><strong>Example feedback</strong><p>{example.explanation}</p></div></div>
            </div>
            <Link className={styles.previewLink} href={`/reading/start?level=${active.level}&size=10`}>Start this HSK {active.level} session <ReadingIcon name="arrow"/></Link>
          </div>
        </article>
      </div>
    </section>

    <section className={styles.sessionFlow} aria-labelledby="reading-session-flow">
      <header className={styles.sectionHeader}>
        <div><span className={styles.sectionEyebrow}>One clear loop</span><h2 id="reading-session-flow">How a reading session works</h2></div>
      </header>
      <ol className={styles.stepList}>{SESSION_STEPS.map((step) => <li key={step.number}>
        <span className={styles.stepNumber}>{step.number}</span>
        <div><h3>{step.title}</h3><p>{step.copy}</p></div>
      </li>)}</ol>
    </section>

    <section className={styles.insideLevel} aria-labelledby="inside-reading-level">
      <header className={styles.insideHeader}>
        <div><span className={styles.sectionEyebrow}>Selected-level content</span><h2 id="inside-reading-level">Inside HSK {active.level}</h2><p>{active.descriptor}</p></div>
        <div className={styles.typeSummary}><span>Question types</span><div>{active.questionTypes.map((type) => <small key={type}>{readableQuestionType(type)}</small>)}</div></div>
      </header>
      <div className={styles.exampleList}>{active.examples.map((item, index) => <article key={item.slug} className={styles.exampleRow}>
        <span className={styles.exampleNumber}>{String(index + 1).padStart(2, "0")}</span>
        <span className={styles.exampleContent}><span><strong lang="zh-CN">{item.title}</strong><small>{readableQuestionType(item.questionType)}</small></span><span className={styles.exampleExcerpt} lang="zh-CN">{item.passage}</span></span>
        <span className={styles.exampleAction}>Real sample</span>
      </article>)}</div>
    </section>
  </div>;
}
