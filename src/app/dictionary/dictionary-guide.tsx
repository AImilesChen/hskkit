import Link from "next/link";

const examples = [
  { label: "Chinese characters", query: "学习", explanation: "Type a word in Hanzi to find its reading and English meanings." },
  { label: "Pinyin", query: "xue xi", explanation: "Know the pronunciation? Start with its pinyin spelling." },
  { label: "English", query: "to study", explanation: "Search an English meaning to find matching Chinese entries." },
];
const directories = [
  { href: "/vocabulary/1", title: "Vocabulary by HSK level", text: "Study a complete level with word lists and quick flashcards." },
  { href: "/dictionary/radicals", title: "Browse all 214 radicals", text: "Find characters by their radical and radical stroke count." },
  { href: "/dictionary/strokes", title: "Browse by stroke count", text: "Explore characters from 1 to 23 strokes." },
  { href: "/dictionary?mode=pinyin", title: "Explore pinyin", text: "Find characters by syllable, initial, final and tone." },
];

export function DictionaryGuide({ wordCount, characterCount }: { wordCount: number; characterCount: number }) {
  return <div className="mt-[40px] space-y-[32px] border-t border-slate-200 pt-[32px]">
    <section aria-labelledby="dictionary-how-to-search" className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
      <h2 id="dictionary-how-to-search" className="text-xl font-bold text-slate-950">How to search this Chinese dictionary</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Use Chinese characters, pinyin or an English meaning. Open a result to explore the word, or narrow the list with an HSK level and the optional filters.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">{examples.map((example) => <div key={example.label} className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-900">{example.label}</h3>
        <Link prefetch={false} href={`/dictionary?q=${encodeURIComponent(example.query)}`} className="mt-1 inline-flex min-h-11 items-center font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-700">{example.query}<span className="sr-only"> — search the dictionary</span></Link>
        <p className="mt-1 text-sm leading-6 text-slate-600">{example.explanation}</p>
      </div>)}</div>
    </section>
    <section aria-labelledby="dictionary-entry-guide" className="rounded-2xl border border-violet-100 bg-violet-50/60 p-5 sm:p-6">
      <h2 id="dictionary-entry-guide" className="text-xl font-bold text-slate-950">Read a word, then keep learning</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Results show the Chinese word, pinyin, English meaning, HSK level and part of speech. Open an entry for its available example sentences, character details and related words. Pronunciation controls appear where audio is available.</p>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Use Practice this word to try a short activity. The learning actions let you save a word for later, add it to Today or add it to Review.</p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-blue-700"><Link prefetch={false} href="/word/hsk2025.word.l1.0001.v1" className="inline-flex min-h-11 items-center hover:underline">Explore 爱 · ài →</Link><Link prefetch={false} href="/blog/chinese-pinyin-guide" className="inline-flex min-h-11 items-center hover:underline">How to read pinyin →</Link></div>
    </section>
    <section aria-labelledby="dictionary-explore" className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5 sm:p-6">
      <h2 id="dictionary-explore" className="text-xl font-bold text-slate-950">Explore words and characters</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{directories.map((item) => <Link prefetch={false} key={item.href} href={item.href} className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-500 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"><h3 className="font-bold text-slate-950">{item.title} <span aria-hidden="true">→</span></h3><p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p></Link>)}</div>
    </section>
    <section aria-labelledby="dictionary-coverage" className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 sm:p-6">
      <h2 id="dictionary-coverage" className="text-xl font-bold text-slate-950">Coverage and sources</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">HSKKit is a learning dictionary built around its published HSK 3.0 vocabulary: {wordCount.toLocaleString("en-US")} words and {characterCount.toLocaleString("en-US")} indexed characters, organized from HSK 1 through the combined HSK 7–9 band. It is a focused study collection, rather than a dictionary of every Chinese word.</p>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Word lists, character information and audio can have different sources and availability. <Link prefetch={false} href="/content-license" className="font-semibold text-blue-700 underline underline-offset-4">Read the content sources and license notes</Link> for the published catalog and <Link prefetch={false} href="/hsk-3-0" className="font-semibold text-blue-700 underline underline-offset-4">the HSK 3.0 guide</Link> for the level framework.</p>
    </section>
    <section aria-labelledby="dictionary-faq" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 id="dictionary-faq" className="text-xl font-bold text-slate-950">Dictionary questions</h2>
      <div className="mt-4 divide-y divide-slate-200">
        <details className="py-1"><summary className="flex min-h-11 cursor-pointer items-center py-2 text-sm font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">Can I search by Chinese, pinyin and English?</summary><p className="pb-4 text-sm leading-6 text-slate-600">Yes. Enter Hanzi such as 学习, pinyin such as xue xi, or an English meaning such as to study. Use Characters or Pinyin when you want to explore individual characters.</p></details>
        <details className="py-1"><summary className="flex min-h-11 cursor-pointer items-center py-2 text-sm font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">How is this different from the vocabulary pages?</summary><p className="pb-4 text-sm leading-6 text-slate-600">Use the dictionary to look up a word or character. Use the vocabulary pages to work through a complete HSK level or practise with quick flashcards. Both open the same word details.</p></details>
        <details className="py-1"><summary className="flex min-h-11 cursor-pointer items-center py-2 text-sm font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">Is the pronunciation recorded or synthesized?</summary><p className="pb-4 text-sm leading-6 text-slate-600">Check the audio label on the entry. Pronunciation labelled synthesized uses speech synthesis. Audio availability varies; a missing audio control does not prevent you from reading the word details.</p></details>
      </div>
    </section>
  </div>;
}
