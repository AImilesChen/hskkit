import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HSK 2 Practice Test Guide | HSKKit",
  description:
    "Prepare for an HSK 2 practice test, mock test, or sample test with structure notes, study methods, common mistakes, and next steps.",
};

const examSections = [
  {
    title: "Listening practice",
    detail:
      "Use short audio-style prompts, picture matching, and simple daily situations to check whether familiar words stay clear at test speed.",
  },
  {
    title: "Reading practice",
    detail:
      "Work with short sentences, answer choices, and everyday topics so vocabulary recognition turns into careful test decisions.",
  },
  {
    title: "Review after scoring",
    detail:
      "A mock test is useful only if you record why each miss happened: unknown word, missed detail, weak pattern, or rushed reading.",
  },
];

const learnerFit = [
  "You know many HSK 1 words and can follow simple beginner sentences.",
  "You are adding HSK 2 vocabulary for daily life, plans, time, work, study, and preferences.",
  "You want a lower-pressure sample test before trying a longer timed mock test.",
  "You need evidence about whether to review vocabulary, listening, reading, or test habits next.",
];

const practiceMethods = [
  {
    method: "Start with sample questions",
    detail:
      "Use a small HSK 2 sample test first. Short sets are easier to review carefully than a full mock test you rush through.",
  },
  {
    method: "Move into timed rounds",
    detail:
      "Once the question style feels familiar, add a timer so listening and reading speed become part of the practice.",
  },
  {
    method: "Keep a mistake log",
    detail:
      "Write one short reason for each wrong answer. The pattern matters more than the score from one practice attempt.",
  },
];

const prepTips = [
  "Review HSK 2 vocabulary by topic before taking a mock test, especially time, questions, school, work, shopping, and preferences.",
  "Practice recognizing complete short sentences instead of translating every word separately.",
  "After listening practice, replay only the missed items and identify the exact word or detail that changed the answer.",
  "After reading practice, compare answer choices slowly and look for small words that change meaning.",
  "Retake a short sample set after review so you can check whether the weak point actually improved.",
];

const commonMistakes = [
  {
    title: "Starting too long",
    detail:
      "A full mock test can hide the real problem. Short HSK 2 practice sets make review clearer for early learners.",
  },
  {
    title: "Ignoring HSK 1 gaps",
    detail:
      "If basic words still feel slow, HSK 2 questions will feel harder than they need to. Review the foundation first.",
  },
  {
    title: "Only checking the score",
    detail:
      "A score without mistake reasons does not tell you what to study next. Track the cause, then choose the review task.",
  },
  {
    title: "Reading by keyword only",
    detail:
      "One familiar word can appear in a wrong option. Read the whole sentence before choosing an answer.",
  },
];

export default function HSK2PracticeTestPage() {
  return (
    <main className="section">
      <section>
        <p className="eyebrow">HSK 2 Practice Test</p>
        <h1>Prepare for an HSK 2 practice test with a clear review plan</h1>
        <p className="subtitle">
          An HSK 2 practice test, mock test, or sample test helps you check
          whether beginner-plus vocabulary works inside short listening and
          reading tasks. Use each attempt to find the next focused review step.
        </p>
        <div className="actions">
          <a className="button primary" href="/hsk-2-vocabulary">
            Review HSK 2 vocabulary
          </a>
          <a className="button secondary" href="/hsk-level-test">
            Check your level
          </a>
        </div>
      </section>

      <section>
        <p className="eyebrow">Structure</p>
        <h2>What an HSK 2 mock test should help you check</h2>
        <p>
          This page is a study guide, not an official format notice. Use it to
          organize practice around the skills a learner normally needs before
          moving beyond HSK 2 material.
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
        <h2>Who should use an HSK 2 sample test</h2>
        <p>
          HSK 2 sample tests are most useful when HSK 1 material is no longer
          completely new, but longer beginner phrases still need careful
          practice.
        </p>
        <ul>
          {learnerFit.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <p className="eyebrow">Method</p>
        <h2>How to practice without wasting a mock test</h2>
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
        <h2>HSK 2 practice test preparation tips</h2>
        <p>
          Good preparation is repeatable. Keep vocabulary, sample questions,
          timed practice, and mistake review in the same small loop.
        </p>
        <ol>
          {prepTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ol>
      </section>

      <section>
        <p className="eyebrow">Common Mistakes</p>
        <h2>What to avoid during HSK 2 mock test practice</h2>
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
            <h3>HSK 2 vocabulary</h3>
            <p>
              Review the words and topic groups that make HSK 2 practice
              questions easier to understand.
            </p>
            <a href="/hsk-2-vocabulary">Open HSK 2 vocabulary</a>
          </article>
          <article className="card">
            <h3>HSK 1 practice test</h3>
            <p>
              Return to HSK 1 practice if HSK 2 questions feel difficult
              because the beginner base is still slow.
            </p>
            <a href="/hsk-1-practice-test">Open HSK 1 practice</a>
          </article>
          <article className="card">
            <h3>HSK 3 vocabulary</h3>
            <p>
              Move into HSK 3 words when HSK 2 sample tests show that the
              beginner-plus foundation is becoming reliable.
            </p>
            <a href="/hsk-3-vocabulary">Open HSK 3 vocabulary</a>
          </article>
          <article className="card">
            <h3>HSK 3 practice test</h3>
            <p>
              Try HSK 3 mock test guidance after HSK 2 sample tests feel
              manageable and longer context becomes the next challenge.
            </p>
            <a href="/hsk-3-practice-test">Open HSK 3 practice test</a>
          </article>
          <article className="card">
            <h3>HSK level test</h3>
            <p>
              Use a broader self-check when you are unsure whether HSK 2 is the
              right current target.
            </p>
            <a href="/hsk-level-test">Open HSK level test</a>
          </article>
          <article className="card">
            <h3>HSK levels guide</h3>
            <p>
              Compare how HSK 2 fits into the wider HSK path before choosing a
              longer study plan.
            </p>
            <a href="/hsk-levels">Open HSK levels guide</a>
          </article>
        </div>
      </section>

      <section className="faq">
        <p className="eyebrow">FAQ</p>
        <h2>HSK 2 practice test questions</h2>
        <details open>
          <summary>Is an HSK 2 mock test the same as the official exam?</summary>
          <p>
            No. A mock test is practice material. Use official or
            exam-provider resources when you need current registration,
            scoring, timing, or format rules.
          </p>
        </details>
        <details>
          <summary>Should I take a full HSK 2 practice test first?</summary>
          <p>
            Not always. Many learners get more value from a short sample test
            first, because it is easier to review every missed question
            carefully.
          </p>
        </details>
        <details>
          <summary>What should I review after a low score?</summary>
          <p>
            Separate the causes. Review vocabulary for unknown words, sentence
            patterns for confusing structures, and test habits if the main
            problem was speed or attention.
          </p>
        </details>
      </section>

      <footer className="footer">
        <a href="/">Back to home</a>
        <a href="/hsk-2-vocabulary">HSK 2 vocabulary</a>
        <a href="/hsk-3-vocabulary">HSK 3 vocabulary</a>
        <a href="/hsk-3-practice-test">HSK 3 practice</a>
        <a href="/hsk-level-test">HSK level test</a>
        <a href="/hsk-levels">HSK levels guide</a>
      </footer>
    </main>
  );
}
