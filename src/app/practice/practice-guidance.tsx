import Link from "next/link";
import type { PracticeHubExample } from "@/lib/practice/hub-examples";
import styles from "./practice-hub.module.css";

export default function PracticeGuidance({ listening, vocabulary, reading }: {
  listening: PracticeHubExample;
  vocabulary: PracticeHubExample;
  reading: PracticeHubExample;
}) {
  return <>
    <section className={styles.section} aria-labelledby="practice-routine">
      <div className={styles.sectionTitle}>
        <p className={styles.eyebrow}>A ROUTINE YOU CAN REPEAT</p>
        <h2 id="practice-routine">Answer. Understand. Come back to it.</h2>
      </div>
      <ol className={styles.steps}>
        <li><span className={styles.stepNumber}>1</span><div><h3>Choose one focus</h3><p>Pick a level and skill. Open the overview, then start your eight-question session.</p></div></li>
        <li><span className={styles.stepNumber}>2</span><div><h3>Check your reasoning</h3><p>Read the explanation after each answer. Look for the word, pattern or detail you missed.</p></div></li>
        <li><span className={styles.stepNumber}>3</span><div><h3>Return to tricky questions</h3><p>Use <Link href="/mistakes" className={styles.textLink}>Mistakes</Link> and <Link href="/review" className={styles.textLink}>Review</Link> to revisit what needs more attention.</p></div></li>
      </ol>
    </section>

    <section className={styles.section} aria-labelledby="practice-methods">
      <div className={styles.sectionTitle}>
        <p className={styles.eyebrow}>MAKE EACH QUESTION USEFUL</p>
        <h2 id="practice-methods">How to practise each HSK skill</h2>
        <p>A correct answer is a useful start. Being able to explain it helps you apply the same idea in another sentence. Try these approaches with your next practice set.</p>
      </div>
      <div className={styles.guides}>
        <article className={styles.guide}>
          <p className={styles.guideTag}>VOCABULARY · CONNECT WORD AND MEANING</p>
          <h3>Remember a word with something it can say.</h3>
          <p>Before checking the options, try recalling the Chinese word yourself. After answering, say its pronunciation and meaning together. Then make a short phrase or sentence, rather than remembering only the position of the correct option.</p>
          <div className={styles.guideExample} data-source-question={vocabulary.id}><p lang="zh-Hans">{vocabulary.excerpt}</p><p>{vocabulary.explanation}</p></div>
          <p>If recognition feels easy but recall is slow, alternate these questions with flashcards. Use the level word list to look up a pronunciation or meaning you are unsure about.</p>
          <div className={styles.guideLinks}><Link href="/vocabulary/1?mode=flashcards#vocabulary-activities" className={styles.textLink}>Try vocabulary flashcards →</Link><Link href="/dictionary" className={styles.textLink}>Look up a word ↗</Link></div>
        </article>
        <article className={styles.guide}>
          <p className={styles.guideTag}>GRAMMAR · NOTICE HOW THE SENTENCE WORKS</p>
          <h3>Check the order, then read the whole sentence.</h3>
          <p>For word-order questions, identify who is doing something and what they are doing. Check where time and place belong. For gap-fill questions, read both sides of the gap before choosing a word; a familiar word is not always the one that fits.</p>
          <div className={styles.guideExample}><p lang="zh-Hans">我<mark>昨天</mark><mark>在学校</mark>看书。</p><p>Worked example: “I read at school yesterday.” Here, the time and place come before the action 看书.</p></div>
          <p>After a mistake, compare the complete correct sentence with your choice. Write down the pattern you need to revisit and try it with different vocabulary.</p>
          <div className={styles.guideLinks}><Link href="/grammar" className={styles.textLink}>Explore Chinese grammar →</Link></div>
        </article>
        <article className={styles.guide}>
          <p className={styles.guideTag}>READING · LOOK FOR SUPPORT IN THE TEXT</p>
          <h3>Find the detail that answers the question.</h3>
          <p>Read the question to see whether you need a person, time, place, reason or conclusion. Then locate the relevant part of the passage. Check that the answer agrees with the text, rather than choosing an option just because it repeats a familiar word.</p>
          <div className={styles.guideExample} data-source-question={reading.id}><p lang="zh-Hans">{reading.excerpt}</p><p>HSK 1 example: {reading.prompt} The answer is <span lang="zh-Hans">{reading.answer}</span>; the morning visit is the relevant detail.</p></div>
          <p>As passages become longer, pay attention to changes of plan and contrasts. Separate what the writer actually says from something that only seems plausible.</p>
          <div className={styles.guideLinks}><Link href="/reading" className={styles.textLink}>Read graded Chinese texts →</Link></div>
        </article>
        <article className={styles.guide}>
          <p className={styles.guideTag}>LISTENING · SOUND FIRST, SCRIPT SECOND</p>
          <h3>Listen for the task, then check what you heard.</h3>
          <p>Read the question before playing the recording. Some tasks focus on a sound or tone; others ask for information from a longer passage. Listen once with that task in mind, then replay to check the part you missed.</p>
          <div className={styles.guideExample} data-source-question={listening.id}>
            <p>Try a real HSK 1 listening question:</p><p>{listening.prompt}</p>
            {listening.audioSrc && <audio controls preload="none" src={listening.audioSrc} aria-label="HSK 1 listening practice sample">Your browser does not support audio playback.</audio>}
            <details><summary>Check the sound and explanation</summary><p><span lang="zh-Hans">{listening.excerpt}</span> · {listening.answer}<br />{listening.explanation}</p></details>
          </div>
          <p>Check the explanation after making your choice. Replay while following the script, then try listening again without reading it.</p>
          <div className={styles.guideLinks}><Link href="/listen" className={styles.textLink}>Explore listening practice →</Link><Link href="/tools/chinese-tone-trainer" className={styles.textLink}>Work on tones ↗</Link></div>
        </article>
      </div>
    </section>

    <section className={styles.section} aria-labelledby="practice-type">
      <div className={styles.sectionTitle}><p className={styles.eyebrow}>CHOOSE WHAT YOU NEED TODAY</p><h2 id="practice-type">A short practice set or a complete mock test?</h2><p>Use focused questions to work on one skill. Choose a complete paper when you want to practise managing several sections and their time limits.</p></div>
      <div className={styles.compare}>
        <article className={`${styles.compareCard} ${styles.compareMain}`}><span className={styles.compareLabel}>YOU ARE HERE · FOCUS ON ONE SKILL</span><h3>Skill practice</h3><p>Eight questions with feedback after each answer. Useful when you want to concentrate on vocabulary, grammar, reading or listening at a chosen level.</p><a href="#choose-practice" className={styles.textLink}>Choose a practice set ↑</a></article>
        <article className={styles.compareCard}><span className={styles.compareLabel}>RECALL WORDS</span><h3>Quick Flashcards</h3><p>Choose a short set from a level word list. Reveal the meaning, then mark how well you remember the word.</p><Link href="/vocabulary/1?mode=flashcards#vocabulary-activities" className={styles.textLink}>Open flashcards →</Link></article>
        <article className={styles.compareCard}><span className={styles.compareLabel}>PRACTISE THE EXAM ROUTINE</span><h3>HSK mock papers</h3><p>Explore the separate HSK 1–6 A/B/C papers for complete-paper practice. Check the exam format and level before starting.</p><Link href="/hsk-test-prep" className={styles.textLink}>Explore HSK mock tests →</Link></article>
      </div>
      <p className={styles.compareNote}>These short skill sets are HSKKit learning material, not official exam papers or a level certificate. Vocabulary uses the 2025 exam word lists; other skills use HSKKit-authored practice material. <Link href="/content-license" className={styles.textLink}>Sources and content details ↗</Link></p>
    </section>

    <section className={styles.section} aria-labelledby="practice-questions">
      <div className={styles.sectionTitle}><p className={styles.eyebrow}>BEFORE YOUR NEXT SESSION</p><h2 id="practice-questions">Questions about HSK practice</h2></div>
      <div className={styles.faqGrid}>
        <div className={styles.faqs}>
          <details><summary>Which HSK level should I choose?</summary><p>Start with the level you are studying and try one skill. If the questions are consistently too difficult or too easy, change the level. The <Link href="/hsk-placement-test" className={styles.textLink}>placement tool</Link> can suggest a starting point; a short practice score is not an official proficiency result.</p></details>
          <details><summary>How many questions are in a session?</summary><p>Each session contains eight published questions for the selected level and skill. Repeating a set can revisit material, so use the explanations and related lessons to work on your understanding as well as your score.</p></details>
          <details><summary>Can I practise without signing in?</summary><p>Yes. You can start a skill-practice session as a guest. Keep using the same browser to return to your guest session. Your account gives you a separate place to continue learning when signed in.</p></details>
          <details><summary>Where can I find my wrong answers?</summary><p>Open <Link href="/mistakes" className={styles.textLink}>Mistakes</Link> to revisit saved incorrect answers, or use <Link href="/review" className={styles.textLink}>Review</Link> for scheduled practice. Read the explanation and retry the question without relying on the option position.</p></details>
          <details><summary>Is this the same as an HSK mock exam?</summary><p>No. These are short, single-skill learning sessions with immediate feedback. The <Link href="/hsk-test-prep" className={styles.textLink}>HSK test centre</Link> has separate complete mock papers. Choose the format that matches your study goal.</p></details>
          <details><summary>Why are HSK 7, 8 and 9 grouped together?</summary><p>The vocabulary catalog uses a unified HSK 7–9 advanced band. Choose that option for the shared advanced skill sets; there are no separate HSK 8 or HSK 9 practice selectors here.</p></details>
        </div>
        <aside className={styles.resources} aria-label="Related study resources"><h3>Keep learning</h3><Link href="/vocabulary/1">HSK vocabulary lists →</Link><Link href="/grammar">Chinese grammar guides →</Link><Link href="/reading">Graded Chinese reading →</Link><Link href="/listen">Chinese listening library →</Link><Link href="/tools/chinese-stroke-order">Stroke order &amp; writing →</Link><Link href="/hsk-test-prep">HSK mock test centre →</Link></aside>
      </div>
    </section>
  </>;
}
