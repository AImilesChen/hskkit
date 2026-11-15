import Link from "next/link";
import { hsk789VocabularyTopics } from "@/lib/content/hsk789-vocabulary-landing";
import styles from "./hsk1-vocabulary.module.css";

const topicCopy: Record<string, { title: string; description: string; tip: string }> = {
  "arguments": {
    "title": "Reasoning & developed arguments",
    "description": "推理 concerns inference, 论证 concerns demonstrating a point through argument, and 阐述 means to elaborate on a position or topic. Follow the steps between what a writer observes, what they infer and how they explain their conclusion.",
    "tip": "Mark the claim and the evidence separately in a passage. Explain the reasoning in a short paraphrase, and check whether the evidence supports the full claim or only part of it."
  },
  "decisions": {
    "title": "Weighing options & taking action",
    "description": "Use 权衡 when considering competing options, 共识 for a shared understanding, and 落实 for putting something into practice. The group connects evaluating a proposal with reaching agreement and acting on it.",
    "tip": "Compare two possible approaches to a familiar problem. State the advantage and limitation of each before explaining your choice. Reaching a consensus and implementing a decision are separate steps."
  },
  "nature": {
    "title": "Species & changes in the natural world",
    "description": "物种 names a species, 繁衍 concerns multiplying or reproducing, and 灭绝 can describe becoming extinct. These words help you read about populations and changes in nature while distinguishing a process from its outcome.",
    "tip": "Find what organism or population the passage refers to, and note any time period or uncertainty. Learn the words in a complete explanation instead of treating a short definition as a scientific claim."
  },
  "genres": {
    "title": "Genres, fables & biographies",
    "description": "体裁 refers to genre, 寓言 to a fable or allegory, and 传记 to a biography. Notice how the kind of text changes what you expect from a story, its interpretation and its relationship to real events.",
    "tip": "Compare a short fable with an extract from a biography. Identify which details convey a lesson and which describe a life. Read 传记 as zhuànjì; a familiar written character may have another reading in a different word."
  },
  "idioms": {
    "title": "Idioms with a useful context",
    "description": "举一反三 describes drawing further inferences from one example. 循序渐进 concerns steady progress in sequence, while 因地制宜 means adapting methods to local circumstances. Keep each expression with a situation that makes its meaning clear.",
    "tip": "Choose an example of applying a familiar pattern to a new case, learning in stages, or adapting an approach to a place. Use the idiom that fits that situation; the three are not interchangeable encouragements."
  },
  "negotiation": {
    "title": "Discussion, deliberation & agreement",
    "description": "磋商 concerns serious discussion or negotiation, 斟酌 means to consider, and 协定 can refer to an agreement or accord. Look at who is discussing what, how they weigh the wording and what they finally agree.",
    "tip": "Read the verbs and nouns around each entry. Write a brief account of a discussion using the appropriate expression for the process and for its outcome, without assuming that every discussion reaches an agreement."
  }
};

const studySteps = [
  {
    "title": "Read for the structure of an argument",
    "text": "Choose a passage on a familiar topic and identify the claim, supporting evidence and conclusion. Use 推理, 论证 and 阐述 to describe what the writer is doing. Summarize the connections in your own words before checking a few unfamiliar entries."
  },
  {
    "title": "Compare expressions in their full context",
    "text": "Record a useful phrase with its subject, object and nearby connectives. Compare it with an expression from HSK 1–6 that you already know. Decide whether the new expression changes precision, formality or emphasis rather than replacing familiar words simply because it belongs to a higher band."
  },
  {
    "title": "Keep an idiom with a situation and a reading",
    "text": "Connect 举一反三 with transferring an insight to another case, 循序渐进 with progress through stages, and 因地制宜 with adapting to local conditions. Read each complete entry. Also distinguish 地道 dìdào, tunnel, in this band from 地道 dìdao, authentic, in HSK 6."
  },
  {
    "title": "Combine short recall sets with longer expression",
    "text": "Start with 10, 20 or 50 flashcards from the combined HSK 7–9 band. For uncertain entries, read their available examples and write a short summary or explanation using a few of them. Keep earlier vocabulary active: a coherent answer needs clear structure as well as a broad vocabulary."
  }
];

export function Hsk789VocabularyIntro({ wordCount }: { wordCount: number }) {
  return <div className={styles.intro}>
    <div className={styles.introCopy}>
      <p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-700">HSK 3.0 · 2025 exam syllabus</p>
      <h1 className="mt-2 text-4xl font-bold tracking-[-.035em] text-slate-950">HSK 7–9 Vocabulary</h1>
      <p className="mt-3 text-base leading-7 text-slate-600">Explore {wordCount.toLocaleString("en-US")} entries in the combined HSK 7–9 advanced band. Study reasoning, precise expression and idioms with pinyin, English meanings and a practical reading and review guide.</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"><strong className="font-semibold text-slate-800">{wordCount.toLocaleString("en-US")} HSK 7–9 entries</strong><span aria-hidden="true" className="text-slate-400">·</span><Link href="#hsk7-sources" className="inline-flex min-h-11 items-center font-semibold text-blue-700 hover:underline">Word counts & syllabus →</Link></div>
    </div>
    <section className={styles.flashcard} aria-labelledby="quick-review-heading">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-violet-700">Quick Flashcards</p>
      <h2 id="quick-review-heading">Put advanced words into context.</h2>
      <p>Practise 10, 20, or 50 HSK 7–9 words.<br />No sign-in required.</p>
      <Link href="/vocabulary/7?mode=flashcards#vocabulary-activities" prefetch={false}>Start HSK 7–9 review →</Link>
    </section>
  </div>;
}

export function Hsk789VocabularyGuide({ wordCount, foundationCount }: { wordCount: number; foundationCount: number }) {
  const combinedCount = foundationCount + wordCount;
  const questions = [
  {
    "question": "Are HSK 7, 8 and 9 separate word lists here?",
    "answer": "HSKKit publishes one combined HSK 7–9 advanced-band catalog. This page does not assign a separate subset to Level 7, Level 8 or Level 9. The /vocabulary/8 and /vocabulary/9 addresses display the shared catalog and point to /vocabulary/7 as the canonical page. Use the combined band when searching or starting flashcards."
  },
  {
    "question": "Does this page contain 5,600 or 11,000 entries?",
    "answer": "This page contains 5,600 entries assigned to HSK 7–9 in HSKKit's active catalog aligned with the 2025 exam syllabus. HSK 1–6 contribute 5,400 earlier entries, bringing the complete published catalog to 11,000. The complete total is not the number of new entries in this band. Entries can distinguish readings or senses; they are not a count of unique characters. Other syllabus versions can use different totals."
  },
  {
    "question": "How should I study the combined advanced band?",
    "answer": "Choose a small group of entries and meet them in a connected text. Identify an argument, a narrative or an explanation, then summarize it with familiar sentence structures and a few new words. Use the theme groups below as study suggestions. Knowing a list alone does not establish readiness for a particular exam level."
  },
  {
    "question": "Why is 地道 read differently from the HSK 6 entry?",
    "answer": "The entry here is dìdào, tunnel or causeway. HSK 6 has a separate dìdao entry meaning authentic. Read the complete entry and check its pinyin and meaning instead of merging words because their written forms match. The same principle applies when an entry has several senses or a character has another reading in a different word."
  },
  {
    "question": "Do all entries have audio and example sentences?",
    "answer": "Availability varies by entry. The Words with audio filter only returns entries with published pronunciation files. If no matching file is published, you can still read pinyin, open word details and use guest flashcards. Published word audio across HSKKit is synthesized; available examples and any separately labelled device-voice preview are shown in the full entry."
  },
  {
    "question": "Can I search and review HSK 7–9 without signing in?",
    "answer": "Yes. Search by Chinese, pinyin or English within the combined band, and use the word-type, audio and sort controls to narrow results. Quick Flashcards supports guest sets of 10, 20 or 50 words from HSK 7–9. Open a word for its details; account learning actions are available when you want synced progress."
  }
];
  return <div className={styles.guide} data-hsk7-guide>
    <section id="hsk7-topics" aria-labelledby="hsk7-topics-title" className={`${styles.panel} ${styles.topics}`}>
      <p className={styles.eyebrow}>Words for a developed explanation</p><h2 id="hsk7-topics-title">Explore HSK 7–9 vocabulary by topic</h2>
      <p className={styles.lead}>Use these six groups to connect the full list with situations you can describe. Each group contains three real entries from the current combined HSK 7–9 catalog. Open a word to see its complete reading, meanings and available examples; the groups are study suggestions rather than an official syllabus classification.</p>
      <div className={styles.topicGrid}>{hsk789VocabularyTopics.map(topic => {
        const copy = topicCopy[topic.id];
        return <article key={topic.id} className={styles.topicCard}><h3>{copy.title}</h3><p>{copy.description}</p><ul className={styles.topicWords}>{topic.words.map(word => <li key={word.id}><Link href={`/word/${word.id}`} prefetch={false} aria-label={`Explore ${word.payload.hanzi}: ${word.payload.meaning}`}><span lang="zh-Hans" className={styles.topicHanzi}>{word.payload.hanzi}</span><span lang="zh-Latn" className={styles.topicPinyin}>{word.payload.pinyin}</span><span className={styles.topicMeaning}>{word.payload.meaning}</span></Link></li>)}</ul><p className={styles.tip}>{copy.tip}</p></article>;
      })}</div>
    </section>
    <section id="hsk7-study-guide" aria-labelledby="hsk7-study-title" className={`${styles.panel} ${styles.method}`}>
      <p className={styles.eyebrow}>Read closely, weigh ideas and explain</p><h2 id="hsk7-study-title">How to study HSK 7–9 vocabulary</h2>
      <p className={styles.lead}>Read beyond individual definitions: follow the structure of an argument, the purpose of a text and the shades of meaning in a phrase. Use short recall sets to find uncertain entries, then practise longer summaries and explanations with those words. Keep your sentence structure clear as the subject matter becomes more complex.</p>
      <div className={styles.methodGrid}>
        <ol className={styles.steps}>{studySteps.map(step => <li key={step.title}><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}</ol>
        <aside className={styles.example} aria-labelledby="hsk7-example-title">
          <h3 id="hsk7-example-title">Weigh alternatives before choosing</h3><p className={styles.exampleWord} lang="zh-Hans">权衡</p><p className={styles.examplePinyin} lang="zh-Latn">quánhéng</p><p>to weigh options · consider competing approaches</p>
          <div className={styles.sentence}><p lang="zh-Hans">我们需要权衡不同的方案。</p><p lang="zh-Latn">Wǒmen xūyào quánhéng bùtóng de fāng'àn.</p><p>We need to weigh the different proposals.</p></div>
          <dl><div><dt>Identify the action and its object</dt><dd>我们 names who is considering the options, 需要 expresses the need to do so, and 权衡不同的方案 identifies the action and its object: weighing different proposals. The sentence does not yet tell you which proposal is preferable.</dd></div><div><dt>Add a reasoned comparison</dt><dd>权衡 is an entry in the combined HSK 7–9 band. Add a sentence describing an advantage and a limitation of each proposal, using words you already know. Explain your choice only after you have made the comparison clear.</dd></div></dl>
          <Link href="/word/hsk2025.word.l7.08762.v1" prefetch={false} className={styles.inlineLink}>Explore 权衡 and its available examples →</Link><p className="!text-sm">An original HSKKit learning example, not an official exam question.</p>
        </aside>
      </div>
      <Link href="/vocabulary/6" prefetch={false} className={styles.inlineLink}>Keep earlier words active: revisit HSK 6 →</Link>
    </section>
    <section id="hsk7-sources" aria-labelledby="hsk7-sources-title" className={`${styles.panel} ${styles.sources}`}>
      <p className={styles.eyebrow}>Separate level entries from combined totals</p><h2 id="hsk7-sources-title">HSK 7–9 word count, syllabus & sources</h2>
      <div className={styles.sourceGrid}>
        <div><h3>{wordCount.toLocaleString("en-US")} entries at this level</h3><p>This page contains {wordCount.toLocaleString("en-US")} entries assigned to the combined HSK 7–9 band in HSKKit's catalog aligned with the 2025 exam syllabus. The {foundationCount.toLocaleString("en-US")} earlier entries across HSK 1–6 bring the complete published catalog to {combinedCount.toLocaleString("en-US")} entries. This page contains the advanced-band portion of that total, not a separate word list for each of Levels 7, 8 and 9.</p><p>Entries are not the same as unique characters or spellings. Different readings or uses can have separate records. The dìdào entry for 地道 in this band is distinct from dìdao in HSK 6. Read the full entry when a written form looks familiar. Other exam versions and standards can also use different totals.</p><Link href="/tools/hsk-vocabulary-comparison" prefetch={false} className={styles.inlineLink}>Compare vocabulary versions →</Link></div>
        <div><h3>Learning explanations & pronunciation</h3><p>The English glosses include adapted CC-CEDICT definitions and are independent learning explanations, not official exam translations. The theme notes and proposal sentence on this page are HSKKit editorial material. Published word audio uses speech synthesis, with files available only for entries that have published audio.</p><p>Check the named syllabus when choosing exam preparation material. The source and licence notes describe catalog membership, definition provenance and audio. HSKKit is independent of the official HSK examination service.</p><Link href="/content-license" prefetch={false} className={styles.inlineLink}>Read content sources & licences →</Link></div>
      </div>
    </section>
    <section id="hsk7-faq" aria-labelledby="hsk7-faq-title" className={`${styles.panel} ${styles.faq}`}>
      <p className={`${styles.eyebrow} !text-blue-700`}>Questions about the combined band</p><h2 id="hsk7-faq-title">HSK 7–9 vocabulary: common questions</h2><div className={styles.faqList}>{questions.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
    </section>
    <section aria-labelledby="hsk7-next-title" className={`${styles.panel} ${styles.next}`}>
      <h2 id="hsk7-next-title">Keep building your vocabulary</h2>
      <div className={styles.nextGrid}>
        <Link href="/vocabulary/7?mode=flashcards#vocabulary-activities" prefetch={false}><strong>Review HSK 7–9 words →</strong><span>Check recall with a short set, then open the entries whose readings or uses need another look.</span></Link>
        <Link href="/dictionary?level=7" prefetch={false}><strong>Look up an HSK 7–9 entry →</strong><span>Search this level in the dictionary and read the full entry for the meaning you want to use.</span></Link>
        <Link href="/levels" prefetch={false}><strong>Browse every HSK level →</strong><span>Revisit earlier vocabulary and choose a review level that matches the words you need to practise.</span></Link>
      </div><Link href="/placement" prefetch={false} className={styles.inlineLink}>Check your starting level →</Link>
    </section>
  </div>;
}
