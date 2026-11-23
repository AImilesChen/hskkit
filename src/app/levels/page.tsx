import type { Metadata } from "next";
import Link from "next/link";
import { StudyPage } from "../components/study-shell";
import { getHsk3LevelStatuses } from "@/lib/content/level-status";
import styles from "./levels.module.css";

const title = "HSK Levels 1–9: Compare Levels & Find Your Starting Point | HSKKit";
const description = "Compare HSK levels, explore published vocabulary counts and choose a Chinese study starting point. Browse HSK 1–6 word lists and the shared HSK 7–9 advanced catalog.";
export const metadata: Metadata = {
  title, description, alternates: { canonical: "/levels" },
  openGraph: { title, description, url: "/levels", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

const guides = [
  { level: 1, title: "Start with the essentials", audience: "New to Chinese", focus: "Greetings, people, numbers and daily needs", task: "Introduce yourself, name familiar things and understand a simple everyday question." },
  { level: 2, title: "Connect everyday ideas", audience: "Comfortable with basic words", focus: "Routines, transport, interests and simple comparisons", task: "Talk about a daily routine, make a simple plan and compare familiar things." },
  { level: 3, title: "Build a fuller conversation", audience: "Ready to go beyond short answers", focus: "Experiences, travel, study and work", task: "Describe an experience, explain a plan and connect several ideas in a conversation." },
  { level: 4, title: "Explain what you mean", audience: "Building more connected Chinese", focus: "Opinions, reasons, plans and responsibilities", task: "Give a reason for a choice, explain a change of plan and compare possible solutions." },
  { level: 5, title: "Explore broader topics", audience: "Ready for more detailed expression", focus: "Viewpoints, developments and wider social topics", task: "Summarise a passage, explain a viewpoint and choose words that fit the context." },
  { level: 6, title: "Work with precise language", audience: "Developing longer, more formal expression", focus: "Abstract ideas, written language and arguments", task: "Follow a longer explanation, distinguish viewpoints and support an argument clearly." },
  { level: 7, title: "Go deeper with advanced Chinese", audience: "Extending an established foundation", focus: "Analysis, nuance, formal expression and idioms", task: "Compare claims and evidence, notice register and express qualifications precisely." },
] as const;

const faqs = [
  { question: "Which HSK level should a beginner start with?", answer: "Start with HSK 1 if pinyin, tones and common everyday words are still new to you. Work on pronunciation alongside vocabulary, then use short sentences to check that you can understand and use the words. If you have studied before, compare a few entries with what you can recall before choosing your starting list." },
  { question: "Are these vocabulary counts cumulative?", answer: "No. Each count is the number of published word entries assigned to that level in HSKKit’s current 2025-aligned catalog. It does not include the entries assigned to earlier levels. Higher-level study still builds on earlier vocabulary; the count beside a level is not a complete exam-readiness requirement." },
  { question: "Why do HSK 7, 8 and 9 share one vocabulary list?", answer: "HSKKit publishes the advanced vocabulary as one unified HSK 7–9 catalog. The shared list gives you one place to browse and practise those entries; it does not mean the three proficiency levels are identical. The advanced vocabulary link opens the combined band." },
  { question: "How do I know when to move to the next level?", answer: "Use recall and practical use as a guide, rather than simply finishing a list. Try reading an unfamiliar short passage, following a recording and using recent words in your own sentences. Continue reviewing earlier words while adding the next level. A placement suggestion can help you find gaps; it is not an official examination result." },
  { question: "Does learning every word mean I am ready for the HSK exam?", answer: "Vocabulary is one part of preparation. Reading, listening, grammar and the tasks required by your chosen exam also matter. Use the word lists for study, practise connected language and check the current syllabus and exam arrangements before booking an exam." },
];
const formatCount = (count: number) => count.toLocaleString("en-US");

export default function LevelsPage() {
  // Published snapshot only; levels 8 and 9 alias the same advanced catalog.
  const statuses = getHsk3LevelStatuses().filter((entry) => entry.level <= 7);
  const entries = guides.map((guide) => ({ ...guide, status: statuses.find((entry) => entry.level === guide.level)! }));
  const total = statuses.reduce((sum, entry) => sum + entry.wordCount, 0);
  const advanced = entries[6];
  return (
    <StudyPage>
      <main className={styles.page}>
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Your Chinese learning path</p>
            <h1>HSK Levels 1–9:<br />find your starting point</h1>
            <p className={styles.lead}>Compare the study focus of each level, choose a starting point and open the word list that fits your next step.</p>
            <div className={styles.actions}><a href="#browse-levels" className={styles.primary}>Explore the levels <span aria-hidden="true">↓</span></a><a href="#compare-levels" className={styles.secondary}>Compare at a glance</a></div>
            <p className={styles.catalogSummary}><strong>{formatCount(total)}</strong> published word entries <span aria-hidden="true">·</span> HSK 1–6 + a shared 7–9 catalog</p>
          </div>
          <aside className={styles.placement} aria-labelledby="placement-heading">
            <p className={styles.eyebrow}>Not sure where to begin?</p><h2 id="placement-heading">Start with what you know.</h2>
            <p>Already learned some Chinese? Use a placement diagnostic to find a suggested starting point and the gaps to work on.</p>
            <Link href="/placement" className={styles.textLink}>Find my starting level <span aria-hidden="true">→</span></Link>
            <p className={styles.small}>Learning guidance, not an official HSK score.</p>
          </aside>
        </header>

        {[
          { id: "browse-levels", heading: "Build your everyday foundation", label: "HSK 1–3", summary: "Start with familiar situations, then connect words into conversations about your day.", items: entries.slice(0, 3), theme: styles.foundation },
          { id: "developing-levels", heading: "Express more, with more detail", label: "HSK 4–6", summary: "Move from connected everyday language towards broader topics, clearer explanations and more precise expression.", items: entries.slice(3, 6), theme: styles.developing },
        ].map((group) => (
          <section key={group.id} id={group.id} className={`${styles.section} ${group.theme}`} aria-labelledby={`${group.id}-heading`}>
            <div className={styles.sectionHeading}><div><p className={styles.groupLabel}>{group.label}</p><h2 id={`${group.id}-heading`}>{group.heading}</h2></div><p>{group.summary}</p></div>
            <div className={styles.cardGrid}>{group.items.map((entry) => (
              <article key={entry.level} className={styles.levelCard}>
                <div className={styles.cardTop}><h3>HSK {entry.level}</h3><span>{formatCount(entry.status.wordCount)} words</span></div>
                <div className={styles.cardBody}><p className={styles.cardTitle}>{entry.title}</p><p className={styles.audience}>{entry.audience}</p><p className={styles.focus}>{entry.focus}</p><div className={styles.practice}><p className={styles.miniLabel}>Your study goal</p><p>{entry.task}</p></div><Link href={`/vocabulary/${entry.level}`} className={styles.cardLink}>Explore HSK {entry.level} vocabulary <span aria-hidden="true">→</span></Link></div>
              </article>
            ))}</div>
          </section>
        ))}

        <section id="advanced-levels" className={`${styles.section} ${styles.advanced}`} aria-labelledby="advanced-heading">
          <div className={styles.advancedIntro}><p className={styles.groupLabel}>The advanced path</p><h2 id="advanced-heading">HSK 7–9.<br />One shared vocabulary catalog.</h2><p>Explore {formatCount(advanced.status.wordCount)} published entries across the unified advanced band. HSKKit keeps these words together, so you can study the catalog without switching between three duplicate lists.</p><Link href="/vocabulary/7" className={styles.primary}>Explore HSK 7–9 vocabulary <span aria-hidden="true">→</span></Link></div>
          <div className={styles.advancedDetail}><p className={styles.miniLabel}>Go beyond recognising a word</p><h3>Pay attention to how it is used.</h3><ul><li><strong>Meaning in context</strong><span>Distinguish closely related expressions and choose the sense that fits a passage.</span></li><li><strong>Register and nuance</strong><span>Notice differences between everyday, written and formal language.</span></li><li><strong>Connected expression</strong><span>Use vocabulary to qualify a claim, develop an argument and summarise evidence.</span></li></ul><p className={styles.small}>A shared word list does not make HSK 7, 8 and 9 identical proficiency levels.</p></div>
        </section>

        <section id="compare-levels" className={styles.section} aria-labelledby="comparison-heading">
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>The bigger picture</p><h2 id="comparison-heading">Compare HSK levels at a glance</h2></div><p>Use the learning focus to choose a list. Word counts describe this catalog, not a complete measure of your ability.</p></div>
          <div className={styles.tableWrap} role="region" aria-label="HSK level comparison" tabIndex={0}>
            <table className={styles.comparison}>
              <caption>Published word entries by assigned level. Counts exclude earlier levels and non-word learning items; they are not cumulative.</caption>
              <thead><tr><th scope="col">Study level</th><th scope="col">Words in this level</th><th scope="col">Learning focus</th><th scope="col">Word list</th></tr></thead>
              <tbody>{entries.map((entry) => <tr key={entry.level}><th scope="row">HSK {entry.level === 7 ? "7–9" : entry.level}</th><td>{formatCount(entry.status.wordCount)}</td><td>{entry.focus}</td><td><Link href={`/vocabulary/${entry.level}`} aria-label={`Open HSK ${entry.level === 7 ? "7–9" : entry.level} word list`}>Open list <span aria-hidden="true">→</span></Link></td></tr>)}</tbody>
            </table>
          </div>
          <p className={styles.tableHint}>On a small screen, swipe the comparison table to see all columns.</p><p className={styles.sourceLink}>Preparing for an exam? <Link href="/hsk-3-0">Read the HSK 3.0 exam and syllabus guide →</Link></p>
        </section>

        <section id="choose-level" className={styles.section} aria-labelledby="choose-heading">
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Choose a useful starting point</p><h2 id="choose-heading">Which HSK level should you study?</h2></div><p>Your best starting point is a level you can work with, with enough unfamiliar language to keep learning.</p></div>
          <div className={styles.choiceGrid}>
            <article><span className={styles.step}>01</span><h3>If you are new to Chinese</h3><p>Begin with HSK 1 and build pinyin and tone awareness alongside the words. Read the meaning, listen where audio is available, then try to recall the word without looking.</p><Link href="/vocabulary/1" className={styles.textLink}>Start with HSK 1 →</Link></article>
            <article><span className={styles.step}>02</span><h3>If you have studied before</h3><p>Sample a word list and check both recognition and recall. Can you understand a short example and use the word in a sentence? Move down if the basics feel fragile; move up if the list is consistently familiar.</p><Link href="/placement" className={styles.textLink}>Check my starting point →</Link></article>
            <article><span className={styles.step}>03</span><h3>If you are preparing for an exam</h3><p>Use your target level to organise study, then practise reading, listening and the relevant exam tasks. A completed vocabulary list is useful progress, but it is not proof of exam readiness.</p><Link href="/hsk-test-prep" className={styles.textLink}>Explore HSK test preparation →</Link></article>
          </div>
        </section>

        <section className={`${styles.section} ${styles.routine}`} aria-labelledby="routine-heading">
          <div><p className={styles.eyebrow}>Turn a word list into a habit</p><h2 id="routine-heading">Learn a little. Recall it.<br />Use it again.</h2><p>Choose a manageable group of words rather than rushing through the whole level. Study their readings and meanings, try a sentence, then return later to check what you remember.</p></div>
          <ol><li><strong>Explore an entry</strong><span>Open a word for its reading, meaning and available examples.</span></li><li><strong>Practise recall</strong><span>Use the vocabulary page’s flashcards and check uncertain words again.</span></li><li><strong>Keep a learning loop</strong><span>Use Today and Review to continue working with the words you add.</span></li></ol>
          <div className={styles.routineLinks}><Link href="/dictionary">Look up a word →</Link><Link href="/today">Open Today →</Link><Link href="/review">Open Review →</Link></div>
        </section>

        <section id="level-faq" className={`${styles.section} ${styles.faq}`} aria-labelledby="faq-heading">
          <div><p className={styles.eyebrow}>A few useful answers</p><h2 id="faq-heading">Questions about HSK levels</h2><p>Choosing a list, understanding the counts and planning your next step.</p></div>
          <div>{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div>
        </section>
        <aside className={styles.sourceNote} aria-labelledby="source-heading"><h2 id="source-heading">About this study catalog</h2><p>Counts come from HSKKit’s currently published 2025-aligned catalog and include word entries only. English explanations and the study goals on this page are HSKKit learning guidance, not official exam material. Audio and examples vary by entry.</p><p><Link href="/content-license">Content sources and licenses →</Link><Link href="/hsk-3-0">Exam syllabus and transition guide →</Link></p></aside>
      </main>
    </StudyPage>
  );
}
