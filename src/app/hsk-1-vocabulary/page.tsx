import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HSK 1 Vocabulary Guide | HSKKit",
  description:
    "Learn what HSK 1 vocabulary supports, review beginner Chinese sample words with pinyin and English meanings, and plan your next practice step.",
};

const sampleWords = [
  { chinese: "我", pinyin: "wǒ", meaning: "I; me" },
  { chinese: "你", pinyin: "nǐ", meaning: "you" },
  { chinese: "好", pinyin: "hǎo", meaning: "good; well" },
  { chinese: "是", pinyin: "shì", meaning: "to be" },
  { chinese: "不", pinyin: "bù", meaning: "not; no" },
  { chinese: "有", pinyin: "yǒu", meaning: "to have; there is" },
  { chinese: "人", pinyin: "rén", meaning: "person; people" },
  { chinese: "水", pinyin: "shuǐ", meaning: "water" },
  { chinese: "今天", pinyin: "jīntiān", meaning: "today" },
];

const studyTips = [
  "Learn the sound, meaning, and character shape together so each word has more than one memory hook.",
  "Say short combinations aloud, such as pronoun plus verb or time word plus activity, before moving to longer sentences.",
  "Review words you hesitate on more often than words you recognize immediately.",
  "Use practice questions early. Vocabulary becomes more useful when you meet it inside a reading or test-style prompt.",
];

export default function HSK1VocabularyPage() {
  return (
    <main className="section">
      <section>
        <p className="eyebrow">HSK 1 Vocabulary</p>
        <h1>Build a clear HSK 1 vocabulary foundation</h1>
        <p className="subtitle">
          HSK 1 vocabulary gives beginners a compact place to start with common
          Chinese words, pinyin, and everyday meanings. Use it to make early
          practice less scattered before you move into longer reading and
          practice-test tasks.
        </p>
        <div className="actions">
          <a className="button primary" href="/hsk-1-practice-test">
            Try HSK 1 practice
          </a>
          <a className="button secondary" href="/hsk-level-test">
            Check your level
          </a>
        </div>
      </section>

      <section>
        <p className="eyebrow">Purpose</p>
        <h2>What HSK 1 vocabulary is for</h2>
        <div className="grid">
          <article className="card">
            <h3>Starting recognition</h3>
            <p>
              Beginner vocabulary helps you recognize frequent building blocks
              before every sentence feels unfamiliar.
            </p>
          </article>
          <article className="card">
            <h3>Pronunciation practice</h3>
            <p>
              Pinyin support helps new learners connect what they see with what
              they hear and say while tones and sounds are still settling in.
            </p>
          </article>
          <article className="card">
            <h3>Useful context</h3>
            <p>
              Words become stronger study material when you notice how they
              combine in greetings, simple statements, questions, and daily
              topics.
            </p>
          </article>
        </div>
      </section>

      <section>
        <p className="eyebrow">Sample List</p>
        <h2>Beginner words to review</h2>
        <p>
          This short sample is a study starting point. Read each character,
          check the pinyin, then cover the English meaning and test recall.
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
        <p className="eyebrow">Study Tips</p>
        <h2>Keep beginner vocabulary practice active</h2>
        <p>
          A word list is a reference, not the whole study session. Keep review
          short enough to repeat and pair it with simple practice that checks
          whether you can recognize meaning in context.
        </p>
        <ol>
          {studyTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ol>
      </section>

      <section>
        <p className="eyebrow">Related Pages</p>
        <h2>Choose your next HSK step</h2>
        <div className="grid">
          <article className="card">
            <h3>HSK level test</h3>
            <p>
              Use the level test page when you want a practical starting point
              before choosing more beginner or higher-level material.
            </p>
            <a href="/hsk-level-test">Open HSK level test</a>
          </article>
          <article className="card">
            <h3>HSK 1 practice test</h3>
            <p>
              Move from isolated words into beginner questions and review what
              slows you down.
            </p>
            <a href="/hsk-1-practice-test">Open HSK 1 practice test</a>
          </article>
          <article className="card">
            <h3>HSK levels guide</h3>
            <p>
              Compare the level path when you want vocabulary study to fit into
              a wider Chinese learning plan.
            </p>
            <a href="/hsk-levels">Open HSK levels guide</a>
          </article>
          <article className="card">
            <h3>New HSK 3.0 guide</h3>
            <p>
              Read the dedicated guide before making assumptions about newer
              HSK framework references.
            </p>
            <a href="/new-hsk-3-0">Open New HSK 3.0 guide</a>
          </article>
        </div>
      </section>

      <section className="faq">
        <p className="eyebrow">FAQ</p>
        <h2>HSK 1 vocabulary questions</h2>
        <details open>
          <summary>Should I memorize English meanings first?</summary>
          <p>
            English meaning is useful for orientation, but beginner review is
            stronger when you also connect the character and pinyin to the word
            you want to recognize in Chinese.
          </p>
        </details>
        <details>
          <summary>Do I need to know every word before I practice?</summary>
          <p>
            No. A small vocabulary base and a short practice task can work
            together. Practice shows which words need another pass.
          </p>
        </details>
        <details>
          <summary>Does one vocabulary page cover every HSK version?</summary>
          <p>
            Vocabulary references can vary with the resource and framework you
            are using. For newer HSK context, continue to the{" "}
            <a href="/new-hsk-3-0">New HSK 3.0 guide</a>.
          </p>
        </details>
      </section>

      <footer className="footer">
        <a href="/">Back to home</a>
        <a href="/hsk-level-test">HSK level test</a>
        <a href="/hsk-1-practice-test">HSK 1 practice test</a>
        <a href="/hsk-levels">HSK levels guide</a>
      </footer>
    </main>
  );
}
