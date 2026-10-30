import type { Metadata } from "next";
import Link from "next/link";
import { StudyPage } from "../components/study-shell";

export const metadata: Metadata = {
  title: "HSK 2.0 vs HSK 3.0: Exam and Vocabulary Differences | HSKKit",
  description: "Compare the older six-level HSK with the HSK 3.0 exam transition. HSKKit's HSK 1–4 lists align with the 2025 exam syllabus; Levels 5–9 are still being migrated.",
  alternates: { canonical: "/hsk-2-0-vs-3-0" },
};

const rows = [
  { topic: "Level structure", old: "Six exam levels, HSK 1–6.", updated: "Nine-level proficiency framework; advanced Levels 7–9 are handled as one advanced band." },
  { topic: "Exam preparation", old: "Use the syllabus and sample questions for the older exam version.", updated: "Use the official 2025 HSK 3.0 examination syllabus and sample questions, and confirm your test center's arrangements." },
  { topic: "Vocabulary on HSKKit", old: "Pages marked Traditional HSK 2.0 preserve the older vocabulary scope.", updated: "HSK 1–4 now have 300, 200, 500 and 1,000 distinct words aligned with the 2025 exam syllabus. Levels 5–9 still follow the 2021 study standard during migration." },
  { topic: "Study records", old: "Earlier vocabulary and test activity keeps its original version label.", updated: "HSKKit does not silently convert older attempts into a new exam score." },
];

export default function ComparisonPage() {
  return <StudyPage><main className="mx-auto w-full max-w-[1000px] flex-1 px-5 py-12 md:px-16 md:py-16">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "https://hskkit.com/" }, { "@type": "ListItem", position: 2, name: "HSK 3.0 guide", item: "https://hskkit.com/hsk-3-0" }, { "@type": "ListItem", position: 3, name: "HSK 2.0 vs HSK 3.0", item: "https://hskkit.com/hsk-2-0-vs-3-0" }] }) }} />
    <nav aria-label="Breadcrumb" className="text-sm text-slate-600"><Link href="/">Home</Link> / <Link href="/hsk-3-0">HSK 3.0</Link> / Comparison</nav>
    <header className="mt-6 max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.15em] text-blue-600">Exam version guide</p><h1 className="mt-3 text-4xl font-bold md:text-5xl">HSK 2.0 vs HSK 3.0</h1><p className="mt-5 text-lg leading-8 text-slate-700">The exam provider has announced a worldwide HSK 3.0 launch on 13 December 2026. Your choice of preparation material depends on the exam version offered by your test center. HSKKit's HSK 1–4 vocabulary lists now align with the 2025 exam syllabus; Levels 5–9 are being migrated.</p><p className="mt-3 text-sm text-slate-500">Reviewed 29 October 2026 · <a className="underline" href="https://old.chinesetest.cn/gonewcontent.do?flag=kdnew&id=51336883">Official launch notice</a></p></header>
    <section className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="hidden grid-cols-[.7fr_1fr_1fr] bg-slate-900 px-5 py-4 font-bold text-white sm:grid"><span>Topic</span><span>HSK 2.0</span><span>HSK 3.0 and current study resources</span></div>{rows.map((item) => <article key={item.topic} className="grid gap-3 border-t border-slate-200 p-5 first:border-t-0 sm:grid-cols-[.7fr_1fr_1fr]"><h2 className="font-bold">{item.topic}</h2><p className="text-slate-600"><span className="mb-1 block text-xs font-bold uppercase text-slate-500 sm:hidden">HSK 2.0</span>{item.old}</p><p className="text-slate-600"><span className="mb-1 block text-xs font-bold uppercase text-slate-500 sm:hidden">HSK 3.0</span>{item.updated}</p></article>)}</section>
    <section className="mt-9 rounded-2xl border border-blue-200 bg-blue-50 p-6"><h2 className="text-xl font-bold">Which should I prepare for?</h2><p className="mt-2 leading-7">Confirm your exam date, test center and version on the <a className="font-semibold text-blue-700 underline" href="https://www.chinesetest.cn/syllabus">official exam website</a>. For vocabulary study, browse <Link className="font-semibold text-blue-700 underline" href="/levels">HSKKit's level catalog</Link>. HSK 1–4 align with the 2025 syllabus; Levels 5–9 still use the earlier study standard.</p></section>
    <Link href="/hsk-3-0" className="mt-8 inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-5 py-3 font-bold text-white">Read the full HSK 3.0 guide</Link>
  </main></StudyPage>;
}

