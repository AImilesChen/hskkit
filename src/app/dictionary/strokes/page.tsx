import type { Metadata } from "next";
import Link from "next/link";
import { StudyPage } from "../../components/study-shell";
import { characterIndexMetadata, strokeDirectory } from "@/lib/dictionary/character-index";

export const metadata: Metadata = {
  title: "Chinese Characters by Stroke Count — HSKKit",
  description: "Browse 2,970 HSK characters from 1 to 23 strokes, with exact character counts for every group.",
  alternates: { canonical: "/dictionary/strokes" },
};

export default function StrokeDirectoryPage() {
  return <StudyPage><main className="mx-auto w-full max-w-[980px] flex-1 px-4 py-6 sm:px-6 md:py-9 lg:px-10">
    <nav className="mb-4 text-sm text-slate-500" aria-label="Breadcrumb"><Link href="/dictionary?mode=characters" className="inline-flex min-h-11 items-center font-semibold hover:text-blue-700">Dictionary</Link><span className="mx-2" aria-hidden="true">/</span><span>Stroke counts</span></nav>
    <header className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.15em] text-blue-700">Character index</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Browse characters by stroke count</h1><p className="mt-3 leading-7 text-slate-600">The complete {characterIndexMetadata.characterCount.toLocaleString()}-character HSK index runs from 1 to 23 strokes. Open a group to see every matching character, then continue to its meaning, pinyin and HSK words.</p></header>
    <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4" aria-label="Stroke count directory">{strokeDirectory.map((item) => <Link key={item.strokes} href={`/dictionary?mode=characters&strokes=${item.strokes}`} className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-500 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"><span className="block text-2xl font-extrabold text-slate-950 group-hover:text-blue-800">{item.strokes} {item.strokes === 1 ? "stroke" : "strokes"}</span><span className="mt-2 block text-sm text-slate-600">{item.characterCount} {item.characterCount === 1 ? "character" : "characters"}</span></Link>)}</section>
  </main></StudyPage>;
}
