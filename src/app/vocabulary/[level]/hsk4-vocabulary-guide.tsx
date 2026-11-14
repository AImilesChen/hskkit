import Link from "next/link";
import { hsk4VocabularyTopics } from "@/lib/content/hsk4-vocabulary-landing";
import styles from "./hsk1-vocabulary.module.css";

const topicCopy: Record<string, { title: string; description: string; tip: string }> = {
  "plans": {
    "title": "Plans & arrangements",
    "description": "Move from saying what you want to do to describing how it will happen. 安排 means to arrange, 计划 can refer to a plan, and 申请 means to apply for something. Read each entry in context to distinguish an intention, an arrangement and a request.",
    "tip": "Connect a plan with a specific activity, then identify what needs arranging or applying for. Check the words that follow each verb instead of treating the three entries as interchangeable."
  },
  "discussion": {
    "title": "Opinions & explanations",
    "description": "Use 讨论 to discuss a topic, 意见 for an opinion or suggestion, and 解释 to explain something. These words let you describe an exchange of ideas rather than only stating that you like or dislike something.",
    "tip": "Choose a familiar topic and give one clear point. Read a model sentence before adding an explanation; a direct English translation may not show the natural order of the Chinese phrase."
  },
  "work": {
    "title": "Responsibilities & teamwork",
    "description": "Describe who is responsible with 负责, a task with 任务, and getting in touch with 联系. Combine people, actions and responsibilities to explain how a small piece of work is organized.",
    "tip": "The final syllable of 任务 is neutral in the catalog reading rènwu. Practise saying who is responsible for a task and who needs to be contacted, keeping the roles clear."
  },
  "travel": {
    "title": "Trips & travel details",
    "description": "Distinguish a business trip, 出差, from travel more generally, 旅行, and use 航班 for a scheduled flight. These entries add purpose and practical detail to earlier words for places and transport.",
    "tip": "Listen for chāi in 出差. The character 差 can have other readings and meanings, so learn the complete word and its context rather than guessing from the character alone."
  },
  "environment": {
    "title": "Environment & everyday choices",
    "description": "Connect 保护, to protect, with words for things people want to change: 垃圾 is trash, and 污染 can mean to pollute or pollution. Use the group to describe a concrete situation before making a broader claim.",
    "tip": "Bring back 环境 from HSK 3 when describing what needs protecting. A short example about a place you know is easier to check than a paragraph filled with unfamiliar abstract words."
  },
  "experience": {
    "title": "Experience & reflection",
    "description": "Use 经验 for experience, 仔细 for being careful or attentive, and 总结 for summing something up. Together they support an account of what happened, what you noticed and what you learned from it.",
    "tip": "After a short activity, summarize one useful point in Chinese. Check which words act as nouns or verbs in your sentence, and keep the event separate from your conclusion about it."
  }
};

const studySteps = [
  {
    "title": "Collect phrases that explain a real situation",
    "text": "Start with a purpose: arrange an activity, explain a suggestion or describe a trip. Learn a few related entries together and read their available examples. The worked sentence uses 讨论 with a travel plan, so the verb has a clear topic rather than only an English translation."
  },
  {
    "title": "Give a point, then support it",
    "text": "Try one short statement followed by a reason or example. Earlier words such as 因为 and 所以 can help connect the ideas. When you meet 不过 or 然而 in this level, notice how the following idea qualifies or contrasts with the earlier one. Read a complete example before choosing a connector."
  },
  {
    "title": "Separate similar characters, readings and uses",
    "text": "This level lists 重 as chóng, to repeat, and zhòng, heavy or important. It also distinguishes 空 as kōng, empty, from kòng, free time or making space. 生 has separate entries for producing or being born and for being raw or uncooked, even though both are read shēng. Keep the full entry and its context together."
  },
  {
    "title": "Alternate recall with a short explanation",
    "text": "Use a set of 10, 20 or 50 HSK 4 flashcards to check recognition. After revealing an answer, open an uncertain entry and read its available examples. Then use a few words in a short spoken or written explanation, bringing earlier vocabulary back into use. A word list supports this practice but does not replace work on other language skills."
  }
];

export function Hsk4VocabularyIntro({ wordCount }: { wordCount: number }) {
  return <div className={styles.intro}>
    <div className={styles.introCopy}>
      <p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-700">HSK 3.0 · 2025 exam syllabus</p>
      <h1 className="mt-2 text-4xl font-bold tracking-[-.035em] text-slate-950">HSK 4 Vocabulary</h1>
      <p className="mt-3 text-base leading-7 text-slate-600">Explore {wordCount.toLocaleString("en-US")} HSK 4 entries for explaining plans, sharing opinions and describing experiences. Build on the earlier levels with pinyin, English meanings, available audio and practical word groups.</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"><strong className="font-semibold text-slate-800">{wordCount.toLocaleString("en-US")} HSK 4 entries</strong><span aria-hidden="true" className="text-slate-400">·</span><Link href="#hsk4-sources" className="inline-flex min-h-11 items-center font-semibold text-blue-700 hover:underline">Word counts & syllabus →</Link></div>
    </div>
    <section className={styles.flashcard} aria-labelledby="quick-review-heading">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-violet-700">Quick Flashcards</p>
      <h2 id="quick-review-heading">Put your ideas into words.</h2>
      <p>Practise 10, 20, or 50 HSK 4 words.<br />No sign-in required.</p>
      <Link href="/vocabulary/4?mode=flashcards#vocabulary-activities" prefetch={false}>Start HSK 4 review →</Link>
    </section>
  </div>;
}

export function Hsk4VocabularyGuide({ wordCount, foundationCount }: { wordCount: number; foundationCount: number }) {
  const combinedCount = foundationCount + wordCount;
  const questions = [
    { question: `Are there ${wordCount.toLocaleString("en-US")} or ${combinedCount.toLocaleString("en-US")} HSK 4 entries?`, answer: `This page contains ${wordCount.toLocaleString("en-US")} entries assigned to HSK 4 in HSKKit's active catalog aligned with the 2025 exam syllabus. HSK 1–3 contain ${foundationCount.toLocaleString("en-US")} earlier entries, making ${combinedCount.toLocaleString("en-US")} across the first four levels. The combined figure is not the number of new entries on this page. These are catalog-entry totals rather than counts of unique characters; other syllabus versions can use different totals.` },
    { question: "How should I use this list after HSK 3?", answer: "Keep earlier vocabulary in your review routine while adding small groups from HSK 4. Practise using a new word to explain a plan, opinion or experience, then read its available examples to check the phrase. You can browse any level freely. Recognizing a list of words alone does not establish readiness for an exam." },
    { question: "Why do 重, 空 and 生 have separate entries?", answer: "A written form can have different readings or uses. This level distinguishes 重 as chóng and zhòng, and 空 as kōng and kòng. 生 has two entries with the same reading shēng but different meanings: producing or being born, and being raw or uncooked. Separate IDs preserve these entries, so check the reading, meaning and context before choosing a word." },
    { question: "How can I practise explaining an opinion in Chinese?", answer: "Choose one familiar topic, state a clear point and add a reason or example using a structure you understand. Try the discussion sentence on this page, then change the topic while keeping the surrounding phrase familiar. Read available word-entry examples before adding an unfamiliar connector or extending the explanation." },
    { question: "Does HSK 4 include recorded pronunciation for every word?", answer: "Published word audio is synthesized rather than recorded by a native speaker, and availability varies by entry. Use the audio filter to show words with published pronunciation files. Word details identify any separate device-voice preview that is offered; the content sources page explains pronunciation provenance." },
    { question: "Can I search and review only HSK 4 for free?", answer: "Yes. Search this level by Chinese, pinyin or English, and use the word-type, audio and sort controls to narrow the results. Quick Flashcards offers guest sets of 10, 20 or 50 HSK 4 words without sign-in. Open a word for its details, or use account learning actions when you want synced progress." },
  ];
  return <div className={styles.guide} data-hsk4-guide>
    <section id="hsk4-topics" aria-labelledby="hsk4-topics-title" className={`${styles.panel} ${styles.topics}`}>
      <p className={styles.eyebrow}>From situations to explanations</p><h2 id="hsk4-topics-title">Explore HSK 4 vocabulary by topic</h2>
      <p className={styles.lead}>Use these six groups to connect the full list with situations you can describe. Each group contains three real entries from the current HSK 4 catalog. Open a word to see its complete reading, meanings and available examples; the groups are study suggestions rather than an official syllabus classification.</p>
      <div className={styles.topicGrid}>{hsk4VocabularyTopics.map(topic => {
        const copy = topicCopy[topic.id];
        return <article key={topic.id} className={styles.topicCard}><h3>{copy.title}</h3><p>{copy.description}</p><ul className={styles.topicWords}>{topic.words.map(word => <li key={word.id}><Link href={`/word/${word.id}`} prefetch={false} aria-label={`Explore ${word.payload.hanzi}: ${word.payload.meaning}`}><span lang="zh-Hans" className={styles.topicHanzi}>{word.payload.hanzi}</span><span lang="zh-Latn" className={styles.topicPinyin}>{word.payload.pinyin}</span><span className={styles.topicMeaning}>{word.payload.meaning}</span></Link></li>)}</ul><p className={styles.tip}>{copy.tip}</p></article>;
      })}</div>
    </section>
    <section id="hsk4-study-guide" aria-labelledby="hsk4-study-title" className={`${styles.panel} ${styles.method}`}>
      <p className={styles.eyebrow}>Build a clear explanation</p><h2 id="hsk4-study-title">How to study HSK 4 vocabulary</h2>
      <p className={styles.lead}>Practise making a point and giving enough detail for someone to follow it. Relate a new word to a complete phrase, keep different readings distinct and reuse earlier vocabulary in a short explanation. Begin with a familiar situation before attempting a longer account.</p>
      <div className={styles.methodGrid}>
        <ol className={styles.steps}>{studySteps.map(step => <li key={step.title}><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}</ol>
        <aside className={styles.example} aria-labelledby="hsk4-example-title">
          <h3 id="hsk4-example-title">Give a discussion a clear topic</h3><p className={styles.exampleWord} lang="zh-Hans">讨论</p><p className={styles.examplePinyin} lang="zh-Latn">tǎolùn</p><p>to discuss · say what the discussion is about</p>
          <div className={styles.sentence}><p lang="zh-Hans">我们正在讨论旅行的计划。</p><p lang="zh-Latn">Wǒmen zhèngzài tǎolùn lǚxíng de jìhuà.</p><p>We are discussing the plans for a trip.</p></div>
          <dl><div><dt>Follow the action and its topic</dt><dd>我们 identifies the speakers, and 正在 shows that the action is in progress. 讨论 names the action. 旅行的计划 tells you what is being discussed: the plans for a trip.</dd></div><div><dt>Bring different levels together</dt><dd>讨论, 旅行 and 计划 are HSK 4 entries. 我们, 正在 and 的 come from HSK 1. Keep the familiar structure while choosing a topic you can explain in your own words.</dd></div></dl>
          <Link href="/word/hsk2025.word.l4.1723.v1" prefetch={false} className={styles.inlineLink}>Explore 讨论 and its available examples →</Link><p className="!text-sm">An original HSKKit learning example, not an official exam question.</p>
        </aside>
      </div>
      <Link href="/vocabulary/3" prefetch={false} className={styles.inlineLink}>Keep earlier words active: revisit HSK 3 →</Link>
    </section>
    <section id="hsk4-sources" aria-labelledby="hsk4-sources-title" className={`${styles.panel} ${styles.sources}`}>
      <p className={styles.eyebrow}>Separate level entries from combined totals</p><h2 id="hsk4-sources-title">HSK 4 word count, syllabus & sources</h2>
      <div className={styles.sourceGrid}>
        <div><h3>{wordCount.toLocaleString("en-US")} entries at this level</h3><p>This page contains {wordCount.toLocaleString("en-US")} entries assigned to HSK 4 in HSKKit's catalog aligned with the 2025 exam syllabus. The {foundationCount.toLocaleString("en-US")} earlier entries across HSK 1–3 bring the first four levels to {combinedCount.toLocaleString("en-US")} catalog entries. This page contains the HSK 4 portion of that combined total.</p><p>Entries are not the same as unique characters or spellings. Different readings or uses can have separate records; this level includes both chóng and zhòng for 重, as well as separate uses of 生 with the same reading shēng. Other exam versions and standards can also use different totals.</p><Link href="/tools/hsk-vocabulary-comparison" prefetch={false} className={styles.inlineLink}>Compare vocabulary versions →</Link></div>
        <div><h3>Learning explanations & pronunciation</h3><p>The English glosses include adapted CC-CEDICT definitions and are independent learning explanations, not official exam translations. The theme notes and discussion sentence on this page are HSKKit editorial material. Published word audio uses speech synthesis, with files available only for entries that have published audio.</p><p>Check the named syllabus when choosing exam preparation material. The source and licence notes describe catalog membership, definition provenance and audio. HSKKit is independent of the official HSK examination service.</p><Link href="/content-license" prefetch={false} className={styles.inlineLink}>Read content sources & licences →</Link></div>
      </div>
    </section>
    <section id="hsk4-faq" aria-labelledby="hsk4-faq-title" className={`${styles.panel} ${styles.faq}`}>
      <p className={`${styles.eyebrow} !text-blue-700`}>Questions about the next level</p><h2 id="hsk4-faq-title">HSK 4 vocabulary: common questions</h2><div className={styles.faqList}>{questions.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
    </section>
    <section aria-labelledby="hsk4-next-title" className={`${styles.panel} ${styles.next}`}>
      <h2 id="hsk4-next-title">Keep building your vocabulary</h2>
      <div className={styles.nextGrid}>
        <Link href="/vocabulary/4?mode=flashcards#vocabulary-activities" prefetch={false}><strong>Review HSK 4 words →</strong><span>Check recall with a short set, then open the entries whose readings or uses need another look.</span></Link>
        <Link href="/dictionary?level=4" prefetch={false}><strong>Look up an HSK 4 entry →</strong><span>Search this level in the dictionary and read the full entry for the meaning you want to use.</span></Link>
        <Link href="/vocabulary/5" prefetch={false}><strong>Explore HSK 5 vocabulary →</strong><span>Browse the next level when you want to extend your vocabulary, while keeping earlier words in review.</span></Link>
      </div><Link href="/placement" prefetch={false} className={styles.inlineLink}>Check your starting level →</Link>
    </section>
  </div>;
}
