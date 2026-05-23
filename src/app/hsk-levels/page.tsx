import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HSK Levels Explained | HSKKit",
  description:
    "Compare HSK 1 to HSK 6 and find a practical beginner path for Chinese vocabulary, practice tests, and level checking.",
};

const levels = [
  {
    level: "HSK 1",
    stage: "First steps",
    overview:
      "A starting point for learners building recognition of essential words, short phrases, and very simple everyday exchanges.",
    practice:
      "Focus on pronunciation, pinyin support, basic characters, and quick recall of beginner vocabulary.",
  },
  {
    level: "HSK 2",
    stage: "Early routine",
    overview:
      "Extends beginner study into more familiar daily situations and a wider set of sentence patterns.",
    practice:
      "Review common question forms, time and quantity expressions, and short listening or reading tasks.",
  },
  {
    level: "HSK 3",
    stage: "Developing independence",
    overview:
      "Moves beyond survival phrases toward handling a broader range of personal, study, travel, and daily-life topics.",
    practice:
      "Strengthen grammar control, read longer passages carefully, and notice gaps that slow comprehension.",
  },
  {
    level: "HSK 4",
    stage: "Broader communication",
    overview:
      "Represents a more capable intermediate stage with more connected language and less reliance on isolated phrases.",
    practice:
      "Work on speed, context clues, longer answers, and vocabulary review across related topics.",
  },
  {
    level: "HSK 5",
    stage: "Advanced study",
    overview:
      "Requires comfort with richer vocabulary, denser reading, and more sustained understanding across topics.",
    practice:
      "Use longer texts and audio to test comprehension, then review unfamiliar words in context.",
  },
  {
    level: "HSK 6",
    stage: "High proficiency",
    overview:
      "Targets learners working with complex language, nuanced meaning, and demanding comprehension tasks.",
    practice:
      "Prioritize accuracy under pressure, careful reading, and active review of weak areas.",
  },
];

const beginnerSteps = [
  "Start with HSK 1 vocabulary until the most common beginner words feel familiar in both sound and meaning.",
  "Use short practice sessions to connect pinyin, characters, and English meaning instead of memorizing one layer alone.",
  "Take a level check when you need a rough starting point, then use practice results to choose what to review next.",
  "Move into HSK 1 practice questions early so vocabulary review supports real reading and test-style decisions.",
];

export default function HSKLevelsPage() {
  return (
    <main className="section">
      <section>
        <p className="eyebrow">HSK Levels Guide</p>
        <h1>HSK levels explained for Chinese learners</h1>
        <p className="subtitle">
          HSK levels help organize Chinese study from beginner foundations to
          advanced comprehension. Use them as a practical map: check your
          starting point, build vocabulary and reading habits, and review the
          skills your next level expects.
        </p>
        <div className="actions">
          <a className="button primary" href="/hsk-level-test">
            Try the HSK level test
          </a>
          <a className="button secondary" href="/hsk-1-vocabulary">
            Study HSK 1 vocabulary
          </a>
        </div>
      </section>

      <section>
        <p className="eyebrow">Overview</p>
        <h2>How to use HSK levels</h2>
        <div className="grid">
          <article className="card">
            <h3>Choose a starting point</h3>
            <p>
              A level label is most useful when it tells you what to practice
              next. Beginners can begin with HSK 1 material and adjust after a
              level check or practice session.
            </p>
          </article>
          <article className="card">
            <h3>Build connected skills</h3>
            <p>
              Vocabulary, characters, listening, reading, grammar, and recall
              support one another. A learner can know some words and still need
              more practice using them in context.
            </p>
          </article>
          <article className="card">
            <h3>Review by evidence</h3>
            <p>
              Practice results are more useful than guessing. Missed words,
              slow comprehension, and repeated grammar confusion show where a
              short review session can help.
            </p>
          </article>
        </div>
      </section>

      <section>
        <p className="eyebrow">Comparison</p>
        <h2>HSK 1 to HSK 6 at a glance</h2>
        <div className="grid">
          {levels.map((item) => (
            <article className="card" key={item.level}>
              <p className="eyebrow">{item.stage}</p>
              <h3>{item.level}</h3>
              <p>{item.overview}</p>
              <p className="note">{item.practice}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Beginner Path</p>
        <h2>A simple path for a new learner</h2>
        <p>
          If you are new to HSK study, keep the first loop small. Learn a
          manageable set of words, test recognition, answer beginner practice
          questions, and repeat the parts that still feel slow.
        </p>
        <ol>
          {beginnerSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section>
        <p className="eyebrow">Related Pages</p>
        <h2>Continue with a focused page</h2>
        <div className="grid">
          <article className="card">
            <h3>Check your level</h3>
            <p>
              Use a level test page when you want a starting recommendation
              before choosing study material.
            </p>
            <a href="/hsk-level-test">Open HSK level test</a>
          </article>
          <article className="card">
            <h3>Practice HSK 1</h3>
            <p>
              Work through beginner-style questions and see which topics need
              review after a practice attempt.
            </p>
            <a href="/hsk-1-practice-test">Open HSK 1 practice test</a>
          </article>
          <article className="card">
            <h3>Review vocabulary</h3>
            <p>
              Start with HSK 1 words when your foundation needs clearer recall
              before longer practice.
            </p>
            <a href="/hsk-1-vocabulary">Open HSK 1 vocabulary</a>
          </article>
          <article className="card">
            <h3>Grow into HSK 2</h3>
            <p>
              Move into beginner-plus vocabulary when HSK 1 words feel familiar
              and short phrases are easier to follow.
            </p>
            <a href="/hsk-2-vocabulary">Open HSK 2 vocabulary</a>
          </article>
          <article className="card">
            <h3>Practice HSK 2</h3>
            <p>
              Use a practice test guide when you want HSK 2 mock test structure,
              sample-test methods, and mistake review advice.
            </p>
            <a href="/hsk-2-practice-test">Open HSK 2 practice test</a>
          </article>
          <article className="card">
            <h3>Build HSK 3 vocabulary</h3>
            <p>
              Start HSK 3 words when HSK 2 practice is manageable and longer
              beginner-intermediate sentences need clearer vocabulary.
            </p>
            <a href="/hsk-3-vocabulary">Open HSK 3 vocabulary</a>
          </article>
          <article className="card">
            <h3>Practice HSK 3</h3>
            <p>
              Try HSK 3 mock test guidance when vocabulary, reading, and
              listening need a more realistic practice check.
            </p>
            <a href="/hsk-3-practice-test">Open HSK 3 practice test</a>
          </article>
          <article className="card">
            <h3>Build HSK 4 vocabulary</h3>
            <p>
              Move into HSK 4 words when HSK 3 practice feels manageable and
              intermediate reading needs broader vocabulary.
            </p>
            <a href="/hsk-4-vocabulary">Open HSK 4 vocabulary</a>
          </article>
          <article className="card">
            <h3>Read about HSK 3.0</h3>
            <p>
              For newer HSK framework questions and transition context, use the
              dedicated guide instead of assuming every resource uses the same
              level structure.
            </p>
            <a href="/new-hsk-3-0">Open New HSK 3.0 guide</a>
          </article>
        </div>
      </section>

      <section className="faq">
        <p className="eyebrow">FAQ</p>
        <h2>Common HSK level questions</h2>
        <details open>
          <summary>Which HSK level should a beginner start with?</summary>
          <p>
            HSK 1 is a sensible starting point for a new learner. If you have
            already studied Chinese, a level check and a short practice session
            can help you avoid reviewing material that is too easy.
          </p>
        </details>
        <details>
          <summary>Does one HSK level describe every Chinese skill?</summary>
          <p>
            Not perfectly. Learners often progress unevenly across vocabulary,
            listening, reading, character recognition, and test familiarity.
            Use the level as a guide and let practice results shape review.
          </p>
        </details>
        <details>
          <summary>Should I study HSK 3.0 separately?</summary>
          <p>
            Check the resource you are using and the exam or study goal you
            care about. For HSKKit context, start with the{" "}
            <a href="/new-hsk-3-0">New HSK 3.0 guide</a> before making strong
            assumptions about newer level references.
          </p>
        </details>
      </section>

      <footer className="footer">
        <a href="/">Back to home</a>
        <a href="/hsk-level-test">HSK level test</a>
        <a href="/hsk-1-practice-test">HSK 1 practice test</a>
        <a href="/hsk-1-vocabulary">HSK 1 vocabulary</a>
      </footer>
    </main>
  );
}
