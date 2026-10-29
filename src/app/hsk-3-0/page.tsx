import type { Metadata } from "next";
import Link from "next/link";
import { StudyPage } from "../components/study-shell";

const notice = "https://old.chinesetest.cn/gonewcontent.do?flag=kdnew&id=51336883";
const syllabus = "https://www.chinesetest.cn/syllabus";

export const metadata: Metadata = {
  title: "HSK 3.0 Guide: 2026 Exam Launch, Syllabus and Levels | HSKKit",
  description: "The HSK 3.0 launch is scheduled for 13 December 2026. Understand the official exam syllabus, the 2021 grading standard and legacy HSK 2.0 resources.",
  alternates: { canonical: "/hsk-3-0" },
  openGraph: { title: "HSK 3.0 Guide: 2026 Exam Launch and Syllabus", description: "Understand the HSK 3.0 transition and choose a suitable learning resource.", url: "https://hskkit.com/hsk-3-0", type: "article" },
};

const faqs = [
  ["When does HSK 3.0 start?", "The exam provider has announced a worldwide launch on 13 December 2026. Confirm the version, format and registration details with your test center."],
  ["Is HSKKit's vocabulary catalog the 2025 exam syllabus?", "No. HSKKit's current Level 1–9 catalog follows the 2021 Chinese Proficiency Grading Standards (GF0025-2021). Its word counts are not the official 2025 exam-syllabus counts."],
  ["What if I studied for HSK 2.0?", "Your language skills remain useful. Check which exam version your test center offers, then use the matching syllabus and sample questions for exam preparation."],
  ["Are HSK 7, 8 and 9 three separate tests?", "HSKKit presents Levels 7–9 as a unified advanced ability band. Check official exam instructions for test and scoring arrangements."],
];

export default function Hsk30Page() {
  return <StudyPage><main className="mx-auto w-full max-w-[1000px] flex-1 px-5 py-12 md:px-16 md:py-16">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "https://hskkit.com/" }, { "@type": "ListItem", position: 2, name: "HSK 3.0 guide", item: "https://hskkit.com/hsk-3-0" }] }) }} />
    <nav aria-label="Breadcrumb" className="text-sm text-slate-600"><Link href="/">Home</Link> / HSK 3.0 guide</nav>
    <header className="mt-6 max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.15em] text-blue-600">Exam and study standards</p><h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">HSK 3.0: what changes in 2026?</h1><p className="mt-5 text-lg leading-8 text-slate-700">The exam provider has announced a worldwide HSK 3.0 launch for <strong>13 December 2026</strong>. HSKKit's current Level 1–9 word catalog follows the <strong>2021 grading standard</strong>; its counts are not the 2025 exam-syllabus counts.</p><p className="mt-3 text-sm text-slate-500">Reviewed 29 October 2026 · Independent study guide, not an official exam notice.</p></header>
    <section className="mt-9 rounded-2xl border border-blue-200 bg-blue-50 p-6"><h2 className="text-xl font-bold">Which resource should I use?</h2><p className="mt-3 leading-7 text-slate-700">For an exam, confirm the version offered by your test center and read the <a className="font-semibold text-blue-700 underline" href={syllabus}>official examination syllabus</a>. For general study, explore HSKKit's <Link className="font-semibold text-blue-700 underline" href="/levels">2021-standard learning catalog</Link>. Older practice guides marked HSK 2.0 follow the previous six-level system.</p></section>
    <section className="mt-12"><h2 className="text-2xl font-bold">Three standards you may encounter</h2><div className="mt-5 grid gap-4 md:grid-cols-3"><article className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-bold">Legacy HSK 2.0</h3><p className="mt-2 text-sm leading-6 text-slate-600">The older six-level exam and vocabulary resources, retained with legacy labels.</p></article><article className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-bold">2021 grading standard</h3><p className="mt-2 text-sm leading-6 text-slate-600">GF0025-2021 is the source of HSKKit's current Level 1–9 catalog and displayed word counts.</p></article><article className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-bold">2025 exam syllabus</h3><p className="mt-2 text-sm leading-6 text-slate-600">The exam provider's syllabus is the source for exam-specific vocabulary, tasks and sample questions.</p></article></div></section>
    <section className="mt-12"><h2 className="text-2xl font-bold">Official transition and next steps</h2><ol className="mt-4 list-decimal space-y-3 pl-6 leading-7 text-slate-700"><li>Read the <a className="text-blue-700 underline" href={notice}>official launch notice</a> for the 13 December 2026 exam and registration details.</li><li>Confirm the exam version and format with your chosen test center.</li><li>Use the <a className="text-blue-700 underline" href={syllabus}>official syllabus and sample questions</a> for exam preparation. Use HSKKit's catalog for ongoing vocabulary study.</li></ol></section>
    <section className="mt-12"><h2 className="text-2xl font-bold">Frequently asked questions</h2><div className="mt-4 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-6">{faqs.map(([question, answer]) => <details key={question} className="py-5"><summary className="cursor-pointer font-semibold">{question}</summary><p className="mt-3 leading-7 text-slate-600">{answer}</p></details>)}</div></section>
    <div className="mt-10 flex flex-wrap gap-3"><Link href="/levels" className="inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-5 py-3 font-bold text-white">Explore study levels</Link><Link href="/hsk-2-0-vs-3-0" className="inline-flex min-h-11 items-center rounded-lg border border-blue-600 px-5 py-3 font-bold text-blue-700">Compare HSK 2.0 and 3.0</Link></div>
  </main></StudyPage>;
}

