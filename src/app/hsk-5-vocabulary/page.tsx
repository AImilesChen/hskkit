import type { Metadata } from "next";
import SiteFooter from "../site-footer";

export const metadata: Metadata = {
  title: "HSK 5 Vocabulary Guide | HSKKit",
  description:
    "Study HSK 5 vocabulary, HSK 5 word list themes, advanced Chinese words, transition challenges from HSK 4, readiness checks, and review advice.",
};

const sampleWords = [
  { chinese: "观点", pinyin: "guāndiǎn", meaning: "viewpoint; opinion" },
  { chinese: "现象", pinyin: "xiànxiàng", meaning: "phenomenon" },
  { chinese: "效率", pinyin: "xiàolǜ", meaning: "efficiency" },
  { chinese: "承担", pinyin: "chéngdān", meaning: "to undertake; bear" },
  { chinese: "促进", pinyin: "cùjìn", meaning: "to promote; advance" },
  { chinese: "明显", pinyin: "míngxiǎn", meaning: "obvious; clear" },
  { chinese: "资源", pinyin: "zīyuán", meaning: "resources" },
  { chinese: "态度", pinyin: "tàidu", meaning: "attitude" },
  { chinese: "复杂", pinyin: "fùzá", meaning: "complex" },
];

const categories = [
  {
    title: "Ideas and viewpoints",
    detail:
      "HSK 5 word lists include more vocabulary for opinions, analysis, arguments, evidence, and social observations.",
  },
  {
    title: "Work and society",
    detail:
      "Learners meet more words about careers, resources, efficiency, responsibility, development, and public topics.",
  },
  {
    title: "Emotion and attitude",
    detail:
      "Vocabulary expands into attitude, confidence, pressure, conflict, expectation, and more nuanced personal response.",
  },
  {
    title: "Abstract verbs and nouns",
    detail:
      "HSK 5 Chinese words often carry abstract meaning, so context and collocation become essential parts of review.",
  },
];

const studyTips = [
  "Study HSK 5 vocabulary with short reading passages so new words are tied to argument, tone, and context.",
  "Compare similar words directly and write a simple example for each one to avoid vague recognition.",
  "Review collocations and common sentence frames because advanced words often appear in repeated patterns.",
  "Keep HSK 4 vocabulary active with mixed review so older words remain fast during longer reading.",
  "After practice, record whether a missed word was unknown, misunderstood in context, or confused with a similar word.",
];

const transitionChallenges = [
  {
    title: "More abstract topics",
    detail:
      "HSK 5 vocabulary often appears in texts about opinions, society, work, education, habits, and complex situations.",
  },
  {
    title: "Longer passage context",
    detail:
      "Words are easier to misunderstand when the answer depends on the main idea, writer attitude, or paragraph logic.",
  },
  {
    title: "Similar-word pressure",
    detail:
      "Learners need to compare near-synonyms and usage patterns instead of treating English meanings as exact matches.",
  },
  {
    title: "Higher review volume",
    detail:
      "HSK 4 words must remain quick enough that the larger HSK 5 word list does not make every passage feel overloaded.",
  },
];

const readinessChecks = [
  "I can review HSK 4 vocabulary through sentences and short passages, not only isolated cards.",
  "I can handle many HSK 4 practice questions and explain whether mistakes come from vocabulary, logic, or pacing.",
  "I am ready to compare similar words and track usage, not just memorize English translations.",
  "I can read longer material slowly and still identify the main idea, detail, and attitude.",
];

export default function HSK5VocabularyPage() {
  return (
    <main className="section">
      <section>
        <p className="eyebrow">HSK 5 Vocabulary</p>
        <h1>Build an HSK 5 vocabulary plan for advanced Chinese reading</h1>
        <p className="subtitle">
          HSK 5 vocabulary expands into advanced Chinese words for viewpoints,
          society, work, resources, attitudes, complex situations, and longer
          reading. Use this guide to organize your HSK 5 word list after HSK 4
          material starts to feel manageable.
        </p>
        <div className="actions">
          <a className="button primary" href="/hsk-4-practice-test">
            Review HSK 4 practice
          </a>
          <a className="button secondary" href="/hsk-level-test">
            Check your level
          </a>
        </div>
      </section>

      <section>
        <p className="eyebrow">Purpose</p>
        <h2>What HSK 5 vocabulary is for</h2>
        <div className="grid">
          <article className="card">
            <h3>Advanced reading</h3>
            <p>
              HSK 5 words support longer reading where meaning depends on main
              idea, detail, writer attitude, and paragraph connection.
            </p>
          </article>
          <article className="card">
            <h3>More abstract expression</h3>
            <p>
              Vocabulary shifts toward ideas, viewpoints, social topics,
              responsibility, development, and more nuanced explanation.
            </p>
          </article>
          <article className="card">
            <h3>Sharper word choice</h3>
            <p>
              At HSK 5, learners need to notice usage, collocation, register,
              and similar words instead of relying on one English meaning.
            </p>
          </article>
        </div>
      </section>

      <section>
        <p className="eyebrow">Sample List</p>
        <h2>HSK 5 Chinese words to review</h2>
        <p>
          This sample is a study orientation, not a complete official
          vocabulary list. Use it to notice the abstract and passage-dependent
          feel of HSK 5 words.
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
        <h2>How to group an HSK 5 word list</h2>
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
        <h2>Make HSK 5 vocabulary easier to use</h2>
        <p>
          HSK 5 vocabulary study works best when words are reviewed through
          topic, collocation, passage context, and repeated mistake patterns.
        </p>
        <ol>
          {studyTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ol>
      </section>

      <section>
        <p className="eyebrow">Transition</p>
        <h2>What gets harder from HSK 4 to HSK 5</h2>
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
        <h2>Signs you are ready for HSK 5 vocabulary</h2>
        <p>
          You do not need perfect HSK 4 performance before starting HSK 5, but
          you should be ready for more abstract vocabulary and passage-level
          review.
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
            <h3>HSK 4 vocabulary</h3>
            <p>
              Review HSK 4 words first if intermediate reading still feels slow
              or similar words are hard to separate.
            </p>
            <a href="/hsk-4-vocabulary">Open HSK 4 vocabulary</a>
          </article>
          <article className="card">
            <h3>HSK 4 practice test</h3>
            <p>
              Use HSK 4 practice guidance to check whether your foundation is
              ready for the HSK 5 vocabulary load.
            </p>
            <a href="/hsk-4-practice-test">Open HSK 4 practice test</a>
          </article>
          <article className="card">
            <h3>HSK level test</h3>
            <p>
              Use a self-check page when you are unsure whether to review HSK 4
              or begin HSK 5 vocabulary.
            </p>
            <a href="/hsk-level-test">Open HSK level test</a>
          </article>
          <article className="card">
            <h3>New HSK 3.0 guide</h3>
            <p>
              Check newer framework context before assuming every HSK 5 word
              list or level label follows the same boundary.
            </p>
            <a href="/new-hsk-3-0">Open New HSK 3.0 guide</a>
          </article>
        </div>
      </section>

      <section className="faq">
        <p className="eyebrow">FAQ</p>
        <h2>HSK 5 vocabulary questions</h2>
        <details open>
          <summary>Is this a complete HSK 5 word list?</summary>
          <p>
            No. This is a learner-facing guide with sample words, categories,
            and study advice. Use your course or exam resource when you need a
            specific required list.
          </p>
        </details>
        <details>
          <summary>When should I start HSK 5 vocabulary?</summary>
          <p>
            Start when HSK 4 vocabulary and practice tasks are mostly
            manageable, and you are ready for more abstract words, longer
            passages, and similar-word review.
          </p>
        </details>
        <details>
          <summary>Why does HSK 5 vocabulary feel difficult?</summary>
          <p>
            HSK 5 words are often abstract, context-dependent, and close to
            other words in meaning. The challenge is using them accurately in
            passages, not only recognizing them alone.
          </p>
        </details>
      </section>
      <SiteFooter />
    </main>
  );
}
