import type { Metadata } from "next";
import Link from "next/link";
import { StudyPage } from "../components/study-shell";

const notice = "https://old.chinesetest.cn/gonewcontent.do?flag=kdnew&id=51336883";
const syllabus = "https://www.chinesetest.cn/syllabus";
const syllabusPdf = "https://hsk.cn-bj.ufileos.com/3.0/%E6%96%B0%E7%89%88HSK%E8%80%83%E8%AF%95%E5%A4%A7%E7%BA%B21219.pdf";
const officialHsk = "https://www.chinesetest.cn/HSK";

const examWordCounts = [
  { level: "HSK 1", words: "300", note: "First foundation level" },
  { level: "HSK 2", words: "500", note: "Includes Level 1" },
  { level: "HSK 3", words: "1,000", note: "End of the elementary band" },
  { level: "HSK 4", words: "2,000", note: "Start of the intermediate band" },
  { level: "HSK 5", words: "3,600", note: "Includes Levels 1–4" },
  { level: "HSK 6", words: "5,400", note: "End of the intermediate band" },
  { level: "HSK 7–9", words: "11,000", note: "One shared advanced band" },
] as const;

export const metadata: Metadata = {
  title: "HSK 3.0 Guide (2026): Exam Date, Syllabus & Word Counts | HSKKit",
  description: "See the HSK 3.0 exam date, official 2025 syllabus, vocabulary counts by level and what the new exam covers. Understand how HSKKit's 2021-standard catalog differs.",
  alternates: { canonical: "/hsk-3-0" },
  openGraph: { title: "HSK 3.0 Guide (2026): Exam Date, Syllabus & Word Counts", description: "Official exam word counts, syllabus scope and a clear route to the right study material.", url: "https://hskkit.com/hsk-3-0", type: "article" },
};

const faqs = [
  ["When does HSK 3.0 start?", "The exam provider has announced a worldwide launch on 13 December 2026. Confirm the version, format and registration details with your test center."],
  ["How many words are in the HSK 3.0 exam syllabus?", "The official 2025 exam syllabus lists 300 cumulative entries at HSK 1, 500 at HSK 2, 1,000 at HSK 3, 2,000 at HSK 4, 3,600 at HSK 5, 5,400 at HSK 6 and 11,000 across HSK 7–9. These are exam-syllabus counts, not HSKKit catalog totals."],
  ["What does the HSK 3.0 syllabus cover?", "The provider organizes it around tasks, topics, vocabulary, Chinese characters and grammar. Exam sections and scoring vary by level, so check the official level page and sample questions for the test you plan to take."],
  ["Is HSKKit's vocabulary catalog the 2025 exam syllabus?", "No. HSKKit's current Level 1–9 catalog follows the 2021 Chinese Proficiency Grading Standards (GF0025-2021). Its word counts are not the official 2025 exam-syllabus counts."],
  ["What if I studied for HSK 2.0?", "Your language skills remain useful. Check which exam version your test center offers, then use the matching syllabus and sample questions for exam preparation."],
  ["Are HSK 7, 8 and 9 three separate tests?", "No. The exam provider presents HSK 7–9 as one advanced test that returns a level evaluation. Check its official level page for the current sections, scoring and duration."],
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

        <nav aria-label="On this page" className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm">
          <span className="font-bold text-slate-900">On this page</span>
          <a className="font-semibold text-blue-700 hover:underline" href="#exam-facts-title">Exam date</a>
          <a className="font-semibold text-blue-700 hover:underline" href="#word-counts-title">Word counts</a>
          <a className="font-semibold text-blue-700 hover:underline" href="#syllabus-scope-title">Syllabus scope</a>
          <a className="font-semibold text-blue-700 hover:underline" href="#prep-title">How to prepare</a>
          <a className="font-semibold text-blue-700 hover:underline" href="#faq-title">Questions</a>
        </nav>

        <section aria-labelledby="exam-facts-title" className="mt-16 border-t border-slate-200 pt-12">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">2026 exam facts</p>
          <h2 id="exam-facts-title" className="mt-2 text-3xl font-bold tracking-tight">When is the new HSK 3.0 exam?</h2>
          <p className="mt-4 max-w-[78ch] leading-7 text-slate-700">The official syllabus was published in November 2025 and states an implementation date of July 2026. Separately, the exam provider announced <strong>13 December 2026</strong> as the worldwide HSK 3.0 launch date. Check your test center&apos;s registration page for the version and format of the sitting you plan to take.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Syllabus published</p><p className="mt-2 text-xl font-bold text-slate-950">November 2025</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Syllabus effective</p><p className="mt-2 text-xl font-bold text-slate-950">July 2026</p></div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5"><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Worldwide exam launch</p><p className="mt-2 text-xl font-bold text-slate-950">13 December 2026</p></div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">Sources: <a className="font-semibold text-blue-700 underline" href={syllabusPdf}>official HSK 3.0 examination syllabus</a> and <a className="font-semibold text-blue-700 underline" href={notice}>launch announcement</a>.</p>
        </section>

        <section aria-labelledby="word-counts-title" className="mt-16">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Official exam vocabulary</p>
          <h2 id="word-counts-title" className="mt-2 text-3xl font-bold tracking-tight">HSK 3.0 vocabulary counts by level</h2>
          <p className="mt-4 max-w-[78ch] leading-7 text-slate-700">The 2025 HSK 3.0 exam syllabus numbers its vocabulary entries by level. These totals are <strong>cumulative</strong>: a higher level includes entries from lower levels. Levels 7–9 share one advanced vocabulary band.</p>
          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(290px,.6fr)]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="w-full border-collapse text-left text-sm sm:text-base">
                <caption className="sr-only">Cumulative vocabulary entries in the official 2025 HSK 3.0 exam syllabus</caption>
                <thead className="bg-slate-950 text-white"><tr><th scope="col" className="px-4 py-3 font-semibold sm:px-5">Exam level</th><th scope="col" className="px-4 py-3 text-right font-semibold sm:px-5">Cumulative entries</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{examWordCounts.map(({ level, words, note }) => <tr key={level} className="even:bg-slate-50"><th scope="row" className="px-4 py-3 font-semibold text-slate-950 sm:px-5">{level}<span className="ml-3 hidden text-sm font-normal text-slate-500 sm:inline">{note}</span></th><td className="px-4 py-3 text-right font-bold tabular-nums text-blue-700 sm:px-5">{words}</td></tr>)}</tbody>
              </table>
            </div>
            <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h3 className="text-lg font-bold text-slate-950">Why do other HSK 3.0 lists show different counts?</h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">Some lists use the 2021 Chinese Proficiency Grading Standards. HSKKit&apos;s current Level 1–9 learning catalog uses that standard. The table here reports entries in the separate <strong>2025 examination syllabus</strong>, so it should not be used as a count of HSKKit&apos;s published words.</p>
              <Link className="mt-4 inline-flex font-semibold text-blue-700 hover:underline" href="/levels">View HSKKit&apos;s 2021-standard study catalog →</Link>
            </aside>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">Source: numbered vocabulary section of the <a className="font-semibold text-blue-700 underline" href={syllabusPdf}>official HSK 3.0 examination syllabus (PDF)</a>. For the exact entries and any updates, use the provider&apos;s syllabus.</p>
        </section>

        <section aria-labelledby="syllabus-scope-title" className="mt-16">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Beyond a word list</p>
          <h2 id="syllabus-scope-title" className="mt-2 text-3xl font-bold tracking-tight">What does the HSK 3.0 syllabus cover?</h2>
          <p className="mt-4 max-w-[78ch] leading-7 text-slate-700">The new HSK follows a three-stage, nine-level framework. Its exam syllabus covers <strong>tasks, topics, vocabulary, Chinese characters and grammar</strong>. The provider also describes assessment of listening, speaking, reading, writing and translation at advanced levels; the actual sections and scoring depend on the level.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Tasks", "What learners need to do in real situations."],
              ["Topics", "The situations and subjects used in communication."],
              ["Vocabulary", "Level-labelled entries in the exam syllabus."],
              ["Characters", "Recognition and writing requirements."],
              ["Grammar", "Structures listed for each level."],
            ].map(([heading, copy], index) => <div key={heading} className="rounded-2xl border border-slate-200 bg-white p-5"><span className="text-sm font-bold text-blue-700">0{index + 1}</span><h3 className="mt-2 font-bold text-slate-950">{heading}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p></div>)}
          </div>
          <p className="mt-5 max-w-[78ch] leading-7 text-slate-700">For the question types and duration of your level, use the provider&apos;s <a className="font-semibold text-blue-700 underline" href={officialHsk}>level pages and sample questions</a>. A vocabulary target alone does not describe the whole exam.</p>
        </section>

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

        <section aria-labelledby="prep-title" className="mt-16 rounded-[28px] bg-slate-950 px-6 py-7 text-white sm:px-7 lg:px-12">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-300">A practical sequence</p><h2 id="prep-title" className="mt-2 text-3xl font-bold tracking-tight">How should I prepare for HSK 3.0?</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <li className="border-l-2 border-blue-400 pl-5"><span className="text-sm font-bold text-blue-300">01 · CHECK YOUR SITTING</span><h3 className="mt-2 text-lg font-bold">Confirm the version</h3><p className="mt-2 text-sm leading-6 text-slate-300">Check your date, test center and paper or computer format before choosing materials.</p></li>
            <li className="border-l-2 border-cyan-400 pl-5"><span className="text-sm font-bold text-cyan-300">02 · SET THE SCOPE</span><h3 className="mt-2 text-lg font-bold">Read your level&apos;s syllabus</h3><p className="mt-2 text-sm leading-6 text-slate-300">Look at its tasks, topics, words, characters and grammar rather than a word count alone.</p></li>
            <li className="border-l-2 border-emerald-400 pl-5"><span className="text-sm font-bold text-emerald-300">03 · TEST YOURSELF</span><h3 className="mt-2 text-lg font-bold">Try sample questions</h3><p className="mt-2 text-sm leading-6 text-slate-300">Use the provider&apos;s sample questions to find which skills need more practice.</p></li>
            <li className="border-l-2 border-violet-400 pl-5"><span className="text-sm font-bold text-violet-300">04 · BUILD A ROUTINE</span><h3 className="mt-2 text-lg font-bold">Study and review</h3><p className="mt-2 text-sm leading-6 text-slate-300">Use the matching exam materials; use HSKKit&apos;s separate 2021-standard catalog for additional vocabulary practice.</p></li>
          </ol>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold"><a className="text-blue-200 hover:underline" href={syllabus}>Official syllabus ↗</a><a className="text-blue-200 hover:underline" href={officialHsk}>Official sample questions ↗</a><Link className="text-blue-200 hover:underline" href="/levels">HSKKit study levels →</Link></div>
        </section>

        <section aria-labelledby="faq-title" className="mx-auto mt-16 max-w-[860px] pb-4">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Quick answers</p><h2 id="faq-title" className="mt-2 text-3xl font-bold tracking-tight">Frequently asked questions</h2>
          <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 sm:px-7">{faqs.map(([question, answer]) => <details key={question} className="py-5"><summary className="cursor-pointer pr-4 font-semibold">{question}</summary><p className="mt-3 max-w-[72ch] leading-7 text-slate-600">{answer}</p></details>)}</div>
        </section>
      </main>
    </StudyPage>
  );
}

