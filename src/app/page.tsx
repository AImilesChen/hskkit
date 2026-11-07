import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "./site-footer";
import SiteHeader from "./site-header";
import HomeNextStep from "./components/home-next-step";
import HomeQuickFlashcards from "./components/home-quick-flashcards";
import HomeIcon from "./components/home-icon";
import "./homepage.css";
import {HomeTools,HomeSkills,HomeGuides} from "./components/home-discovery";
import {cumulativeWordCounts} from "@/lib/home/discovery";
import { matchedWordExample } from "@/lib/learning/word-example-editorial";
import {
  getHsk3LevelPreview,
  getHsk3LevelStatuses,
  formalWordAudioUrlByContentId,
} from "@/lib/content/level-status";

export const metadata: Metadata = {
  title: "HSKKit — Build Your HSK Vocabulary",
  description: "Build your HSK vocabulary with 11,000 words, daily practice and spaced review. Start learning free, with pinyin and English meanings.",
  alternates: { canonical: "/" },
};


const faqItems = [
  {
    question: "Which version of HSK does HSKKit use?",
    answer: "HSKKit's published vocabulary follows the 2025 exam syllabus: 5,400 distinct entries across HSK 1–6 and 5,600 in one unified Advanced 7–9 band. English glosses and available audio are independent HSKKit study materials.",
    href: "/hsk-3-0",
    linkLabel: "Read the HSK 3.0 guide",
  },
  {
    question: "Is Placement an official HSK result?",
    answer: "No. Placement suggests a practical starting level for learning. It is not an official examination result, certification or guarantee of exam performance.",
    href: "/disclaimer",
    linkLabel: "Read the learning disclaimer",
  },
  {
    question: "What is included in Free and Pro?",
    answer: "Free includes the published catalog, core practice, 10 new items and 20 successful SRS ratings daily. Pro adds unlimited learning and review subject to safeguards, Focused Review, AI credits, longer history and three-device sync. The 7-day Pro trial requires no card and returns to Free automatically.",
    href: "/pricing",
    linkLabel: "Compare current plans",
  },
  {
    question: "Can I start without signing in?",
    answer: "Yes. You can start as a guest. A verified account is optional and lets eligible progress be restored and synced within the limits of your plan.",
    href: "/login?returnTo=%2Ftoday",
    linkLabel: "Sign in when ready",
  },
  {
    question: "How much of the catalog has audio?",
    answer: "Not every published word has audio. Routes that include audio use QA-approved synthesized Mandarin assets with source, version and QA records; unapproved or withdrawn files are not published.",
    href: "/content-license",
    linkLabel: "See audio provenance",
  },
  {
    question: "How do subscriptions, cancellation and refunds work?",
    answer: "Pro renews until cancelled. Cancellation stops automatic renewal and normally keeps access through the paid period. Refund requests are reviewed under the eligibility and timing rules on the current policy page.",
    href: "/refund-policy",
    linkLabel: "Read cancellation and refund rules",
  },
] as const;

const sceneItems = [
  { asset: "daily-life", label: "Daily life", title: "Make every day a learning moment.", text: "From your morning routine to making plans.", href: "/topics/daily-life" },
  { asset: "food-drink", label: "Food & drink", title: "Find the words for your next meal.", text: "Order, shop and cook with useful Chinese.", href: "/topics/food-drink" },
  { asset: "travel-transport", label: "Travel & transport", title: "Go a little further with Chinese.", text: "Get around town and feel ready for your next trip.", href: "/topics/travel-transport" },
] as const;

export default function HomePage() {
  const levels = getHsk3LevelStatuses();
  const foundationLevels = levels.slice(0, 6);
  const cumulativeCounts = cumulativeWordCounts(levels);
  const advancedLevel = levels.find((entry) => entry.level === 7);
  const levelOnePreviewWords = getHsk3LevelPreview(1, 120);
  const previewWord = levelOnePreviewWords[0];
  const demoCards = levelOnePreviewWords.slice(0, 5).map((word) => ({ id: word.id, hanzi: word.hanzi, pinyin: word.pinyin, meaning: word.meaning, partOfSpeech: word.partOfSpeech, audioSrc: formalWordAudioUrlByContentId.get(word.id), example: matchedWordExample(1, word.hanzi, word.pinyin, word.id) }));
  const foundationCount = foundationLevels.reduce((total, entry) => total + entry.wordCount, 0);
  const publishedWordCount = foundationCount + (advancedLevel?.wordCount ?? 0);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return <><SiteHeader/><main className="home-main mx-auto w-full max-w-[1204px] flex-1 px-5 sm:px-8">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

    <section className="home-hero" aria-labelledby="home-title">
      <div className="home-hero-copy">
        <p className="home-eyebrow">Free HSK learning platform</p>
        <h1 id="home-title" aria-label="Build your HSK vocabulary. Remember what you learn.">
          <span className="home-title-primary" aria-hidden="true">
            <span className="home-title-line">Build your HSK</span>
            <span className="home-title-line">vocabulary.</span>
          </span>
          <span className="home-title-secondary" aria-hidden="true">
            <span className="home-title-line">Remember what</span>
            <span className="home-title-line">you learn.</span>
          </span>
        </h1>
        <p className="home-lede">{publishedWordCount.toLocaleString("en-US")} HSK words. Build vocabulary, train your ear and practise writing—with tools for your next step.</p>
        <HomeNextStep />
      </div>

      <div className="home-product-shell home-study-scene" role="group" aria-labelledby="home-product-preview-title">
        <div className="home-product-heading">
          <div><p className="home-product-kicker">A word worth remembering</p><h2 id="home-product-preview-title">Learn it. Use it. Remember it.</h2></div>
          <span>HSK 1 · Example</span>
        </div>
        {previewWord ? <div className="home-study-stage">
          <div className="home-study-card">
            <span className="home-study-badge">One word at a time</span>
            <div className="home-product-word"><div><p lang="zh-Hans">{previewWord.hanzi}</p><span>{previewWord.pinyin}</span></div><span className="home-study-check" aria-hidden="true">✓</span></div>
            <p className="home-product-meaning">{previewWord.meaning}</p>
          </div>
        </div> : null}
      </div>
    </section>

    <HomeQuickFlashcards cards={demoCards} />

    <HomeTools/>


    <section className="home-section home-catalog" id="hsk-levels" aria-labelledby="catalog-heading">
      <div className="home-section-heading"><div className="home-section-copy"><p className="home-eyebrow">Your starting point</p><h2 id="catalog-heading">Find your starting point.</h2><p>Choose a comfortable starting level, then build a regular learning habit.</p></div><Link href="/levels" className="home-text-link">Level details <HomeIcon name="arrow" className="h-4 w-4" /></Link></div>
      <div className="home-start-options"><Link href="/learn"><strong>New to Chinese?</strong><span>Start with the learning guides →</span></Link><Link href="/hsk-placement-test"><strong>Not sure of your level?</strong><span>Get a learning suggestion →</span></Link><a href="#home-level-list"><strong>Know your level?</strong><span>Choose your vocabulary below ↓</span></a></div><p className="home-level-explanation">Entry counts follow the 2025 syllabus. “At this level” is new to that level; “through this level” includes earlier levels.</p><div className="home-level-list" id="home-level-list">{foundationLevels.map((entry) => <Link key={entry.level} href={`/vocabulary/${entry.level}`} className="home-level-row">
        <span className="home-level-index">0{entry.level}</span><h3>Level {entry.level}</h3><div className="home-level-counts"><strong>{entry.wordCount.toLocaleString("en-US")} <span>at this level</span></strong><span>{cumulativeCounts.get(entry.level)?.toLocaleString("en-US")} through this level</span></div><HomeIcon name="arrow" className="h-4 w-4" />
      </Link>)}{advancedLevel ? <Link href="/vocabulary/7" className="home-level-row home-level-row-advanced"><span className="home-level-index">07–09</span><h3>Levels 7–9</h3><div className="home-level-counts"><strong>{advancedLevel.wordCount.toLocaleString("en-US")} <span>at this band</span></strong><span>{cumulativeCounts.get(advancedLevel.level)?.toLocaleString("en-US")} through this band · Unified advanced band</span></div><HomeIcon name="arrow" className="h-4 w-4" /></Link> : null}</div>
    <nav className="home-learning-rhythm" aria-label="A regular learning rhythm"><Link href="/vocabulary/1">Learn focused vocabulary</Link><span aria-hidden="true">→</span><Link href="/listen">Practise listening</Link><span aria-hidden="true">→</span><Link href="/review">Complete today’s review</Link></nav></section>

    <HomeSkills/>

    <section className="home-section home-scenes" aria-labelledby="scenes-heading">
      <div className="home-section-copy"><p className="home-eyebrow">Chinese for your everyday</p><h2 id="scenes-heading">Learn words you can put to use.</h2><p>Choose a familiar situation and build the vocabulary to take part.</p></div>
      <div className="home-scene-grid">{sceneItems.map((scene) => <Link key={scene.asset} href={scene.href} className="home-scene">
        <img src={`/illustrations/${scene.asset}.webp`} alt="" width="768" height="512" loading="lazy" decoding="async" />
        <span className="home-scene-copy"><span>{scene.label}</span><strong>{scene.title}</strong><small>{scene.text}</small><span className="home-scene-action">Explore topics <HomeIcon name="arrow" className="h-4 w-4" /></span></span>
      </Link>)}</div>
    </section>



    <HomeGuides/>

    <div className="home-trust-note">
      <span><HomeIcon name="book" className="h-4 w-4" /> HSK 1–9 · 2025 syllabus</span>
      <Link href="/content-license">Content &amp; audio sources <HomeIcon name="arrow" className="h-4 w-4" /></Link>
    </div>

    <section className="home-section home-faq" aria-labelledby="faq-heading">
      <div className="home-section-copy"><p className="home-eyebrow">Before you begin</p><h2 id="faq-heading">Frequently asked questions</h2><p>Six short answers to the questions that matter before starting.</p></div>
      <div className="home-faq-list">{faqItems.map((item, index) => <details key={item.question} open={index === 0}><summary><span>{item.question}</span><HomeIcon name="arrow" className="h-5 w-5" /></summary><div><p>{item.answer}</p><Link href={item.href}>{item.linkLabel} <span aria-hidden="true">→</span></Link></div></details>)}</div>
    </section>

    <section className="home-final-cta"><p className="home-eyebrow">Make a little progress today</p><h2>Start with the right level.</h2><p>Find a comfortable starting point and make Chinese part of your day.</p><Link href="/start">Start learning free</Link></section>
  </main><SiteFooter/></>;
}

