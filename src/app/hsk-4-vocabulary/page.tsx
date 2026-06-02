import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import InfoBanner from "../components/info-banner";
import LearningPath from "../components/learning-path";

export const metadata: Metadata = {
  title: "HSK 4 Vocabulary Guide | HSKKit",
  description:
    "Study HSK 4 vocabulary, HSK 4 word list themes, sample Chinese words, transition challenges from HSK 3, readiness checks, and review advice.",
  alternates: {
    canonical: "https://hskkit.com/hsk-4-vocabulary",
  },
  openGraph: {
    title: "HSK 4 Vocabulary Guide | HSKKit",
    description:
      "Study HSK 4 vocabulary, HSK 4 word list themes, sample Chinese words, transition challenges from HSK 3, readiness checks, and review advice.",
    url: "https://hskkit.com/hsk-4-vocabulary",
    siteName: "HSKKit",
    type: "website",
  },
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
    <>
      <SiteHeader />
      <main>
        <section className="section pt-20">
          <div className="section-inner">
            <span className="eyebrow">HSK 4 Vocabulary</span>
            <h1 className="text-h1 max-sm:text-[32px] mb-6">
              Build an HSK 4 vocabulary plan for intermediate Chinese
            </h1>
            <InfoBanner level={4} />
            <p className="text-body-lg text-ink-secondary max-w-[640px] mb-10">
              HSK 4 vocabulary expands from beginner-intermediate topics into more
              abstract Chinese words for opinions, work, responsibility,
              relationships, problem solving, and longer reading. Use this guide to
              organize your HSK 4 word list after HSK 3 starts to feel manageable.
            </p>
            <div className="flex gap-4 flex-wrap">
              <a href="/hsk-4-practice-test" className="btn btn-primary">
                Try HSK 4 practice
              </a>
              <a href="/hsk-level-test" className="btn btn-secondary">
                Check your level
              </a>
            </div>
          </div>
        </section>

        <section className="section section-alt">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">
              What HSK 4 vocabulary is for
            </h2>
            <div className="card-grid">
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Richer expression</h3>
                <p className="text-body text-ink-secondary">
                  HSK 4 words help learners explain opinions, causes, decisions,
                  problems, and relationships with more precision.
                </p>
              </article>
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Longer context</h3>
                <p className="text-body text-ink-secondary">
                  Vocabulary appears inside fuller reading and listening contexts,
                  so study should include sentences and short passages.
                </p>
              </article>
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Intermediate review habits</h3>
                <p className="text-body text-ink-secondary">
                  At HSK 4, the best word list is not only bigger. It is organized
                  by topic, usage, similarity, and mistake patterns.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">
              HSK 4 Chinese words to review
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleWords.map((word) => (
                <article className="card text-center" key={word.chinese}>
                  <p className="chinese-char text-[48px] mb-2">{word.chinese}</p>
                  <p className="text-small text-ink-muted mb-2">{word.pinyin}</p>
                  <p className="text-body text-ink-secondary">{word.meaning}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-alt">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">
              How to group an HSK 4 word list
            </h2>
            <div className="card-grid">
              {categories.map((category) => (
                <article className="card" key={category.title}>
                  <h3 className="text-h3 max-sm:text-xl mb-3">{category.title}</h3>
                  <p className="text-body text-ink-secondary">{category.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">
              Make HSK 4 vocabulary easier to use
            </h2>
            <div className="max-w-[800px]">
              {studyTips.map((tip) => (
                <div key={tip} className="flex items-start gap-4 py-4 border-b border-border">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4634E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <p className="text-body text-ink-secondary">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-alt">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">
              What gets harder from HSK 3 to HSK 4
            </h2>
            <div className="card-grid">
              {transitionChallenges.map((challenge) => (
                <article className="card" key={challenge.title}>
                  <h3 className="text-h3 max-sm:text-xl mb-3">{challenge.title}</h3>
                  <p className="text-body text-ink-secondary">{challenge.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">
              Signs you are ready for HSK 4 vocabulary
            </h2>
            <div className="max-w-[800px]">
              {readinessChecks.map((check) => (
                <div key={check} className="flex items-start gap-4 py-4 border-b border-border">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4634E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <p className="text-body text-ink-secondary">{check}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-alt">
          <div className="section-inner">
            <LearningPath level={4} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
