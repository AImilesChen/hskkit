import type { Metadata } from "next";
import SiteFooter from "../site-footer";

export const metadata: Metadata = {
  title: "HSK 3 Vocabulary Guide | HSKKit",
  description:
    "Study HSK 3 vocabulary, HSK 3 word list themes, sample Chinese words, transition tips from HSK 2, readiness checks, and next steps.",
  alternates: {
    canonical: "https://hskkit.com/hsk-3-vocabulary",
  },
};

const sampleWords = [
  { chinese: "比较", pinyin: "bǐjiào", meaning: "comparatively; relatively" },
  { chinese: "重要", pinyin: "zhòngyào", meaning: "important" },
  { chinese: "影响", pinyin: "yǐngxiǎng", meaning: "to influence; effect" },
  { chinese: "机会", pinyin: "jīhuì", meaning: "opportunity" },
  { chinese: "环境", pinyin: "huánjìng", meaning: "environment" },
  { chinese: "决定", pinyin: "juédìng", meaning: "to decide; decision" },
  { chinese: "练习", pinyin: "liànxí", meaning: "to practice; exercise" },
  { chinese: "了解", pinyin: "liǎojiě", meaning: "to understand" },
  { chinese: "参加", pinyin: "cānjiā", meaning: "to participate; attend" },
];

const categories = [
  {
    title: "Study and work",
    detail:
      "Words for learning, tasks, meetings, plans, choices, and everyday responsibilities become more common at HSK 3.",
  },
  {
    title: "Opinions and reasons",
    detail:
      "Learners meet more words for explaining why something matters, comparing options, and giving simple personal views.",
  },
  {
    title: "Life situations",
    detail:
      "Vocabulary expands into travel, health, shopping, weather, time, people, places, and practical daily problems.",
  },
  {
    title: "Connecting words",
    detail:
      "Small words that connect ideas become more important because HSK 3 reading uses longer phrases and fuller sentences.",
  },
];

const studyTips = [
  "Review the HSK 3 word list in topic groups instead of trying to memorize one long alphabetical list.",
  "Write short example sentences so each word has a situation, not only an English meaning.",
  "Mix old HSK 2 words with new HSK 3 Chinese words to keep earlier vocabulary active.",
  "Mark words that look familiar but fail inside reading practice; those usually need context review.",
  "Use a short weekly loop: learn new words, read sample sentences, test recall, then review mistakes.",
];

const transitionChallenges = [
  {
    title: "More abstract meaning",
    detail:
      "HSK 3 vocabulary includes more words for decisions, influence, importance, comparison, and explanation.",
  },
  {
    title: "Longer sentence context",
    detail:
      "A word may be easy alone but harder inside a sentence with time, reason, result, and opinion details.",
  },
  {
    title: "Similar-looking choices",
    detail:
      "Practice questions may include several familiar words, so learners need careful reading instead of keyword guessing.",
  },
  {
    title: "Review load",
    detail:
      "HSK 2 words still matter. If earlier words fade, HSK 3 reading and listening become slower than expected.",
  },
];

const readinessChecks = [
  "I can answer many HSK 2 practice questions and explain why missed answers happened.",
  "I can recognize common HSK 2 words inside short sentences without translating every word.",
  "I am ready to study vocabulary by topic, example sentence, and mistake pattern.",
  "I can handle a slower first pass through longer beginner-intermediate reading material.",
];

export default function HSK3VocabularyPage() {
  return (
    <main className="section">
      <section>
        <p className="eyebrow">HSK 3 Vocabulary</p>
        <h1>Build an HSK 3 vocabulary plan for stronger Chinese reading</h1>
        <p className="subtitle">
          HSK 3 vocabulary moves beyond beginner phrases into more connected
          Chinese words for study, work, decisions, opinions, daily problems,
          and longer sentence meaning. Use this guide to organize your HSK 3
          word list and bridge the gap after HSK 2.
        </p>
        <div className="actions">
          <a className="button primary" href="/hsk-3-practice-test">
            Try HSK 3 practice
          </a>
          <a className="button secondary" href="/hsk-level-test">
            Check your level
          </a>
        </div>
      </section>

      <section>
        <p className="eyebrow">Purpose</p>
        <h2>What HSK 3 vocabulary is for</h2>
        <div className="grid">
          <article className="card">
            <h3>Connected meaning</h3>
            <p>
              HSK 3 words help you understand longer sentences where people
              explain plans, reasons, comparisons, and everyday situations.
            </p>
          </article>
          <article className="card">
            <h3>Intermediate bridge</h3>
            <p>
              This level starts to feel less like isolated beginner survival
              language and more like practical communication across topics.
            </p>
          </article>
          <article className="card">
            <h3>Better review evidence</h3>
            <p>
              The most useful HSK 3 study comes from noticing which words fail
              in context, then reviewing those words with short examples.
            </p>
          </article>
        </div>
      </section>

      <section>
        <p className="eyebrow">Sample List</p>
        <h2>HSK 3 Chinese words to review</h2>
        <p>
          This sample is not a complete official vocabulary list. Use it to see
          the kind of words that often make HSK 3 reading feel more connected
          than HSK 2.
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
        <h2>How to group an HSK 3 word list</h2>
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
        <h2>Make HSK 3 vocabulary easier to remember</h2>
        <p>
          HSK 3 vocabulary study works best when every word is tied to a topic,
          a short sentence, and a review decision after practice.
        </p>
        <ol>
          {studyTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ol>
      </section>

      <section>
        <p className="eyebrow">Transition</p>
        <h2>What gets harder from HSK 2 to HSK 3</h2>
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
        <h2>Signs you are ready for HSK 3 vocabulary</h2>
        <p>
          You do not need perfect HSK 2 performance before starting HSK 3, but
          the foundation should be strong enough that new words do not overwhelm
          every practice session.
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
            <h3>HSK 2 vocabulary</h3>
            <p>
              Review HSK 2 words first if common beginner-plus vocabulary still
              slows down reading.
            </p>
            <a href="/hsk-2-vocabulary">Open HSK 2 vocabulary</a>
          </article>
          <article className="card">
            <h3>HSK 2 practice test</h3>
            <p>
              Use HSK 2 sample test guidance to check whether you are ready to
              make HSK 3 vocabulary your main focus.
            </p>
            <a href="/hsk-2-practice-test">Open HSK 2 practice test</a>
          </article>
          <article className="card">
            <h3>HSK level test</h3>
            <p>
              Use a self-check page when you are unsure whether HSK 2 review or
              HSK 3 vocabulary should come next.
            </p>
            <a href="/hsk-level-test">Open HSK level test</a>
          </article>
          <article className="card">
            <h3>HSK 3 practice test</h3>
            <p>
              Use HSK 3 sample test guidance when you want to see whether new
              words work inside longer listening and reading tasks.
            </p>
            <a href="/hsk-3-practice-test">Open HSK 3 practice test</a>
          </article>
          <article className="card">
            <h3>HSK 4 vocabulary</h3>
            <p>
              Continue into HSK 4 words when HSK 3 vocabulary feels reliable
              inside longer reading and practice tasks.
            </p>
            <a href="/hsk-4-vocabulary">Open HSK 4 vocabulary</a>
          </article>
          <article className="card">
            <h3>New HSK 3.0 guide</h3>
            <p>
              Read the framework guide before assuming every HSK 3 resource uses
              the same level labels or word list boundaries.
            </p>
            <a href="/new-hsk-3-0">Open New HSK 3.0 guide</a>
          </article>
        </div>
      </section>

      <section className="faq">
        <p className="eyebrow">FAQ</p>
        <h2>HSK 3 vocabulary questions</h2>
        <details open>
          <summary>Is this a complete HSK 3 word list?</summary>
          <p>
            No. This is a learner-facing guide with sample words, categories,
            and study advice. Use the course or exam resource you follow when
            you need a specific required list.
          </p>
        </details>
        <details>
          <summary>When should I start HSK 3 vocabulary?</summary>
          <p>
            Start when HSK 2 words and short practice questions are mostly
            manageable, and you are ready to read longer beginner-intermediate
            sentences with more detail.
          </p>
        </details>
        <details>
          <summary>Why does HSK 3 feel harder than HSK 2?</summary>
          <p>
            HSK 3 adds more abstract words, longer context, and more connected
            meaning. The challenge is not just more vocabulary, but using words
            inside fuller sentences.
          </p>
        </details>
      </section>
      <SiteFooter />
    </main>
  );
}
