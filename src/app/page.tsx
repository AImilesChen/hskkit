import SiteFooter from "./site-footer";

const features = [
  {
    title: "Level Guides",
    text: "Compare HSK levels and choose a practical next step for your current study stage.",
  },
  {
    title: "Vocabulary Pages",
    text: "Review sample Chinese words, pinyin, meanings, topic groups, and transition tips.",
  },
  {
    title: "Practice Test Guides",
    text: "Use sample-test guidance to plan listening, reading, pacing, and mistake review.",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <nav className="nav">
          <strong>HSKKit</strong>
          <div>
            <a href="#features">Features</a>
            <a href="/hsk-levels">Levels</a>
            <a href="/hsk-level-test">Level test</a>
            <a href="/privacy-policy">Privacy</a>
          </div>
        </nav>
        <div className="heroContent">
          <p className="eyebrow">HSK study guides for Chinese learners</p>
          <h1>
            Plan focused HSK vocabulary and practice without guessing your next
            step.
          </h1>
          <p className="subtitle">
            HSKKit helps Chinese learners compare levels, review vocabulary, and
            use practice-test guidance to make each study session clearer.
          </p>
          <div className="actions">
            <a className="button primary" href="/hsk-level-test">
              Start with level test
            </a>
            <a className="button secondary" href="/hsk-levels">
              Compare HSK levels
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="section">
        <p className="eyebrow">Study path</p>
        <h2>Start with the pages learners actually need.</h2>
        <div className="grid">
          {features.map((item) => (
            <article className="card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section pricing">
        <p className="eyebrow">Popular starting points</p>
        <h2>Choose a focused HSK page.</h2>
        <div className="grid">
          <article className="card">
            <h3>HSK level test</h3>
            <p>Use a self-check guide when you need a rough starting point.</p>
            <a href="/hsk-level-test">Open level test</a>
          </article>
          <article className="card">
            <h3>HSK vocabulary</h3>
            <p>
              Review vocabulary guides from beginner foundations into advanced
              reading.
            </p>
            <a href="/hsk-1-vocabulary">Start vocabulary</a>
          </article>
          <article className="card">
            <h3>Practice test guides</h3>
            <p>
              Prepare for sample tests and mock tests with clearer review
              habits.
            </p>
            <a href="/hsk-1-practice-test">Start practice</a>
          </article>
        </div>
      </section>

      <section className="section faq">
        <h2>FAQ</h2>
        <details open>
          <summary>Who is HSKKit for?</summary>
          <p>
            English-speaking learners preparing for HSK or building practical
            Mandarin study habits.
          </p>
        </details>
        <details>
          <summary>Is HSKKit connected to HSK test organizers?</summary>
          <p>No. HSKKit is an independent study guide site for learners.</p>
        </details>
      </section>

      <SiteFooter />
    </main>
  );
}
