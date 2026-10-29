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
  return (
    <StudyPage>
      <main className="mx-auto w-full max-w-[1240px] flex-1 px-5 py-6 sm:px-6 lg:px-12 lg:py-8">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "https://hskkit.com/" }, { "@type": "ListItem", position: 2, name: "HSK 3.0 guide", item: "https://hskkit.com/hsk-3-0" }] }) }} />
        <nav aria-label="Breadcrumb" className="text-sm text-slate-600"><Link className="hover:text-blue-700" href="/">Home</Link> / HSK 3.0 guide</nav>

        <header className="mt-6 grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-blue-700">Exam and study standards</p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.13] tracking-tight text-slate-950 sm:text-5xl lg:text-[3.35rem]">HSK 3.0: what changes in 2026?</h1>
            <p className="mt-5 text-lg leading-8 text-slate-700">The exam provider has announced a worldwide launch for <strong>13 December 2026</strong>. For a test, check the official exam syllabus. For vocabulary study, HSKKit&apos;s Level 1–9 catalog follows the 2021 grading standard.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a className="inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700" href={syllabus}>Official exam syllabus <span aria-hidden="true" className="ml-2">↗</span></a>
              <Link className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-900 hover:border-blue-400 hover:text-blue-700" href="/levels">Explore study levels <span aria-hidden="true" className="ml-2">→</span></Link>
            </div>
            <p className="mt-5 text-sm text-slate-500">Reviewed 29 October 2026 · Independent study guide, not an official exam notice.</p>
          </div>
          <figure aria-labelledby="standards-figure-title" className="rounded-[28px] border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 shadow-sm sm:p-7">
            <figcaption id="standards-figure-title" className="text-sm font-bold uppercase tracking-[0.14em] text-blue-800">Which source is for which goal?</figcaption>
            <div className="mt-5 rounded-2xl bg-slate-950 px-5 py-4 text-white"><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200">HSK 3.0 transition</p><p className="mt-1 text-lg font-bold">Choose by what you need to do</p></div>
            <div aria-hidden="true" className="mx-auto h-6 w-px bg-blue-300" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-blue-200 bg-white p-5"><span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase text-blue-800">Taking an exam</span><p className="mt-4 text-lg font-bold">2025 exam syllabus</p><p className="mt-2 text-sm leading-6 text-slate-600">Provider&apos;s exam vocabulary, tasks and sample questions.</p></div>
              <div className="rounded-2xl border border-emerald-200 bg-white p-5"><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase text-emerald-800">Studying vocabulary</span><p className="mt-4 text-lg font-bold">2021 grading standard</p><p className="mt-2 text-sm leading-6 text-slate-600">Source of HSKKit&apos;s Level 1–9 word catalog.</p></div>
            </div>
            <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600"><strong className="text-slate-900">Older HSK 2.0 materials:</strong> the previous six-level system. Check the label before using them for exam practice.</p>
          </figure>
        </header>

        <section aria-labelledby="route-title" className="mt-16 border-t border-slate-200 pt-12">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,.7fr)_minmax(0,1.3fr)] lg:gap-10">
            <div><p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Find your route</p><h2 id="route-title" className="mt-2 text-3xl font-bold tracking-tight">Start with your goal</h2><p className="mt-4 max-w-md leading-7 text-slate-600">These resources serve different purposes. Choose the one that matches what you are doing today.</p></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="text-sm font-bold text-blue-700">01 / EXAM</span><h3 className="mt-3 text-lg font-bold">Preparing to test?</h3><p className="mt-2 flex-1 text-sm leading-6 text-slate-600">Confirm your test center&apos;s version, then follow the official syllabus.</p><a className="mt-5 font-semibold text-blue-700 hover:underline" href={syllabus}>Open syllabus ↗</a></article>
              <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="text-sm font-bold text-emerald-700">02 / STUDY</span><h3 className="mt-3 text-lg font-bold">Growing vocabulary?</h3><p className="mt-2 flex-1 text-sm leading-6 text-slate-600">Browse HSKKit&apos;s published 2021-standard Level 1–9 word lists.</p><Link className="mt-5 font-semibold text-blue-700 hover:underline" href="/levels">Choose a level →</Link></article>
              <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="text-sm font-bold text-slate-600">03 / COMPARE</span><h3 className="mt-3 text-lg font-bold">Using older materials?</h3><p className="mt-2 flex-1 text-sm leading-6 text-slate-600">See how HSK 2.0 and the newer learning framework differ.</p><Link className="mt-5 font-semibold text-blue-700 hover:underline" href="/hsk-2-0-vs-3-0">Compare versions →</Link></article>
            </div>
          </div>
        </section>

        <section aria-labelledby="transition-title" className="mt-16 rounded-[28px] bg-slate-950 px-6 py-7 text-white sm:px-7 lg:px-12">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-300">Know the difference</p><h2 id="transition-title" className="mt-2 text-3xl font-bold tracking-tight">The transition at a glance</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="border-l-2 border-blue-400 pl-5"><p className="text-sm font-bold text-blue-300">2021 · STUDY STANDARD</p><h3 className="mt-2 text-lg font-bold">Level 1–9 catalog</h3><p className="mt-2 text-sm leading-6 text-slate-300">The standard behind HSKKit&apos;s published vocabulary counts.</p></div>
            <div className="border-l-2 border-cyan-400 pl-5"><p className="text-sm font-bold text-cyan-300">2025 · EXAM SYLLABUS</p><h3 className="mt-2 text-lg font-bold">Exam preparation source</h3><p className="mt-2 text-sm leading-6 text-slate-300">Use the provider&apos;s syllabus for exam-specific scope and questions.</p></div>
            <div className="border-l-2 border-emerald-400 pl-5"><p className="text-sm font-bold text-emerald-300">13 DEC 2026 · ANNOUNCED LAUNCH</p><h3 className="mt-2 text-lg font-bold">Check your test center</h3><p className="mt-2 text-sm leading-6 text-slate-300">Confirm the exam version, format and registration details before booking.</p></div>
          </div>
          <a className="mt-6 inline-flex font-semibold text-blue-200 hover:underline" href={notice}>Read the official launch notice ↗</a>
        </section>

        <section aria-labelledby="faq-title" className="mx-auto mt-16 max-w-[860px] pb-4">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Quick answers</p><h2 id="faq-title" className="mt-2 text-3xl font-bold tracking-tight">Frequently asked questions</h2>
          <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 sm:px-7">{faqs.map(([question, answer]) => <details key={question} className="py-5"><summary className="cursor-pointer pr-4 font-semibold">{question}</summary><p className="mt-3 max-w-[72ch] leading-7 text-slate-600">{answer}</p></details>)}</div>
        </section>
      </main>
    </StudyPage>
  );
}

