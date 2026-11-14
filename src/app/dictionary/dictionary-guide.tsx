import Link from "next/link";

const learningWordPath = "/word/hsk2025.word.l1.0249.v1";
const learningCharacterPath = "/character/%E5%AD%A6";
const examples = [
  { label: "Search with Chinese characters", query: "学习", explanation: "Enter the word you have seen in a lesson, message or text. The result gives its pinyin, English meanings and HSK level. Open 学习 to read the complete word entry.", tip: "If a word contains several characters, search the complete word first. Its meaning may be more useful than the meanings of its characters separately." },
  { label: "Search with pinyin", query: "xue xi", explanation: "Use plain pinyin when you know the sound but cannot type the characters. This search includes 学习, shown with the tone marks xuéxí in the results.", tip: "Similar spellings can appear together. Compare the Chinese characters, tone marks and meanings before choosing an entry." },
  { label: "Search with an English meaning", query: "to study", explanation: "Start with a short English meaning when you want to find a Chinese word. An English search can return several possible translations, so check each result's Chinese spelling and part of speech.", tip: "For example, to study includes 学习. Read the word entry and its available examples to decide whether it fits the sentence you want to write." },
];
const directories = [
  { href: "/vocabulary/1", title: "Vocabulary by HSK level", text: "Open a complete level list, filter its words and use quick flashcards for a short review. Choose this route when you want to study a level in order." },
  { href: "/dictionary/radicals", title: "Browse all 214 radicals", text: "Start with the character's radical. The directory groups Kangxi radicals by their stroke counts and links to the HSK characters indexed under each one." },
  { href: "/dictionary/strokes", title: "Browse by stroke count", text: "Use the total number of strokes when you recognize a character's shape but do not know its reading. The directory covers the indexed characters from 1 to 23 strokes." },
  { href: "/dictionary?mode=pinyin", title: "Explore pinyin", text: "Look up individual characters by syllable, or narrow the list with an initial, final and tone. This is useful when you remember a pronunciation but need to identify the character." },
];
const levelLinks = [1, 2, 3, 4, 5, 6, 7];
const entryFields = [
  { title: "Pinyin: xuéxí", text: "The marks above the vowels show the tones. Read them together with the characters instead of treating an unmarked spelling as the complete pronunciation." },
  { title: "English: to learn; to study", text: "The gloss gives the word's core meanings. Several English glosses can describe one Chinese word; they are starting points for understanding its use." },
  { title: "HSK level: 1", text: "This entry belongs to HSK 1 in the published catalog. Use the level label to connect a dictionary lookup with the matching vocabulary list." },
  { title: "Part of speech: V", text: "V identifies this entry as a verb. Other results may show labels such as N for noun or Adj for adjective. The label helps you compare words with related meanings." },
];
const questions = [
  { question: "Can I search without pinyin tone marks?", answer: "Yes. Try plain pinyin such as xue xi. The results display tone-marked readings such as xuéxí, so you can check the pronunciation after searching. A spelling can match more than one result; compare the Hanzi and meaning as well." },
  { question: "Can I look up traditional Chinese characters?", answer: "The dictionary accepts a traditional spelling such as 學習 as well as 学习. Use Simplified or Traditional above the results to change the available display forms. If an unfamiliar spelling does not match, try the other form or search its pinyin." },
  { question: "Why do I see HSK 1 words when I first open the dictionary?", answer: "The opening list is a beginner starting point. It does not represent the whole dictionary. Choose All to browse across the published levels, or select an HSK level to focus your lookup. HSK 7–9 is presented as a combined band." },
  { question: "What should I try when a search has no matches?", answer: "Check the spelling and remove the level, word-type or audio filters. Try a shorter English meaning, plain pinyin or the complete Chinese word. If you only know one character, use Characters, the radical directory or the stroke-count directory. The published HSK collection does not contain every Chinese term or name." },
  { question: "Does every word have audio and example sentences?", answer: "Availability varies by entry. Use the audio control where it appears and read its label; pronunciation labelled synthesized uses speech synthesis. Word details show the examples and character information available for that entry. You can still read the definitions when audio or examples are unavailable." },
  { question: "Should I use the dictionary or a vocabulary list for daily study?", answer: "Use the dictionary to answer a specific question about a word or character. Use a vocabulary page to work through a complete HSK level or practise with quick flashcards. Both routes lead to the same word details, so you can move between lookup and study without learning two different sets of entries." },
];

export function DictionaryGuide({ wordCount, characterCount }: { wordCount: number; characterCount: number }) {
  return <div className="mt-[40px] space-y-[32px] border-t border-slate-200 pt-[32px]">
    <section aria-labelledby="dictionary-how-to-search" className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
      <h2 id="dictionary-how-to-search" className="text-xl font-bold text-slate-950">How to search this Chinese-English dictionary</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Choose the information you already know: Chinese characters, a pinyin spelling or an English meaning. The three searches below offer different ways to find the same word, 学习 (xuéxí, to learn; to study). Try an example, then compare the reading and meaning in the result.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">{examples.map((example) => <div key={example.label} className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-900">{example.label}</h3>
        <Link prefetch={false} href={`/dictionary?q=${encodeURIComponent(example.query)}`} className="mt-1 inline-flex min-h-11 items-center font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-700">{example.query}<span className="sr-only"> — search the dictionary</span></Link>
        <p className="mt-1 text-sm leading-6 text-slate-600">{example.explanation}</p>
        <p className="mt-3 text-sm leading-6 text-slate-600">{example.tip}</p>
      </div>)}</div>
    </section>
    <section aria-labelledby="dictionary-entry-guide" className="rounded-2xl border border-violet-100 bg-violet-50/60 p-5 sm:p-6">
      <h2 id="dictionary-entry-guide" className="text-xl font-bold text-slate-950">How to read a Chinese dictionary entry</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">A useful lookup connects the written word with its sound, meaning and role in a sentence. Here is how to read the information shown for <Link prefetch={false} href={learningWordPath} className="font-semibold text-blue-700 underline underline-offset-4">学习 · xuéxí</Link>, a real HSK 1 entry in this catalog.</p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">{entryFields.map((field) => <div key={field.title} className="rounded-xl border border-violet-100 bg-white p-4"><dt className="text-sm font-bold text-slate-900">{field.title}</dt><dd className="mt-2 text-sm leading-6 text-slate-600">{field.text}</dd></div>)}</dl>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">Open the full entry to read its available example sentences, character details and related words. Listen where a pronunciation control is provided. After checking the meaning, use Practice this word for a short activity, or use the learning actions to save the word, add it to Today or add it to Review.</p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-blue-700"><Link prefetch={false} href={learningWordPath} className="inline-flex min-h-11 items-center hover:underline">Open 学习 word entry →</Link><Link prefetch={false} href="/blog/chinese-pinyin-guide" className="inline-flex min-h-11 items-center hover:underline">Learn to read pinyin →</Link></div>
    </section>
    <section aria-labelledby="dictionary-words-and-characters" className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5 sm:p-6">
      <h2 id="dictionary-words-and-characters" className="text-xl font-bold text-slate-950">Chinese words and characters: what to look up</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">A Chinese word can contain one character or several. Learning the meaning of each character can help, but a word should also be understood as a whole. This is why the dictionary offers both word entries and a separate character index.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-cyan-100 bg-white p-4"><h3 className="font-bold text-slate-950">Look up 学习 as a word</h3><p className="mt-2 text-sm leading-6 text-slate-600">学习 contains two characters and is listed as the verb to learn; to study. Use its word entry when you want the meaning, pronunciation and available examples for the complete expression.</p><Link prefetch={false} href={learningWordPath} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 hover:underline">Explore 学习 · xuéxí →</Link></div>
        <div className="rounded-xl border border-cyan-100 bg-white p-4"><h3 className="font-bold text-slate-950">Look up 学 as a character</h3><p className="mt-2 text-sm leading-6 text-slate-600">学 is one character, read xué. Its indexed character record has 8 strokes and the radical 子. Open the character page to explore its structure and words that contain it, including 学习.</p><Link prefetch={false} href={learningCharacterPath} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 hover:underline">Explore the character 学 →</Link></div>
      </div>
    </section>
    <section aria-labelledby="dictionary-hsk-levels" className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
      <h2 id="dictionary-hsk-levels" className="text-xl font-bold text-slate-950">Use HSK levels to guide your vocabulary study</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">The opening word list introduces HSK 1 vocabulary. Choose All when you want to browse across the published levels, or select a level to narrow the list. The HSK 7–9 entries are grouped together in the advanced band used by this catalog.</p>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">For a quick lookup, stay in the dictionary and open the word you need. For systematic study, move to a level's vocabulary page: it brings that level's published words together with filtering and quick flashcards. You can then return to the same word detail whenever you need a fuller explanation.</p>
      <nav className="mt-4 flex flex-wrap gap-2" aria-label="Explore HSK vocabulary lists">{levelLinks.map((level) => <Link prefetch={false} key={level} href={`/vocabulary/${level}`} className="inline-flex min-h-11 items-center rounded-lg border border-blue-200 bg-white px-3 text-sm font-semibold text-blue-700 hover:bg-blue-100">HSK {level === 7 ? "7–9" : level} vocabulary</Link>)}</nav>
    </section>
    <section aria-labelledby="dictionary-explore" className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5 sm:p-6">
      <h2 id="dictionary-explore" className="text-xl font-bold text-slate-950">Find a character when you do not know its pronunciation</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">You do not need a pinyin spelling to start a character lookup. If you recognize a component, try the radical directory. If you can count the strokes, use the stroke-count directory. In Characters mode, you can also combine the available radical, stroke-count and structure filters to narrow the results.</p>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">For example, 学 is indexed under 子 and has 8 strokes in total. Open its character record after finding the shape, then follow its containing words to connect character recognition with vocabulary. When you do know a sound, Pinyin mode offers a second route through the indexed readings.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{directories.map((item) => <Link prefetch={false} key={item.href} href={item.href} className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-500 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"><h3 className="font-bold text-slate-950">{item.title} <span aria-hidden="true">→</span></h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p></Link>)}</div>
    </section>
    <section aria-labelledby="dictionary-coverage" className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 sm:p-6">
      <h2 id="dictionary-coverage" className="text-xl font-bold text-slate-950">What this HSK dictionary covers and where its information comes from</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">HSKKit is a learning dictionary built around its published HSK 3.0 vocabulary. The current collection contains {wordCount.toLocaleString("en-US")} words and {characterCount.toLocaleString("en-US")} indexed characters, organized from HSK 1 through the combined HSK 7–9 band. The counts describe the collection available here; specialized terms, names and other Chinese words may fall outside it.</p>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Word lists, character structure information and pronunciation can use different source materials. The <Link prefetch={false} href="/content-license" className="font-semibold text-blue-700 underline underline-offset-4">content sources and license notes</Link> explain the references behind the published catalog. Use the <Link prefetch={false} href="/hsk-3-0" className="font-semibold text-blue-700 underline underline-offset-4">HSK 3.0 guide</Link> when you want to understand the level framework and follow through to the current vocabulary lists.</p>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">The dictionary gives you a focused starting point for reading and study. Compare the English gloss with the available examples and the context in which you encountered the word. Check the audio label before listening: a synthesized pronunciation uses speech synthesis, and audio or example availability can differ between entries.</p>
    </section>
    <section aria-labelledby="dictionary-faq" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 id="dictionary-faq" className="text-xl font-bold text-slate-950">Questions about searching and learning Chinese words</h2>
      <div className="mt-4 divide-y divide-slate-200">{questions.map((item) => <details key={item.question} className="py-1"><summary className="flex min-h-11 cursor-pointer items-center py-2 text-sm font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">{item.question}</summary><p className="max-w-3xl pb-4 text-sm leading-6 text-slate-600">{item.answer}</p></details>)}</div>
    </section>
  </div>;
}
