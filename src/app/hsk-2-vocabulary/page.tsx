import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import InfoBanner from "../components/info-banner";
import LearningPath from "../components/learning-path";

export const metadata: Metadata = {
  title: "HSK 2 Vocabulary Guide | HSKKit",
  description:
    "Review HSK 2 vocabulary themes, sample beginner-plus Chinese words, study tips, and practical next steps after HSK 1.",
  alternates: {
    canonical: "https://hskkit.com/hsk-2-vocabulary",
  },
  openGraph: {
    title: "HSK 2 Vocabulary Guide | HSKKit",
    description:
      "Review HSK 2 vocabulary themes, sample beginner-plus Chinese words, study tips, and practical next steps after HSK 1.",
    url: "https://hskkit.com/hsk-2-vocabulary",
    siteName: "HSKKit",
    type: "website",
  },
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
    <>
      <SiteHeader />
      <main>
        <section className="section pt-20">
          <div className="section-inner">
            <span className="eyebrow">HSK 2 Vocabulary</span>
            <h1 className="text-h1 max-sm:text-[32px] mb-6">
              Grow your HSK 2 vocabulary after the beginner foundation
            </h1>
            <InfoBanner level={2} />
            <p className="text-body-lg text-ink-secondary max-w-[640px] mb-10">
              HSK 2 vocabulary helps learners move from isolated beginner words
              toward more useful daily phrases, simple opinions, time expressions,
              and short explanations. Use this guide as a practical bridge after
              HSK 1 review.
            </p>
            <div className="flex gap-4 flex-wrap">
              <a href="/hsk-2-practice-test" className="btn btn-primary">
                Try HSK 2 practice
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
              What HSK 2 vocabulary adds
            </h2>
            <div className="card-grid">
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">More daily topics</h3>
                <p className="text-body text-ink-secondary">
                  HSK 2 study expands the beginner base into school, work, family,
                  shopping, time, plans, and simple personal preferences.
                </p>
              </article>
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Longer recognition</h3>
                <p className="text-body text-ink-secondary">
                  New words often appear inside slightly longer phrases, so review
                  should include short sentence practice instead of only flashcards.
                </p>
              </article>
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Better review choices</h3>
                <p className="text-body text-ink-secondary">
                  When HSK 2 feels hard, the answer is not always more words. Some
                  learners need stronger HSK 1 recall or calmer reading habits.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">
              Beginner-plus words to review
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
              Make HSK 2 vocabulary easier to keep
            </h2>
            <div className="max-w-[800px]">
              {studyMoves.map((tip) => (
                <div key={tip} className="flex items-start gap-4 py-4 border-b border-border">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5BA88A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <p className="text-body text-ink-secondary">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">
              Signs you are ready to add HSK 2 words
            </h2>
            <div className="card-grid">
              {readinessSigns.map((sign) => (
                <article className="card" key={sign.title}>
                  <h3 className="text-h3 max-sm:text-xl mb-3">{sign.title}</h3>
                  <p className="text-body text-ink-secondary">{sign.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-alt">
          <div className="section-inner">
            <LearningPath level={2} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
