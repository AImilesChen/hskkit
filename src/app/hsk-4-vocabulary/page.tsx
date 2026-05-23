import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HSK 4 Vocabulary Guide | HSKKit",
  description:
    "Study HSK 4 vocabulary, HSK 4 word list themes, sample Chinese words, transition challenges from HSK 3, readiness checks, and review advice.",
};

const sampleWords = [
  { chinese: "经验", pinyin: "jīngyàn", meaning: "experience" },
  { chinese: "解决", pinyin: "jiějué", meaning: "to solve; resolve" },
  { chinese: "关系", pinyin: "guānxì", meaning: "relationship; connection" },
  { chinese: "提高", pinyin: "tígāo", meaning: "to improve; raise" },
  { chinese: "选择", pinyin: "xuǎnzé", meaning: "to choose; choice" },
  { chinese: "压力", pinyin: "yālì", meaning: "pressure" },
  { chinese: "适合", pinyin: "shìhé", meaning: "to suit; suitable" },
  { chinese: "负责", pinyin: "fùzé", meaning: "to be responsible for" },
  { chinese: "坚持", pinyin: "jiānchí", meaning: "to persist; insist" },
];

const categories = [
  {
    title: "Opinions and argument",
    detail:
      "HSK 4 word lists include more language for explaining views, supporting reasons, comparing choices, and responding to problems.",
  },
  {
    title: "Work and responsibility",
    detail:
      "Learners meet more words about jobs, pressure, decisions, progress, plans, expectations, and responsibility.",
  },
  {
    title: "Social life and relationships",
    detail:
      "Vocabulary expands into relationships, communication, feelings, habits, advice, and everyday conflict or cooperation.",
  },
  {
    title: "Abstract connectors",
    detail:
      "Small linking words and abstract verbs matter more because HSK 4 reading depends on cause, contrast, condition, and result.",
  },
];

const studyTips = [
  "Group HSK 4 Chinese words by topic and function so similar words can be compared instead of memorized alone.",
  "Write short example sentences that include context, not only a word plus English meaning.",
  "Review common collocations and verb-object pairs because HSK 4 words often appear in predictable combinations.",
  "Mix HSK 3 review into each session so earlier vocabulary stays fast enough for longer reading.",
  "After practice, mark whether a missed word was unknown, confused with a similar word, or understood too slowly.",
];

const transitionChallenges = [
  {
    title: "More abstract vocabulary",
    detail:
      "HSK 4 adds words for opinions, responsibility, pressure, experience, conditions, and problem solving.",
  },
  {
    title: "Longer reading load",
    detail:
      "Sentences and passages ask learners to keep more context in mind before choosing an answer or summary.",
  },
  {
    title: "Word relationships",
    detail:
      "Knowing one meaning is not enough. Learners need to notice collocations, usage limits, and similar words.",
  },
  {
    title: "Less room for slow recall",
    detail:
      "HSK 3 words need to feel automatic enough that new HSK 4 vocabulary does not overload every sentence.",
  },
];

const readinessChecks = [
  "I can study HSK 3 vocabulary in context and use it in short reading or practice tasks.",
  "I can finish many HSK 3 practice questions without relying only on keyword matching.",
  "I can review mistakes by cause: unknown word, similar word, grammar pattern, or rushed reading.",
  "I am ready for vocabulary that is more abstract and more dependent on sentence context.",
];

export default function HSK4VocabularyPage() {
  return (
    <main className="section">
      <section>
        <p className="eyebrow">HSK 4 Vocabulary</p>
        <h1>Build an HSK 4 vocabulary plan for intermediate Chinese</h1>
        <p className="subtitle">
          HSK 4 vocabulary expands from beginner-intermediate topics into more
          abstract Chinese words for opinions, work, responsibility,
          relationships, problem solving, and longer reading. Use this guide to
          organize your HSK 4 word list after HSK 3 starts to feel manageable.
        </p>
        <div className="actions">
          <a className="button primary" href="/hsk-3-practice-test">
            Review HSK 3 practice
          </a>
          <a className="button secondary" href="/hsk-level-test">
            Check your level
          </a>
        </div>
      </section>

      <section>
        <p className="eyebrow">Purpose</p>
        <h2>What HSK 4 vocabulary is for</h2>
        <div className="grid">
          <article className="card">
            <h3>Richer expression</h3>
            <p>
              HSK 4 words help learners explain opinions, causes, decisions,
              problems, and relationships with more precision.
            </p>
          </article>
          <article className="card">
            <h3>Longer context</h3>
            <p>
              Vocabulary appears inside fuller reading and listening contexts,
              so study should include sentences and short passages.
            </p>
          </article>
          <article className="card">
            <h3>Intermediate review habits</h3>
            <p>
              At HSK 4, the best word list is not only bigger. It is organized
              by topic, usage, similarity, and mistake patterns.
            </p>
          </article>
        </div>
      </section>

      <section>
        <p className="eyebrow">Sample List</p>
        <h2>HSK 4 Chinese words to review</h2>
        <p>
          This sample is a study orientation, not a complete official
          vocabulary list. Use it to notice the more abstract and context-heavy
          feel of HSK 4 words.
        </p>
        <div className="grid">
          {sampleWords.map((word) => (
            <article className="card" key={word.chinese}>
              <p className="eyebrow">{word.pinyin}</p>
              <h3>{word.chinese}</h3>
              <p>{word.meaning}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="eyebrow">Categories</p>
        <h2>How to group an HSK 4 word list</h2>
        <div className="grid">
          {categories.map((category) => (
            <article className="card" key={category.title}>
              <h3>{category.title}</h3>
              <p>{category.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Study Tips</p>
        <h2>Make HSK 4 vocabulary easier to use</h2>
        <p>
          HSK 4 study becomes easier when words are reviewed with topic,
          sentence context, common combinations, and mistake evidence.
        </p>
        <ol>
          {studyTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ol>
      </section>

      <section>
        <p className="eyebrow">Transition</p>
        <h2>What gets harder from HSK 3 to HSK 4</h2>
        <div className="grid">
          {transitionChallenges.map((challenge) => (
            <article className="card" key={challenge.title}>
              <h3>{challenge.title}</h3>
              <p>{challenge.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Readiness</p>
        <h2>Signs you are ready for HSK 4 vocabulary</h2>
        <p>
          You do not need perfect HSK 3 performance before starting HSK 4, but
          you should be ready to learn words through context instead of only
          isolated recall.
        </p>
        <ul>
          {readinessChecks.map((check) => (
            <li key={check}>{check}</li>
          ))}
        </ul>
      </section>

      <section>
        <p className="eyebrow">Related Pages</p>
        <h2>Choose the next HSK study step</h2>
        <div className="grid">
          <article className="card">
            <h3>HSK 3 vocabulary</h3>
            <p>
              Review HSK 3 words first if longer beginner-intermediate reading
              still feels slow.
            </p>
            <a href="/hsk-3-vocabulary">Open HSK 3 vocabulary</a>
          </article>
          <article className="card">
            <h3>HSK 3 practice test</h3>
            <p>
              Use HSK 3 practice guidance to check whether your foundation is
              ready for the HSK 4 vocabulary load.
            </p>
            <a href="/hsk-3-practice-test">Open HSK 3 practice test</a>
          </article>
          <article className="card">
            <h3>HSK level test</h3>
            <p>
              Use a self-check page when you are unsure whether to review HSK 3
              or begin HSK 4 vocabulary.
            </p>
            <a href="/hsk-level-test">Open HSK level test</a>
          </article>
          <article className="card">
            <h3>New HSK 3.0 guide</h3>
            <p>
              Check newer framework context before assuming every HSK 4 word
              list or level label follows the same boundary.
            </p>
            <a href="/new-hsk-3-0">Open New HSK 3.0 guide</a>
          </article>
        </div>
      </section>

      <section className="faq">
        <p className="eyebrow">FAQ</p>
        <h2>HSK 4 vocabulary questions</h2>
        <details open>
          <summary>Is this a complete HSK 4 word list?</summary>
          <p>
            No. This is a learner-facing guide with sample words, categories,
            and study advice. Use your course or exam resource when you need a
            specific required list.
          </p>
        </details>
        <details>
          <summary>When should I start HSK 4 vocabulary?</summary>
          <p>
            Start when HSK 3 vocabulary and practice tasks are mostly
            manageable, and you are ready for more abstract words and longer
            context.
          </p>
        </details>
        <details>
          <summary>Why does HSK 4 vocabulary feel difficult?</summary>
          <p>
            HSK 4 adds more abstract meaning, similar word choices, and longer
            contexts. The challenge is learning how words behave in sentences,
            not only recognizing them alone.
          </p>
        </details>
      </section>

      <footer className="footer">
        <a href="/">Back to home</a>
        <a href="/hsk-3-vocabulary">HSK 3 vocabulary</a>
        <a href="/hsk-3-practice-test">HSK 3 practice</a>
        <a href="/hsk-level-test">HSK level test</a>
        <a href="/hsk-levels">HSK levels guide</a>
      </footer>
    </main>
  );
}
