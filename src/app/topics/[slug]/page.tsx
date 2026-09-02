import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StudyPage } from "../../components/study-shell";
import { AudioPlaybackControl } from "../../components/audio-playback-control";
import { TopicCard } from "../topic-card";
import {
  categoryForTopic,
  findTopicBySlug,
  findTopicCategoryBySlug,
  relatedTopicsFor,
  topicsForCategory,
} from "@/lib/topics/catalog";
import { getVerifiedTopicsSnapshot, getVerifiedTopicWords, verifiedTopicsFromSnapshot } from "@/lib/topics/server";
import { TopicLearningPanel } from "../topic-learning-panel";
import { TopicLessonAudioPlayer } from "../topic-lesson-audio-player";
import { CategoryVisual, TopicHeroScene } from "../topic-visuals";
import { topicVisualFor } from "@/lib/topics/visuals";
import { topicMeaningForCard } from "@/lib/topics/presentation";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  const category = findTopicCategoryBySlug(slug);
  if (category) {
    const verified = verifiedTopicsFromSnapshot(await getVerifiedTopicsSnapshot());
    const expected = topicsForCategory(category.id);
    const ready = expected.length > 0 && expected.every((topic) => verified.some((item) => item.id === topic.id));
    return {
      title: `${category.title} Chinese Topics — ${category.titleZh} | HSKKit`,
      description: category.description,
      alternates: ready ? { canonical: `/topics/${category.slug}` } : undefined,
      robots: ready ? undefined : { index: false, follow: false },
      openGraph: ready ? { title: `${category.title} Chinese Topics | HSKKit`, description: category.description, url: `https://hskkit.com/topics/${category.slug}`, type: "website" } : undefined,
    };
  }
  const topic = findTopicBySlug(slug);
  if (!topic) return { title: "Topic unavailable — HSKKit", robots: { index: false, follow: false } };
  const verified = await getVerifiedTopicWords(topic);
  const ready = verified.status === "ready";
  return {
    title: topic.seoTitle,
    description: topic.seoDescription,
    alternates: ready ? { canonical: `/topics/${topic.slug}` } : undefined,
    robots: ready ? undefined : { index: false, follow: false },
    openGraph: ready ? { title: topic.seoTitle, description: topic.seoDescription, url: `https://hskkit.com/topics/${topic.slug}`, type: "article" } : undefined,
  };
}

async function CategoryPage({ slug }: { slug: string }) {
  const category = findTopicCategoryBySlug(slug);
  if (!category) notFound();
  const expected = topicsForCategory(category.id);
  const verified = verifiedTopicsFromSnapshot(await getVerifiedTopicsSnapshot());
  const topics = expected.filter((topic) => verified.some((item) => item.id === topic.id));
  const categoryReady = expected.length > 0 && topics.length === expected.length;
  const categoryVisual = topicVisualFor(category.slug);
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://hskkit.com" },
      { "@type": "ListItem", position: 2, name: "Topics", item: "https://hskkit.com/topics" },
      { "@type": "ListItem", position: 3, name: category.title, item: `https://hskkit.com/topics/${category.slug}` },
    ],
  };
  return <StudyPage>
    <main className="mx-auto w-full max-w-[1160px] flex-1 px-4 py-8 sm:px-6 md:py-12 lg:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <nav className="flex min-h-11 flex-wrap items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb"><Link href="/" className="inline-flex min-h-11 items-center px-1 font-semibold hover:text-blue-700">Home</Link><span aria-hidden="true">/</span><Link href="/topics" className="inline-flex min-h-11 items-center font-semibold hover:text-blue-700">Topics</Link><span aria-hidden="true">/</span><span className="text-slate-800">{category.title}</span></nav>
      <header className={`mt-5 grid gap-6 rounded-3xl border p-5 shadow-[0_22px_55px_-44px_rgba(15,23,42,0.35)] sm:p-8 lg:grid-cols-[180px_minmax(0,1fr)_260px] lg:items-center ${categoryVisual.border} ${categoryVisual.softSurface}`}>
        <CategoryVisual categorySlug={category.slug} title={category.title} />
        <div><p className={`text-sm font-bold ${categoryVisual.mutedText}`}>{category.titleZh}</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{category.title}</h1><p className="mt-3 max-w-2xl leading-7 text-slate-600">{category.description}</p></div>
        <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><p className={`text-xs font-bold uppercase tracking-[0.12em] ${categoryVisual.mutedText}`}>Learning outcome</p><p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{category.outcome}</p>{categoryReady && topics[0] ? <Link href={`/topics/${topics[0].slug}`} className="mt-4 inline-flex min-h-11 w-full items-center justify-between rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">Start recommended topic <span aria-hidden="true">→</span></Link> : null}</div>
      </header>
      {!categoryReady ? <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950"><h2 className="font-black">This category is temporarily unavailable</h2><p className="mt-2 text-sm leading-6">HSKKit could not verify every mapped word against the active release, so incomplete topic collections are hidden.</p></section> : <section className="mt-9" aria-labelledby="category-topics-title"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Recommended sequence</p><h2 id="category-topics-title" className="mt-2 text-2xl font-black text-slate-950">Choose a focused topic</h2></div><p className="text-sm text-slate-600">{topics.length} original topic collections</p></div><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{topics.map((topic) => <TopicCard key={topic.id} topic={topic} />)}</div></section>}
      <Link href="/topics" className="mt-10 inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-5 font-bold text-slate-800 hover:border-blue-400 hover:text-blue-700">← All topic categories</Link>
    </main>
  </StudyPage>;
}

async function TopicDetailPage({ slug }: { slug: string }) {
  const topic = findTopicBySlug(slug);
  if (!topic) notFound();
  const category = categoryForTopic(topic);
  if (!category) notFound();
  const topicVisual = topicVisualFor(category.slug);

  const verified = await getVerifiedTopicWords(topic);
  const wordsAvailable = verified.status === "ready";
  const words = wordsAvailable ? verified.words : [];
  const audioAvailableCount = words.filter((word) => Boolean(word.audioAsset)).length;
  const verifiedTopics = verifiedTopicsFromSnapshot(await getVerifiedTopicsSnapshot());
  const related = relatedTopicsFor(topic).filter((item) => verifiedTopics.some((verifiedTopic) => verifiedTopic.id === item.id));
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://hskkit.com" },
      { "@type": "ListItem", position: 2, name: "Topics", item: "https://hskkit.com/topics" },
      { "@type": "ListItem", position: 3, name: category.title, item: `https://hskkit.com/topics/${category.slug}` },
      { "@type": "ListItem", position: 4, name: topic.title, item: `https://hskkit.com/topics/${topic.slug}` },
    ],
  };
  const schema = wordsAvailable ? [
    breadcrumbSchema,
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: topic.title,
      alternateName: topic.titleZh,
      description: topic.description,
      url: `https://hskkit.com/topics/${topic.slug}`,
      educationalLevel: topic.levelBands.map((level) => `HSK ${level}`).join(", "),
      learningResourceType: "Vocabulary collection",
      teaches: topic.learningGoal,
      timeRequired: `PT${topic.estimatedMinutes}M`,
      isAccessibleForFree: true,
    },
  ] : [breadcrumbSchema];

  return <StudyPage>
    <main className="mx-auto w-full max-w-[1160px] flex-1 px-4 py-6 sm:px-6 md:py-10 lg:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <nav className="flex min-h-11 flex-wrap items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb"><Link href="/" className="inline-flex min-h-11 items-center px-1 font-semibold hover:text-blue-700">Home</Link><span aria-hidden="true">/</span><Link href="/topics" className="inline-flex min-h-11 items-center font-semibold hover:text-blue-700">Topics</Link><span aria-hidden="true">/</span><Link href={`/topics/${category.slug}`} className="inline-flex min-h-11 items-center font-semibold hover:text-blue-700">{category.title}</Link><span aria-hidden="true">/</span><span className="text-slate-800">{topic.title}</span></nav>

      <header className="mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b1f4b] to-[#123b75] text-white shadow-[0_24px_65px_-48px_rgba(11,31,75,0.85)]">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
          <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-400/15 px-3 py-1 text-xs font-bold text-blue-100 ring-1 ring-blue-200/25">HSK {topic.levelBands.join(" · ")}</span><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-100">{wordsAvailable ? "Published collection" : "Verification unavailable"}</span></div><p className="mt-4 text-lg font-black text-sky-200 sm:text-xl">{topic.titleZh}</p><h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-[44px]">{topic.title}</h1><p className="mt-3 max-w-2xl text-base leading-7 text-blue-50/80">{topic.description}</p>{wordsAvailable ? <Link href={`/topics/${topic.slug}/practice`} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-blue-500 px-5 text-sm font-bold text-white hover:bg-blue-400">Start practice <span className="ml-2" aria-hidden="true">→</span></Link> : null}</div>
          <div><TopicHeroScene visualKey={topic.slug} categorySlug={category.slug} title={topic.title} titleZh={topic.titleZh} /><dl className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-blue-950/30 p-2.5 text-center ring-1 ring-white/15"><div className="rounded-xl bg-white/10 px-2 py-2.5"><dt className="text-xs text-blue-100/75">Words</dt><dd className="mt-1 text-xl font-black">{wordsAvailable ? words.length : "—"}</dd></div><div className="rounded-xl bg-white/10 px-2 py-2.5"><dt className="text-xs text-blue-100/75">Time</dt><dd className="mt-1 text-xl font-black">{topic.estimatedMinutes}<span className="ml-0.5 text-xs">m</span></dd></div><div className="rounded-xl bg-white/10 px-2 py-2.5"><dt className="text-xs text-blue-100/75">Audio</dt><dd className="mt-1 text-xl font-black">{wordsAvailable ? audioAvailableCount : "—"}</dd></div></dl></div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <section className="min-w-0" aria-labelledby="topic-words-title">
          <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Published HSK 3.0 vocabulary</p><h2 id="topic-words-title" className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Core words</h2><p className="mt-2 text-sm leading-6 text-slate-600">Ordered for this learning situation. Open a word for its complete verified definition.</p></div>
          {!wordsAvailable ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950"><h3 className="font-bold">Published words are temporarily unavailable</h3><p className="mt-2 text-sm leading-6">The topic remains published, but HSKKit could not verify the active word release for this request. Try again later or open the dictionary.</p></div> : null}

          {wordsAvailable && topic.lessons ? <div className="mt-5 space-y-8">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5"><p className="text-xs font-black uppercase tracking-[0.15em] text-blue-700">Three practical lessons</p><h2 className="mt-2 text-xl font-black text-slate-950">Learn the complete real-world sequence</h2><p className="mt-2 text-sm leading-6 text-slate-700">Each mini-lesson contains verified words with published pronunciation, useful combinations, a short dialogue and one real-world task.</p></div>
            {topic.lessons.map((lesson, lessonIndex) => {
              const lessonWords = lesson.wordAssetIds.flatMap((assetId) => words.filter((word) => word.assetId === assetId));
              return <article key={lesson.id} id={`lesson-${lesson.id}`} className="scroll-mt-24 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/70">
                <header className="border-b border-slate-200 bg-white p-5 sm:p-6"><p className="text-xs font-black uppercase tracking-[0.15em] text-blue-700">Lesson {lessonIndex + 1} · {lessonWords.length} words</p><h3 className="mt-2 text-2xl font-black text-slate-950"><span lang="zh-Hans">{lesson.titleZh}</span><span className="mt-1 block text-base font-bold text-slate-600">{lesson.title}</span></h3><p className="mt-3 text-sm leading-6 text-slate-700">{lesson.outcome}</p></header>
                <div className="p-4 sm:p-6"><p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700">Listen and learn</p><div className="mt-3"><TopicLessonAudioPlayer lessonTitle={lesson.title} tracks={lessonWords.map((word) => ({ assetId: word.assetId, hanzi: word.hanzi, pinyin: word.pinyin, audioAsset: word.audioAsset }))} /></div><ol className="mt-3 grid gap-3 sm:grid-cols-2">{lessonWords.map((word) => <li key={word.assetId} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-3xl font-black text-slate-950" lang="zh-Hans">{word.hanzi}</p><p className="mt-1 font-bold text-blue-700">{word.pinyin}</p></div><span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">HSK {word.levelBand}</span></div>
                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{topicMeaningForCard(word.meaning)}</p><AudioPlaybackControl asset={word.audioAsset} className="mt-3" />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><Link href={`/word/${encodeURIComponent(word.assetId)}`} className="inline-flex min-h-11 items-center px-1 text-sm font-bold text-blue-700">Details →</Link><Link href={`/word/${encodeURIComponent(word.assetId)}/practice`} className="inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white">Learn word</Link></div>
                </li>)}</ol>
                <div className="mt-5 grid gap-4 xl:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-4"><h4 className="font-black text-slate-950">Useful combinations</h4><ul className="mt-2 divide-y divide-slate-100">{lesson.expressions.map((expression) => <li key={expression.hanzi} className="py-3"><p className="font-black text-slate-950" lang="zh-Hans">{expression.hanzi}</p><p className="mt-1 break-words text-sm font-bold text-blue-700">{expression.pinyin}</p><p className="mt-1 text-sm leading-6 text-slate-600">{expression.meaning}</p></li>)}</ul></section>
                <section className="rounded-2xl border border-slate-200 bg-white p-4"><h4 className="font-black text-slate-950">Short dialogue</h4><ol className="mt-2 space-y-2">{lesson.dialogue.map((turn, index) => <li key={`${turn.speaker}-${index}`} className={`rounded-xl p-3 ${turn.speaker === "A" ? "bg-blue-50" : "bg-emerald-50"}`}><p className="font-black text-slate-950"><span className="mr-2 text-xs text-slate-500">{turn.speaker}</span><span lang="zh-Hans">{turn.hanzi}</span></p><p className="mt-1 break-words text-sm font-bold text-slate-700">{turn.pinyin}</p><p className="mt-1 text-sm leading-5 text-slate-600">{turn.meaning}</p></li>)}</ol></section></div>
                <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-amber-800">Real-world task</p><h4 className="mt-2 text-lg font-black text-slate-950">{lesson.task.title}</h4><p className="mt-2 text-sm leading-6 text-slate-700">{lesson.task.scenario}</p><ul className="mt-3 grid gap-2 sm:grid-cols-3">{lesson.task.successCriteria.map((criterion) => <li key={criterion} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold leading-5 text-slate-700">✓ {criterion}</li>)}</ul></section>
                <div className="mt-4 grid gap-2 sm:grid-cols-2"><Link href={`/word/${encodeURIComponent(lesson.wordAssetIds[0])}/practice`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-200 bg-white px-4 text-center text-sm font-bold text-blue-700">Start this lesson</Link><Link href={`/topics/${topic.slug}/practice`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-center text-sm font-bold text-white">Continue listening practice →</Link>{topic.lessons?.[lessonIndex + 1] ? <Link href={`#lesson-${topic.lessons[lessonIndex + 1].id}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-4 text-center text-sm font-bold text-emerald-800 sm:col-span-2">Next mini-lesson: {topic.lessons[lessonIndex + 1].title} ↓</Link> : null}</div>
                </div>
              </article>;
            })}
          </div> : null}

          {wordsAvailable && !topic.lessons ? <ol className="mt-5 grid gap-3 sm:grid-cols-2">{words.map((word, index) => <li key={word.assetId} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-3xl font-black text-slate-950" lang="zh-Hans">{word.hanzi}</p><p className="mt-1 font-bold text-blue-700">{word.pinyin}</p></div><span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{index + 1} · HSK {word.levelBand}</span></div>
            <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{topicMeaningForCard(word.meaning)}</p>
            <AudioPlaybackControl asset={word.audioAsset} className="mt-4" />
            <div className="mt-4 flex items-center justify-between gap-3"><Link href={`/word/${encodeURIComponent(word.assetId)}`} className="inline-flex min-h-11 items-center px-1 text-sm font-bold text-blue-700 hover:text-blue-900">Word details →</Link><Link href={`/word/${encodeURIComponent(word.assetId)}/practice`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-center text-sm font-bold text-white hover:bg-blue-700">Practice</Link></div>
          </li>)}</ol> : null}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <TopicLearningPanel topic={topic} />
          <section className={`rounded-2xl border p-5 ${topicVisual.border} ${topicVisual.surface}`}><p className={`text-xs font-bold uppercase tracking-[0.12em] ${topicVisual.mutedText}`}>Learning goal</p><h2 className="mt-2 text-lg font-black text-slate-950">Use the words in context</h2><p className="mt-2 text-sm leading-6 text-slate-700">{topic.learningGoal}</p></section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black text-slate-950">Continue learning</h2><Link href={`/topics/${topic.slug}/practice`} className="mt-3 inline-flex min-h-11 w-full items-center justify-between rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">Continue practice <span aria-hidden="true">→</span></Link><nav className="mt-3 divide-y divide-slate-100" aria-label="Related learning tools"><Link href="/today" className="flex min-h-11 items-center justify-between text-sm font-bold text-slate-700 hover:text-blue-700">Today <span aria-hidden="true">→</span></Link><Link href="/review" className="flex min-h-11 items-center justify-between text-sm font-bold text-slate-700 hover:text-blue-700">Review <span aria-hidden="true">→</span></Link><Link href="/dictionary" className="flex min-h-11 items-center justify-between text-sm font-bold text-slate-700 hover:text-blue-700">Dictionary <span aria-hidden="true">→</span></Link></nav></section>
          <p className="px-1 text-xs leading-5 text-slate-500">Published synthesized pronunciation is labelled explicitly. Words without a published asset show an unavailable state instead of a silent omission.</p>
        </aside>
      </div>

      <section className="mt-12 grid gap-5 lg:grid-cols-2 lg:items-start" aria-label="Topic expressions and context">
        {!topic.lessons ? <div className="contents">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Useful expressions</p><h2 className="mt-2 text-2xl font-black text-slate-950">Say it naturally</h2><ul className="mt-4 divide-y divide-slate-100">{topic.expressions.map((expression) => <li key={expression.hanzi} className="py-4 first:pt-1 last:pb-1"><p className="text-xl font-black text-slate-950" lang="zh-Hans">{expression.hanzi}</p><p className="mt-1 font-bold text-blue-700">{expression.pinyin}</p><p className="mt-1 text-sm leading-6 text-slate-600">{expression.meaning}</p></li>)}</ul></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Scene dialogue</p><h2 className="mt-2 text-2xl font-black text-slate-950">A short original exchange</h2><ol className="mt-5 space-y-3">{topic.dialogue.map((turn, index) => <li key={`${turn.speaker}-${index}`} className={`rounded-xl px-3 py-4 sm:px-4 ${turn.speaker === "A" ? "sm:mr-3 bg-blue-50" : "sm:ml-3 bg-emerald-50"}`}><div className="flex items-start gap-2.5"><span className={`grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-black text-white ${turn.speaker === "A" ? "bg-blue-700" : "bg-emerald-700"}`}>{turn.speaker}</span><div className="min-w-0"><p className="text-lg font-black leading-7 text-slate-950" lang="zh-Hans">{turn.hanzi}</p><p className="mt-1 break-words text-sm font-bold leading-6 text-slate-700">{turn.pinyin}</p><p className="mt-1 text-sm leading-6 text-slate-600">{turn.meaning}</p></div></div></li>)}</ol></article>
        </div> : null}
        <article className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6 lg:col-span-2"><p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-800">Culture tip</p><h2 className="mt-2 text-xl font-black text-slate-950">Use the language with context</h2><p className="mt-3 max-w-4xl leading-7 text-slate-700">{topic.cultureNote}</p><p className="mt-3 text-xs leading-5 text-slate-500">This HSKKit note provides practical context rather than a universal rule; habits and wording vary by region and situation.</p></article>
      </section>

      <section className="mt-12 border-t border-slate-200 pt-8" aria-labelledby="related-topics-title"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Keep exploring</p><h2 id="related-topics-title" className="mt-2 text-2xl font-black text-slate-950">Recommended next topics</h2></div><Link href={`/topics/${category.slug}`} className="inline-flex min-h-11 items-center font-bold text-blue-700">View category →</Link></div><div className="mt-5 grid gap-4 md:grid-cols-2">{related.map((item) => <TopicCard key={item.id} topic={item} />)}</div></section>
    </main>
  </StudyPage>;
}

export default async function TopicOrCategoryPage({ params }: Props) {
  const slug = (await params).slug;
  if (findTopicCategoryBySlug(slug)) return <CategoryPage slug={slug} />;
  if (findTopicBySlug(slug)) return <TopicDetailPage slug={slug} />;
  notFound();
}
