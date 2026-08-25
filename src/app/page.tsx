import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "./site-footer";
import SiteHeader from "./site-header";
import HomeNextStep from "./components/home-next-step";
import "./homepage.css";
import { getHsk3LevelPreview, getHsk3LevelStatuses } from "@/lib/content/level-status";
import {
  PUBLIC_ACCOUNT_SCOPE,
  PUBLIC_DICTIONARY_SCOPE,
  PUBLIC_FORMAL_CONTENT_SCOPE,
} from "@/lib/public-copy";

export const metadata: Metadata = {
  title: "HSKKit — Find your HSK 3.0 level and study path",
  description: "Find your starting level, follow today's study plan, and keep published HSK 3.0 vocabulary, listening, practice, mistakes, and review connected.",
  alternates: { canonical: "/" },
};

type Tool = {
  title: string;
  text: string;
  href: string;
  icon: string;
  status?: "Limited";
};

const toolGroups: { title: string; description: string; tools: Tool[] }[] = [
  {
    title: "Core study",
    description: "Move through the connected daily learning loop.",
    tools: [
      { title: "Today", text: "Open due review and the next focused task.", href: "/today", icon: "今" },
      { title: "Vocabulary", text: "Browse the published catalog by level.", href: "/vocabulary/1", icon: "字" },
      { title: "Listening", text: "Build word and context listening mastery.", href: "/listen", icon: "听" },
      { title: "Practice", text: "Keep attempts and mistakes in your record.", href: "/practice", icon: "练" },
    ],
  },
  {
    title: "Skills",
    description: "Work on focused language skills with linked exercises.",
    tools: [
      { title: "Reading", text: "Use levelled passages and review actions.", href: "/reading/morning-study-routine", icon: "读", status: "Limited" },
      { title: "Grammar", text: "Study a pattern, examples and an exercise.", href: "/grammar/ba-sentence-basics", icon: "法", status: "Limited" },
    ],
  },
  {
    title: "Tests",
    description: "Check a starting point or practise under timed conditions.",
    tools: [
      { title: "Basic Mock", text: "Take the published HSK 1–6 timed mock.", href: "/mock/basic", icon: "测" },
      { title: "Advanced Mock", text: "Assess the unified HSK 7–9 ability band.", href: "/mock/advanced", icon: "高" },
    ],
  },
  {
    title: "Reference",
    description: "Look up published words without leaving the study system.",
    tools: [
      { title: "Dictionary", text: "Search the published HSK 3.0 catalog.", href: "/dictionary", icon: "查" },
      { title: "Worksheet generator", text: "Create printable Chinese character practice sheets.", href: "/tools/chinese-character-practice-sheet-generator", icon: "写" },
    ],
  },
];

const learningSteps = [
  { number: "01", title: "Find your starting level", text: "Use placement as a learning suggestion, not an official examination result.", href: "/placement" },
  { number: "02", title: "Follow Today’s queue", text: "Return to due review and the next focused learning task.", href: "/today" },
  { number: "03", title: "Practise real skills", text: "Move through vocabulary, listening, practice and published skill content.", href: "/practice" },
  { number: "04", title: "Review what you missed", text: "Keep attempts, mistakes and due review in the same learning record.", href: "/mistakes" },
];

export default function HomePage() {
  const levels = getHsk3LevelStatuses();
  const foundationLevels = levels.slice(0, 6);
  const advancedLevel = levels.find((entry) => entry.level === 7);
  const previewWord = getHsk3LevelPreview(1, 1)[0];
  const foundationCount = foundationLevels.reduce((total, entry) => total + entry.contentCount, 0);

  return <><SiteHeader/><main className="mx-auto w-full max-w-[1204px] flex-1 px-5 sm:px-8">
    <section className="home-hero grid items-center gap-12 border-b border-slate-200 py-14 sm:py-20 lg:grid-cols-[.88fr_1.12fr] lg:gap-16 lg:py-24">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-700">HSK 3.0 · Levels 1–9</p>
        <h1 className="mt-5 max-w-[650px] text-[40px] font-extrabold leading-[1.04] tracking-[-.04em] sm:text-[54px] lg:text-[64px]">
          <span className="text-blue-700">Find your HSK 3.0 level.</span><br/>Study the next useful task.
        </h1>
        <p className="mt-6 max-w-[620px] text-lg leading-8 text-slate-600">Start with a level check, follow a focused daily queue, and keep vocabulary, listening, practice mistakes, and review connected.</p>
        <HomeNextStep />
        <p className="mt-4 text-sm text-slate-500">Start as a guest. Sign in when you want to sync private progress across devices.</p>
      </div>

      <div className="home-product-stage" role="group" aria-labelledby="home-product-preview-title">
        <div className="home-product-card">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div><p id="home-product-preview-title" className="text-xs font-semibold uppercase tracking-[.12em] text-blue-700">A connected daily path</p><h2 className="mt-1 text-2xl font-bold">Today</h2></div>
            <span className="rounded-xl bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">Example queue</span>
          </div>
          <ol className="mt-5 grid gap-3">
            {["Review due items", "Learn focused content", "Listen or practise", "See the daily summary"].map((task, index) => <li key={task} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-bold ${index===0?"bg-blue-700 text-white":"bg-white text-slate-500"}`}>{index + 1}</span><span className="font-semibold text-slate-800">{task}</span>{index===0&&<span className="ml-auto text-xs font-semibold text-blue-700">NEXT</span>}</li>)}
          </ol>
          <div role="progressbar" aria-label="Example queue progress" aria-valuemin={0} aria-valuemax={4} aria-valuenow={1} className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="home-progress h-full w-1/4 rounded-full bg-blue-700"/></div>
        </div>

        {previewWord && <Link href="/vocabulary/1" className="home-word-card" aria-label={`Open Level 1 vocabulary, preview word ${previewWord.hanzi}`}>
          <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-[.1em] text-slate-500">Published word</span><span className="text-xs font-semibold text-blue-700">HSK 1</span></div>
          <p lang="zh-Hans" className="mt-4 font-[var(--font-chinese)] text-4xl font-bold text-slate-950">{previewWord.hanzi}</p>
          <p className="mt-1 font-semibold text-blue-700">{previewWord.pinyin}</p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{previewWord.meaning}</p>
          <span className="mt-4 inline-flex min-h-11 items-center font-semibold text-slate-900">Open vocabulary <span aria-hidden="true" className="ml-2 text-blue-700">→</span></span>
        </Link>}
      </div>
    </section>

    <section className="border-b border-slate-200 py-16 sm:py-20">
      <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-700">How HSKKit connects study</p><h2 className="mt-3 text-[34px] font-bold leading-tight tracking-[-.025em] sm:text-[42px]">One connected path from level check to daily review.</h2><p className="mt-4 text-lg leading-8 text-slate-600">Each step leads into the next useful action instead of leaving placement, practice and review as separate tools.</p></div>
      <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{learningSteps.map((step) => <Link key={step.number} href={step.href} className="home-flow-card">
        <span className="text-sm font-bold text-blue-700">{step.number}</span><h3 className="mt-6 text-xl font-bold">{step.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{step.text}</p><span className="mt-5 inline-flex items-center font-semibold text-slate-900">Open step <span aria-hidden="true" className="ml-2 text-blue-700">→</span></span>
      </Link>)}</div>
    </section>

    <section className="border-b border-slate-200 py-16 sm:py-20">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-700">Published HSK 3.0 catalog</p><h2 className="mt-3 text-[34px] font-bold leading-tight tracking-[-.025em] sm:text-[42px]">Explore the published HSK 3.0 catalog.</h2><p className="mt-4 text-base leading-7 text-slate-600">Browse QA-approved vocabulary by level. Levels 7–9 share one unified advanced ability band.</p></div><Link href="/levels" className="inline-flex min-h-11 items-center font-semibold text-slate-900">Browse all level details <span aria-hidden="true" className="ml-2 text-blue-700">→</span></Link></div>
      <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{foundationLevels.map((entry) => <Link key={entry.level} href={`/vocabulary/${entry.level}`} className="home-level-card"><span className="text-sm font-semibold text-slate-500">HSK 3.0</span><div className="mt-3 flex items-end justify-between gap-3"><h3 className="text-2xl font-bold">Level {entry.level}</h3><span className="text-sm font-semibold text-slate-600">{entry.contentCount.toLocaleString("en-US")} words</span></div><span className="mt-5 inline-flex items-center text-sm font-semibold text-slate-900">Open catalog <span aria-hidden="true" className="ml-2 text-blue-700">→</span></span></Link>)}
        {advancedLevel && <Link href="/vocabulary/7" className="home-level-card home-level-card-advanced sm:col-span-2"><span className="text-sm font-semibold text-blue-700">Unified advanced band</span><div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><h3 className="text-2xl font-bold">Levels 7–9</h3><span className="text-sm font-semibold text-slate-600">{advancedLevel.contentCount.toLocaleString("en-US")} words</span></div><p className="mt-3 text-sm leading-6 text-slate-600">One shared advanced ability catalog, not three separate level lists.</p><span className="mt-4 inline-flex items-center text-sm font-semibold text-slate-900">Open advanced catalog <span aria-hidden="true" className="ml-2 text-blue-700">→</span></span></Link>}
      </div>
    </section>

    <section className="border-b border-slate-200 py-16 sm:py-20">
      <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-700">Study tools</p><h2 className="mt-3 text-[34px] font-bold leading-tight tracking-[-.025em] sm:text-[42px]">Choose a tool for the task in front of you.</h2><p className="mt-4 text-lg leading-8 text-slate-600">The main study path comes first; focused skills, tests and reference tools stay easy to find.</p></div>
      <div className="mt-9 grid gap-5 lg:grid-cols-2">{toolGroups.map((group) => <section key={group.title} className="home-tool-group"><div><h3 className="text-xl font-bold">{group.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{group.description}</p></div><div className="mt-5 grid gap-2">{group.tools.map((tool) => <Link key={tool.title} href={tool.href} className="home-tool-card"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 font-bold text-slate-700">{tool.icon}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><strong className="text-slate-950">{tool.title}</strong>{tool.status&&<span className="text-xs font-semibold text-amber-700">{tool.status} public release</span>}</span><span className="mt-0.5 block text-sm leading-5 text-slate-600">{tool.text}</span></span><span aria-hidden="true" className="text-blue-700">→</span></Link>)}</div></section>)}</div>
    </section>

    <section className="border-b border-slate-200 py-16 sm:py-20"><div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-start"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-700">Content transparency</p><h2 className="mt-3 text-[32px] font-bold tracking-[-.02em]">Current public scope</h2><p className="mt-4 text-base leading-7 text-slate-600">The homepage keeps the summary compact; the published source and standards pages retain the detailed record.</p></div><div>
      <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5"><strong className="text-2xl text-slate-950">{foundationCount.toLocaleString("en-US")}</strong><span className="mt-1 block text-sm text-slate-600">Level 1–6 entries</span></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><strong className="text-2xl text-slate-950">{advancedLevel?.contentCount.toLocaleString("en-US")}</strong><span className="mt-1 block text-sm text-slate-600">Unified Level 7–9 entries</span></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><strong className="text-2xl text-slate-950">Guest study</strong><span className="mt-1 block text-sm text-slate-600">Account used for sync</span></div></div>
      <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer font-semibold text-slate-950">Read the detailed public-scope notes</summary><div className="mt-4 space-y-3 text-sm leading-6 text-slate-600"><p>{PUBLIC_FORMAL_CONTENT_SCOPE}</p><p>{PUBLIC_DICTIONARY_SCOPE}</p><p>{PUBLIC_ACCOUNT_SCOPE}</p><p><strong>Stripe Test Store is open.</strong> The US$9.99 PDF Pack is a separate one-time PackPurchase for one selected HSK 3.0 level; no live card charge is enabled.</p></div></details>
    </div></div></section>

    <section className="my-16 rounded-[24px] bg-slate-950 px-6 py-12 text-center text-white shadow-[0_24px_60px_rgba(15,23,42,.18)] sm:my-20 sm:px-12 sm:py-16"><p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-300">Your next useful step</p><h2 className="mt-3 text-[34px] font-bold text-white sm:text-[42px]">Start with the right level.</h2><p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">Use a learning suggestion to choose the starting point, then keep Today, practice, mistakes and review connected.</p><Link href="/placement" className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-white px-7 font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-blue-50 motion-reduce:transform-none">Find my starting level</Link></section>
  </main><SiteFooter/></>;
}
