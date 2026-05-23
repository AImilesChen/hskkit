import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New HSK 3.0 Guide | HSKKit",
  description:
    "Understand the New HSK 3.0 discussion conservatively, compare beginner study planning, and choose practical HSK next steps.",
};

const planningComparison = [
  {
    topic: "Level labels",
    earlierPlanning:
      "Many learner resources organize study around the familiar HSK 1 to HSK 6 path.",
    newerDiscussion:
      "New HSK 3.0 discussion often refers to a newer proficiency framework with a wider level structure.",
  },
  {
    topic: "Beginner action",
    earlierPlanning:
      "A beginner can start with HSK 1 basics, common words, and short practice questions.",
    newerDiscussion:
      "Newer labels do not remove the need for pronunciation, vocabulary, reading attention, and steady review.",
  },
  {
    topic: "Study decisions",
    earlierPlanning:
      "Learners compare the resource they use with their course, exam goal, and current confidence.",
    newerDiscussion:
      "Learners should check the timeline and requirements that apply to their school, test center, or exam provider.",
  },
];

const beginnerGuidance = [
  "Start with HSK 1 basics if you are still building your first Chinese words and short sentence recognition.",
  "Use vocabulary review to connect characters, pinyin, sound, and English meaning before harder practice.",
  "Try practice questions early so labels turn into real evidence about what you can recognize in context.",
  "Read a level guide when you need a wider plan, then verify exam-specific requirements with the source that matters for your goal.",
];

const avoidList = [
  "Assuming every school or test center uses the same rollout timeline.",
  "Over-optimizing for level labels before building pronunciation, vocabulary, and practice habits.",
  "Treating this page as official policy or a replacement for exam-provider guidance.",
];

export default function NewHSK30Page() {
  return (
    <main className="section">
      <section>
        <p className="eyebrow">New HSK 3.0 Guide</p>
        <h1>New HSK 3.0 context for practical Chinese study</h1>
        <p className="subtitle">
          Learners often meet the phrase New HSK 3.0 while comparing HSK
          resources, level charts, and exam plans. Use this page as a cautious
          orientation guide, then check the school, test center, or official exam
          provider that applies to your goal.
        </p>
        <div className="actions">
          <a className="button primary" href="/hsk-levels">
            Read HSK levels guide
          </a>
          <a className="button secondary" href="/hsk-1-vocabulary">
            Start HSK 1 vocabulary
          </a>
        </div>
      </section>

      <section>
        <p className="eyebrow">Meaning</p>
        <h2>What people usually mean by New HSK 3.0</h2>
        <div className="grid">
          <article className="card">
            <h3>Newer framework discussion</h3>
            <p>
              The phrase usually points to newer HSK-related proficiency
              standards and level discussion beyond the older six-level study
              shorthand many learners already know.
            </p>
          </article>
          <article className="card">
            <h3>Resource comparison</h3>
            <p>
              It often appears when learners compare vocabulary lists, courses,
              level charts, and exam preparation resources that may not use the
              same labels.
            </p>
          </article>
          <article className="card">
            <h3>Verification still matters</h3>
            <p>
              A discussion label is not a personal exam notice. Confirm the
              requirements and timing that matter for your own study or test
              path.
            </p>
          </article>
        </div>
      </section>

      <section>
        <p className="eyebrow">Comparison</p>
        <h2>Old HSK 1 to 6 planning and newer discussion</h2>
        <p>
          For beginners, the safest comparison is about planning habits rather
          than guessing policy timelines.
        </p>
        <div className="grid">
          {planningComparison.map((item) => (
            <article className="card" key={item.topic}>
              <p className="eyebrow">{item.topic}</p>
              <h3>Study planning</h3>
              <p>{item.earlierPlanning}</p>
              <p className="note">{item.newerDiscussion}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Beginner Guidance</p>
        <h2>Keep the first study steps concrete</h2>
        <p>
          A beginner does not need to solve every framework question before
          learning. Build the foundation first, then compare level guidance with
          the resource and exam path you actually use.
        </p>
        <ol>
          {beginnerGuidance.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section>
        <p className="eyebrow">Avoid</p>
        <h2>What learners should avoid</h2>
        <div className="grid">
          {avoidList.map((item) => (
            <article className="card" key={item}>
              <h3>Check before you assume</h3>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="eyebrow">Related Pages</p>
        <h2>Continue with a practical HSK step</h2>
        <div className="grid">
          <article className="card">
            <h3>HSK level test</h3>
            <p>
              Use a self-check guide when you want a rough starting point before
              choosing what to review.
            </p>
            <a href="/hsk-level-test">Open HSK level test guide</a>
          </article>
          <article className="card">
            <h3>HSK 1 vocabulary</h3>
            <p>
              Start with beginner words when your foundation matters more than
              the label on a future level chart.
            </p>
            <a href="/hsk-1-vocabulary">Open HSK 1 vocabulary</a>
          </article>
          <article className="card">
            <h3>HSK 1 practice</h3>
            <p>
              Try short questions to see whether beginner vocabulary stays clear
              in context.
            </p>
            <a href="/hsk-1-practice-test">Open HSK 1 practice guide</a>
          </article>
          <article className="card">
            <h3>HSK 3 vocabulary</h3>
            <p>
              Study HSK 3 words with a cautious eye on resource labels, word
              list boundaries, and the transition beyond HSK 2.
            </p>
            <a href="/hsk-3-vocabulary">Open HSK 3 vocabulary</a>
          </article>
          <article className="card">
            <h3>HSK 3 practice test</h3>
            <p>
              Use HSK 3 mock test guidance as practice support while still
              checking which framework or resource your goal uses.
            </p>
            <a href="/hsk-3-practice-test">Open HSK 3 practice test</a>
          </article>
          <article className="card">
            <h3>HSK 4 vocabulary</h3>
            <p>
              Review HSK 4 word-list guidance while checking which framework,
              course, or exam resource your goal follows.
            </p>
            <a href="/hsk-4-vocabulary">Open HSK 4 vocabulary</a>
          </article>
          <article className="card">
            <h3>HSK levels guide</h3>
            <p>
              Compare the wider level path when you need a simple study map for
              planning next steps.
            </p>
            <a href="/hsk-levels">Open HSK levels guide</a>
          </article>
        </div>
      </section>

      <section className="faq">
        <p className="eyebrow">FAQ</p>
        <h2>New HSK 3.0 questions</h2>
        <details open>
          <summary>Is this page official HSK policy?</summary>
          <p>
            No. It is a learner-facing guide. Check your school, test center, or
            official exam provider when you need policy, timing, or registration
            details.
          </p>
        </details>
        <details>
          <summary>Should a beginner wait before studying HSK 1 basics?</summary>
          <p>
            No. Beginner vocabulary, simple reading attention, and short
            practice questions remain useful foundations while you compare the
            resources relevant to your goal.
          </p>
        </details>
        <details>
          <summary>Why do HSK resources use different labels?</summary>
          <p>
            Resources can reflect different study paths, publishing dates, or
            framework references. Check what a resource is built for before
            treating its labels as universal.
          </p>
        </details>
      </section>

      <footer className="footer">
        <a href="/">Back to home</a>
        <a href="/hsk-level-test">HSK level test</a>
        <a href="/hsk-1-vocabulary">HSK 1 vocabulary</a>
        <a href="/hsk-3-vocabulary">HSK 3 vocabulary</a>
        <a href="/hsk-3-practice-test">HSK 3 practice</a>
        <a href="/hsk-4-vocabulary">HSK 4 vocabulary</a>
        <a href="/hsk-levels">HSK levels guide</a>
      </footer>
    </main>
  );
}
