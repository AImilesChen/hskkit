import Link from "next/link";
import { hsk1VocabularyTopics } from "@/lib/content/hsk1-vocabulary-landing";
import styles from "./hsk1-vocabulary.module.css";

const topicCopy: Record<string, { title: string; description: string; tip: string }> = {
  family: { title: "Family & people", description: "Start with the people you talk about every day. Chinese family words can carry information that English leaves out: 弟弟 means a younger brother, rather than any brother.", tip: "Say the word while picturing someone you know. Keep the two syllables together when practising family names such as 爸爸 and 妈妈." },
  numbers: { title: "Numbers & quantities", description: "Numbers help you understand prices, ages and amounts. Learn a number's sound as well as its written form, so you can recognize it when someone says it aloud.", tip: "半 means half. When you start combining numbers with things, check the complete phrase: Chinese often uses a measure word between a number and a noun." },
  time: { title: "Time & daily life", description: "Time words help place a simple action in context. 今天 tells you which day, 白天 refers to daytime, and 点 can mark an hour in a clock-time expression.", tip: "Compare a day word with a clock expression. A word such as 点 can have several meanings; read the entry and its available examples to find the use you need." },
  food: { title: "Food & drink", description: "Connect a Chinese word with a familiar food or drink. A concrete picture can be easier to remember than an isolated English translation, especially when you meet the word on a menu.", tip: "饭 can refer to cooked rice or a meal. Use the surrounding words to decide which meaning fits, rather than assuming one English gloss works in every sentence." },
  study: { title: "Study & communication", description: "Build small connections between actions and things: 读 is to read, 书 is a book, and 学习 is to learn or study. These related words give you material for useful short phrases.", tip: "Read a multi-character word as a whole. Knowing the individual characters helps, but the complete entry gives the pronunciation and meaning of the word you are learning." },
  places: { title: "Places & transport", description: "Learn the names you can connect to a real route or destination. 车 is a general word for a vehicle, 出租车 is a taxi, and 超市 is a supermarket.", tip: "Compare 车 with 出租车 to notice how a familiar character appears inside a longer word. Open both entries to check their full readings and meanings." },
};

const steps = [
  { title: "Listen and connect the sound with the word", text: "Choose a small set you can revisit. Play the available pronunciation and read the pinyin, paying attention to its tone marks. Repeat the complete word; do not rely on an English-looking spelling to guess its sound." },
  { title: "Read the meaning, then try a short sentence", text: "Open a word's details for its available examples and character information. Notice which English meaning fits the example. For a new sentence, keep the structure simple and check any unfamiliar word before adding it." },
  { title: "Recall the meaning with quick flashcards", text: "Start with 10 cards, then try 20 or 50 when a longer set is useful. Attempt the answer before revealing it. A word that feels familiar on the list may still need practice when its meaning is hidden." },
  { title: "Return to the words you found difficult", text: "Make another attempt after a break, especially with words you mixed up. The word-detail learning actions let you save an entry or add it to Today or Review. An account can keep learning progress synced across devices." },
];

export function Hsk1VocabularyIntro({ wordCount }: { wordCount: number }) {
  return <div className={styles.intro}>
    <div className={styles.introCopy}>
      <p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-700">HSK 3.0 · 2025 exam syllabus</p>
      <h1 className="mt-2 text-4xl font-bold tracking-[-.035em] text-slate-950">HSK 1 Vocabulary</h1>
      <p className="mt-3 text-base leading-7 text-slate-600">Explore {wordCount.toLocaleString("en-US")} beginner Chinese words with pinyin, English meanings and available pronunciation. Search the list, open a word for details, or practise a small set with quick flashcards.</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"><strong className="font-semibold text-slate-800">{wordCount.toLocaleString("en-US")} words</strong><span aria-hidden="true" className="text-slate-400">·</span><Link href="/content-license" prefetch={false} className="inline-flex min-h-11 items-center font-semibold text-blue-700 hover:underline">Sources & syllabus version →</Link></div>
    </div>
    <section className={styles.flashcard} aria-labelledby="quick-review-heading">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-violet-700">Quick Flashcards</p>
      <h2 id="quick-review-heading">A few words. A little progress.</h2>
      <p>Practise 10, 20, or 50 HSK 1 words.<br />No sign-in required.</p>
      <Link href="/vocabulary/1?mode=flashcards#vocabulary-activities" prefetch={false}>Start quick review →</Link>
    </section>
  </div>;
}

export function Hsk1VocabularyGuide({ wordCount }: { wordCount: number }) {
  const questions = [
    { question: "Which HSK vocabulary version does this page use?", answer: `This page follows HSKKit's published catalog aligned with the 2025 HSK exam syllabus. It contains ${wordCount.toLocaleString("en-US")} HSK 1 word entries. The membership of the list and the English learning explanations are different things: the glosses and study guidance are learning material, rather than official examination questions.` },
    { question: "Why do other HSK 1 lists have a different word count?", answer: "A list labelled HSK 1 may use an older exam syllabus or a different standard. Check the version and source before comparing totals. HSKKit's vocabulary comparison tool shows the older and current catalog membership; changing a list's word count does not by itself describe a learner's readiness for an exam." },
    { question: "Can I search by Chinese, pinyin or English?", answer: "Yes. Search this level using a Chinese word, its pinyin or a short English meaning. Use the part-of-speech and audio filters to narrow the results, or switch the sort order to pinyin. Clear the filters if a word you expect does not appear. For a lookup across levels, open the Chinese dictionary." },
    { question: "Is the pronunciation recorded by a person or synthesized?", answer: "The published word audio uses speech synthesis, as explained on the content sources page. It is not a native-speaker recording. A pronunciation button appears where a published audio file is available; use the audio filter to find those entries. Word-detail pages label any separate device-voice preview where one is offered." },
    { question: "Can I practise HSK 1 words without an account?", answer: "Yes. Quick Flashcards lets guests practise a set of 10, 20 or 50 published words. Use it for a short recall session, then open a word's details when you need more explanation. An account is useful when you want to sync saved learning progress; it is not required to browse this list or start a quick review." },
    { question: "How is this page different from the Chinese dictionary?", answer: "Use this page to study the published HSK 1 list in order, filter it or start a quick flashcard session. Use the dictionary when you want to look up a particular word across levels or explore characters. Both routes open the same word-detail pages, so the pronunciation and meanings refer to the same catalog entries." },
  ];
  return <div className={styles.guide} data-hsk1-guide>
    <section id="hsk1-topics" aria-labelledby="hsk1-topics-title" className={`${styles.panel} ${styles.topics}`}>
      <p className={styles.eyebrow}>Make connections</p>
      <h2 id="hsk1-topics-title">Explore HSK 1 vocabulary by topic</h2>
      <p className={styles.lead}>The full word list is above. These small groups are a different way to begin: connect a few related words with a familiar situation, then open an entry to check its meaning and available examples. Each word below belongs to the current HSK 1 catalog.</p>
      <div className={styles.topicGrid}>{hsk1VocabularyTopics.map((topic) => {
        const copy = topicCopy[topic.id];
        return <article key={topic.id} className={styles.topicCard}>
          <h3>{copy.title}</h3><p>{copy.description}</p>
          <ul className={styles.topicWords}>{topic.words.map((word) => <li key={word.id}><Link href={`/word/${word.id}`} prefetch={false} aria-label={`Explore ${word.payload.hanzi}: ${word.payload.meaning}`}>
            <span lang="zh-Hans" className={styles.topicHanzi}>{word.payload.hanzi}</span><span lang="zh-Latn" className={styles.topicPinyin}>{word.payload.pinyin}</span><span className={styles.topicMeaning}>{word.payload.meaning}</span>
          </Link></li>)}</ul><p className={styles.tip}>{copy.tip}</p>
        </article>;
      })}</div>
    </section>
    <section id="hsk1-study-guide" aria-labelledby="hsk1-study-title" className={`${styles.panel} ${styles.method}`}>
      <p className={styles.eyebrow}>From recognizing to remembering</p>
      <h2 id="hsk1-study-title">How to study HSK 1 vocabulary</h2>
      <p className={styles.lead}>Use the list as a place to start, then practise using and remembering the words. A short session can connect pronunciation, meaning and recall without trying to memorize the whole catalog at once.</p>
      <div className={styles.methodGrid}>
        <ol className={styles.steps}>{steps.map((step) => <li key={step.title}><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}</ol>
        <aside className={styles.example} aria-labelledby="hsk1-example-title">
          <h3 id="hsk1-example-title">One word, then a useful sentence</h3>
          <p className={styles.exampleWord} lang="zh-Hans">茶</p><p className={styles.examplePinyin} lang="zh-Latn">chá</p><p>tea · noun</p>
          <div className={styles.sentence}><p lang="zh-Hans">我喝茶。</p><p lang="zh-Latn">Wǒ hē chá.</p><p>I drink tea.</p></div>
          <dl><div><dt>Notice the order</dt><dd>我 is the subject, 喝 is the action and 茶 is what is being drunk. Keep this simple order when practising the sentence.</dd></div><div><dt>Try recalling it</dt><dd>Look away from the English and say what 茶 means. Then read the sentence again and connect the word with its pronunciation, chá.</dd></div></dl>
          <Link href="/word/hsk2025.word.l1.0017.v1" prefetch={false} className={styles.inlineLink}>Read the 茶 word entry →</Link>
          <p className="!text-sm">An original HSKKit study example, not an official exam question.</p>
        </aside>
      </div>
      <Link href="/blog/chinese-pinyin-guide" prefetch={false} className={styles.inlineLink}>Need help with tone marks? Read the pinyin guide →</Link>
    </section>
    <section id="hsk1-sources" aria-labelledby="hsk1-sources-title" className={`${styles.panel} ${styles.sources}`}>
      <p className={styles.eyebrow}>Know which list you are studying</p>
      <h2 id="hsk1-sources-title">HSK 1 word count, syllabus & sources</h2>
      <div className={styles.sourceGrid}>
        <div><h3>{wordCount.toLocaleString("en-US")} entries in this HSK 1 list</h3><p>HSKKit aligns this published list with the 2025 HSK exam syllabus. The number counts word entries, rather than individual Chinese characters. A word may contain one character or several; a longer word is still one entry here.</p><p>Older exam syllabuses and other standards can use different level boundaries and totals. Compare the named versions before combining study lists, and use the complete syllabus for the requirements of the exam you plan to take.</p><Link href="/tools/hsk-vocabulary-comparison" prefetch={false} className={styles.inlineLink}>Compare HSK vocabulary versions →</Link></div>
        <div><h3>Definitions, examples & pronunciation</h3><p>The English glosses are independent learning material, including adapted CC-CEDICT definitions. They are not official exam translations. Published audio is synthesized; availability varies by entry, and each word's detail page shows its available learning material.</p><p>The short study example on this page is HSKKit editorial content. Source and licence notes explain the catalog and audio provenance. HSKKit is an independent learning service and is not an official HSK examination provider.</p><Link href="/content-license" prefetch={false} className={styles.inlineLink}>Read content sources & licences →</Link></div>
      </div>
    </section>
    <section id="hsk1-faq" aria-labelledby="hsk1-faq-title" className={`${styles.panel} ${styles.faq}`}>
      <p className={`${styles.eyebrow} !text-blue-700`}>Questions about this list</p><h2 id="hsk1-faq-title">HSK 1 vocabulary: common questions</h2>
      <div className={styles.faqList}>{questions.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
    </section>
    <section aria-labelledby="hsk1-next-title" className={`${styles.panel} ${styles.next}`}>
      <h2 id="hsk1-next-title">Keep learning from here</h2>
      <div className={styles.nextGrid}>
        <Link href="/vocabulary/1?mode=flashcards#vocabulary-activities" prefetch={false}><strong>Review HSK 1 words →</strong><span>Recall a small set with quick flashcards, then return to the entries you want to understand better.</span></Link>
        <Link href="/dictionary?level=1" prefetch={false}><strong>Look up a Chinese word →</strong><span>Search the dictionary for a word or explore its characters, meanings and available examples.</span></Link>
        <Link href="/vocabulary/2" prefetch={false}><strong>Explore HSK 2 vocabulary →</strong><span>Browse the next level when you want to extend your study beyond the HSK 1 list.</span></Link>
      </div>
      <Link href="/placement" prefetch={false} className={styles.inlineLink}>Not sure where to start? Find your starting level →</Link>
    </section>
  </div>;
}
