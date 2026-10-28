import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StudyPage } from "../../../components/study-shell";
import { categoryForTopic, findTopicBySlug, learningTopics } from "@/lib/topics/catalog";
import { getTrustedTopicPracticeQuestions } from "@/lib/topics/server";
import { publicTopicPracticeQuestion } from "@/lib/topics/practice";
import { TopicPracticeClient } from "./topic-practice-client";
import { TopicIcon } from "../../topic-visuals";
import { topicIconFor, topicVisualFor } from "@/lib/topics/visuals";

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 86_400;

export function generateStaticParams() {
  return learningTopics.filter((topic) => topic.status === "published").map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const topic = findTopicBySlug((await params).slug);
  return topic ? {
    title: `${topic.title} Continuous Practice | HSKKit`,
    description: `Practise meaning, pinyin and scene understanding inside the ${topic.title} topic, with listening when approved synthesized audio is available.`,
    robots: { index: false, follow: true },
  } : { title: "Topic practice unavailable | HSKKit", robots: { index: false, follow: false } };
}

export default async function TopicPracticePage({ params }: Props) {
  const topic = findTopicBySlug((await params).slug);
  if (!topic || topic.status !== "published") notFound();
  const category = categoryForTopic(topic);
  if (!category) notFound();
  const visual = topicVisualFor(category.slug);
  const trusted = await getTrustedTopicPracticeQuestions(topic.slug);
  const questions = trusted ? trusted.questions.map(publicTopicPracticeQuestion) : [];
  const hasListening = questions.some((question) => question.mode === "listening");

  return <StudyPage>
    <main className="mx-auto w-full max-w-[980px] flex-1 px-[16px] py-[24px] sm:px-[24px] md:py-[32px] lg:px-[40px]">
      <nav className="flex min-h-11 flex-wrap items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
        <Link href="/topics" className="inline-flex min-h-11 items-center font-semibold hover:text-blue-700">Topics</Link><span aria-hidden="true">/</span>
        <Link href={`/topics/${topic.slug}`} className="inline-flex min-h-11 items-center font-semibold hover:text-blue-700">{topic.title}</Link><span aria-hidden="true">/</span><span className="text-slate-800">Practice</span>
      </nav>
      <header className={`mt-2 flex items-start gap-4 overflow-hidden rounded-2xl border px-[20px] py-[16px] sm:px-[24px] sm:py-[20px] ${visual.border} ${visual.softSurface}`}>
        <span className={`grid size-12 shrink-0 place-items-center rounded-2xl bg-white/90 shadow-sm ${visual.iconText}`}><TopicIcon name={topicIconFor(topic.slug)} className="size-7" title={`${topic.title} icon`} /></span>
        <div><p className={`text-xs font-black uppercase tracking-[0.15em] ${visual.mutedText}`}>Continuous topic practice</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{topic.title}</h1>
        <p className="mt-1 text-sm leading-6 text-slate-700">Answer one continuous, server-checked topic set. Results save to your existing learning record.</p></div>
      </header>
      {questions.length < 4 ? <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950"><h2 className="font-black">Practice is temporarily unavailable</h2><p className="mt-2 text-sm leading-6">HSKKit could not verify the complete topic word set. No partial or guessed questions are shown.</p><Link href={`/topics/${topic.slug}`} className="mt-4 inline-flex min-h-11 items-center font-bold text-blue-700">Return to topic</Link></section> : <>{!hasListening ? <p className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600">No verified formal recording is published for this topic, so listening is omitted rather than replaced with synthetic audio.</p> : null}<TopicPracticeClient topicSlug={topic.slug} topicTitle={topic.title} visualKey={topic.slug} categorySlug={category.slug} questions={questions} /></>}
    </main>
  </StudyPage>;
}
