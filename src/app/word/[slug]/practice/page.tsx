import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedWordBySlug } from "../../../../lib/dictionary/runtime-word";
import { getDictionaryLearningContext } from "../../../../lib/dictionary/p2-server";
import { buildDictionaryPractice } from "../../../../lib/dictionary/p2-learning";
import { StudyPage } from "../../../components/study-shell";
import { WordPracticeClient } from "./word-practice-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublishedWordBySlug(decodeURIComponent(slug));
  return result.status === "published"
    ? { title: `Practise ${result.item.hanzi} | HSKKit`, description: `Practise the meaning, pinyin and available synthesized pronunciation for ${result.item.hanzi}.` }
    : { title: "Word practice | HSKKit" };
}

export default async function WordPracticePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPublishedWordBySlug(decodeURIComponent(slug));
  if (result.status !== "published") notFound();
  const context = await getDictionaryLearningContext(result.item.id);
  if (!context) notFound();
  const exercises = buildDictionaryPractice(context.current, context.candidates);

  return <StudyPage><main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
    <nav className="mx-auto mb-4 flex max-w-3xl flex-wrap items-center gap-2 text-sm text-slate-600" aria-label="Breadcrumb">
      <Link href="/dictionary" className="font-semibold text-blue-700 hover:underline">Dictionary</Link><span aria-hidden="true">/</span>
      <Link href={`/word/${encodeURIComponent(result.item.slug)}`} className="font-semibold text-blue-700 hover:underline">{result.item.hanzi}</Link><span aria-hidden="true">/</span><span>Practice</span>
    </nav>
    <header className="mx-auto mb-5 max-w-3xl border-b border-slate-200 pb-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">HSK {context.current.levelBand === "7-9" ? "7–9" : context.current.levelBand} · Word practice</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Test your recall</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Complete a question to add it to Review.</p>
    </header>
    <WordPracticeClient word={context.current} exercises={exercises} />
  </main></StudyPage>;
}
