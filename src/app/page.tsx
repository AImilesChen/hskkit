const features = [
  { title: "AI Worksheets", text: "Generate targeted HSK practice sheets for vocabulary, grammar, and reading drills." },
  { title: "Graded Reading", text: "Create short Chinese readings matched to learner level and study goals." },
  { title: "Flashcards", text: "Review core HSK vocabulary with clean, focused flashcard practice." }
];

const limits = [
  "Free: 1 worksheet/day, reading 2 of 5, first 30 flashcards",
  "Pro: $5.99/month or $49/year",
  "Pro includes 500 AI credits/month, reset monthly with no rollover",
  "AI costs: worksheet 2 credits, reading 20 credits, flashcards 5 credits"
];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <nav className="nav">
          <strong>HSKKit</strong>
          <div>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="/privacy-policy">Privacy</a>
          </div>
        </nav>
        <div className="heroContent">
          <p className="eyebrow">AI-powered Chinese learning tools</p>
          <h1>Practice smarter for HSK with worksheets, readings, and flashcards.</h1>
          <p className="subtitle">HSKKit helps Chinese learners generate focused practice materials in minutes, so every study session has a clear next step.</p>
          <div className="actions">
            <a className="button primary" href="#pricing">View pricing</a>
            <a className="button secondary" href="mailto:support@hskkit.com">Contact support</a>
          </div>
        </div>
      </section>

      <section id="features" className="section">
        <p className="eyebrow">P1 toolkit</p>
        <h2>Start with the study tools learners actually use.</h2>
        <div className="grid">
          {features.map((item) => (
            <article className="card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="section pricing">
        <p className="eyebrow">Simple pricing</p>
        <h2>Free to try. Pro for serious practice.</h2>
        <ul>
          {limits.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p className="note">Payments planned via PayPal in USD. Refund window: 7 days. Failed payment grace period: 3 days.</p>
      </section>

      <section className="section faq">
        <h2>FAQ</h2>
        <details open>
          <summary>Who is HSKKit for?</summary>
          <p>English-speaking learners preparing for HSK or building practical Mandarin study habits.</p>
        </details>
        <details>
          <summary>Is the AI output a replacement for a teacher?</summary>
          <p>No. HSKKit creates practice materials. Learners should still verify important explanations with teachers or trusted learning resources.</p>
        </details>
      </section>

      <footer className="footer">
        <span>© 2026 HSKKit</span>
        <a href="/terms-of-service">Terms</a>
        <a href="/privacy-policy">Privacy</a>
        <a href="mailto:support@hskkit.com">support@hskkit.com</a>
      </footer>
    </main>
  );
}
