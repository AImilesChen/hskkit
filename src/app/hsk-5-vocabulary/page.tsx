import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import InfoBanner from "../components/info-banner";
import LearningPath from "../components/learning-path";

export const metadata: Metadata = {
  title: "HSK 5 Vocabulary Guide | HSKKit",
  description:
    "Study HSK 5 vocabulary, HSK 5 word list themes, advanced Chinese words, transition challenges from HSK 4, readiness checks, and review advice.",
  alternates: {
    canonical: "https://hskkit.com/hsk-5-vocabulary",
  },
  openGraph: {
    title: "HSK 5 Vocabulary Guide | HSKKit",
    description:
      "Study HSK 5 vocabulary, HSK 5 word list themes, advanced Chinese words, transition challenges from HSK 4, readiness checks, and review advice.",
    url: "https://hskkit.com/hsk-5-vocabulary",
    siteName: "HSKKit",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const sampleWords = [
  { chinese: "观点", pinyin: "guāndiǎn", meaning: "viewpoint; opinion" },
  { chinese: "现象", pinyin: "xiànxiàng", meaning: "phenomenon" },
  { chinese: "效率", pinyin: "xiàolǜ", meaning: "efficiency" },
  { chinese: "承担", pinyin: "chéngdān", meaning: "to undertake; bear" },
  { chinese: "促进", pinyin: "cùjìn", meaning: "to promote; advance" },
  { chinese: "明显", pinyin: "míngxiǎn", meaning: "obvious; clear" },
  { chinese: "资源", pinyin: "zīyuán", meaning: "resources" },
  { chinese: "态度", pinyin: "tàidu", meaning: "attitude" },
  { chinese: "复杂", pinyin: "fùzá", meaning: "complex" },
];

const categories = [
  {
    title: "Ideas and viewpoints",
    detail:
      "HSK 5 word lists include more vocabulary for opinions, analysis, arguments, evidence, and social observations.",
  },
  {
    title: "Work and society",
    detail:
      "Learners meet more words about careers, resources, efficiency, responsibility, development, and public topics.",
  },
  {
    title: "Emotion and attitude",
    detail:
      "Vocabulary expands into attitude, confidence, pressure, conflict, expectation, and more nuanced personal response.",
  },
  {
    title: "Abstract verbs and nouns",
    detail:
      "HSK 5 Chinese words often carry abstract meaning, so context and collocation become essential parts of review.",
  },
];

const studyTips = [
  "Study HSK 5 vocabulary with short reading passages so new words are tied to argument, tone, and context.",
  "Compare similar words directly and write a simple example for each one to avoid vague recognition.",
  "Review collocations and common sentence frames because advanced words often appear in repeated patterns.",
  "Keep HSK 4 vocabulary active with mixed review so older words remain fast during longer reading.",
  "After practice, record whether a missed word was unknown, misunderstood in context, or confused with a similar word.",
];

const transitionChallenges = [
  {
    title: "More abstract topics",
    detail:
      "HSK 5 vocabulary often appears in texts about opinions, society, work, education, habits, and complex situations.",
  },
  {
    title: "Longer passage context",
    detail:
      "Words are easier to misunderstand when the answer depends on the main idea, writer attitude, or paragraph logic.",
  },
  {
    title: "Similar-word pressure",
    detail:
      "Learners need to compare near-synonyms and usage patterns instead of treating English meanings as exact matches.",
  },
  {
    title: "Higher review volume",
    detail:
      "HSK 4 words must remain quick enough that the larger HSK 5 word list does not make every passage feel overloaded.",
  },
];

const readinessChecks = [
  "I can review HSK 4 vocabulary through sentences and short passages, not only isolated cards.",
  "I can handle many HSK 4 practice questions and explain whether mistakes come from vocabulary, logic, or pacing.",
  "I am ready to compare similar words and track usage, not just memorize English translations.",
  "I can read longer material slowly and still identify the main idea, detail, and attitude.",
];

export default function HSK5VocabularyPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section pt-20">
          <div className="section-inner">
            <span className="eyebrow">HSK 5 Vocabulary</span>
            <h1 className="text-h1 max-sm:text-[32px] mb-6">
              Build an HSK 5 vocabulary plan for advanced Chinese reading
            </h1>
            <InfoBanner level={5} />
            <p className="text-body-lg text-ink-secondary max-w-[640px] mb-10">
              HSK 5 vocabulary expands into advanced Chinese words for viewpoints,
              society, work, resources, attitudes, complex situations, and longer
              reading. Use this guide to organize your HSK 5 word list after HSK 4
              material starts to feel manageable.
            </p>
            <div className="flex gap-4 flex-wrap">
              <a href="/hsk-4-practice-test" className="btn btn-primary">
                Review HSK 4 practice
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
              What HSK 5 vocabulary is for
            </h2>
            <div className="card-grid">
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Advanced reading</h3>
                <p className="text-body text-ink-secondary">
                  HSK 5 words support longer reading where meaning depends on main
                  idea, detail, writer attitude, and paragraph connection.
                </p>
              </article>
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">More abstract expression</h3>
                <p className="text-body text-ink-secondary">
                  Vocabulary shifts toward ideas, viewpoints, social topics,
                  responsibility, development, and more nuanced explanation.
                </p>
              </article>
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Sharper word choice</h3>
                <p className="text-body text-ink-secondary">
                  At HSK 5, learners need to notice usage, collocation, register,
                  and similar words instead of relying on one English meaning.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">
              HSK 5 Chinese words to review
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
              How to group an HSK 5 word list
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
              Make HSK 5 vocabulary easier to use
            </h2>
            <div className="max-w-[800px]">
              {studyTips.map((tip) => (
                <div key={tip} className="flex items-start gap-4 py-4 border-b border-border">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B85440" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
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
              What gets harder from HSK 4 to HSK 5
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
              Signs you are ready for HSK 5 vocabulary
            </h2>
            <div className="max-w-[800px]">
              {readinessChecks.map((check) => (
                <div key={check} className="flex items-start gap-4 py-4 border-b border-border">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B85440" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
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
            <LearningPath level={5} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
