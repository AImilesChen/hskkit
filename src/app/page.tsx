import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "./site-footer";
import SiteHeader from "./site-header";
import HomeNextStep from "./components/home-next-step";
import { getHsk3LevelStatuses } from "@/lib/content/level-status";
import {
  PUBLIC_ACCOUNT_SCOPE,
  PUBLIC_DICTIONARY_SCOPE,
  PUBLIC_FORMAL_CONTENT_SCOPE,
  PURCHASING_UNAVAILABLE,
} from "@/lib/public-copy";

export const metadata: Metadata = {
  title: "HSKKit — HSK 3.0 Levels 1–9 study path",
  description: "Find your starting level, open today's study plan, and use published HSK 3.0 vocabulary, dictionary, listening, and practice tools.",
  alternates: { canonical: "/" },
};

const tools = [
  { title: "Vocabulary", text: "Open the published HSK 3.0 catalog by level and continue into word detail.", href: "/vocabulary/1", status: "Live" },
  { title: "Listening", text: "Build word and context listening mastery with levelled audio tasks.", href: "/listen", status: "Live" },
  { title: "Practice", text: "Choose a level and skill, keep your attempt, and send mistakes into review.", href: "/practice", status: "Live" },
  { title: "Reading", text: "Use levelled passages, vocabulary support, exercises, and review actions.", href: "/reading/morning-study-routine", status: "Limited" },
  { title: "Grammar", text: "Study a clear pattern, examples, a linked exercise, and a review action.", href: "/grammar/ba-sentence-basics", status: "Limited" },
  { title: "Basic Mock", text: "Take an 18-task timed HSK 1–6 assessment with autosave, scoring, Mistakes and SRS.", href: "/mock/basic", status: "Live" },
  { title: "Advanced Mock", text: "Check the unified HSK 7–9 advanced ability band across reading, listening and pragmatic ability without a fake single-level score.", href: "/mock/advanced", status: "Live" },
];

const quickTools = [
  { label: "Vocabulary browser", href: "/vocabulary/1", icon: "字" },
  { label: "Word detail", href: "/dictionary", icon: "词" },
  { label: "Dictionary lookup", href: "/dictionary", icon: "查" },
];

export default function HomePage() {
  const levels = getHsk3LevelStatuses();
  const publishedCount = levels.filter((entry) => entry.availability === "ready").length;
  return <><SiteHeader/><main className="mx-auto w-full max-w-[1140px] flex-1 px-5 py-12 sm:py-16">
    <section className="grid items-center gap-10 border-b border-slate-200 pb-16 lg:grid-cols-[1.05fr_.95fr]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.05em] text-blue-600">HSK 3.0 · Levels 1–9</p>
        <h1 className="mt-4 max-w-2xl text-[32px] font-extrabold leading-[1.2] tracking-[-.02em] sm:text-[40px]">Build your HSK 3.0 learning path</h1>
        <p className="mt-5 max-w-2xl text-lg leading-[1.6] text-slate-600">Choose an evidence-based starting point, study published content by level, and return to the next useful task. Levels 7–9 use one unified HSK 7–9 advanced ability band.</p>
        <HomeNextStep />
        <p className="mt-5 text-sm italic text-slate-500">ⓘ A learning suggestion is not an examination result or a promise of an outcome.</p>
      </div>
      <div aria-hidden="true" className="relative mx-auto h-[300px] w-full max-w-[440px]">
        <div className="absolute inset-x-8 inset-y-3 rotate-3 rounded-2xl border border-blue-100 bg-blue-100/60"/>
        <div className="absolute inset-4 grid -rotate-2 content-start gap-4 rounded-2xl border border-slate-200 bg-white p-7 shadow-lg">
          <div className="h-3 w-2/5 rounded bg-slate-200"/><div className="h-3 w-4/5 rounded bg-slate-100"/><div className="mt-3 grid h-36 place-items-center rounded-xl bg-blue-50 text-6xl font-bold text-blue-200">学</div><div className="grid grid-cols-3 gap-3"><span className="h-3 rounded bg-slate-100"/><span className="h-3 rounded bg-blue-100"/><span className="h-3 rounded bg-slate-100"/></div>
        </div>
      </div>
    </section>

    <section className="border-b border-slate-200 py-16"><h2 className="text-[32px] font-bold tracking-[-.01em]">Make today’s next step clear.</h2><div className="mt-8 grid gap-8 lg:grid-cols-2">
      <div><h3 className="text-xs font-semibold uppercase tracking-[.05em] text-slate-500">Tools</h3><div className="mt-4 grid gap-3">{quickTools.map((item)=><Link key={item.label} href={item.href} className="flex min-h-16 items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300"><span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 font-bold text-blue-700">{item.icon}</span><strong className="flex-1">{item.label}</strong><span aria-hidden="true" className="text-blue-600">→</span></Link>)}</div></div>
      <div><h3 className="text-xs font-semibold uppercase tracking-[.05em] text-slate-500">Continue studying</h3><div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="font-semibold text-slate-950">Today learning order</p><p className="mt-2 text-sm leading-6 text-slate-600">Review due items → Learn focused content → Listen or practise → See the daily summary.</p><Link href="/today" className="mt-4 inline-flex min-h-11 items-center font-semibold text-blue-700">Open Today →</Link></div><h3 className="mt-6 text-xs font-semibold uppercase tracking-[.05em] text-slate-500">Recent practice</h3><div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-7 text-center"><span aria-hidden="true" className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">↻</span><h4 className="mt-4 text-lg font-semibold">Your practice stays connected</h4><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Attempts, mistakes, and review items remain in the same learning record.</p><Link href="/practice" className="mt-4 inline-flex min-h-11 items-center font-semibold text-blue-700">Start practising →</Link></div></div>
    </div></section>

    <section className="border-b border-slate-200 py-16"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.05em] text-blue-600">{publishedCount} published catalog routes</p><h2 className="mt-2 text-[32px] font-bold tracking-[-.01em]">Learn by HSK 3.0 level.</h2></div><Link href="/levels" className="inline-flex min-h-11 items-center font-semibold text-blue-700">View full curriculum →</Link></div>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">{levels.slice(0,3).map((entry)=><Link key={entry.level} href={`/vocabulary/${entry.level}`} className={`relative rounded-2xl border bg-white p-6 shadow-sm ${entry.level===1?'border-2 border-blue-600':'border-slate-200'}`}>{entry.level===1&&<span className="absolute right-0 top-0 rounded-bl-lg rounded-tr-xl bg-blue-600 px-3 py-1 text-xs font-bold text-white">START HERE</span>}<div className="flex items-center justify-between gap-3"><h3 className="text-2xl font-semibold">Level {entry.level}</h3><span className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">{entry.contentCount.toLocaleString("en-US")} words</span></div><p className="mt-4 text-sm leading-6 text-slate-600">Published, source-locked HSK 3.0 content for this level.</p><div className="mt-8 flex justify-between text-sm text-slate-500"><span>Catalog</span><span>Ready</span></div><div className="mt-2 h-1.5 rounded bg-blue-100"><div className="h-full w-full rounded bg-blue-600"/></div></Link>)}</div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{levels.slice(3).map((entry)=>{const catalog=entry.level>=8?7:entry.level;return <Link key={entry.level} href={`/vocabulary/${catalog}`} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">Level {entry.level}</h3><span className="text-sm text-slate-500">{entry.level>=8?'Unified HSK 7–9 advanced ability band':`${entry.contentCount.toLocaleString("en-US")} words`}</span></div><div className="mt-4 h-1.5 rounded bg-blue-100"/></Link>})}</div>
    </section>

    <section className="py-16"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-center text-[32px] font-bold tracking-[-.01em]">Use the tool that matches your task.</h2><div className="mt-8 grid gap-4 lg:grid-cols-6">{tools.map((tool,index)=><Link key={tool.title} href={tool.href} className={`rounded-xl border border-slate-200 p-5 hover:border-blue-300 ${index<2?'lg:col-span-3':'lg:col-span-2'}`}><div className="flex items-center justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 font-bold text-blue-700">{tool.title.slice(0,1)}</span><span className="text-xs font-semibold uppercase tracking-wide text-blue-600">{tool.status}</span></div><h3 className="mt-4 text-xl font-semibold">{tool.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{tool.text}</p></Link>)}</div></div></section>

    <section className="mx-auto max-w-3xl pb-16"><h2 className="border-b border-slate-200 pb-4 text-2xl font-semibold">Current public scope</h2><div className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600"><p>{PUBLIC_FORMAL_CONTENT_SCOPE}</p><p>{PUBLIC_DICTIONARY_SCOPE}</p><p>{PUBLIC_ACCOUNT_SCOPE}</p><p><strong>{PURCHASING_UNAVAILABLE}.</strong> The planned PDF Pack is marked Coming later and no checkout is open.</p></div><div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">{[["Published HSK 3.0 catalog","AVAILABLE"],["Placement, Today and review loop","AVAILABLE"],["Basic Mock","AVAILABLE"],["HSK 7–9 advanced Mock","AVAILABLE"]].map(([name,status])=><div key={name} className="flex min-h-14 items-center justify-between gap-4 border-b border-slate-200 px-4 last:border-0"><span className="font-medium"><span className="mr-3 text-blue-600">✓</span>{name}</span><span className="text-xs font-semibold text-blue-600">{status}</span></div>)}</div></section>

    <section className="rounded-2xl bg-slate-950 p-9 text-center text-white shadow-md sm:p-12"><h2 className="text-[32px] font-bold text-white">Start with one useful next step.</h2><p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-slate-300">Find the level that fits, then keep Today, published content, listening, practice, mistakes, and review connected.</p><Link href="/placement" className="mt-7 inline-flex min-h-11 items-center rounded-lg bg-white px-7 font-semibold text-slate-950 hover:bg-slate-100">Find your starting point</Link></section>
  </main><SiteFooter/></>;
}
