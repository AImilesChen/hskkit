import type { Metadata } from "next";
import SiteFooter from "../site-footer";

export const metadata: Metadata = {
  title: "HSK 4 Practice Test Guide | HSKKit",
  description:
    "Prepare for an HSK 4 practice test, mock test, or sample test with structure notes, study methods, HSK 3 transition challenges, and review tips.",
  alternates: {
    canonical: "https://hskkit.com/hsk-4-practice-test",
  },
};

const examSections = [
  {
    title: "Listening practice",
    detail:
      "HSK 4 listening practice should check whether you can follow longer everyday situations, opinions, reasons, and details without losing the main point.",
  },
  {
    title: "Reading practice",
    detail:
      "Reading practice should include longer sentences and short passages where meaning depends on cause, contrast, sequence, and context.",
  },
  {
    title: "Score review",
    detail:
      "A useful HSK 4 mock test turns each miss into a review decision: vocabulary, similar words, sentence structure, pacing, or attention.",
  },
];

const learnerFit = [
  "You can handle many HSK 3 practice questions without relying only on keyword matching.",
  "You are studying HSK 4 vocabulary and need to test whether words work inside longer context.",
  "You want a lower-pressure HSK 4 sample test before taking a full timed mock test.",
  "You need evidence about whether to review vocabulary, reading speed, listening detail, or intermediate grammar patterns.",
];

const practiceMethods = [
  {
    method: "Start with section practice",
    detail:
      "Use separate listening and reading sample sets before combining them into a longer HSK 4 mock test.",
  },
  {
    method: "Add timing gradually",
    detail:
      "First review carefully, then add time pressure. HSK 4 practice is more useful when accuracy and pacing are trained in order.",
  },
  {
    method: "Review uncertain correct answers",
    detail:
      "Mark guesses and slow answers. These often reveal weak vocabulary or sentence patterns before they become wrong answers.",
  },
];

const prepTips = [
  "Review HSK 4 vocabulary by topic and usage before a mock test, especially opinions, responsibility, work, relationships, and problem solving.",
  "Practice reading short passages for main idea, detail, and logical connection instead of translating line by line.",
  "For listening, replay missed items and write the exact detail that changed the answer.",
  "Keep HSK 3 vocabulary active so older words do not slow down HSK 4 listening and reading.",
  "Use one mistake log across sample tests and timed mock tests so repeated patterns are easy to spot.",
];

const transitionDifficulties = [
  {
    title: "More passage-level meaning",
    detail:
      "HSK 4 questions may require understanding how several sentences connect, not only one simple prompt.",
  },
  {
    title: "Similar answer choices",
    detail:
      "Wrong options can sound reasonable or include familiar words. Learners need to compare meaning carefully.",
  },
  {
    title: "Faster vocabulary recall",
    detail:
      "HSK 3 vocabulary needs to be quick enough that HSK 4 words and longer context do not overload the whole task.",
  },
  {
    title: "More stamina",
    detail:
      "A longer mock test can reveal fatigue, rushed reading, missed listening details, and weaker time control.",
  },
];

const commonMistakes = [
  {
    title: "Taking only full mock tests",
    detail:
      "Full tests are useful, but section practice often shows the exact skill that needs review more clearly.",
  },
  {
    title: "Skipping similar-word review",
    detail:
      "HSK 4 practice often exposes words that look familiar but are used differently. Compare them directly.",
  },
  {
    title: "Ignoring slow correct answers",
    detail:
      "A correct answer that took too long can still point to a pacing problem or weak recall.",
  },
  {
    title: "Leaving HSK 3 behind",
    detail:
      "Older vocabulary still appears inside HSK 4 practice. Review it enough that it supports the new material.",
  },
];

export default function HSK4PracticeTestPage() {
  return (
    <main className="section">
      <section>
        <p className="eyebrow">HSK 4 Practice Test</p>
        <h1>Prepare for an HSK 4 practice test with intermediate review</h1>
        <p className="subtitle">
          An HSK 4 practice test, mock test, or sample test helps you check
          whether vocabulary, listening, reading, pacing, and sentence logic are
          ready for more intermediate Chinese tasks. Use each attempt to choose
          a focused review step.
        </p>
        <div className="actions">
          <a className="button primary" href="/hsk-4-vocabulary">
            Review HSK 4 vocabulary
          </a>
          <a className="button secondary" href="/hsk-level-test">
            Check your level
          </a>
        </div>
      </section>

      <section>
        <p className="eyebrow">Structure</p>
        <h2>What an HSK 4 mock test should check</h2>
        <p>
          This page is a study guide, not an official exam format notice. Use it
          to organize practice around the intermediate skills that HSK 4 learners
          usually need to strengthen.
        </p>
        <div className="grid">
          {examSections.map((section) => (
            <article className="card" key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Fit</p>
        <h2>Who should use an HSK 4 sample test</h2>
        <p>
          HSK 4 sample tests are useful when HSK 3 practice is mostly
          manageable and you need a realistic check before a longer timed mock
          test.
        </p>
        <ul>
          {learnerFit.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <p className="eyebrow">Method</p>
        <h2>How to practice before a full mock test</h2>
        <div className="grid">
          {practiceMethods.map((item) => (
            <article className="card" key={item.method}>
              <h3>{item.method}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Preparation</p>
        <h2>HSK 4 practice test preparation tips</h2>
        <p>
          Strong preparation connects vocabulary, passage reading, listening
          detail, timing, and mistake review instead of treating each mock test
          as a one-time score.
        </p>
        <ol>
          {prepTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ol>
      </section>

      <section>
        <p className="eyebrow">Transition</p>
        <h2>What gets harder from HSK 3 to HSK 4 practice</h2>
        <div className="grid">
          {transitionDifficulties.map((item) => (
            <article className="card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="eyebrow">Common Mistakes</p>
        <h2>What to avoid during HSK 4 mock test review</h2>
        <div className="grid">
          {commonMistakes.map((mistake) => (
            <article className="card" key={mistake.title}>
              <h3>{mistake.title}</h3>
              <p>{mistake.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="eyebrow">Related Pages</p>
        <h2>Choose the next HSK study step</h2>
        <div className="grid">
          <article className="card">
            <h3>HSK 4 vocabulary</h3>
            <p>
              Review HSK 4 words before and after sample tests so missed
              questions become focused vocabulary work.
            </p>
            <a href="/hsk-4-vocabulary">Open HSK 4 vocabulary</a>
          </article>
          <article className="card">
            <h3>HSK 3 practice test</h3>
            <p>
              Return to HSK 3 practice if HSK 4 sample tests show that earlier
              vocabulary or pacing still needs attention.
            </p>
            <a href="/hsk-3-practice-test">Open HSK 3 practice test</a>
          </article>
          <article className="card">
            <h3>HSK 5 vocabulary</h3>
            <p>
              Start HSK 5 vocabulary when HSK 4 mock test review shows that
              advanced word coverage is the next useful challenge.
            </p>
            <a href="/hsk-5-vocabulary">Open HSK 5 vocabulary</a>
          </article>
          <article className="card">
            <h3>HSK level test</h3>
            <p>
              Use a broader self-check when you are unsure whether to review
              HSK 3, continue HSK 4 vocabulary, or take more mock tests.
            </p>
            <a href="/hsk-level-test">Open HSK level test</a>
          </article>
          <article className="card">
            <h3>New HSK 3.0 guide</h3>
            <p>
              Check framework context before assuming every HSK 4 practice
              resource uses the same labels, lists, or boundaries.
            </p>
            <a href="/new-hsk-3-0">Open New HSK 3.0 guide</a>
          </article>
        </div>
      </section>

      <section className="faq">
        <p className="eyebrow">FAQ</p>
        <h2>HSK 4 practice test questions</h2>
        <details open>
          <summary>Is this an official HSK 4 mock test?</summary>
          <p>
            No. This is a learner-facing practice guide. Use official or
            exam-provider resources when you need current registration, timing,
            scoring, or format requirements.
          </p>
        </details>
        <details>
          <summary>Should I take an HSK 4 sample test before a full mock test?</summary>
          <p>
            Yes for many learners. A shorter sample test or section set makes it
            easier to review every mistake before adding full-test length and
            time pressure.
          </p>
        </details>
        <details>
          <summary>What should I review after a low HSK 4 practice score?</summary>
          <p>
            Separate the causes first. Review vocabulary for unknown or similar
            words, sentence logic for confusing passages, and pacing if the main
            issue was speed or fatigue.
          </p>
        </details>
      </section>
      <SiteFooter />
    </main>
  );
}
