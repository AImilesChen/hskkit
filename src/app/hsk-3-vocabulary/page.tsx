import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import InfoBanner from "../components/info-banner";
import LearningPath from "../components/learning-path";

export const metadata: Metadata = {
  title: "HSK 3 Vocabulary Guide (Traditional HSK 2.0) | HSKKit",
  description:
    "Traditional HSK 2.0 resource: study HSK 3 vocabulary themes, sample words and readiness tips. Use the HSK 3.0 Level 3 catalog for the current standard.",
  alternates: {
    canonical: "https://hskkit.com/hsk-3-vocabulary",
  },
  openGraph: {
    title: "HSK 3 Vocabulary Guide (Traditional HSK 2.0) | HSKKit",
    description:
      "Traditional HSK 2.0 resource: study HSK 3 vocabulary themes, sample words and readiness tips. Use the HSK 3.0 Level 3 catalog for the current standard.",
    url: "https://hskkit.com/hsk-3-vocabulary",
    siteName: "HSKKit",
    type: "website",
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
    <>
      <SiteHeader />
      <main>
        <section className="section pt-20">
          <div className="section-inner">
            <span className="eyebrow">HSK 3 Vocabulary</span>
            <h1 className="text-h1 max-sm:text-[32px] mb-6">
              Build an HSK 3 vocabulary plan for stronger Chinese reading
            </h1>
            <InfoBanner level={3} />
            <p className="text-body-lg text-ink-secondary max-w-[640px] mb-10">
              HSK 3 vocabulary moves beyond beginner phrases into more connected
              Chinese words for study, work, decisions, opinions, daily problems,
              and longer sentence meaning. Use this guide to organize your HSK 3
              word list and bridge the gap after HSK 2.
            </p>
            <div className="flex gap-4 flex-wrap">
              <a href="/hsk-3-practice-test" className="btn btn-primary">
                Try HSK 3 practice
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
              What HSK 3 vocabulary is for
            </h2>
            <div className="card-grid">
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Connected meaning</h3>
                <p className="text-body text-ink-secondary">
                  HSK 3 words help you understand longer sentences where people
                  explain plans, reasons, comparisons, and everyday situations.
                </p>
              </article>
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Intermediate bridge</h3>
                <p className="text-body text-ink-secondary">
                  This level starts to feel less like isolated beginner survival
                  language and more like practical communication across topics.
                </p>
              </article>
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Better review evidence</h3>
                <p className="text-body text-ink-secondary">
                  The most useful HSK 3 study comes from noticing which words fail
                  in context, then reviewing those words with short examples.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">
              HSK 3 Chinese words to review
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
              How to group an HSK 3 word list
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
              Make HSK 3 vocabulary easier to remember
            </h2>
            <div className="max-w-[800px]">
              {studyTips.map((tip) => (
                <div key={tip} className="flex items-start gap-4 py-4 border-b border-border">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A03E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
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
              What gets harder from HSK 2 to HSK 3
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
              Signs you are ready for HSK 3 vocabulary
            </h2>
            <div className="max-w-[800px]">
              {readinessChecks.map((check) => (
                <div key={check} className="flex items-start gap-4 py-4 border-b border-border">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A03E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
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
            <LearningPath level={3} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
