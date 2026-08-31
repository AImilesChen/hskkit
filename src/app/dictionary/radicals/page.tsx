import type { Metadata } from "next";
import Link from "next/link";
import { StudyPage } from "../../components/study-shell";
import { radicalDirectory } from "@/lib/dictionary/character-index";

export const metadata: Metadata = {
  title: "214 Chinese Radicals by Stroke Count — HSKKit",
  description: "Browse all 214 Kangxi radicals by stroke count, with honest counts for the 2,971-character HSK index.",
  alternates: { canonical: "/dictionary/radicals" },
};

export default function RadicalDirectoryPage() {
  const groups = Array.from({ length: 17 }, (_, index) => index + 1).map((strokes) => ({
    strokes,
    radicals: radicalDirectory.filter((item) => item.strokes === strokes),
  }));
  return <StudyPage><main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-6 sm:px-6 md:py-9 lg:px-10">
    <nav className="mb-4 text-sm text-slate-500" aria-label="Breadcrumb"><Link href="/dictionary?mode=characters" className="inline-flex min-h-11 items-center font-semibold hover:text-blue-700">Dictionary</Link><span className="mx-2" aria-hidden="true">/</span><span>Radicals</span></nav>
    <header className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.15em] text-blue-700">Character index</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">214 Kangxi radicals</h1><p className="mt-3 leading-7 text-slate-600">Browse the complete traditional radical system by radical stroke count. Each number shows how many of HSKKit&apos;s 2,971 indexed characters use that radical; zero means the radical does not occur in the current HSK word catalog.</p></header>
    <div className="mt-8 space-y-8">{groups.map((group) => <section key={group.strokes} aria-labelledby={`radical-strokes-${group.strokes}`}><h2 id={`radical-strokes-${group.strokes}`} className="mb-3 text-xl font-bold text-slate-950">{group.strokes} {group.strokes === 1 ? "stroke" : "strokes"}</h2><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{group.radicals.map((item) => item.characterCount > 0 ? <Link key={item.number} href={`/dictionary?mode=characters&radical=${encodeURIComponent(item.radical)}`} className="group flex min-h-[76px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-500 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"><strong className="text-3xl text-slate-950 group-hover:text-blue-800">{item.radical}</strong><span className="min-w-0"><span className="block truncate text-sm font-bold text-slate-800">{item.number}. {item.name}</span><span className="mt-1 block text-xs text-slate-500">{item.characterCount} {item.characterCount === 1 ? "character" : "characters"}</span></span></Link> : <div key={item.number} className="flex min-h-[76px] items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-slate-400" aria-label={`${item.radical}, radical ${item.number}, ${item.name}, no indexed HSK characters`}><strong className="text-3xl">{item.radical}</strong><span className="min-w-0"><span className="block truncate text-sm font-bold">{item.number}. {item.name}</span><span className="mt-1 block text-xs">0 characters</span></span></div>)}</div></section>)}</div>
  </main></StudyPage>;
}
