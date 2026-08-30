import type { Metadata } from "next";
import Link from "next/link";
import { StudyPage } from "../components/study-shell";
import { SavedWordsClient } from "./saved-words-client";

export const metadata: Metadata = {
  title: "Saved words | HSKKit",
  description: "Open your saved Chinese words, add them to Today, and practise them with Review-connected activities.",
  robots: { index: false, follow: false },
};

export default function SavedWordsPage() {
  return <StudyPage><main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-8 sm:px-6 md:py-12 lg:px-10">
    <nav className="mb-5 text-sm font-semibold text-blue-700"><Link href="/dictionary" className="hover:underline">Dictionary</Link> <span className="text-slate-400">/</span> <span className="text-slate-700">Saved words</span></nav>
    <header className="mb-6 rounded-3xl bg-slate-950 px-5 py-7 text-white sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-300">Your vocabulary</p>
      <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Saved words</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">This list uses the same learning state as Dictionary, Today and Review. Guest words remain available when you sign in.</p>
    </header>
    <SavedWordsClient />
  </main></StudyPage>;
}
