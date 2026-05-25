import type { Metadata } from "next";
import SiteFooter from "../site-footer";

export const metadata: Metadata = {
  title: "HSK 3 Sample Practice Questions | HSKKit",
  description:
    "Prepare for an HSK 3 practice test, mock test, or sample test with structure notes, study methods, HSK 2 transition challenges, and review tips.",
  alternates: {
    canonical: "https://hskkit.com/hsk-3-practice-test",
  },
};

const examSections = [
  {
    title: "Listening practice",
    detail:
      "HSK 3 listening practice should check whether you can follow short conversations, everyday situations, and key details without relying on one keyword.",
  },
  {
    title: "Reading practice",
    detail:
      "Reading practice usually asks you to connect sentence meaning, compare choices, and notice small words that change time, reason, or result.",
  },
  {
    title: "Integrated review",
    detail:
      "A useful mock test turns the score into a review plan: vocabulary gaps, weak sentence patterns, slow reading, or missed listening details.",
  },
];

const learnerFit = [
  "You can handle many HSK 2 practice questions and explain your common mistakes.",
  "You are studying HSK 3 vocabulary and need to test whether words work inside longer context.",
  "You want a sample test before committing to a longer timed HSK 3 mock test.",
  "You need to decide whether your next review should focus on vocabulary, listening, reading, or grammar patterns.",
];

const practiceMethods = [
  {
    method: "Use a short sample test first",
    detail:
      "Start with a smaller HSK 3 sample test so every wrong answer can be reviewed carefully before you add time pressure.",
  },
  {
    method: "Separate listening and reading",
    detail:
      "Practice each skill separately at first. This makes it easier to tell whether the problem is speed, vocabulary, or sentence structure.",
  },
  {
    method: "Retake by mistake type",
    detail:
      "After review, retake questions that test the same weak point instead of only chasing a higher total score.",
  },
];

const prepTips = [
  "Review HSK 3 vocabulary by topic before a mock test, especially opinions, plans, comparisons, daily problems, and study or work situations.",
  "Practice reading full sentences instead of choosing an answer from one familiar word.",
  "For listening, write the missed detail after replaying a question: person, time, place, reason, action, or result.",
  "Mix older HSK 2 material into review so earlier vocabulary does not fade while you add HSK 3 words.",
  "Use one mistake log for both sample tests and timed mock tests so repeated weak points become easy to see.",
];

const transitionDifficulties = [
  {
    title: "Longer context",
    detail:
      "HSK 3 questions often require holding more sentence information in memory than HSK 2 practice tasks.",
  },
  {
    title: "More connected grammar",
    detail:
      "Reason, result, comparison, and sequence can appear together, so learners need to understand how the sentence is built.",
  },
  {
    title: "Less obvious answers",
    detail:
      "A wrong option may include familiar words from the prompt. Careful meaning matters more than keyword matching.",
  },
  {
    title: "Stamina and pacing",
    detail:
      "Even when individual questions are understandable, a longer mock test can expose fatigue, speed problems, or careless reading.",
  },
];

const commonMistakes = [
  {
    title: "Taking a full mock test too early",
    detail:
      "If every section feels overwhelming, use shorter sample tests first and review the pattern behind each miss.",
  },
  {
    title: "Skipping vocabulary review",
    detail:
      "HSK 3 practice depends on enough word coverage. Unknown words can make grammar and listening feel harder than they are.",
  },
  {
    title: "Reviewing only wrong answers",
    detail:
      "Some correct answers are lucky guesses. Mark uncertain correct answers too, because they often reveal the next weak area.",
  },
  {
    title: "Ignoring HSK 2 foundations",
    detail:
      "Weak HSK 2 recall slows down HSK 3 reading and listening. Keep earlier vocabulary active during test preparation.",
  },
];

export default function HSK3PracticeTestPage() {
  return (
    <main className="section">
      <section>
        <p className="eyebrow">HSK 3 Sample Practice Questions</p>
        <h1>Prepare for an HSK 3 practice test with focused review</h1>
        <p className="subtitle">
          An HSK 3 practice test, mock test, or sample test helps you check
          whether vocabulary, listening, reading, and sentence patterns are
          ready for longer beginner-intermediate Chinese tasks. Use every result
          to choose the next review step.
        </p>
        <div className="actions">
          <a className="button primary" href="/hsk-3-vocabulary">
            Review HSK 3 vocabulary
          </a>
          <a className="button secondary" href="/hsk-level-test">
            Check your level
          </a>
        </div>
      </section>

      <section>
        <p className="eyebrow">Structure</p>
        <h2>What an HSK 3 mock test should check</h2>
        <p>
          This page is a study guide, not an official exam notice. Use it to
          organize practice around the skills learners usually need before HSK 3
          material feels reliable.
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
        <h2>Who should use an HSK 3 sample test</h2>
        <p>
          HSK 3 sample tests are useful when HSK 2 practice is mostly
          manageable and you need evidence about the next layer of vocabulary,
          reading, and listening.
        </p>
        <ul>
          {learnerFit.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <p className="eyebrow">Method</p>
        <h2>How to practice before a timed mock test</h2>
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
        <h2>HSK 3 practice test preparation tips</h2>
        <p>
          Good preparation keeps vocabulary, sentence practice, timed rounds,
          and mistake review connected instead of treating each test attempt as
          a separate event.
        </p>
        <ol>
          {prepTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ol>
      </section>

      <section>
        <p className="eyebrow">Transition</p>
        <h2>What gets harder from HSK 2 to HSK 3 practice</h2>
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
        <h2>What to avoid during HSK 3 mock test review</h2>
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
            <h3>HSK 3 vocabulary</h3>
            <p>
              Review HSK 3 words before and after sample tests so mistakes turn
              into focused vocabulary work.
            </p>
            <a href="/hsk-3-vocabulary">Open HSK 3 vocabulary</a>
          </article>
          <article className="card">
            <h3>HSK 2 practice test</h3>
            <p>
              Return to HSK 2 practice when HSK 3 sample tests show the earlier
              foundation is still slow.
            </p>
            <a href="/hsk-2-practice-test">Open HSK 2 practice test</a>
          </article>
          <article className="card">
            <h3>HSK 4 vocabulary</h3>
            <p>
              Start HSK 4 vocabulary when HSK 3 mock test review shows that
              word coverage is ready for a broader intermediate step.
            </p>
            <a href="/hsk-4-vocabulary">Open HSK 4 vocabulary</a>
          </article>
          <article className="card">
            <h3>HSK 4 practice test</h3>
            <p>
              Move into HSK 4 mock test guidance when HSK 3 practice is
              manageable and intermediate pacing becomes the next challenge.
            </p>
            <a href="/hsk-4-practice-test">Open HSK 4 practice test</a>
          </article>
          <article className="card">
            <h3>HSK level test</h3>
            <p>
              Use a broader self-check if you are unsure whether to review HSK
              2, continue HSK 3 vocabulary, or try more mock tests.
            </p>
            <a href="/hsk-level-test">Open HSK level test</a>
          </article>
          <article className="card">
            <h3>New HSK 3.0 guide</h3>
            <p>
              Read the framework guide before assuming every HSK 3 practice
              resource uses the same labels or boundaries.
            </p>
            <a href="/new-hsk-3-0">Open New HSK 3.0 guide</a>
          </article>
        </div>
      </section>

      <section className="faq">
        <p className="eyebrow">FAQ</p>
        <h2>HSK 3 practice test questions</h2>
        <details open>
          <summary>Is this an official HSK 3 mock test?</summary>
          <p>
            No. This is a learner-facing practice guide. Use official or
            exam-provider resources when you need current registration, timing,
            scoring, or format requirements.
          </p>
        </details>
        <details>
          <summary>Should I take an HSK 3 sample test before a full mock test?</summary>
          <p>
            Yes for many learners. A shorter sample test makes it easier to
            review every mistake before adding full-test length and time
            pressure.
          </p>
        </details>
        <details>
          <summary>What should I do if HSK 3 practice feels too hard?</summary>
          <p>
            Check whether the difficulty is vocabulary, sentence structure,
            listening detail, or HSK 2 recall. Then review that cause before
            taking another mock test.
          </p>
        </details>
      </section>
      <SiteFooter />
    </main>
  );
}
