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
    ? { title: `Practise ${result.item.hanzi} | HSKKit`, description: `Practise the meaning, pinyin and available formal audio for ${result.item.hanzi}.` }
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
    <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-600" aria-label="Breadcrumb">
      <Link href="/dictionary" className="font-semibold text-blue-700 hover:underline">Dictionary</Link><span aria-hidden="true">/</span>
      <Link href={`/word/${encodeURIComponent(result.item.slug)}`} className="font-semibold text-blue-700 hover:underline">{result.item.hanzi}</Link><span aria-hidden="true">/</span><span>Practice</span>
    </nav>
    <header className="mb-6 rounded-3xl bg-slate-950 px-5 py-6 text-white sm:px-8 sm:py-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">HSK {context.current.levelBand === "7-9" ? "7–9" : context.current.levelBand} · focused word practice</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-4xl font-black text-white sm:text-5xl">{context.current.hanzi}</h1><p className="mt-2 text-lg text-slate-200">{context.current.pinyin} · {context.current.meaning}</p></div>
        <p className="max-w-sm text-sm leading-6 text-slate-300">Each answer is saved to your learning history and schedules a real Review card. Listening appears only when formal audio is published.</p>
      </div>
    </header>
    <WordPracticeClient word={context.current} exercises={exercises} />
  </main></StudyPage>;
}
