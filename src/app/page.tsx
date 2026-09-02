import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "./site-footer";
import SiteHeader from "./site-header";
import HomeNextStep from "./components/home-next-step";
import HomeIcon, { type HomeIconName } from "./components/home-icon";
import "./homepage.css";
import {
  formalWordAudioUrlByContentId,
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
  status?: "Limited";
  core?: boolean;
};

const toolGroups: { title: string; description: string; tools: Tool[] }[] = [
  {
    title: "Start",
    description: "Choose an evidence-based starting point and see today’s next task.",
    tools: [
      { title: "Placement", text: "Get a suggested HSK 3.0 starting level.", href: "/placement", icon: "target", core: true },
      { title: "Today", text: "Open due review and the next focused task.", href: "/today", icon: "calendar", core: true },
    ],
  },
  {
    title: "Learn",
    description: "Build vocabulary through published levels and real situations.",
    tools: [
      { title: "Topics", text: "Learn linked words through practical situations.", href: "/topics", icon: "route", core: true },
      { title: "Vocabulary", text: "Browse the published catalog by HSK level.", href: "/vocabulary/1", icon: "book" },
      { title: "Reading", text: "Use levelled passages and review actions.", href: "/reading/morning-study-routine", icon: "reading", status: "Limited" },
    ],
  },
  {
    title: "Practise",
    description: "Turn recall, listening and mistakes into saved review evidence.",
    tools: [
      { title: "Listening", text: "Practise approved word and context audio.", href: "/listen", icon: "headphones", core: true },
      { title: "Practice", text: "Check meaning, pinyin and listening recall.", href: "/practice", icon: "pencil" },
      { title: "Mistakes", text: "Return to unresolved answers before they fade.", href: "/mistakes", icon: "review" },
    ],
  },
  {
    title: "Reference",
    description: "Look up published material or choose a test without leaving the system.",
    tools: [
      { title: "Dictionary", text: "Search the published HSK 3.0 catalog.", href: "/dictionary", icon: "search" },
      { title: "Basic Mock", text: "Take the published HSK 1–6 timed mock.", href: "/mock/basic", icon: "timer" },
      { title: "Advanced Mock", text: "Assess the unified HSK 7–9 ability band.", href: "/mock/advanced", icon: "target" },
    ],
  },
];

const learningSteps: { number: string; title: string; text: string; href: string; action: string; icon: HomeIconName }[] = [
  { number: "01", title: "Find your starting level", text: "Use placement as learning guidance, never as an official examination result.", href: "/placement", action: "Start level check", icon: "target" },
  { number: "02", title: "Learn focused vocabulary", text: "Open the next published words by level or through a practical topic.", href: "/topics", action: "Browse topics", icon: "book" },
  { number: "03", title: "Practise listening", text: "Hear approved audio, answer in context and keep the attempt in your record.", href: "/listen", action: "Open listening", icon: "headphones" },
  { number: "04", title: "Complete today’s review", text: "Bring mistakes and due memories back through the connected SRS loop.", href: "/review", action: "Review due items", icon: "review" },
];

const faqItems = [
  {
    question: "What is HSK 3.0?",
    answer: "HSK 3.0 is the nine-level Chinese proficiency framework used by HSKKit to organise its published vocabulary and study routes. Levels 1–6 are shown separately; Levels 7–9 form one unified advanced ability band.",
    href: "/hsk-3-0",
    linkLabel: "Read the HSK 3.0 guide",
  },
  {
    question: "How does the starting-level check work?",
    answer: "Placement checks responses across published material and suggests a practical starting level. You can use that suggestion to open the matching level or continue into Today’s queue.",
    href: "/placement",
    linkLabel: "Open Placement",
  },
  {
    question: "Is the placement result an official HSK score?",
    answer: "No. It is general learning guidance, not an official examination result, certification or guarantee of exam performance.",
    href: "/disclaimer",
    linkLabel: "Read the learning disclaimer",
  },
  {
    question: "What can I use for free?",
    answer: "Free includes the published catalog, Placement and Today path, up to 10 new items and 20 successful SRS ratings daily, standard practice and review, one active device, and the most recent 7 days up to 100 history entries.",
    href: "/pricing",
    linkLabel: "Compare current plans",
  },
  {
    question: "What does Pro include?",
    answer: "Pro adds unlimited learning and reviews subject to anti-abuse safeguards, Focused Review, 500 monthly AI credits, up to 10,000 history entries and sync across 3 active devices. AI is limited to 10 requests per hour and one concurrent request.",
    href: "/pricing",
    linkLabel: "See Pro details",
  },
  {
    question: "Does every published word have audio?",
    answer: "No. Not every word in the published catalog has audio. When a learning route includes audio, HSKKit uses a QA-approved synthesized Mandarin asset with source, version and QA records; withdrawn or unapproved audio is not presented as published content.",
    href: "/content-license",
    linkLabel: "See audio provenance",
  },
  {
    question: "Why are Levels 7–9 shown as one advanced band?",
    answer: "The advanced examination framework is assessed as one unified ability band, so HSKKit keeps Levels 7–9 together instead of presenting three independent exams or separate claims.",
    href: "/levels",
    linkLabel: "Browse all levels",
  },
  {
    question: "Can I start as a guest and sync later?",
    answer: "Yes. You can begin studying as a guest. A verified account is used to restore and sync eligible progress across supported devices; account and plan limits still apply.",
    href: "/login?returnTo=%2Ftoday",
    linkLabel: "Sign in when ready",
  },
] as const;

const sceneItems = [
  {
    asset: "desk-practice",
    label: "Desktop practice",
    title: "Grocery shopping in context",
    text: "Work through a real eight-question topic session with server-checked answers and saved results.",
    href: "/topics/grocery-shopping/practice",
  },
  {
    asset: "mobile-listening",
    label: "Listening practice",
    title: "Short listening rounds between plans",
    text: "Choose a level and a bounded question set when audio practice fits the moment.",
    href: "/listen",
  },
  {
    asset: "tablet-review",
    label: "Today’s queue",
    title: "One plan keeps the loop moving",
    text: "See real time budgets, learning tasks and SRS limits together before choosing the next action.",
    href: "/today",
  },
] as const;

function ResponsiveSceneImage({ asset, alt }: { asset: string; alt: string }) {
  const sizes = asset === "desk-practice"
    ? "(min-width: 1024px) 52vw, (min-width: 640px) 100vw, calc(100vw - 36px)"
    : "(min-width: 1024px) 30vw, (min-width: 640px) 50vw, calc(100vw - 36px)";
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
  const previewWord = levelOnePreviewWords.find((word) => formalWordAudioUrlByContentId.has(word.id)) ?? levelOnePreviewWords[0];
  const previewWords = previewWord
    ? [previewWord, ...levelOnePreviewWords.filter((word) => word.id !== previewWord.id).slice(0, 2)]
    : [];
  const previewAudioUrl = previewWord ? formalWordAudioUrlByContentId.get(previewWord.id) : undefined;
  const foundationCount = foundationLevels.reduce((total, entry) => total + entry.contentCount, 0);
  const maxCatalogCount = Math.max(...levels.map((entry) => entry.contentCount));
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
        <p className="home-lede">Start with a suggested level, then keep vocabulary, listening, checked practice, mistakes and spaced review in one connected study path.</p>
        <HomeNextStep />
      </div>

      <div className="home-product-shell" role="group" aria-labelledby="home-product-preview-title">
        <div className="home-product-heading">
          <div><p id="home-product-preview-title" className="home-product-kicker">Example learning path</p><h2>Today’s next task</h2></div>
          <span>Real published data</span>
        </div>
        <ol className="home-product-route" aria-label="Example connected study path">
          {["Level", "Word", "Listen", "Answer", "Review"].map((label, index) => <li key={label} className={index < 3 ? "is-active" : ""}><span>{index + 1}</span>{label}</li>)}
        </ol>
        {previewWord ? <div className="home-product-task">
          <div className="home-product-task-meta"><span>Published HSK 1 word</span><span>Meaning recall</span></div>
          <div className="home-product-word">
            <div><p lang="zh-Hans">{previewWord.hanzi}</p><span>{previewWord.pinyin}</span></div>
            {previewAudioUrl ? <audio controls preload="none" src={previewAudioUrl}>Your browser does not support published word audio.</audio> : null}
          </div>
          <p className="home-product-question">Which meaning matches this word?</p>
          <ol className="home-product-options">{previewWords.map((word, index) => <li key={word.id} className={index === 0 ? "is-correct" : ""}><span>{String.fromCharCode(65 + index)}</span><p>{word.meaning}</p></li>)}</ol>
          <Link href={`/word/${previewWord.id}/practice`} className="home-product-link">Try this practice <HomeIcon name="arrow" className="h-4 w-4" /></Link>
        </div> : null}
      </div>
    </section>

    <section className="home-section" aria-labelledby="path-heading">
      <div className="home-section-copy"><p className="home-eyebrow">How HSKKit connects study</p><h2 id="path-heading">One connected path from level check to daily review.</h2><p>Each completed action leaves a clear next step instead of turning placement, listening, practice and review into unrelated tools.</p></div>
      <ol className="home-learning-path">{learningSteps.map((step, index) => <li key={step.number} className="home-flow-node">
        <Link href={step.href} className="home-flow-card">
          <span className="home-flow-icon"><HomeIcon name={step.icon} className="h-6 w-6" /></span>
          <span className="home-flow-number">{step.number}</span>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
          <span className="home-flow-action">{step.action}<HomeIcon name="arrow" className="h-4 w-4" /></span>
        </Link>
        {index < learningSteps.length - 1 ? <span className="home-flow-connector" aria-hidden="true"><HomeIcon name="arrow" className="h-4 w-4" /></span> : null}
      </li>)}</ol>
    </section>

    <section className="home-section home-scenes" aria-labelledby="scenes-heading">
      <div className="home-section-copy"><p className="home-eyebrow">Built around real study moments</p><h2 id="scenes-heading">Study fits the rhythm of real life.</h2><p>HSKKit works across focused topic practice, short listening rounds and the Today queue that keeps the learning loop moving.</p></div>
      <div className="home-scene-grid">{sceneItems.map((scene, index) => <Link key={scene.asset} href={scene.href} className={`home-scene home-scene-${index + 1}`}>
        <ResponsiveSceneImage asset={scene.asset} alt={`Real HSKKit ${scene.label.toLowerCase()} screen`} />
        <span className="home-scene-copy"><span>{scene.label}</span><strong>{scene.title}</strong><small>{scene.text}</small></span>
      </Link>)}</div>
    </section>

    <section className="home-section" aria-labelledby="catalog-heading">
      <div className="home-section-heading"><div className="home-section-copy"><p className="home-eyebrow">Published HSK 3.0 catalog</p><h2 id="catalog-heading">Explore the published HSK 3.0 catalog.</h2><p>Browse QA-approved vocabulary by level. Levels 7–9 share one Unified advanced band.</p></div><Link href="/levels" className="home-text-link">Browse level details <HomeIcon name="arrow" className="h-4 w-4" /></Link></div>
      <div className="home-level-grid">{foundationLevels.map((entry) => <Link key={entry.level} href={`/vocabulary/${entry.level}`} className="home-level-card">
        <span>HSK 3.0</span><div><h3>Level {entry.level}</h3><strong>{entry.contentCount.toLocaleString("en-US")}</strong></div>
        <div className="home-level-density" aria-hidden="true"><span style={{width:`${Math.max(4,Math.round(entry.contentCount/maxCatalogCount*100))}%`}}/></div>
        <span className="home-level-action">Open vocabulary <HomeIcon name="arrow" className="h-4 w-4" /></span>
      </Link>)}{advancedLevel ? <Link href="/vocabulary/7" className="home-level-card home-level-card-advanced"><span>HSK 3.0</span><div><h3>Levels 7–9</h3><strong>{advancedLevel.contentCount.toLocaleString("en-US")}</strong></div><p>Unified advanced band</p><span className="home-level-action">Open advanced catalog <HomeIcon name="arrow" className="h-4 w-4" /></span></Link> : null}</div>
    </section>

    <section className="home-section" aria-labelledby="tools-heading">
      <div className="home-section-copy"><p className="home-eyebrow">Focused tools</p><h2 id="tools-heading">Choose a tool for the task in front of you.</h2><p>The connected study path stays first. Tests, skill practice and reference routes remain easy to find without competing with the main action.</p></div>
      <div className="home-tool-grid">{toolGroups.map((group) => <section key={group.title} className="home-tool-group"><div><h3>{group.title}</h3><p>{group.description}</p></div><div className="home-tool-list">{group.tools.map((tool) => <Link key={tool.title} href={tool.href} className={`home-tool-card ${tool.core ? "home-tool-card-core" : ""}`}><span className="home-tool-icon"><HomeIcon name={tool.icon} className="h-5 w-5" /></span><span className="home-tool-copy"><span><strong>{tool.title}</strong>{tool.status ? <em>{tool.status}</em> : null}</span><small>{tool.text}</small></span><span aria-hidden="true" className="home-tool-arrow"><HomeIcon name="arrow" className="h-4 w-4" /></span></Link>)}</div></section>)}</div>
    </section>

    <section className="home-section home-transparency" aria-labelledby="scope-heading">
      <div className="home-section-copy"><p className="home-eyebrow">Content transparency</p><h2 id="scope-heading">Published and transparent</h2><p>Summary counts stay visible here. Detailed source, rights and account notes remain available when you need them.</p></div>
      <div><div className="home-scope-stats"><div><strong>{foundationCount.toLocaleString("en-US")}</strong><span>Level 1–6 entries</span></div><div><strong>{advancedLevel?.contentCount.toLocaleString("en-US")}</strong><span>Unified Level 7–9 entries</span></div><div><strong>Guest study</strong><span>Account used for sync</span></div></div>
      <details className="home-scope-details"><summary>Read the detailed public-scope notes</summary><div><p>{PUBLIC_FORMAL_CONTENT_SCOPE}</p><p>{PUBLIC_DICTIONARY_SCOPE}</p><p>{PUBLIC_ACCOUNT_SCOPE}</p><p><strong>Stripe Test Store is open.</strong> Store resources are separate one-time purchases; no live card charge is enabled.</p></div></details></div>
    </section>

    <section className="home-section home-faq" aria-labelledby="faq-heading">
      <div className="home-section-copy"><p className="home-eyebrow">Before you begin</p><h2 id="faq-heading">Frequently asked questions</h2><p>Core study, account, audio and plan rules in one place, aligned with the current product pages.</p></div>
      <div className="home-faq-list">{faqItems.map((item, index) => <details key={item.question} open={index === 0}><summary><span>{item.question}</span><HomeIcon name="arrow" className="h-5 w-5" /></summary><div><p>{item.answer}</p><Link href={item.href}>{item.linkLabel} <span aria-hidden="true">→</span></Link>{item.question === "What can I use for free?" ? <Link href="/refund-policy" className="home-faq-secondary-link">Refund policy</Link> : null}</div></details>)}</div>
    </section>

    <section className="home-final-cta"><p className="home-eyebrow">Your next useful step</p><h2>Start with the right level.</h2><p>Use a learning suggestion to choose the starting point, then keep vocabulary, listening, mistakes and review connected.</p><Link href="/placement">Find my starting level</Link></section>
  </main><SiteFooter/></>;
}
