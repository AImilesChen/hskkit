import Link from "next/link";
import { hsk5VocabularyTopics } from "@/lib/content/hsk5-vocabulary-landing";
import styles from "./hsk1-vocabulary.module.css";

const topicCopy: Record<string, { title: string; description: string; tip: string }> = {
  "analysis": {
    "title": "Information & analysis",
    "description": "Connect the information you examine with what you say about it. 数据 means data, 分析 means to analyze, and 结论 is a conclusion. Learning them together helps you describe the stages of looking into a question.",
    "tip": "Keep the information, your analysis and your conclusion clear when reading a passage. Try summarizing one point in your own words before checking the complete word entries."
  },
  "opinions": {
    "title": "Opinions & supporting detail",
    "description": "Use 观点 for a point of view, 证据 for evidence, and 表达 for expressing something. The group helps you follow what someone believes, how they communicate it and what they use to support it.",
    "tip": "Choose one viewpoint and add a concrete reason or example. Check the phrases used with 证据 and 表达 in available examples, rather than translating a whole English argument word for word."
  },
  "cooperation": {
    "title": "Cooperation & practical plans",
    "description": "Move from an individual task to working with others. 合作 means to cooperate, 方案 is a plan or proposed approach, and 效率 refers to efficiency. Link the people involved with an approach and the way the work proceeds.",
    "tip": "Compare 方案 here with 计划 from HSK 4 by reading their available examples. They overlap in English, but a particular context may call for a proposed approach or for an intended course of action."
  },
  "innovation": {
    "title": "Ideas & implementation",
    "description": "Follow an idea through design and action. 设计 means to design, 创新 concerns bringing forward new ideas, and 实施 means to implement. Together they help describe how an idea moves into practical use.",
    "tip": "Explain one familiar activity in a few short steps. Choose the word that fits each step, then check how its object is expressed before extending the account."
  },
  "change": {
    "title": "Society & changing needs",
    "description": "Describe something you notice with 现象, a direction of change with 趋势, and a requirement or demand with 需求. The three entries give you ways to discuss a situation beyond naming an isolated event.",
    "tip": "Be precise about what you observed and what you think may be changing. In reading practice, identify the words that connect a particular example with a broader description."
  },
  "culture": {
    "title": "Traditions, customs & values",
    "description": "Explore 传统 for tradition, 风俗 for social custom, and 价值 for value. Use a specific practice or example when talking about culture, so that an abstract word has a clear reference.",
    "tip": "Compare a custom you know with its description in a passage. Keep the particular practice separate from a broad claim about a whole group, and read the complete entry for the sense being used."
  }
};

const studySteps = [
  {
    "title": "Read a small group of words in a complete passage",
    "text": "Choose a familiar subject and identify a few HSK 5 entries in a short text. Look at the words around them and how the sentences connect. A word such as 分析 is easier to use when you know what is being analyzed and what information the writer draws on."
  },
  {
    "title": "Separate the main point from its support",
    "text": "Find the viewpoint, then identify the reason, evidence or example that follows. Use 观点, 证据 and 结论 to describe those roles in your notes. Summarize the point in a short sentence before writing a longer explanation with structures you already understand."
  },
  {
    "title": "Keep similar readings and meanings distinct",
    "text": "This level distinguishes 处 as chǔ, to handle, from chù, a place; 调 as diào, to transfer, from tiáo, to harmonize; and 系 as jì, to tie, from xì, a system. 称 also has separate entries for naming and weighing, both read chēng. Learn the complete entry in context instead of merging records with the same characters."
  },
  {
    "title": "Combine recall with paraphrasing",
    "text": "Use 10, 20 or 50 HSK 5 flashcards to check recognition. Then choose a few uncertain words, read their available examples and explain the same idea in a shorter way. Keep earlier vocabulary active while building a more precise account; word recognition and connected language use need practice together."
  }
];

export function Hsk5VocabularyIntro({ wordCount }: { wordCount: number }) {
  return <div className={styles.intro}>
    <div className={styles.introCopy}>
      <p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-700">HSK 3.0 · 2025 exam syllabus</p>
      <h1 className="mt-2 text-4xl font-bold tracking-[-.035em] text-slate-950">HSK 5 Vocabulary</h1>
      <p className="mt-3 text-base leading-7 text-slate-600">Explore {wordCount.toLocaleString("en-US")} HSK 5 entries for analyzing information, explaining viewpoints and discussing wider topics. Read pinyin and English meanings, study useful word groups and practise expressing a clear idea.</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"><strong className="font-semibold text-slate-800">{wordCount.toLocaleString("en-US")} HSK 5 entries</strong><span aria-hidden="true" className="text-slate-400">·</span><Link href="#hsk5-sources" className="inline-flex min-h-11 items-center font-semibold text-blue-700 hover:underline">Word counts & syllabus →</Link></div>
    </div>
    <section className={styles.flashcard} aria-labelledby="quick-review-heading">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-violet-700">Quick Flashcards</p>
      <h2 id="quick-review-heading">Make a more precise point.</h2>
      <p>Practise 10, 20, or 50 HSK 5 words.<br />No sign-in required.</p>
      <Link href="/vocabulary/5?mode=flashcards#vocabulary-activities" prefetch={false}>Start HSK 5 review →</Link>
    </section>
  </div>;
}

export function Hsk5VocabularyGuide({ wordCount, foundationCount }: { wordCount: number; foundationCount: number }) {
  const combinedCount = foundationCount + wordCount;
  const questions = [
    { question: `Does HSK 5 have ${wordCount.toLocaleString("en-US")} or ${combinedCount.toLocaleString("en-US")} entries?`, answer: `This page contains ${wordCount.toLocaleString("en-US")} entries assigned to HSK 5 in HSKKit's active catalog aligned with the 2025 exam syllabus. HSK 1–4 contribute ${foundationCount.toLocaleString("en-US")} earlier entries, making ${combinedCount.toLocaleString("en-US")} across the first five levels. The combined total is not the number of new entries on this page. Catalog entries are not the same as unique written characters, and other syllabus versions can use different totals.` },
    { question: "How does this list build on HSK 4?", answer: "The HSK 5 groups on this page extend earlier vocabulary into analyzing information, explaining a point of view and discussing broader subjects. Keep HSK 1–4 words in review and combine them with a few new entries in a short text or explanation. You can browse any level freely; knowing a word list alone does not establish exam readiness." },
    { question: "Why do 处, 调, 系 and 称 have separate entries?", answer: "A written form can represent different readings or senses. This level separates chǔ and chù for 处, diào and tiáo for 调, and jì and xì for 系. It also has two entries for 称, both read chēng: naming and weighing. Separate IDs keep these meanings and readings distinct. Use the full entry and its context when deciding which one fits." },
    { question: "How can I use HSK 5 vocabulary in a longer explanation?", answer: "Begin with one clear point and a short supporting example or reason. Identify what the new words do in the sentence, then use familiar structures to connect the ideas. The analysis example on this page shows how 根据 introduces the basis for an action. Read available word-entry examples and try paraphrasing a short passage before writing a longer account." },
    { question: "What if the Words with audio filter has no results?", answer: "The filter only returns entries with published pronunciation files, so an empty result means no matching files are currently published for those filters. You can still search, read pinyin, open word details and use flashcards. Published word audio across HSKKit is synthesized; any separate device-voice preview is identified in word details. Check the sources page for pronunciation provenance." },
    { question: "Can I search and review just HSK 5 without signing in?", answer: "Yes. Search within this level by Chinese, pinyin or English, then use the word-type, audio and sort controls to narrow the results. Quick Flashcards supports guest sets of 10, 20 or 50 HSK 5 words. Open a word to read its details, or use account learning actions when you want synced progress." },
  ];
  return <div className={styles.guide} data-hsk5-guide>
    <section id="hsk5-topics" aria-labelledby="hsk5-topics-title" className={`${styles.panel} ${styles.topics}`}>
      <p className={styles.eyebrow}>Words for a developed idea</p><h2 id="hsk5-topics-title">Explore HSK 5 vocabulary by topic</h2>
      <p className={styles.lead}>Use these six groups to connect the full list with situations you can describe. Each group contains three real entries from the current HSK 5 catalog. Open a word to see its complete reading, meanings and available examples; the groups are study suggestions rather than an official syllabus classification.</p>
      <div className={styles.topicGrid}>{hsk5VocabularyTopics.map(topic => {
        const copy = topicCopy[topic.id];
        return <article key={topic.id} className={styles.topicCard}><h3>{copy.title}</h3><p>{copy.description}</p><ul className={styles.topicWords}>{topic.words.map(word => <li key={word.id}><Link href={`/word/${word.id}`} prefetch={false} aria-label={`Explore ${word.payload.hanzi}: ${word.payload.meaning}`}><span lang="zh-Hans" className={styles.topicHanzi}>{word.payload.hanzi}</span><span lang="zh-Latn" className={styles.topicPinyin}>{word.payload.pinyin}</span><span className={styles.topicMeaning}>{word.payload.meaning}</span></Link></li>)}</ul><p className={styles.tip}>{copy.tip}</p></article>;
      })}</div>
    </section>
    <section id="hsk5-study-guide" aria-labelledby="hsk5-study-title" className={`${styles.panel} ${styles.method}`}>
      <p className={styles.eyebrow}>Read closely and express precisely</p><h2 id="hsk5-study-title">How to study HSK 5 vocabulary</h2>
      <p className={styles.lead}>Link a word with the role it plays in a passage: naming information, presenting a viewpoint or explaining a result. Practise reading for those connections, then use a few entries in an explanation of your own. Keep the wording precise while the surrounding sentence structure stays familiar.</p>
      <div className={styles.methodGrid}>
        <ol className={styles.steps}>{studySteps.map(step => <li key={step.title}><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}</ol>
        <aside className={styles.example} aria-labelledby="hsk5-example-title">
          <h3 id="hsk5-example-title">Connect an action with its basis</h3><p className={styles.exampleWord} lang="zh-Hans">分析</p><p className={styles.examplePinyin} lang="zh-Latn">fēnxī</p><p>to analyze · explain what you examine</p>
          <div className={styles.sentence}><p lang="zh-Hans">我们根据数据分析问题。</p><p lang="zh-Latn">Wǒmen gēnjù shùjù fēnxī wèntí.</p><p>We analyze the problem based on the data.</p></div>
          <dl><div><dt>Find the basis and the action</dt><dd>我们 identifies who acts. 根据数据 explains the basis for the action, and 分析问题 tells you what is being done: analyzing the problem.</dd></div><div><dt>Connect new words with earlier vocabulary</dt><dd>数据 and 分析 are HSK 5 entries. 根据 comes from HSK 3, while 我们 and 问题 come from HSK 1. Keep the pattern clear when you describe the information used in your own example.</dd></div></dl>
          <Link href="/word/hsk2025.word.l5.2355.v1" prefetch={false} className={styles.inlineLink}>Explore 分析 and its available examples →</Link><p className="!text-sm">An original HSKKit learning example, not an official exam question.</p>
        </aside>
      </div>
      <Link href="/vocabulary/4" prefetch={false} className={styles.inlineLink}>Keep earlier words active: revisit HSK 4 →</Link>
    </section>
    <section id="hsk5-sources" aria-labelledby="hsk5-sources-title" className={`${styles.panel} ${styles.sources}`}>
      <p className={styles.eyebrow}>Separate level entries from combined totals</p><h2 id="hsk5-sources-title">HSK 5 word count, syllabus & sources</h2>
      <div className={styles.sourceGrid}>
        <div><h3>{wordCount.toLocaleString("en-US")} entries at this level</h3><p>This page contains {wordCount.toLocaleString("en-US")} entries assigned to HSK 5 in HSKKit's catalog aligned with the 2025 exam syllabus. The {foundationCount.toLocaleString("en-US")} earlier entries across HSK 1–4 bring the first five levels to {combinedCount.toLocaleString("en-US")} catalog entries. This page contains the HSK 5 portion of that combined total.</p><p>Entries are not the same as unique characters or spellings. Different readings or uses can have separate records; this level includes both jì and xì for 系, as well as separate senses of 称 with the same reading chēng. Other exam versions and standards can also use different totals.</p><Link href="/tools/hsk-vocabulary-comparison" prefetch={false} className={styles.inlineLink}>Compare vocabulary versions →</Link></div>
        <div><h3>Learning explanations & pronunciation</h3><p>The English glosses include adapted CC-CEDICT definitions and are independent learning explanations, not official exam translations. The theme notes and analysis sentence on this page are HSKKit editorial material. Published word audio uses speech synthesis, with files available only for entries that have published audio.</p><p>Check the named syllabus when choosing exam preparation material. The source and licence notes describe catalog membership, definition provenance and audio. HSKKit is independent of the official HSK examination service.</p><Link href="/content-license" prefetch={false} className={styles.inlineLink}>Read content sources & licences →</Link></div>
      </div>
    </section>
    <section id="hsk5-faq" aria-labelledby="hsk5-faq-title" className={`${styles.panel} ${styles.faq}`}>
      <p className={`${styles.eyebrow} !text-blue-700`}>Questions about the next level</p><h2 id="hsk5-faq-title">HSK 5 vocabulary: common questions</h2><div className={styles.faqList}>{questions.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
    </section>
    <section aria-labelledby="hsk5-next-title" className={`${styles.panel} ${styles.next}`}>
      <h2 id="hsk5-next-title">Keep building your vocabulary</h2>
      <div className={styles.nextGrid}>
        <Link href="/vocabulary/5?mode=flashcards#vocabulary-activities" prefetch={false}><strong>Review HSK 5 words →</strong><span>Check recall with a short set, then open the entries whose readings or uses need another look.</span></Link>
        <Link href="/dictionary?level=5" prefetch={false}><strong>Look up an HSK 5 entry →</strong><span>Search this level in the dictionary and read the full entry for the meaning you want to use.</span></Link>
        <Link href="/vocabulary/6" prefetch={false}><strong>Explore HSK 6 vocabulary →</strong><span>Browse the next level when you want to extend your vocabulary, while keeping earlier words in review.</span></Link>
      </div><Link href="/placement" prefetch={false} className={styles.inlineLink}>Check your starting level →</Link>
    </section>
  </div>;
}
