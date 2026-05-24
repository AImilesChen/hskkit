import SiteHeader from "./site-header";
import SiteFooter from "./site-footer";

const features = [
  {
    title: "Level Guides",
    text: "Compare HSK levels and choose a practical next step for your current study stage.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    title: "Vocabulary Pages",
    text: "Review sample Chinese words, pinyin, meanings, topic groups, and transition tips.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>
      </svg>
    ),
  },
  {
    title: "Practice Test Guides",
    text: "Use sample-test guidance to plan listening, reading, pacing, and mistake review.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>
      </svg>
    ),
  },
];

const popularCards = [
  {
    title: "HSK level test",
    text: "Use a self-check guide when you need a rough starting point.",
    href: "/hsk-level-test",
    label: "Open level test",
  },
  {
    title: "HSK vocabulary",
    text: "Review vocabulary guides from beginner foundations into advanced reading.",
    href: "/hsk-1-vocabulary",
    label: "Start vocabulary",
  },
  {
    title: "Practice test guides",
    text: "Prepare for sample tests and mock tests with clearer review habits.",
    href: "/hsk-1-practice-test",
    label: "Start practice",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative pt-[120px] pb-20 px-6 text-center bg-bg max-sm:pt-20 max-sm:pb-12">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,rgba(27,58,92,0.03)_0%,transparent_70%)] pointer-events-none" />
          <div className="relative max-w-[800px] mx-auto">
            <span className="eyebrow fade-in">HSK Study Guides for Chinese Learners</span>
            <h1 className="text-h1 max-sm:text-[32px] mb-6 fade-in" style={{ animationDelay: "0.05s" }}>
              Plan focused HSK vocabulary and practice without guessing your next step.
            </h1>
            <p className="text-body-lg text-ink-secondary max-w-[640px] mx-auto mb-10 fade-in" style={{ animationDelay: "0.1s" }}>
              HSKKit helps Chinese learners compare levels, review vocabulary, and use practice-test guidance to make each study session clearer.
            </p>
            <div className="flex gap-4 justify-center flex-wrap fade-in" style={{ animationDelay: "0.15s" }}>
              <a href="/hsk-level-test" className="btn btn-primary">Start with level test</a>
              <a href="/hsk-levels" className="btn btn-secondary">Compare HSK levels</a>
            </div>
          </div>
        </section>

        {/* Study Path */}
        <section className="section section-alt" id="features">
          <div className="section-inner">
            <span className="eyebrow">Study Path</span>
            <h2 className="text-h2 max-sm:text-[28px] mb-8">Start with the pages learners actually need.</h2>
            <div className="card-grid">
              {features.map((item) => (
                <article className="card" key={item.title}>
                  <div className="card-icon">{item.icon}</div>
                  <h3 className="text-h3 max-sm:text-xl mb-3">{item.title}</h3>
                  <p className="text-body text-ink-secondary">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Starting Points */}
        <section className="section">
          <div className="section-inner">
            <span className="eyebrow">Popular Starting Points</span>
            <h2 className="text-h2 max-sm:text-[28px] mb-8">Choose a focused HSK page.</h2>
            <div className="card-grid">
              {popularCards.map((item) => (
                <article className="card" key={item.title}>
                  <h3 className="text-h3 max-sm:text-xl mb-3">{item.title}</h3>
                  <p className="text-body text-ink-secondary mb-4">{item.text}</p>
                  <a href={item.href} className="btn-ghost">{item.label}</a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section section-alt">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] text-center mb-12">FAQ</h2>
            <div className="faq-list">
              <FaqItem question="Who is HSKKit for?" answer="English-speaking learners preparing for HSK or building practical Mandarin study habits." defaultOpen />
              <FaqItem question="Is HSKKit connected to HSK test organizers?" answer="No. HSKKit is an independent study tool and is not affiliated with, endorsed by, sponsored by, or operated by any HSK test organizer or trademark owner." />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function FaqItem({ question, answer, defaultOpen = false }: { question: string; answer: string; defaultOpen?: boolean }) {
  return (
    <details className="faq-item" open={defaultOpen}>
      <summary className="faq-question list-none">
        <span>{question}</span>
        <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </summary>
      <div className="faq-answer">{answer}</div>
    </details>
  );
}
