import type { Metadata } from "next";
import SiteFooter from "../site-footer";

export const metadata: Metadata = {
  title: "HSK 1 Practice Test Guide | HSKKit",
  description:
    "Prepare for beginner HSK 1 practice with sample questions, review tips, and a simple learning path for vocabulary and mistakes.",
};

const sampleQuestions = [
  {
    prompt: "Choose the closest English meaning for 你好.",
    choices: ["Goodbye", "Hello", "Thank you"],
    answer: "Hello",
    note: "Start by checking whether you recognize the whole greeting before translating character by character.",
  },
  {
    prompt: "Which sentence matches the meaning: I am a student?",
    choices: ["我是学生。", "你好吗？", "今天很热。"],
    answer: "我是学生。",
    note: "Watch for familiar pronouns and the simple sentence pattern around 是.",
  },
  {
    prompt: "In 不喝水, what does 不 tell you?",
    choices: ["A question", "A negative meaning", "A time meaning"],
    answer: "A negative meaning",
    note: "Small function words can change the meaning of an otherwise familiar phrase.",
  },
];

const preparationTips = [
  "Review beginner vocabulary in short rounds before you expect fast recognition in questions.",
  "Read every option carefully. A familiar character in the wrong sentence can still lead to a missed answer.",
  "Keep a simple mistake note: missed word, misunderstood pattern, or rushed reading.",
  "Return to practice after review so the same weak point is tested in context again.",
];

const learningPath = [
  {
    step: "Learn vocabulary",
    detail:
      "Build recognition of common beginner words, their pinyin, and their everyday meanings.",
    href: "/hsk-1-vocabulary",
    label: "Open HSK 1 vocabulary",
  },
  {
    step: "Try practice questions",
    detail:
      "Use small question sets to see whether vocabulary and simple sentence patterns stay clear in context.",
  },
  {
    step: "Review mistakes",
    detail:
      "Separate words you did not know from answers you missed because you read too quickly or confused a pattern.",
  },
  {
    step: "Take a level test",
    detail:
      "Use a broader level check when you want a practical next-step recommendation beyond one HSK 1 page.",
    href: "/hsk-level-test",
    label: "Open HSK level test",
  },
];

export default function HSK1PracticeTestPage() {
  return (
    <main className="section">
      <section>
        <p className="eyebrow">HSK 1 Practice Test</p>
        <h1>Practice HSK 1 questions with a beginner plan</h1>
        <p className="subtitle">
          HSK 1 practice helps turn beginner vocabulary into decisions you can
          make inside short prompts. Start small, notice what you miss, and use
          each question to choose the next review step.
        </p>
        <div className="actions">
          <a className="button primary" href="/hsk-1-vocabulary">
            Review HSK 1 vocabulary
          </a>
          <a className="button secondary" href="/hsk-level-test">
            Take a level test
          </a>
        </div>
      </section>

      <section>
        <p className="eyebrow">Purpose</p>
        <h2>What HSK 1 practice helps with</h2>
        <div className="grid">
          <article className="card">
            <h3>Recall under context</h3>
            <p>
              Questions show whether a word still feels familiar when it appears
              inside a phrase, sentence, or answer choice.
            </p>
          </article>
          <article className="card">
            <h3>Reading attention</h3>
            <p>
              Beginner mistakes often come from missing a small word, confusing
              a similar option, or reading faster than comprehension allows.
            </p>
          </article>
          <article className="card">
            <h3>Review direction</h3>
            <p>
              A missed question can point back to vocabulary, a sentence pattern,
              or the need for calmer test habits.
            </p>
          </article>
        </div>
      </section>

      <section>
        <p className="eyebrow">Sample Questions</p>
        <h2>A small beginner practice set</h2>
        <p>
          These examples are for study guidance. Try each prompt first, then
          compare your choice with the answer and review note.
        </p>
        <div className="grid">
          {sampleQuestions.map((question) => (
            <article className="card" key={question.prompt}>
              <h3>{question.prompt}</h3>
              <ol>
                {question.choices.map((choice) => (
                  <li key={choice}>{choice}</li>
                ))}
              </ol>
              <p className="note">
                Answer: {question.answer}. {question.note}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Preparation Tips</p>
        <h2>Prepare without overcomplicating the first test</h2>
        <p>
          Early practice is most useful when it stays repeatable. Use short
          rounds, check the reason for each miss, and return to the material
          after a focused review.
        </p>
        <ol>
          {preparationTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ol>
      </section>

      <section>
        <p className="eyebrow">Learning Path</p>
        <h2>A simple HSK 1 study loop</h2>
        <div className="grid">
          {learningPath.map((item) => (
            <article className="card" key={item.step}>
              <h3>{item.step}</h3>
              <p>{item.detail}</p>
              {item.href ? <a href={item.href}>{item.label}</a> : null}
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="eyebrow">Related Pages</p>
        <h2>Continue with the right guide</h2>
        <div className="grid">
          <article className="card">
            <h3>HSK 1 vocabulary</h3>
            <p>
              Review words first when questions feel difficult because the core
              meanings are not familiar yet.
            </p>
            <a href="/hsk-1-vocabulary">Open vocabulary guide</a>
          </article>
          <article className="card">
            <h3>HSK level test</h3>
            <p>
              Use a level check when you want a broader starting point or a next
              step after beginner practice.
            </p>
            <a href="/hsk-level-test">Open level test</a>
          </article>
          <article className="card">
            <h3>HSK levels guide</h3>
            <p>
              Compare the wider level path so HSK 1 practice fits into a longer
              study plan.
            </p>
            <a href="/hsk-levels">Open levels guide</a>
          </article>
          <article className="card">
            <h3>New HSK 3.0 guide</h3>
            <p>
              Read the separate guide for newer HSK framework context instead of
              assuming every resource uses identical labels.
            </p>
            <a href="/new-hsk-3-0">Open New HSK 3.0 guide</a>
          </article>
        </div>
      </section>

      <section className="faq">
        <p className="eyebrow">FAQ</p>
        <h2>HSK 1 practice questions</h2>
        <details open>
          <summary>Should I practice before I know all beginner words?</summary>
          <p>
            Yes. A small vocabulary base is enough to begin short practice.
            Questions help show which words need another review pass.
          </p>
        </details>
        <details>
          <summary>What should I do after a wrong answer?</summary>
          <p>
            Identify the cause first. Review a missing word, revisit a sentence
            pattern, or slow down if the problem was rushed reading.
          </p>
        </details>
        <details>
          <summary>Does this page define the official test format?</summary>
          <p>
            No. This is a beginner study guide with sample practice prompts.
            Check the exam resource you are using when you need current format
            details.
          </p>
        </details>
      </section>
      <SiteFooter />
    </main>
  );
}
