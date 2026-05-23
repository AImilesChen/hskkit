import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HSK 2 Vocabulary Guide | HSKKit",
  description:
    "Review HSK 2 vocabulary themes, sample beginner-plus Chinese words, study tips, and practical next steps after HSK 1.",
};

const sampleWords = [
  { chinese: "时间", pinyin: "shíjiān", meaning: "time" },
  { chinese: "问题", pinyin: "wèntí", meaning: "question; problem" },
  { chinese: "学习", pinyin: "xuéxí", meaning: "to study; learning" },
  { chinese: "工作", pinyin: "gōngzuò", meaning: "work; job" },
  { chinese: "喜欢", pinyin: "xǐhuan", meaning: "to like" },
  { chinese: "准备", pinyin: "zhǔnbèi", meaning: "to prepare" },
  { chinese: "一起", pinyin: "yìqǐ", meaning: "together" },
  { chinese: "已经", pinyin: "yǐjīng", meaning: "already" },
  { chinese: "因为", pinyin: "yīnwèi", meaning: "because" },
];

const studyMoves = [
  "Group words by daily situations such as school, work, time, food, travel, and simple opinions.",
  "Practice short sentence patterns so new words connect to meaning instead of staying isolated.",
  "Review HSK 1 words that still feel slow before adding too many HSK 2 words at once.",
  "Use mistakes from practice questions to decide which words deserve another focused review round.",
];

const readinessSigns = [
  {
    title: "HSK 1 feels familiar",
    detail:
      "You can recognize common beginner words and simple sentence patterns without stopping at every character.",
  },
  {
    title: "Longer phrases are manageable",
    detail:
      "You can follow short combinations such as time plus action, person plus preference, or reason plus result.",
  },
  {
    title: "Mistakes have patterns",
    detail:
      "You can tell whether a missed answer came from a new word, a grammar pattern, or reading too quickly.",
  },
];

export default function HSK2VocabularyPage() {
  return (
    <main className="section">
      <section>
        <p className="eyebrow">HSK 2 Vocabulary</p>
        <h1>Grow your HSK 2 vocabulary after the beginner foundation</h1>
        <p className="subtitle">
          HSK 2 vocabulary helps learners move from isolated beginner words
          toward more useful daily phrases, simple opinions, time expressions,
          and short explanations. Use this guide as a practical bridge after
          HSK 1 review.
        </p>
        <div className="actions">
          <a className="button primary" href="/hsk-1-practice-test">
            Review HSK 1 practice
          </a>
          <a className="button secondary" href="/hsk-level-test">
            Check your level
          </a>
        </div>
      </section>

      <section>
        <p className="eyebrow">Purpose</p>
        <h2>What HSK 2 vocabulary adds</h2>
        <div className="grid">
          <article className="card">
            <h3>More daily topics</h3>
            <p>
              HSK 2 study expands the beginner base into school, work, family,
              shopping, time, plans, and simple personal preferences.
            </p>
          </article>
          <article className="card">
            <h3>Longer recognition</h3>
            <p>
              New words often appear inside slightly longer phrases, so review
              should include short sentence practice instead of only flashcards.
            </p>
          </article>
          <article className="card">
            <h3>Better review choices</h3>
            <p>
              When HSK 2 feels hard, the answer is not always more words. Some
              learners need stronger HSK 1 recall or calmer reading habits.
            </p>
          </article>
        </div>
      </section>

      <section>
        <p className="eyebrow">Sample List</p>
        <h2>Beginner-plus words to review</h2>
        <p>
          This sample is for study orientation. Read the Chinese first, check
          the pinyin, then cover the English meaning and test recall in a short
          phrase.
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

      <section className="card">
        <p className="eyebrow">Study Moves</p>
        <h2>Make HSK 2 vocabulary easier to keep</h2>
        <p>
          HSK 2 words become more useful when you connect them to a topic, a
          sentence pattern, and a real review decision. Keep the loop small
          enough to repeat.
        </p>
        <ol>
          {studyMoves.map((move) => (
            <li key={move}>{move}</li>
          ))}
        </ol>
      </section>

      <section>
        <p className="eyebrow">Readiness</p>
        <h2>Signs you are ready to add HSK 2 words</h2>
        <div className="grid">
          {readinessSigns.map((sign) => (
            <article className="card" key={sign.title}>
              <h3>{sign.title}</h3>
              <p>{sign.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="eyebrow">Related Pages</p>
        <h2>Keep the study path connected</h2>
        <div className="grid">
          <article className="card">
            <h3>HSK 1 vocabulary</h3>
            <p>
              Return to HSK 1 words when the beginner base still slows down
              reading or practice questions.
            </p>
            <a href="/hsk-1-vocabulary">Open HSK 1 vocabulary</a>
          </article>
          <article className="card">
            <h3>HSK level test</h3>
            <p>
              Use a self-check guide when you are unsure whether to review HSK
              1 or continue into HSK 2 material.
            </p>
            <a href="/hsk-level-test">Open HSK level test</a>
          </article>
          <article className="card">
            <h3>HSK levels guide</h3>
            <p>
              Compare HSK levels when you want to see how HSK 2 fits into the
              wider Chinese learning path.
            </p>
            <a href="/hsk-levels">Open HSK levels guide</a>
          </article>
          <article className="card">
            <h3>New HSK 3.0 guide</h3>
            <p>
              Check newer HSK framework context before assuming every resource
              uses the same vocabulary labels.
            </p>
            <a href="/new-hsk-3-0">Open New HSK 3.0 guide</a>
          </article>
        </div>
      </section>

      <section className="faq">
        <p className="eyebrow">FAQ</p>
        <h2>HSK 2 vocabulary questions</h2>
        <details open>
          <summary>When should I start HSK 2 vocabulary?</summary>
          <p>
            Start when common HSK 1 words and simple sentence patterns feel
            familiar enough that you can read short prompts without stopping at
            every word.
          </p>
        </details>
        <details>
          <summary>Should I memorize HSK 2 words as a raw list?</summary>
          <p>
            A list is useful for coverage, but retention improves when each word
            is reviewed in a short phrase, topic group, or practice question.
          </p>
        </details>
        <details>
          <summary>Does this page replace an official vocabulary list?</summary>
          <p>
            No. It is a learner-facing study guide with sample words and review
            advice. Check the course or exam resource you use when you need a
            specific required list.
          </p>
        </details>
      </section>

      <footer className="footer">
        <a href="/">Back to home</a>
        <a href="/hsk-1-vocabulary">HSK 1 vocabulary</a>
        <a href="/hsk-level-test">HSK level test</a>
        <a href="/hsk-levels">HSK levels guide</a>
      </footer>
    </main>
  );
}
