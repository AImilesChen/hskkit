import Link from "next/link";
import { hsk6VocabularyTopics } from "@/lib/content/hsk6-vocabulary-landing";
import styles from "./hsk1-vocabulary.module.css";

const topicCopy: Record<string, { title: string; description: string; tip: string }> = {
  "viewpoints": {
    "title": "Viewpoints & disagreement",
    "description": "Identify a position with 立场, a controversy with 争议, and what someone advocates with 主张. These words help separate a speaker's position from the issue being discussed and the course of action they support.",
    "tip": "Read two short accounts of the same issue. Note who holds each position and what they actually advocate. Avoid treating a disagreement as evidence that either position is correct."
  },
  "finance": {
    "title": "Investment, capital & assets",
    "description": "Connect 投资, investment, with 资本, capital, and 资产, property or assets. Distinguish the activity from the resources involved when reading a business report or explaining how an organization uses its funds.",
    "tip": "Write down what each financial noun refers to in the passage. The group is language practice: reading a definition does not provide advice about an investment or its risks."
  },
  "policy": {
    "title": "Policies & how systems work",
    "description": "Use 政策 for policy, 机制 for a mechanism, and 监督 for supervising. Together they help you distinguish a stated approach, the arrangements through which it operates and the oversight of what happens.",
    "tip": "Choose a familiar school or workplace rule. Describe the rule, how it works and who oversees it, using a short sentence for each part before linking the ideas."
  },
  "register": {
    "title": "Written, spoken & set expressions",
    "description": "书面 means in writing, while 口头 refers to oral expression. 成语 names a Chinese set expression, often associated with a story or quotation. Learning the three together helps you notice the form of communication as well as its meaning.",
    "tip": "Compare a short spoken explanation with a written version. Use an idiom only when its meaning and context fit; adding a four-character expression does not automatically make a sentence more natural."
  },
  "narrative": {
    "title": "Relating events & describing scenes",
    "description": "叙述 concerns relating a story or information. 描写 and 描绘 both involve description. Compare what the writer recounts with how they describe a person, a scene or an event, rather than assigning a rigid English equivalent to each verb.",
    "tip": "Find a sentence with each verb in its full entry or another reliable text. Record its object and surrounding words. Similar dictionary glosses do not mean every sentence permits the same substitution."
  },
  "meaning": {
    "title": "Natural wording & abstract meanings",
    "description": "地道 here is dìdao, authentic, not the dìdào entry for a tunnel in HSK 7–9. 含义 concerns the meaning conveyed by a phrase, while 抽象 means abstract. Pay attention to the complete reading and context before choosing a sense.",
    "tip": "Explain an abstract idea with a concrete example. Then look back at the original wording: what does the phrase convey, and which reading or sense supports that interpretation?"
  }
};

const studySteps = [
  {
    "title": "Read for the position, not just the unfamiliar word",
    "text": "Choose a short passage on a familiar subject. Identify who is speaking, the main claim and the supporting example. Look up a few HSK 6 entries such as 立场 or 主张, then explain how each contributes to the passage rather than collecting isolated translations."
  },
  {
    "title": "Compare spoken and written expression",
    "text": "Use 口头 and 书面 as prompts to compare two ways of conveying an idea. Notice the surrounding verbs, connectives and degree of formality. Keep a useful phrase with its context, and choose familiar sentence structures when trying the phrase yourself."
  },
  {
    "title": "Keep readings and senses attached to their entries",
    "text": "This level separates 露 as lòu, to show, from lù, dew. 地道 is dìdao, authentic, here; a separate HSK 7–9 entry is dìdào, tunnel or causeway. Check the pinyin, part of speech and meaning together before reviewing a word with a familiar written form."
  },
  {
    "title": "Alternate recognition, retelling and review",
    "text": "Use a set of 10, 20 or 50 HSK 6 flashcards to find uncertain words. Read their full entries and available examples, then retell a short passage using two or three of them. Revisit HSK 1–5 vocabulary when it supplies the structure or connective needed to make the retelling clear."
  }
];

export function Hsk6VocabularyIntro({ wordCount }: { wordCount: number }) {
  return <div className={styles.intro}>
    <div className={styles.introCopy}>
      <p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-700">HSK 3.0 · 2025 exam syllabus</p>
      <h1 className="mt-2 text-4xl font-bold tracking-[-.035em] text-slate-950">HSK 6 Vocabulary</h1>
      <p className="mt-3 text-base leading-7 text-slate-600">Explore {wordCount.toLocaleString("en-US")} HSK 6 entries for precise viewpoints, connected narratives and written or spoken expression. Read pinyin and English meanings, compare related words and put new vocabulary into context.</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"><strong className="font-semibold text-slate-800">{wordCount.toLocaleString("en-US")} HSK 6 entries</strong><span aria-hidden="true" className="text-slate-400">·</span><Link href="#hsk6-sources" className="inline-flex min-h-11 items-center font-semibold text-blue-700 hover:underline">Word counts & syllabus →</Link></div>
    </div>
    <section className={styles.flashcard} aria-labelledby="quick-review-heading">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-violet-700">Quick Flashcards</p>
      <h2 id="quick-review-heading">From recognition to expression.</h2>
      <p>Practise 10, 20, or 50 HSK 6 words.<br />No sign-in required.</p>
      <Link href="/vocabulary/6?mode=flashcards#vocabulary-activities" prefetch={false}>Start HSK 6 review →</Link>
    </section>
  </div>;
}

export function Hsk6VocabularyGuide({ wordCount, foundationCount }: { wordCount: number; foundationCount: number }) {
  const combinedCount = foundationCount + wordCount;
  const questions = [
  {
    "question": "Does HSK 6 have 1,800 or 5,400 entries?",
    "answer": "This page contains 1,800 entries assigned to HSK 6 in HSKKit's active catalog aligned with the 2025 exam syllabus. HSK 1–5 contribute 3,600 earlier entries, making 5,400 across the first six levels. The combined total is not the number of new entries on this page. Entries can distinguish readings or senses and are not a count of unique characters. Other syllabus versions can use different totals."
  },
  {
    "question": "How does HSK 6 build on HSK 5?",
    "answer": "The groups here extend the analysis and viewpoint vocabulary from HSK 5 into more precise positions, policy mechanisms, narrative description and written or spoken expression. Keep earlier vocabulary in review and use a few new entries in a connected explanation. A completed word list alone does not establish exam readiness."
  },
  {
    "question": "Why are there different entries for 露 and 地道?",
    "answer": "HSK 6 distinguishes 露 read lòu, to show, from 露 read lù, dew. The 地道 entry on this level is dìdao, authentic. The separate HSK 7–9 entry dìdào means tunnel or causeway. Open the full entry and check its reading and meaning; the same written form does not always represent the same word."
  },
  {
    "question": "How should I practise longer answers with these words?",
    "answer": "Read a short passage, identify its main point and supporting detail, then retell it using familiar sentence structures. Add one or two new entries where their meaning fits. The 立场 example below shows how to identify whose position is being expressed; you can then add a separate sentence explaining that position or its supporting evidence."
  },
  {
    "question": "Does every HSK 6 word have audio or an example sentence?",
    "answer": "Availability varies by entry. The Words with audio filter only returns entries with published pronunciation files; an empty result means no matching files are published for those filters. Pinyin, word details and guest flashcards remain usable. Published word audio across HSKKit is synthesized. Read each entry for its available examples and any separately labelled device-voice preview."
  },
  {
    "question": "Can I search and review HSK 6 without signing in?",
    "answer": "Yes. Search this level by Chinese, pinyin or English, then narrow the results with the word-type, audio and sort controls. Quick Flashcards supports guest sets of 10, 20 or 50 HSK 6 words. Open a word for its details; account learning actions are available when you want synced progress."
  }
];
  return <div className={styles.guide} data-hsk6-guide>
    <section id="hsk6-topics" aria-labelledby="hsk6-topics-title" className={`${styles.panel} ${styles.topics}`}>
      <p className={styles.eyebrow}>Words for connected expression</p><h2 id="hsk6-topics-title">Explore HSK 6 vocabulary by topic</h2>
      <p className={styles.lead}>Use these six groups to connect the full list with situations you can describe. Each group contains three real entries from the current HSK 6 catalog. Open a word to see its complete reading, meanings and available examples; the groups are study suggestions rather than an official syllabus classification.</p>
      <div className={styles.topicGrid}>{hsk6VocabularyTopics.map(topic => {
        const copy = topicCopy[topic.id];
        return <article key={topic.id} className={styles.topicCard}><h3>{copy.title}</h3><p>{copy.description}</p><ul className={styles.topicWords}>{topic.words.map(word => <li key={word.id}><Link href={`/word/${word.id}`} prefetch={false} aria-label={`Explore ${word.payload.hanzi}: ${word.payload.meaning}`}><span lang="zh-Hans" className={styles.topicHanzi}>{word.payload.hanzi}</span><span lang="zh-Latn" className={styles.topicPinyin}>{word.payload.pinyin}</span><span className={styles.topicMeaning}>{word.payload.meaning}</span></Link></li>)}</ul><p className={styles.tip}>{copy.tip}</p></article>;
      })}</div>
    </section>
    <section id="hsk6-study-guide" aria-labelledby="hsk6-study-title" className={`${styles.panel} ${styles.method}`}>
      <p className={styles.eyebrow}>Read, compare and retell</p><h2 id="hsk6-study-title">How to study HSK 6 vocabulary</h2>
      <p className={styles.lead}>Go beyond recognizing a translation: identify who holds a view, how a story is told and why a writer chooses a particular expression. Practise these skills with short passages before attempting a longer explanation. Keep earlier vocabulary active so that new words fit into a clear account.</p>
      <div className={styles.methodGrid}>
        <ol className={styles.steps}>{studySteps.map(step => <li key={step.title}><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}</ol>
        <aside className={styles.example} aria-labelledby="hsk6-example-title">
          <h3 id="hsk6-example-title">Identify whose position is expressed</h3><p className={styles.exampleWord} lang="zh-Hans">立场</p><p className={styles.examplePinyin} lang="zh-Latn">lìchǎng</p><p>position · connect a view with its holder</p>
          <div className={styles.sentence}><p lang="zh-Hans">这篇文章表达了作者的立场。</p><p lang="zh-Latn">Zhè piān wénzhāng biǎodá le zuòzhě de lìchǎng.</p><p>This article expresses the author’s position.</p></div>
          <dl><div><dt>Find the action and whose view it is</dt><dd>这篇文章 names the article. 表达了 tells you that it expresses something, and 作者的立场 identifies what is expressed: the position of the author. Read the passage before assuming what that position actually is.</dd></div><div><dt>Extend the idea in your own words</dt><dd>立场 is an HSK 6 entry. Keep 作者的立场 as a useful phrase, then add a separate sentence explaining the position in a text you have read. Separate the author’s view from your own response and support each explanation with a specific detail.</dd></div></dl>
          <Link href="/word/hsk2025.word.l6.4437.v1" prefetch={false} className={styles.inlineLink}>Explore 立场 and its available examples →</Link><p className="!text-sm">An original HSKKit learning example, not an official exam question.</p>
        </aside>
      </div>
      <Link href="/vocabulary/5" prefetch={false} className={styles.inlineLink}>Keep earlier words active: revisit HSK 5 →</Link>
    </section>
    <section id="hsk6-sources" aria-labelledby="hsk6-sources-title" className={`${styles.panel} ${styles.sources}`}>
      <p className={styles.eyebrow}>Separate level entries from combined totals</p><h2 id="hsk6-sources-title">HSK 6 word count, syllabus & sources</h2>
      <div className={styles.sourceGrid}>
        <div><h3>{wordCount.toLocaleString("en-US")} entries at this level</h3><p>This page contains {wordCount.toLocaleString("en-US")} entries assigned to HSK 6 in HSKKit's catalog aligned with the 2025 exam syllabus. The {foundationCount.toLocaleString("en-US")} earlier entries across HSK 1–5 bring the first six levels to {combinedCount.toLocaleString("en-US")} catalog entries. This page contains the HSK 6 portion of that combined total.</p><p>Entries are not the same as unique characters or spellings. Different readings or uses can have separate records; this level includes lòu and lù for 露. The dìdao entry for 地道 here is also distinct from dìdào in the HSK 7–9 catalog. Other exam versions and standards can also use different totals.</p><Link href="/tools/hsk-vocabulary-comparison" prefetch={false} className={styles.inlineLink}>Compare vocabulary versions →</Link></div>
        <div><h3>Learning explanations & pronunciation</h3><p>The English glosses include adapted CC-CEDICT definitions and are independent learning explanations, not official exam translations. The theme notes and position sentence on this page are HSKKit editorial material. Published word audio uses speech synthesis, with files available only for entries that have published audio.</p><p>Check the named syllabus when choosing exam preparation material. The source and licence notes describe catalog membership, definition provenance and audio. HSKKit is independent of the official HSK examination service.</p><Link href="/content-license" prefetch={false} className={styles.inlineLink}>Read content sources & licences →</Link></div>
      </div>
    </section>
    <section id="hsk6-faq" aria-labelledby="hsk6-faq-title" className={`${styles.panel} ${styles.faq}`}>
      <p className={`${styles.eyebrow} !text-blue-700`}>Questions about the next level</p><h2 id="hsk6-faq-title">HSK 6 vocabulary: common questions</h2><div className={styles.faqList}>{questions.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
    </section>
    <section aria-labelledby="hsk6-next-title" className={`${styles.panel} ${styles.next}`}>
      <h2 id="hsk6-next-title">Keep building your vocabulary</h2>
      <div className={styles.nextGrid}>
        <Link href="/vocabulary/6?mode=flashcards#vocabulary-activities" prefetch={false}><strong>Review HSK 6 words →</strong><span>Check recall with a short set, then open the entries whose readings or uses need another look.</span></Link>
        <Link href="/dictionary?level=6" prefetch={false}><strong>Look up an HSK 6 entry →</strong><span>Search this level in the dictionary and read the full entry for the meaning you want to use.</span></Link>
        <Link href="/vocabulary/7" prefetch={false}><strong>Explore HSK 7–9 vocabulary →</strong><span>Explore the combined advanced band when you want to extend your vocabulary, while keeping earlier words in review.</span></Link>
      </div><Link href="/placement" prefetch={false} className={styles.inlineLink}>Check your starting level →</Link>
    </section>
  </div>;
}
