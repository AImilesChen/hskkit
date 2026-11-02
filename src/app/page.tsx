import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "./site-footer";
import SiteHeader from "./site-header";
import HomeNextStep from "./components/home-next-step";
import HomeQuickFlashcards from "./components/home-quick-flashcards";
import HomeIcon, { type HomeIconName } from "./components/home-icon";
import "./homepage.css";
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

const learningSteps: { number: string; title: string; text: string; href: string; icon: HomeIconName }[] = [
  { number: "01", title: "Find your starting level", text: "Get a practical learning suggestion.", href: "/placement", icon: "target" },
  { number: "02", title: "Learn focused vocabulary", text: "Study words by level or topic.", href: "/topics", icon: "book" },
  { number: "03", title: "Practise listening", text: "Hear, answer and save the attempt.", href: "/listen", icon: "headphones" },
  { number: "04", title: "Complete today’s review", text: "Bring due words and mistakes back.", href: "/review", icon: "review" },
];

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
        <p className="home-lede">{publishedWordCount.toLocaleString("en-US")} HSK words with pinyin, English meanings and spaced review.</p>
        <HomeNextStep />
      </div>

      <div className="home-product-shell home-study-scene" role="group" aria-labelledby="home-product-preview-title">
        <div className="home-product-heading">
          <div><p className="home-product-kicker">A word worth remembering</p><h2 id="home-product-preview-title">Learn it. Use it. Remember it.</h2></div>
          <span>HSK 1 · Example</span>
        </div>
        {previewWord ? <div className="home-study-stage">
          <div className="home-study-meta"><span>Example flashcard</span><span>Vocabulary · HSK 1</span></div>
          <div className="home-study-progress" aria-hidden="true"><span /></div>
          <div className="home-study-card">
            <span className="home-study-badge">One word at a time</span>
            <div className="home-product-word"><div><p lang="zh-Hans">{previewWord.hanzi}</p><span>{previewWord.pinyin}</span></div><span className="home-study-check" aria-hidden="true">✓</span></div>
            <p className="home-product-meaning">{previewWord.meaning}</p>
            <p className="home-study-example">A small step today. A stronger vocabulary tomorrow.</p>
          </div>
          <ol className="home-study-flow" aria-label="Preview learning flow">
            <li className="is-complete"><span>1</span><div><strong>Learn</strong><small>Word and meaning</small></div></li>
            <li className="is-active"><span>2</span><div><strong>Listen</strong><small>Audio where available</small></div></li>
            <li><span>3</span><div><strong>Review</strong><small>Remember for longer</small></div></li>
          </ol>
        </div> : null}
      </div>
    </section>

    <HomeQuickFlashcards cards={demoCards} />

    <section className="home-section home-path-section" aria-labelledby="path-heading">
      <div className="home-section-copy"><p className="home-eyebrow">How HSKKit works</p><h2 id="path-heading">A simple rhythm for lasting progress.</h2><p>Find your level, learn useful words, and keep them fresh with regular review.</p></div>
      <ol className="home-learning-path">{learningSteps.map((step, index) => <li key={step.number} className="home-flow-node">
        <Link href={step.href} className="home-flow-card">
          <span className="home-flow-number">{step.number}</span>
          <span className="home-flow-icon"><HomeIcon name={step.icon} className="h-5 w-5" /></span>
          <div className="home-flow-copy"><h3>{step.title}</h3><small>{step.text}</small></div>
        </Link>
        {index < learningSteps.length - 1 ? <span className="home-flow-connector" aria-hidden="true"><HomeIcon name="arrow" className="h-4 w-4" /></span> : null}
      </li>)}</ol>
    </section>

    <section className="home-section home-scenes" aria-labelledby="scenes-heading">
      <div className="home-section-copy"><p className="home-eyebrow">Chinese for your everyday</p><h2 id="scenes-heading">Learn words you can put to use.</h2><p>Choose a familiar situation and build the vocabulary to take part.</p></div>
      <div className="home-scene-grid">{sceneItems.map((scene) => <Link key={scene.asset} href={scene.href} className="home-scene">
        <img src={`/illustrations/${scene.asset}.webp`} alt="" width="768" height="512" loading="lazy" decoding="async" />
        <span className="home-scene-copy"><span>{scene.label}</span><strong>{scene.title}</strong><small>{scene.text}</small><span className="home-scene-action">Explore topics <HomeIcon name="arrow" className="h-4 w-4" /></span></span>
      </Link>)}</div>
    </section>

    <section className="home-section home-catalog" aria-labelledby="catalog-heading">
      <div className="home-section-heading"><div className="home-section-copy"><p className="home-eyebrow">Your starting point</p><h2 id="catalog-heading">Find your level. Take the next step.</h2><p>Explore 11,000 words across HSK 1–9, aligned with the 2025 exam syllabus.</p></div><Link href="/levels" className="home-text-link">Level details <HomeIcon name="arrow" className="h-4 w-4" /></Link></div>
      <div className="home-level-list">{foundationLevels.map((entry) => <Link key={entry.level} href={`/vocabulary/${entry.level}`} className="home-level-row">
        <span className="home-level-index">0{entry.level}</span><h3>Level {entry.level}</h3><strong>{entry.wordCount.toLocaleString("en-US")} words</strong><HomeIcon name="arrow" className="h-4 w-4" />
      </Link>)}{advancedLevel ? <Link href="/vocabulary/7" className="home-level-row home-level-row-advanced"><span className="home-level-index">07–09</span><h3>Levels 7–9</h3><strong>{advancedLevel.wordCount.toLocaleString("en-US")} words · Unified advanced band</strong><HomeIcon name="arrow" className="h-4 w-4" /></Link> : null}</div>
    </section>

    <div className="home-trust-note">
      <span><HomeIcon name="book" className="h-4 w-4" /> HSK 1–9 · 2025 syllabus</span>
      <Link href="/content-license">Content &amp; audio sources <HomeIcon name="arrow" className="h-4 w-4" /></Link>
    </div>

    <section className="home-section home-faq" aria-labelledby="faq-heading">
      <div className="home-section-copy"><p className="home-eyebrow">Before you begin</p><h2 id="faq-heading">Frequently asked questions</h2><p>Six short answers to the questions that matter before starting.</p></div>
      <div className="home-faq-list">{faqItems.map((item, index) => <details key={item.question} open={index === 0}><summary><span>{item.question}</span><HomeIcon name="arrow" className="h-5 w-5" /></summary><div><p>{item.answer}</p><Link href={item.href}>{item.linkLabel} <span aria-hidden="true">→</span></Link></div></details>)}</div>
    </section>

    <section className="home-final-cta"><p className="home-eyebrow">Make a little progress today</p><h2>Start with the right level.</h2><p>Find a comfortable starting point and make Chinese part of your day.</p><Link href="/placement">Find my starting level</Link></section>
  </main><SiteFooter/></>;
}

