import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";

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
  "Review 10 words daily rather than 50 once a week",
  "Say each word aloud while reading the pinyin",
  "Write characters by hand to build muscle memory",
  "Test yourself without looking at the meaning first",
];

export default function HSK1VocabularyPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="section pt-20">
          <div className="section-inner">
            <span className="eyebrow">HSK 1 Vocabulary</span>
            <h1 className="text-h1 max-sm:text-[32px] mb-6">Build a clear HSK 1 vocabulary foundation</h1>
            <p className="text-body-lg text-ink-secondary max-w-[640px] mb-10">
              Start with the most common words in daily Chinese. Each word includes pinyin, meaning, and a simple example to help you recognize and remember.
            </p>
            <div className="flex gap-4 flex-wrap">
              <a href="/hsk-1-practice-test" className="btn btn-primary">Try HSK 1 practice</a>
              <a href="/hsk-level-test" className="btn btn-secondary">Check your level</a>
            </div>
          </div>
        </section>

        {/* Purpose */}
        <section className="section section-alt">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">What HSK 1 vocabulary is for</h2>
            <div className="card-grid">
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Starting recognition</h3>
                <p className="text-body text-ink-secondary">Build confidence by identifying the most common characters and words first.</p>
              </article>
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Pronunciation practice</h3>
                <p className="text-body text-ink-secondary">Use pinyin to connect what you see with how it sounds.</p>
              </article>
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Useful context</h3>
                <p className="text-body text-ink-secondary">See words in short phrases so you understand how they work together.</p>
              </article>
            </div>
          </div>
        </section>

        {/* Sample Words */}
        <section className="section">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">Beginner words to review</h2>
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

        {/* Study Tips */}
        <section className="section section-alt">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">Keep beginner vocabulary practice active</h2>
            <div className="max-w-[800px]">
              {studyTips.map((tip) => (
                <div key={tip} className="flex items-start gap-4 py-4 border-b border-border">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A9B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <p className="text-body text-ink-secondary">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
