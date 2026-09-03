import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "./site-footer";
import SiteHeader from "./site-header";
import HomeNextStep from "./components/home-next-step";
import HomeQuickFlashcards from "./components/home-quick-flashcards";
import HomeIcon, { type HomeIconName } from "./components/home-icon";
import "./homepage.css";
import {
  getHsk3LevelPreview,
  getHsk3LevelStatuses,
} from "@/lib/content/level-status";
import {
  PUBLIC_ACCOUNT_SCOPE,
  PUBLIC_DICTIONARY_SCOPE,
  PUBLIC_FORMAL_CONTENT_SCOPE,
} from "@/lib/public-copy";

export const metadata: Metadata = {
  title: "HSKKit — Find your HSK level and know what to study next",
  description: "Find a suggested HSK 3.0 starting level, then connect vocabulary, listening, practice, mistakes and spaced review in one daily study path.",
  alternates: { canonical: "/" },
};

type Tool = {
  title: string;
  text: string;
  href: string;
  icon: HomeIconName;
};

const primaryTools: Tool[] = [
  { title: "Topics", text: "Learn linked words in practical situations.", href: "/topics", icon: "route" },
  { title: "Listening", text: "Hear approved word and context audio.", href: "/listen", icon: "headphones" },
  { title: "Practice", text: "Check meaning, pinyin and listening recall.", href: "/practice", icon: "pencil" },
  { title: "Today", text: "Open the next focused task and due review.", href: "/today", icon: "calendar" },
  { title: "Mistakes", text: "Return to answers that still need work.", href: "/mistakes", icon: "review" },
  { title: "Dictionary", text: "Search the published HSK 3.0 catalog.", href: "/dictionary", icon: "search" },
];

const learningSteps: { number: string; title: string; text: string; href: string; icon: HomeIconName }[] = [
  { number: "01", title: "Find your starting level", text: "Get a practical learning suggestion.", href: "/placement", icon: "target" },
  { number: "02", title: "Learn focused vocabulary", text: "Study words by level or topic.", href: "/topics", icon: "book" },
  { number: "03", title: "Practise listening", text: "Hear, answer and save the attempt.", href: "/listen", icon: "headphones" },
  { number: "04", title: "Complete today’s review", text: "Bring due words and mistakes back.", href: "/review", icon: "review" },
];

const faqItems = [
  {
    question: "Which version of HSK does HSKKit use?",
    answer: "HSKKit organises its published vocabulary and study routes around the nine-level HSK 3.0 framework. Levels 1–6 appear separately, while Levels 7–9 form one unified advanced band.",
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
    answer: "Free includes the published catalog, core practice and bounded daily learning and review. Pro adds unlimited learning and review subject to safeguards, Focused Review, AI credits, longer history and three-device sync.",
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
  {
    asset: "desk-practice",
    label: "Desktop practice",
    title: "Grocery shopping in context",
    text: "A real published topic session with checked answers and saved results.",
    href: "/topics/grocery-shopping/practice",
  },
  {
    asset: "mobile-listening",
    label: "Listening practice",
    title: "A short listening round",
    text: "Choose a level and a bounded question set when audio practice fits the moment.",
    href: "/listen",
  },
] as const;

function ResponsiveSceneImage({ asset, alt }: { asset: string; alt: string }) {
  const sizes = asset === "desk-practice"
    ? "(min-width: 1024px) 52vw, (min-width: 640px) 60vw, calc(100vw - 36px)"
    : "(min-width: 1024px) 30vw, (min-width: 640px) 40vw, calc(100vw - 36px)";
  return <picture>
    <source type="image/avif" srcSet={`/home/${asset}-640.avif 640w, /home/${asset}-1200.avif 1200w`} sizes={sizes} />
    <source type="image/webp" srcSet={`/home/${asset}-640.webp 640w, /home/${asset}-1200.webp 1200w`} sizes={sizes} />
    <img src={`/home/${asset}-640.webp`} alt={alt} width="640" height="360" loading="lazy" decoding="async" />
  </picture>;
}

export default function HomePage() {
  const levels = getHsk3LevelStatuses();
  const foundationLevels = levels.slice(0, 6);
  const advancedLevel = levels.find((entry) => entry.level === 7);
  const levelOnePreviewWords = getHsk3LevelPreview(1, 120);
  const previewWord = levelOnePreviewWords[0];
  const demoCards = levelOnePreviewWords.slice(0, 5).map((word) => ({ id: word.id, hanzi: word.hanzi, pinyin: word.pinyin, meaning: word.meaning }));
  const foundationCount = foundationLevels.reduce((total, entry) => total + entry.wordCount, 0);
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
        <p className="home-eyebrow">HSK 3.0 · Levels 1–9</p>
        <h1 id="home-title"><span>Find your HSK level.</span><br/>Know what to study next.</h1>
        <p className="home-lede">Start with a suggested level, then connect vocabulary, listening, checked practice, mistakes and spaced review in one clear study path.</p>
        <HomeNextStep />
      </div>

      <div className="home-product-shell home-study-scene" role="group" aria-labelledby="home-product-preview-title">
        <div className="home-product-heading">
          <div><p className="home-product-kicker">Study flow preview</p><h2 id="home-product-preview-title">A complete learning moment</h2></div>
          <span>HSK 1 · Example</span>
        </div>
        {previewWord ? <div className="home-study-stage">
          <div className="home-study-meta"><span>Step 2 of 3</span><span>Illustrative flow</span></div>
          <div className="home-study-progress" aria-hidden="true"><span /></div>
          <div className="home-study-card">
            <span className="home-study-badge">Learn in context</span>
            <div className="home-product-word"><div><p lang="zh-Hans">{previewWord.hanzi}</p><span>{previewWord.pinyin}</span></div><span className="home-study-check" aria-hidden="true">✓</span></div>
            <p className="home-product-meaning">{previewWord.meaning}</p>
            <p className="home-study-example">Recognize the word, reveal its meaning, then continue into a short listening check.</p>
          </div>
          <ol className="home-study-flow" aria-label="Preview learning flow">
            <li className="is-complete"><span>1</span><div><strong>Learn</strong><small>Word and meaning</small></div></li>
            <li className="is-active"><span>2</span><div><strong>Listen</strong><small>Approved audio when available</small></div></li>
            <li><span>3</span><div><strong>Review</strong><small>Bring it back when due</small></div></li>
          </ol>
        </div> : null}
      </div>
    </section>

    <HomeQuickFlashcards cards={demoCards} />

    <section className="home-section home-path-section" aria-labelledby="path-heading">
      <div className="home-section-copy"><p className="home-eyebrow">How HSKKit works</p><h2 id="path-heading">One connected path from level check to daily review.</h2><p>Every action points to the next one, so the product feels like a study route rather than a directory of separate tools.</p></div>
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
      <div className="home-section-copy"><p className="home-eyebrow">Inside the product</p><h2 id="scenes-heading">Study fits the rhythm of real life.</h2><p>These are real HSKKit screens: one topic practice route and one bounded listening round.</p></div>
      <div className="home-scene-grid">{sceneItems.map((scene) => <Link key={scene.asset} href={scene.href} className="home-scene">
        <ResponsiveSceneImage asset={scene.asset} alt={`Real HSKKit ${scene.label.toLowerCase()} screen`} />
        <span className="home-scene-copy"><span>{scene.label}</span><strong>{scene.title}</strong><small>{scene.text}</small></span>
      </Link>)}</div>
    </section>

    <section className="home-section home-catalog" aria-labelledby="catalog-heading">
      <div className="home-section-heading"><div className="home-section-copy"><p className="home-eyebrow">HSK 3.0 vocabulary</p><h2 id="catalog-heading">Explore the published HSK 3.0 catalog.</h2><p>Choose a level without reading the same explanation seven times.</p></div><Link href="/levels" className="home-text-link">Level details <HomeIcon name="arrow" className="h-4 w-4" /></Link></div>
      <div className="home-level-list">{foundationLevels.map((entry) => <Link key={entry.level} href={`/vocabulary/${entry.level}`} className="home-level-row">
        <span className="home-level-index">0{entry.level}</span><h3>Level {entry.level}</h3><strong>{entry.wordCount.toLocaleString("en-US")} words</strong><HomeIcon name="arrow" className="h-4 w-4" />
      </Link>)}{advancedLevel ? <Link href="/vocabulary/7" className="home-level-row home-level-row-advanced"><span className="home-level-index">07–09</span><h3>Levels 7–9</h3><strong>{advancedLevel.wordCount.toLocaleString("en-US")} words · Unified advanced band</strong><HomeIcon name="arrow" className="h-4 w-4" /></Link> : null}</div>
    </section>

    <section className="home-section" aria-labelledby="tools-heading">
      <div className="home-section-heading"><div className="home-section-copy"><p className="home-eyebrow">Core tools</p><h2 id="tools-heading">Choose a tool for the task in front of you.</h2><p>The main study loop stays prominent. Tests, reading and other routes remain available through navigation and the footer.</p></div><Link href="/levels" className="home-text-link">Explore all routes <HomeIcon name="arrow" className="h-4 w-4" /></Link></div>
      <div className="home-tool-grid">{primaryTools.map((tool) => <Link key={tool.title} href={tool.href} className="home-tool-card"><span className="home-tool-icon"><HomeIcon name={tool.icon} className="h-5 w-5" /></span><span className="home-tool-copy"><strong>{tool.title}</strong><small>{tool.text}</small></span><span aria-hidden="true" className="home-tool-arrow"><HomeIcon name="arrow" className="h-4 w-4" /></span></Link>)}</div>
    </section>

    <section className="home-section home-transparency" aria-labelledby="scope-heading">
      <div className="home-transparency-heading"><p className="home-eyebrow">Content transparency</p><h2 id="scope-heading">Published. Clear. Ready to start.</h2><p>See what the product covers before you begin.</p><Link href="/content-license">How content and audio are published <HomeIcon name="arrow" className="h-4 w-4" /></Link></div>
      <div className="home-scope-stats"><div><strong>HSK 3.0 Levels 1–9</strong><span>Six foundation levels and one Unified advanced band.</span></div><div><strong>Published vocabulary catalog</strong><span>{foundationCount.toLocaleString("en-US")} Level 1–6 entries plus the published advanced catalog.</span></div><div><strong>Guest start and optional account sync</strong><span>Begin without an account; sign in later for eligible sync.</span></div></div>
      <p className="home-sr-only">{PUBLIC_FORMAL_CONTENT_SCOPE}{" "}{PUBLIC_DICTIONARY_SCOPE}{" "}{PUBLIC_ACCOUNT_SCOPE}</p>
    </section>

    <section className="home-section home-faq" aria-labelledby="faq-heading">
      <div className="home-section-copy"><p className="home-eyebrow">Before you begin</p><h2 id="faq-heading">Frequently asked questions</h2><p>Six short answers to the questions that matter before starting.</p></div>
      <div className="home-faq-list">{faqItems.map((item, index) => <details key={item.question} open={index === 0}><summary><span>{item.question}</span><HomeIcon name="arrow" className="h-5 w-5" /></summary><div><p>{item.answer}</p><Link href={item.href}>{item.linkLabel} <span aria-hidden="true">→</span></Link></div></details>)}</div>
    </section>

    <section className="home-final-cta"><p className="home-eyebrow">Your next useful step</p><h2>Start with the right level.</h2><p>Get a learning suggestion, then follow one connected route through vocabulary, listening, practice and review.</p><Link href="/placement">Find my starting level</Link></section>
  </main><SiteFooter/></>;
}
