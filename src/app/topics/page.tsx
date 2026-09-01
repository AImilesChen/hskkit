import type { Metadata } from "next";
import Link from "next/link";
import { StudyPage } from "../components/study-shell";
import { learningTopics, topicCategories } from "@/lib/topics/catalog";
import { getVerifiedTopicsSnapshot, verifiedTopicsFromSnapshot } from "@/lib/topics/server";
import { TopicsBrowser } from "./topics-browser";
import { CategoryVisual, TopicHeroScene } from "./topic-visuals";
import { topicVisualFor } from "@/lib/topics/visuals";

export const dynamic = "force-dynamic";

const publishedCount = learningTopics.filter((topic) => topic.status === "published").length;

export async function generateMetadata(): Promise<Metadata> {
  const verified = verifiedTopicsFromSnapshot(await getVerifiedTopicsSnapshot());
  const ready = verified.length === publishedCount;
  return {
    title: "Learn Chinese by Topic — Real-life HSK 3.0 Vocabulary | HSKKit",
    description: "Browse original HSKKit topic collections for daily life, food and travel, backed by published HSK 3.0 vocabulary and existing word practice.",
    alternates: ready ? { canonical: "/topics" } : undefined,
    robots: ready ? undefined : { index: false, follow: false },
    openGraph: ready ? {
      title: "Learn Chinese by Topic | HSKKit",
      description: "Choose a real-life theme, study published HSK 3.0 words and continue to word practice.",
      url: "https://hskkit.com/topics",
      type: "website",
    } : undefined,
  };
}

export default async function TopicsPage() {
  const snapshot = await getVerifiedTopicsSnapshot();
  const verifiedTopics = verifiedTopicsFromSnapshot(snapshot);
  const catalogReady = verifiedTopics.length === publishedCount;
  const visibleCategories = topicCategories.filter((category) => verifiedTopics.some((topic) => topic.categoryId === category.id));
  const topicsFor = (categoryId: string) => verifiedTopics.filter((topic) => topic.categoryId === categoryId).sort((left, right) => left.sortOrder - right.sortOrder);
  const schema = catalogReady ? {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "HSKKit Chinese topics",
    description: "Original real-life topic collections using published HSK 3.0 vocabulary.",
    url: "https://hskkit.com/topics",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: verifiedTopics.length,
      itemListElement: verifiedTopics.map((topic, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "LearningResource",
          name: topic.title,
          alternateName: topic.titleZh,
          url: `https://hskkit.com/topics/${topic.slug}`,
          educationalLevel: topic.levelBands.map((level) => `HSK ${level}`).join(", "),
          learningResourceType: "Vocabulary collection",
        },
      })),
    },
  } : null;

  return <StudyPage>
    <main className="mx-auto w-full max-w-[1160px] flex-1 px-4 py-4 sm:px-6 md:py-12 lg:px-10">
      {schema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /> : null}
      <nav className="flex min-h-11 items-center text-sm font-semibold text-slate-500" aria-label="Breadcrumb"><Link href="/" className="inline-flex min-h-11 items-center px-1 hover:text-blue-700">Home</Link><span className="mx-2" aria-hidden="true">/</span><span className="text-slate-800">Topics</span></nav>

      <header className="mt-3 grid gap-4 overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-sky-100 px-5 py-5 text-slate-950 shadow-[0_24px_70px_-52px_rgba(30,64,175,0.55)] sm:mt-5 sm:gap-7 sm:px-8 sm:py-9 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-center">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Practical HSK 3.0 collections</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">Learn Chinese through real-life topics</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700 sm:mt-4 sm:text-lg sm:leading-7">Choose a situation, study a focused set of published HSK words, then open the real word detail or practise it in the existing learning system.</p>
          {catalogReady && visibleCategories[0] ? <Link href={`/topics/${visibleCategories[0].slug}`} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 font-bold text-white hover:bg-blue-500 sm:mt-5">Start with {visibleCategories[0].title} <span className="ml-2" aria-hidden="true">→</span></Link> : null}
        </div>
        <div className="hidden sm:block">{catalogReady && verifiedTopics[0] && visibleCategories[0] ? <TopicHeroScene visualKey={verifiedTopics[0].slug} categorySlug={visibleCategories[0].slug} title={verifiedTopics[0].title} titleZh={verifiedTopics[0].titleZh} /> : null}<dl className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-blue-100 bg-white/80 p-3 text-center shadow-sm">
          <div className="rounded-xl px-2 py-3"><dt className="text-xs text-slate-500">Categories</dt><dd className="mt-1 text-2xl font-black text-slate-950">{catalogReady ? visibleCategories.length : "—"}</dd></div>
          <div className="rounded-xl border-x border-blue-100 px-2 py-3"><dt className="text-xs text-slate-500">Topics</dt><dd className="mt-1 text-2xl font-black text-slate-950">{catalogReady ? verifiedTopics.length : "—"}</dd></div>
          <div className="rounded-xl px-2 py-3"><dt className="text-xs text-slate-500">Source</dt><dd className="mt-1 text-sm font-bold text-slate-900">{catalogReady ? "HSK 3.0" : "Checking"}</dd></div>
        </dl></div>
      </header>

      {!catalogReady ? <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950" aria-labelledby="topics-unavailable-title"><h2 id="topics-unavailable-title" className="text-lg font-black">Topic collections are temporarily unavailable</h2><p className="mt-2 max-w-3xl text-sm leading-6">HSKKit could not verify every mapped word against the active published release. The collections are hidden rather than showing incomplete or stale learning content.</p><Link href="/dictionary" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-amber-900 px-5 font-bold text-white">Open the verified dictionary</Link></section> : null}

      {catalogReady ? <>
        <section className="mt-6 sm:mt-8" aria-labelledby="category-title">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Choose your setting</p><h2 id="category-title" className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Browse by category</h2></div><p className="max-w-xl text-sm leading-6 text-slate-600">Start with the situation you need now. HSK labels show the published levels represented inside each topic.</p></div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">{visibleCategories.map((category) => {
            const count = topicsFor(category.id).length;
            const visual = topicVisualFor(category.slug);
            return <Link key={category.id} href={`/topics/${category.slug}`} className={`group flex h-full flex-col rounded-2xl border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:p-5 ${visual.border}`}><CategoryVisual categorySlug={category.slug} title={category.title} /><div className="mt-4"><h3 className="min-h-[56px] text-xl font-black leading-7 text-slate-950">{category.title}</h3><div className="mt-2 flex items-center justify-between gap-3"><p className={`font-semibold ${visual.mutedText}`}>{category.titleZh}</p><span className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${visual.surface} ${visual.mutedText}`}>{count} topics</span></div></div><p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{category.description}</p><span className="mt-4 inline-flex min-h-11 items-center font-bold text-blue-700">Explore category <span className="ml-2" aria-hidden="true">→</span></span></Link>;
          })}</div>
        </section>

        <TopicsBrowser topics={verifiedTopics} />
      </> : null}

      <section className="mt-12 rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-7"><h2 className="text-xl font-black text-slate-950">How topic learning connects</h2><p className="mt-2 max-w-3xl leading-7 text-slate-700">Topic pages organise existing published words without creating a second dictionary. Open any word for definitions and approved audio, or practise that word through the existing saved-attempt and review flow.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/vocabulary/1" className="inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 font-bold text-white hover:bg-blue-700">Browse by HSK level</Link><Link href="/dictionary" className="inline-flex min-h-11 items-center rounded-xl border border-blue-300 bg-white px-5 font-bold text-blue-700 hover:bg-blue-100">Search the dictionary</Link></div></section>
    </main>
  </StudyPage>;
}
