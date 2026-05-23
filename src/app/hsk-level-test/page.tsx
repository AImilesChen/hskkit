import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HSK Level Test Guide | HSKKit",
  description:
    "Estimate your starting HSK study level with beginner self-check questions, a readiness checklist, and practical next steps.",
};

const selfCheckQuestions = [
  {
    prompt: "Can you recognize a basic greeting such as 你好 without pausing?",
    lookFor:
      "A confident yes suggests your first beginner vocabulary is becoming familiar.",
  },
  {
    prompt: "Can you connect a simple word you see with its pinyin and meaning?",
    lookFor:
      "If one layer is missing, vocabulary review may help before harder practice.",
  },
  {
    prompt: "Can you follow a short beginner sentence when the key words are familiar?",
    lookFor:
      "This checks whether word recognition is starting to work inside context.",
  },
  {
    prompt: "Can you notice what caused a missed practice answer?",
    lookFor:
      "Separating a missing word from rushed reading gives a clearer next step.",
  },
];

const readinessChecklist = [
  "I can recognize some common beginner words in Chinese, not only their English meanings.",
  "I can use pinyin as support without ignoring the characters completely.",
  "I can stay with a short prompt long enough to compare the answer choices carefully.",
  "I can name at least one area to review after a practice attempt.",
];

const confidenceSteps = [
  {
    title: "Low confidence",
    detail:
      "Start with HSK 1 vocabulary and build a small base of words, pinyin, and meanings.",
    href: "/hsk-1-vocabulary",
    label: "Start with vocabulary",
  },
  {
    title: "Some confidence",
    detail:
      "Try HSK 1 practice so familiar words appear inside short prompts and choices.",
    href: "/hsk-1-practice-test",
    label: "Try HSK 1 practice",
  },
  {
    title: "Ready for HSK 2",
    detail:
      "Use HSK 2 vocabulary and practice test guidance when HSK 1 questions feel manageable but longer beginner phrases still need work.",
    href: "/hsk-2-practice-test",
    label: "Try HSK 2 practice",
  },
  {
    title: "Moving toward HSK 3",
    detail:
      "Start HSK 3 vocabulary when HSK 2 practice feels manageable and longer sentences need more word coverage.",
    href: "/hsk-3-vocabulary",
    label: "Study HSK 3 vocabulary",
  },
  {
    title: "Testing HSK 3 readiness",
    detail:
      "Use an HSK 3 practice test guide when vocabulary study needs a realistic listening and reading check.",
    href: "/hsk-3-practice-test",
    label: "Try HSK 3 practice",
  },
  {
    title: "Moving toward HSK 4",
    detail:
      "Start HSK 4 vocabulary when HSK 3 practice is manageable and intermediate reading needs more abstract word coverage.",
    href: "/hsk-4-vocabulary",
    label: "Study HSK 4 vocabulary",
  },
  {
    title: "Testing HSK 4 readiness",
    detail:
      "Use an HSK 4 practice test guide when intermediate vocabulary needs a realistic listening, reading, and pacing check.",
    href: "/hsk-4-practice-test",
    label: "Try HSK 4 practice",
  },
  {
    title: "Moving toward HSK 5",
    detail:
      "Start HSK 5 vocabulary when HSK 4 practice is manageable and advanced reading needs more abstract word coverage.",
    href: "/hsk-5-vocabulary",
    label: "Study HSK 5 vocabulary",
  },
  {
    title: "Planning ahead",
    detail:
      "Read the HSK levels guide when you want to compare the wider study path.",
    href: "/hsk-levels",
    label: "Read HSK levels guide",
  },
  {
    title: "Framework questions",
    detail:
      "Use the New HSK 3.0 guide for separate context on newer HSK references.",
    href: "/new-hsk-3-0",
    label: "Read New HSK 3.0 guide",
  },
];

export default function HSKLevelTestPage() {
  return (
    <main className="section">
      <section>
        <p className="eyebrow">HSK Level Test Guide</p>
        <h1>Estimate your HSK starting point with a simple self-check</h1>
        <p className="subtitle">
          This page is a study guide, not an official placement test. Use it to
          judge your beginner confidence, choose a next page, and turn uncertainty
          into a short review plan.
        </p>
        <div className="actions">
          <a className="button primary" href="/hsk-1-vocabulary">
            Start with HSK 1 vocabulary
          </a>
          <a className="button secondary" href="/hsk-levels">
            Compare HSK levels
          </a>
        </div>
      </section>

      <section>
        <p className="eyebrow">Estimate</p>
        <h2>How a beginner can estimate their level</h2>
        <div className="grid">
          <article className="card">
            <h3>Check recognition</h3>
            <p>
              Begin with what you can identify without heavy guessing: common
              words, simple greetings, and short beginner patterns.
            </p>
          </article>
          <article className="card">
            <h3>Test context</h3>
            <p>
              A word list alone is not enough. Try short practice prompts to see
              whether familiar language still makes sense in context.
            </p>
          </article>
          <article className="card">
            <h3>Choose a next step</h3>
            <p>
              If beginner material feels slow, review foundations. If it feels
              manageable, practice more and read the wider level guide.
            </p>
          </article>
        </div>
      </section>

      <section>
        <p className="eyebrow">Self-Check</p>
        <h2>Static questions to ask yourself</h2>
        <p>
          These are reflection prompts, not a scored quiz. Answer honestly and
          use hesitation as useful study information.
        </p>
        <div className="grid">
          {selfCheckQuestions.map((question) => (
            <article className="card" key={question.prompt}>
              <h3>{question.prompt}</h3>
              <p className="note">{question.lookFor}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Checklist</p>
        <h2>A simple level-readiness checklist</h2>
        <p>
          You do not need every skill to feel equal before moving forward. Use
          this checklist to notice whether your foundation is ready for short
          beginner practice or needs another vocabulary round.
        </p>
        <ul>
          {readinessChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <p className="eyebrow">Next Steps</p>
        <h2>Choose the next page by confidence</h2>
        <div className="grid">
          {confidenceSteps.map((step) => (
            <article className="card" key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
              <a href={step.href}>{step.label}</a>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="eyebrow">Related Pages</p>
        <h2>Keep your study path connected</h2>
        <div className="grid">
          <article className="card">
            <h3>HSK 1 vocabulary</h3>
            <p>
              Use the vocabulary guide when a self-check shows your first words
              need firmer recall.
            </p>
            <a href="/hsk-1-vocabulary">Open vocabulary guide</a>
          </article>
          <article className="card">
            <h3>HSK 1 practice test</h3>
            <p>
              Move into practice questions when you want to check beginner
              recognition inside short prompts.
            </p>
            <a href="/hsk-1-practice-test">Open practice guide</a>
          </article>
          <article className="card">
            <h3>HSK 2 practice test</h3>
            <p>
              Try HSK 2 sample test guidance when HSK 1 is manageable and you
              want a more useful next challenge.
            </p>
            <a href="/hsk-2-practice-test">Open HSK 2 practice test</a>
          </article>
          <article className="card">
            <h3>HSK 3 vocabulary</h3>
            <p>
              Move into HSK 3 words when HSK 2 practice is manageable and you
              need more vocabulary for longer reading.
            </p>
            <a href="/hsk-3-vocabulary">Open HSK 3 vocabulary</a>
          </article>
          <article className="card">
            <h3>HSK 3 practice test</h3>
            <p>
              Use HSK 3 sample test guidance when you need to check vocabulary,
              listening, reading, and pacing together.
            </p>
            <a href="/hsk-3-practice-test">Open HSK 3 practice test</a>
          </article>
          <article className="card">
            <h3>HSK 4 vocabulary</h3>
            <p>
              Move into HSK 4 words when HSK 3 practice is manageable and
              longer intermediate reading needs broader vocabulary.
            </p>
            <a href="/hsk-4-vocabulary">Open HSK 4 vocabulary</a>
          </article>
          <article className="card">
            <h3>HSK 4 practice test</h3>
            <p>
              Try HSK 4 mock test guidance when vocabulary, listening, reading,
              and pacing need a broader check.
            </p>
            <a href="/hsk-4-practice-test">Open HSK 4 practice test</a>
          </article>
          <article className="card">
            <h3>HSK 5 vocabulary</h3>
            <p>
              Move into HSK 5 words when HSK 4 practice is manageable and
              advanced reading needs broader vocabulary.
            </p>
            <a href="/hsk-5-vocabulary">Open HSK 5 vocabulary</a>
          </article>
          <article className="card">
            <h3>HSK levels guide</h3>
            <p>
              Compare the wider HSK path after you have a rough sense of your
              current starting point.
            </p>
            <a href="/hsk-levels">Open levels guide</a>
          </article>
          <article className="card">
            <h3>New HSK 3.0 guide</h3>
            <p>
              Use the separate guide for newer HSK framework context before
              making assumptions about level references.
            </p>
            <a href="/new-hsk-3-0">Open New HSK 3.0 guide</a>
          </article>
        </div>
      </section>

      <section className="faq">
        <p className="eyebrow">FAQ</p>
        <h2>HSK level self-check questions</h2>
        <details open>
          <summary>Is this an official HSK placement test?</summary>
          <p>
            No. This is a static study guide for estimating a useful starting
            point. Use official or exam-specific resources when you need formal
            testing information.
          </p>
        </details>
        <details>
          <summary>What if my skills do not match one level neatly?</summary>
          <p>
            That is common. Vocabulary recognition, listening comfort, reading
            speed, and test familiarity can develop at different rates.
          </p>
        </details>
        <details>
          <summary>Should a complete beginner begin with HSK 1?</summary>
          <p>
            HSK 1 material is a practical starting place for a new learner who
            wants beginner vocabulary and short practice before comparing higher
            levels.
          </p>
        </details>
      </section>

      <footer className="footer">
        <a href="/">Back to home</a>
        <a href="/hsk-1-vocabulary">HSK 1 vocabulary</a>
        <a href="/hsk-1-practice-test">HSK 1 practice</a>
        <a href="/hsk-2-practice-test">HSK 2 practice</a>
        <a href="/hsk-3-vocabulary">HSK 3 vocabulary</a>
        <a href="/hsk-3-practice-test">HSK 3 practice</a>
        <a href="/hsk-4-vocabulary">HSK 4 vocabulary</a>
        <a href="/hsk-4-practice-test">HSK 4 practice</a>
        <a href="/hsk-5-vocabulary">HSK 5 vocabulary</a>
        <a href="/hsk-levels">HSK levels guide</a>
      </footer>
    </main>
  );
}
