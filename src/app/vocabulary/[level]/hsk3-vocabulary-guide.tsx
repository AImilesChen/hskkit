import Link from "next/link";
import { hsk3VocabularyTopics } from "@/lib/content/hsk3-vocabulary-landing";
import styles from "./hsk1-vocabulary.module.css";

const topicCopy: Record<string, { title: string; description: string; tip: string }> = {
  "travel": {
    "title": "Travel & accommodation",
    "description": "Prepare for more than naming a destination. 护照 is a passport, 行李 is luggage, and 宾馆 is a hotel or guesthouse. Together, these words help you describe what you need for a trip and where you will stay.",
    "tip": "Read 行李 as xíngli, with a neutral final syllable. Connect each word with a real travel task, then open the entry for its available examples."
  },
  "learning": {
    "title": "Study & recall",
    "description": "Give your study routine a clearer purpose: 复习 means to review, 笔记 refers to notes, and 词典 is a dictionary. Use the three entries to talk about revisiting a lesson and looking up a word you cannot remember.",
    "tip": "Do more than copy a translation into your notes. Record the reading and a short phrase, then try recalling it before checking the dictionary again."
  },
  "health": {
    "title": "Health & how you feel",
    "description": "Use 感冒 for a cold or catching a cold, 发烧 for having a fever, and 健康 for health or being healthy. Notice how a word describing a condition differs from a general description of health.",
    "tip": "Read the complete example before substituting a health word into a sentence. Try describing how someone feels and when a condition started, using time words you already know."
  },
  "work": {
    "title": "Work & shared activities",
    "description": "Talk about a workplace with 办公室, a colleague with 同事, and a meeting with 会议. Link the people, place and event in a short account of a working day instead of learning three unrelated translations.",
    "tip": "Check the verb that accompanies an event such as a meeting. A noun and its English translation alone do not show every natural Chinese combination."
  },
  "plans": {
    "title": "Plans & decisions",
    "description": "Explain what you intend to do with 打算, make a decision with 决定, and place an activity at the weekend with 周末. The difference between an intention and a settled decision gives each entry a practical use.",
    "tip": "Try the worked example below, then change the planned activity. Keep the words in a sentence you understand rather than adding several unfamiliar structures at once."
  },
  "seasons": {
    "title": "Seasons & everyday changes",
    "description": "Compare familiar activities across 春天, 夏天 and 冬天: spring, summer and winter. Relate each season to where you live and what you do, bringing earlier weather and time words back into use.",
    "tip": "The complete four-season set also includes 秋天, available in the full HSK 3 list. Search for it above and compare the readings before making a seasonal description."
  }
};

const studySteps = [
  {
    "title": "Learn a useful phrase around each new entry",
    "text": "Start with a situation you can describe, such as a weekend plan or a visit to a library. Pair a new word with familiar vocabulary and read its available examples. For instance, 打算 introduces an intended activity; the meaning becomes easier to recall when you say what you plan to do."
  },
  {
    "title": "Connect ideas in a short sequence",
    "text": "Use 先 for a first step and 然后 for what follows. Keep the subject and actions clear before making a longer sentence. You can also explore 如果 for a condition, but read a complete model before joining several clauses. One accurate connection is more useful than a string of memorized English glosses."
  },
  {
    "title": "Keep readings and grammatical roles separate",
    "text": "HSK 3 lists 得 as dé, to obtain, and děi, must or have to. These differ from the HSK 2 structural particle de. Likewise, 还 as huán, to return something, differs from hái, still or also, in HSK 1. Check the specific entry and its context before choosing a reading."
  },
  {
    "title": "Recall new words alongside the earlier levels",
    "text": "Use 10, 20 or 50 HSK 3 flashcards for a manageable recall session. Reveal each answer after trying it, then revisit uncertain entries. Combine a few HSK 3 words with HSK 1 and HSK 2 vocabulary in a short spoken or written account; a word list alone does not practise every language skill."
  }
];

export function Hsk3VocabularyIntro({ wordCount }: { wordCount: number }) {
  return <div className={styles.intro}>
    <div className={styles.introCopy}>
      <p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-700">HSK 3.0 · 2025 exam syllabus</p>
      <h1 className="mt-2 text-4xl font-bold tracking-[-.035em] text-slate-950">HSK 3 Vocabulary</h1>
      <p className="mt-3 text-base leading-7 text-slate-600">Build on HSK 1 and HSK 2 with {wordCount.toLocaleString("en-US")} HSK 3 entries for travel, study, work and everyday plans. Explore pinyin, meanings and available audio, then connect new words in short sentences.</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"><strong className="font-semibold text-slate-800">{wordCount.toLocaleString("en-US")} HSK 3 entries</strong><span aria-hidden="true" className="text-slate-400">·</span><Link href="#hsk3-sources" className="inline-flex min-h-11 items-center font-semibold text-blue-700 hover:underline">Word counts & syllabus →</Link></div>
    </div>
    <section className={styles.flashcard} aria-labelledby="quick-review-heading">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-violet-700">Quick Flashcards</p>
      <h2 id="quick-review-heading">Make your next sentence count.</h2>
      <p>Practise 10, 20, or 50 HSK 3 words.<br />No sign-in required.</p>
      <Link href="/vocabulary/3?mode=flashcards#vocabulary-activities" prefetch={false}>Start HSK 3 review →</Link>
    </section>
  </div>;
}

export function Hsk3VocabularyGuide({ wordCount, foundationCount }: { wordCount: number; foundationCount: number }) {
  const combinedCount = foundationCount + wordCount;
  const questions = [
    { question: `Does HSK 3 contain ${wordCount} or ${combinedCount.toLocaleString("en-US")} entries?`, answer: `This page contains the ${wordCount} entries assigned to HSK 3 in HSKKit's active catalog aligned with the 2025 exam syllabus. HSK 1 and HSK 2 together contain ${foundationCount} earlier entries, giving ${combinedCount.toLocaleString("en-US")} across the first three levels. These are catalog-entry totals, not counts of unique Chinese characters. Earlier exam versions can use different word lists and totals.` },
    { question: "Should I keep reviewing HSK 1 and HSK 2?", answer: "Yes. The earlier levels supply familiar words that you can combine with the new entries. Add a small group from HSK 3, then use it in a situation that also brings earlier vocabulary back into use. You can browse any level freely; vocabulary recognition by itself does not establish exam readiness." },
    { question: "Why does 得 have more than one reading?", answer: "The HSK 3 catalog has separate entries for dé, to obtain or get, and děi, must or have to. HSK 2 also lists de as a structural particle. These entries have different IDs and uses. Read the pinyin and full entry, then check its examples instead of choosing a pronunciation from the written character alone." },
    { question: "How can I move from flashcards to sentences?", answer: "Choose a situation and a small set of words you want to use. Try the weekend-plan example on this page, then change one detail while keeping a familiar sentence structure. Read available word-entry examples to check usage. You can practise sequencing with 先 and 然后 before attempting a longer account." },
    { question: "Is the HSK 3 pronunciation audio recorded by speakers?", answer: "Published word audio is synthesized rather than a native-speaker recording. Use the audio filter to find entries with published pronunciation files; play controls appear where files are available. The sources page explains provenance, and word details identify any separate device-voice preview that is offered." },
    { question: "Can I search and practise this level without an account?", answer: "Yes. Search HSK 3 by Chinese, pinyin or English, and use the part-of-speech, audio and sort controls to narrow the list. Quick Flashcards supports guest sets of 10, 20 or 50 words. Open a word for full details; account learning actions are available when you want synced progress." },
  ];
  return <div className={styles.guide} data-hsk3-guide>
    <section id="hsk3-topics" aria-labelledby="hsk3-topics-title" className={`${styles.panel} ${styles.topics}`}>
      <p className={styles.eyebrow}>Words for a fuller account</p><h2 id="hsk3-topics-title">Explore HSK 3 vocabulary by topic</h2>
      <p className={styles.lead}>Use these six groups to connect the full list with situations you can describe. Each group contains three real entries from the current HSK 3 catalog. Open a word to see its complete reading, meanings and available examples; the groups are study suggestions rather than an official syllabus classification.</p>
      <div className={styles.topicGrid}>{hsk3VocabularyTopics.map(topic => {
        const copy = topicCopy[topic.id];
        return <article key={topic.id} className={styles.topicCard}><h3>{copy.title}</h3><p>{copy.description}</p><ul className={styles.topicWords}>{topic.words.map(word => <li key={word.id}><Link href={`/word/${word.id}`} prefetch={false} aria-label={`Explore ${word.payload.hanzi}: ${word.payload.meaning}`}><span lang="zh-Hans" className={styles.topicHanzi}>{word.payload.hanzi}</span><span lang="zh-Latn" className={styles.topicPinyin}>{word.payload.pinyin}</span><span className={styles.topicMeaning}>{word.payload.meaning}</span></Link></li>)}</ul><p className={styles.tip}>{copy.tip}</p></article>;
      })}</div>
    </section>
    <section id="hsk3-study-guide" aria-labelledby="hsk3-study-title" className={`${styles.panel} ${styles.method}`}>
      <p className={styles.eyebrow}>Turn vocabulary into connected ideas</p><h2 id="hsk3-study-title">How to study HSK 3 vocabulary</h2>
      <p className={styles.lead}>Use HSK 3 words to describe an intention, connect a sequence and give more detail about everyday life. The aim is to recall both a word and a way to use it. Keep familiar vocabulary active while you practise a few new entries at a time.</p>
      <div className={styles.methodGrid}>
        <ol className={styles.steps}>{studySteps.map(step => <li key={step.title}><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}</ol>
        <aside className={styles.example} aria-labelledby="hsk3-example-title">
          <h3 id="hsk3-example-title">Put a weekend plan into words</h3><p className={styles.exampleWord} lang="zh-Hans">打算</p><p className={styles.examplePinyin} lang="zh-Latn">dǎsuàn</p><p>to plan · introduce an intended activity</p>
          <div className={styles.sentence}><p lang="zh-Hans">周末我打算去图书馆复习。</p><p lang="zh-Latn">Zhōumò wǒ dǎsuàn qù túshūguǎn fùxí.</p><p>I plan to go to the library to review this weekend.</p></div>
          <dl><div><dt>Read the plan in parts</dt><dd>周末 sets the time, 我 identifies the speaker, and 打算 introduces the intention. 去图书馆 names the destination, while 复习 explains the activity.</dd></div><div><dt>Connect this level with familiar words</dt><dd>周末, 打算, 图书馆 and 复习 are HSK 3 entries. 我 and 去 come from HSK 1. Change one part to make a plan that is true for you, keeping the rest of the sentence familiar.</dd></div></dl>
          <Link href="/word/hsk2025.word.l3.0572.v1" prefetch={false} className={styles.inlineLink}>Explore 打算 and its available examples →</Link><p className="!text-sm">An original HSKKit learning example, not an official exam question.</p>
        </aside>
      </div>
      <Link href="/vocabulary/2" prefetch={false} className={styles.inlineLink}>Keep earlier words active: revisit HSK 2 →</Link>
    </section>
    <section id="hsk3-sources" aria-labelledby="hsk3-sources-title" className={`${styles.panel} ${styles.sources}`}>
      <p className={styles.eyebrow}>Separate level entries from combined totals</p><h2 id="hsk3-sources-title">HSK 3 word count, syllabus & sources</h2>
      <div className={styles.sourceGrid}>
        <div><h3>{wordCount.toLocaleString("en-US")} entries at this level</h3><p>This page contains {wordCount.toLocaleString("en-US")} entries assigned to HSK 3 in HSKKit's catalog aligned with the 2025 exam syllabus. The {foundationCount.toLocaleString("en-US")} entries across HSK 1 and HSK 2 bring the first three levels to {combinedCount.toLocaleString("en-US")} catalog entries. This page is the HSK 3 portion, rather than the entire combined list.</p><p>Entries are not the same as unique characters or spellings. Different readings or uses can have separate records; for example, 得 appears as dé and děi in this level. Other exam versions and standards can also use different totals.</p><Link href="/tools/hsk-vocabulary-comparison" prefetch={false} className={styles.inlineLink}>Compare vocabulary versions →</Link></div>
        <div><h3>Learning explanations & pronunciation</h3><p>The English glosses include adapted CC-CEDICT definitions and are independent learning explanations, not official exam translations. The theme notes and weekend-plan sentence on this page are HSKKit editorial material. Published word audio uses speech synthesis, with files available only for entries that have published audio.</p><p>Check the named syllabus when choosing exam preparation material. The source and licence notes describe catalog membership, definition provenance and audio. HSKKit is independent of the official HSK examination service.</p><Link href="/content-license" prefetch={false} className={styles.inlineLink}>Read content sources & licences →</Link></div>
      </div>
    </section>
    <section id="hsk3-faq" aria-labelledby="hsk3-faq-title" className={`${styles.panel} ${styles.faq}`}>
      <p className={`${styles.eyebrow} !text-blue-700`}>Questions about the next level</p><h2 id="hsk3-faq-title">HSK 3 vocabulary: common questions</h2><div className={styles.faqList}>{questions.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
    </section>
    <section aria-labelledby="hsk3-next-title" className={`${styles.panel} ${styles.next}`}>
      <h2 id="hsk3-next-title">Keep building your vocabulary</h2>
      <div className={styles.nextGrid}>
        <Link href="/vocabulary/3?mode=flashcards#vocabulary-activities" prefetch={false}><strong>Review HSK 3 words →</strong><span>Check recall with a short set, then open the entries whose readings or uses need another look.</span></Link>
        <Link href="/dictionary?level=3" prefetch={false}><strong>Look up an HSK 3 entry →</strong><span>Search this level in the dictionary and read the full entry for the meaning you want to use.</span></Link>
        <Link href="/vocabulary/4" prefetch={false}><strong>Explore HSK 4 vocabulary →</strong><span>Browse the next level when you want to extend your vocabulary, while keeping earlier words in review.</span></Link>
      </div><Link href="/placement" prefetch={false} className={styles.inlineLink}>Check your starting level →</Link>
    </section>
  </div>;
}
