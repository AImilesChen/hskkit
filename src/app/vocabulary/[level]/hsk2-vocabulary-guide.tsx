import Link from "next/link";
import { hsk2VocabularyTopics } from "@/lib/content/hsk2-vocabulary-landing";
import styles from "./hsk1-vocabulary.module.css";

const topicCopy: Record<string, { title: string; description: string; tip: string }> = {
  transport: { title: "Getting around", description: "Move beyond naming a vehicle to talking about a journey. Connect a station with a way of travelling: 车站 can refer to a station or stop, while 地铁 and 公交车 name two kinds of transport.", tip: "Choose a familiar route and describe how you travel. Keep the full word 公交车 together, even if you already recognize 车 from HSK 1." },
  ordering: { title: "Ordering food & drinks", description: "Bring a place, an action and something to order into the same situation. 饭馆 names a restaurant, 点 can mean to order food, and 咖啡 is coffee. Context helps you choose the right meaning.", tip: "Compare the HSK 2 verb 点 with the HSK 1 time expression 点. The written character is the same, but the use you are practising here is different." },
  learning: { title: "Classes & learning", description: "Use words for what happens around a lesson: a classroom, an exam and remembering something. Notice that 考试 can name an exam or describe taking one; its English gloss is only a starting point.", tip: "Read a sentence before deciding how a word functions. Practise 记得 with something you want to remember, rather than memorizing an English label on its own." },
  interests: { title: "Interests & activities", description: "Build a short introduction about something you enjoy. 爱好 can refer to an interest, 篮球 names basketball, and 游泳 describes swimming. These words connect the list with an activity you can talk about.", tip: "Collect a small group of words around one interest and read their full entries. Check the verb used with a sport; English and Chinese do not always combine the same action words." },
  directions: { title: "Places & directions", description: "Locate something more precisely with words such as 前面, 里面 and 右边. Relate each position to a real object or place so that the word describes a clear spatial relationship.", tip: "A position needs a reference point. Practise identifying what something is in front of, inside or to the right of, rather than learning the direction word without a situation." },
  comparisons: { title: "Comparisons & descriptions", description: "Compare two familiar places with 比, then describe the difference with a word such as 近 or 远. This gives a new purpose to vocabulary you already know from simple statements.", tip: "In a basic comparison, place 比 between the two things being compared and the describing word after the second one. The worked example below uses 快 to compare two forms of transport." },
};

const studySteps = [
  { title: "Connect new meanings with familiar words", text: "Start from a word you can already use, then add a related HSK 2 entry. For example, knowing 车 can help you remember 公交车. When a familiar spelling appears again, read the full entry: 点 for ordering food has a different use from 点 in a clock-time expression." },
  { title: "Practise a short pattern, not only a translation", text: "Choose two familiar things and describe a difference with A 比 B and a describing word. Keep the sentence short while you learn its order. Then read a word's available examples to see how its meaning works in context." },
  { title: "Check readings and small differences", text: "Read the pinyin and listen where audio is available. This catalog distinguishes 过 (guò, to pass or cross) from 过 (guo, a past-experience particle). Similarly, directions such as 回来 and 回去 depend on the speaker's point of reference. Similar characters do not guarantee the same use." },
  { title: "Review HSK 2 while keeping HSK 1 active", text: "Use a set of 10, 20 or 50 HSK 2 flashcards for recall, then return to a few HSK 1 words in your own sentences. Reveal an answer after making an attempt. Open word details to save an entry or add it to Today or Review when you want to keep working on it." },
];

export function Hsk2VocabularyIntro({ wordCount }: { wordCount: number }) {
  return <div className={styles.intro}>
    <div className={styles.introCopy}>
      <p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-700">HSK 3.0 · 2025 exam syllabus</p>
      <h1 className="mt-2 text-4xl font-bold tracking-[-.035em] text-slate-950">HSK 2 Vocabulary</h1>
      <p className="mt-3 text-base leading-7 text-slate-600">Build on HSK 1 with {wordCount.toLocaleString("en-US")} HSK 2 entries for journeys, ordering, interests and everyday comparisons. Explore pinyin, meanings and available audio, then practise using new words together.</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"><strong className="font-semibold text-slate-800">{wordCount.toLocaleString("en-US")} HSK 2 entries</strong><span aria-hidden="true" className="text-slate-400">·</span><Link href="#hsk2-sources" className="inline-flex min-h-11 items-center font-semibold text-blue-700 hover:underline">Word counts & syllabus →</Link></div>
    </div>
    <section className={styles.flashcard} aria-labelledby="quick-review-heading">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-violet-700">Quick Flashcards</p>
      <h2 id="quick-review-heading">Put your next words to work.</h2>
      <p>Practise 10, 20, or 50 HSK 2 words.<br />No sign-in required.</p>
      <Link href="/vocabulary/2?mode=flashcards#vocabulary-activities" prefetch={false}>Start HSK 2 review →</Link>
    </section>
  </div>;
}

export function Hsk2VocabularyGuide({ wordCount, foundationCount }: { wordCount: number; foundationCount: number }) {
  const combinedCount = foundationCount + wordCount;
  const questions = [
    { question: `Why are there ${wordCount} HSK 2 entries rather than ${combinedCount}?`, answer: `This page shows the ${wordCount} entries assigned to HSK 2 in HSKKit's active 2025-syllabus catalog. HSK 1 has another ${foundationCount} entries, giving ${combinedCount} entries across the first two levels. That combined figure is not the number of new entries on this page. These are entry counts: one written form may have separately listed readings or uses.` },
    { question: "Should I finish HSK 1 before using this list?", answer: "You can browse either list at any time. If HSK 1 vocabulary is still unfamiliar, keep it in your review routine while adding small groups from HSK 2. The worked example here connects several HSK 2 words in one short sentence. Vocabulary recognition alone does not establish readiness for an exam, which also involves language skills beyond a word list." },
    { question: "Why does a character I know appear with another meaning?", answer: "A written form can be used in different ways. The HSK 1 entry 点 includes o'clock; this level also has 点 as the verb to order food or point to something. Check the reading, part of speech and examples for the particular entry. Separate catalog IDs keep these learning entries distinct." },
    { question: "How can I practise HSK 2 words in sentences?", answer: "Begin with a short situation, such as choosing transport or describing where something is. Reuse a small set of words in a pattern you understand. For comparisons, try A 比 B plus a describing word, as in the example on this page. Read available word-entry examples and check your new sentence instead of substituting words into an unfamiliar structure." },
    { question: "Does every HSK 2 entry have pronunciation audio?", answer: "The audio filter shows entries with published pronunciation files, and a play button appears where a file is available. Published word audio is synthesized, rather than a native-speaker recording. Availability varies by entry. Word details identify any separate device-voice preview that is offered; the sources page explains audio provenance." },
    { question: "Can I search and review just HSK 2 without signing in?", answer: "Yes. Search within this level by Hanzi, pinyin or English, then use word-type, audio and sort controls to narrow the list. Quick Flashcards offers guest sets of 10, 20 or 50 words. Open a result for its details, or use the dictionary for a lookup across levels. Account learning actions are available when you want synced progress." },
  ];
  return <div className={styles.guide} data-hsk2-guide>
    <section id="hsk2-topics" aria-labelledby="hsk2-topics-title" className={`${styles.panel} ${styles.topics}`}>
      <p className={styles.eyebrow}>From single words to situations</p><h2 id="hsk2-topics-title">Explore HSK 2 vocabulary by topic</h2>
      <p className={styles.lead}>Use these six groups to connect the full list with situations you can describe. Each group contains three real entries from the current HSK 2 catalog. Open a word to see its complete reading, meanings and available examples; the groups are study suggestions rather than an official syllabus classification.</p>
      <div className={styles.topicGrid}>{hsk2VocabularyTopics.map(topic => {
        const copy = topicCopy[topic.id];
        return <article key={topic.id} className={styles.topicCard}><h3>{copy.title}</h3><p>{copy.description}</p><ul className={styles.topicWords}>{topic.words.map(word => <li key={word.id}><Link href={`/word/${word.id}`} prefetch={false} aria-label={`Explore ${word.payload.hanzi}: ${word.payload.meaning}`}><span lang="zh-Hans" className={styles.topicHanzi}>{word.payload.hanzi}</span><span lang="zh-Latn" className={styles.topicPinyin}>{word.payload.pinyin}</span><span className={styles.topicMeaning}>{word.payload.meaning}</span></Link></li>)}</ul><p className={styles.tip}>{copy.tip}</p></article>;
      })}</div>
    </section>
    <section id="hsk2-study-guide" aria-labelledby="hsk2-study-title" className={`${styles.panel} ${styles.method}`}>
      <p className={styles.eyebrow}>Add detail to what you can say</p><h2 id="hsk2-study-title">How to study HSK 2 vocabulary</h2>
      <p className={styles.lead}>At this stage, link recognition with use. Notice new meanings in familiar characters, listen for differences in readings and practise small groups of words in a short sentence. Keep reviewing the HSK 1 foundation while adding this level's entries.</p>
      <div className={styles.methodGrid}>
        <ol className={styles.steps}>{studySteps.map(step => <li key={step.title}><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}</ol>
        <aside className={styles.example} aria-labelledby="hsk2-example-title">
          <h3 id="hsk2-example-title">Use new words to make a comparison</h3><p className={styles.exampleWord} lang="zh-Hans">比</p><p className={styles.examplePinyin} lang="zh-Latn">bǐ</p><p>than · used in comparisons</p>
          <div className={styles.sentence}><p lang="zh-Hans">地铁比公交车快。</p><p lang="zh-Latn">Dìtiě bǐ gōngjiāochē kuài.</p><p>The subway is faster than the bus.</p></div>
          <dl><div><dt>Build the comparison</dt><dd>地铁 is the first thing being compared. 比 introduces 公交车, and 快 describes the difference. Read the pattern as A 比 B + a describing word.</dd></div><div><dt>Check every new word</dt><dd>地铁, 比, 公交车 and 快 are all entries in this HSK 2 list. Read the sentence as one practice example, then use a comparison that fits your own situation.</dd></div></dl>
          <Link href="/word/hsk2025.word.l2.0309.v1" prefetch={false} className={styles.inlineLink}>Explore 比 and its available examples →</Link><p className="!text-sm">An original HSKKit learning example, not an official exam question.</p>
        </aside>
      </div>
      <Link href="/vocabulary/1" prefetch={false} className={styles.inlineLink}>Keep your foundation active: review HSK 1 →</Link>
    </section>
    <section id="hsk2-sources" aria-labelledby="hsk2-sources-title" className={`${styles.panel} ${styles.sources}`}>
      <p className={styles.eyebrow}>Separate level entries from combined totals</p><h2 id="hsk2-sources-title">HSK 2 word count, syllabus & sources</h2>
      <div className={styles.sourceGrid}>
        <div><h3>{wordCount.toLocaleString("en-US")} entries at this level</h3><p>This page contains {wordCount.toLocaleString("en-US")} entries assigned to HSK 2 in HSKKit's catalog aligned with the 2025 exam syllabus. Together with the {foundationCount.toLocaleString("en-US")} HSK 1 entries, the first two levels contain {combinedCount.toLocaleString("en-US")} catalog entries. Keep the earlier level in your study plan rather than treating this page as the whole foundation.</p><p>Entries are not the same as unique characters or spellings. Different readings or uses can have separate records; for example, 过 appears as guò and as the neutral-tone particle guo. Other exam versions and standards can also use different totals.</p><Link href="/tools/hsk-vocabulary-comparison" prefetch={false} className={styles.inlineLink}>Compare vocabulary versions →</Link></div>
        <div><h3>Learning explanations & pronunciation</h3><p>The English glosses include adapted CC-CEDICT definitions and are independent learning explanations, not official exam translations. The theme notes and comparison sentence on this page are HSKKit editorial material. Published word audio uses speech synthesis, with files available only for entries that have published audio.</p><p>Check the named syllabus when choosing exam preparation material. The source and licence notes describe catalog membership, definition provenance and audio. HSKKit is independent of the official HSK examination service.</p><Link href="/content-license" prefetch={false} className={styles.inlineLink}>Read content sources & licences →</Link></div>
      </div>
    </section>
    <section id="hsk2-faq" aria-labelledby="hsk2-faq-title" className={`${styles.panel} ${styles.faq}`}>
      <p className={`${styles.eyebrow} !text-blue-700`}>Questions about the next level</p><h2 id="hsk2-faq-title">HSK 2 vocabulary: common questions</h2><div className={styles.faqList}>{questions.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
    </section>
    <section aria-labelledby="hsk2-next-title" className={`${styles.panel} ${styles.next}`}>
      <h2 id="hsk2-next-title">Keep building your vocabulary</h2>
      <div className={styles.nextGrid}>
        <Link href="/vocabulary/2?mode=flashcards#vocabulary-activities" prefetch={false}><strong>Review HSK 2 words →</strong><span>Check recall with a short set, then open the entries whose readings or uses need another look.</span></Link>
        <Link href="/dictionary?level=2" prefetch={false}><strong>Look up an HSK 2 entry →</strong><span>Search this level in the dictionary and read the full entry for the meaning you want to use.</span></Link>
        <Link href="/vocabulary/3" prefetch={false}><strong>Explore HSK 3 vocabulary →</strong><span>Browse the next level when you want to extend your vocabulary, while keeping earlier words in review.</span></Link>
      </div><Link href="/placement" prefetch={false} className={styles.inlineLink}>Check your starting level →</Link>
    </section>
  </div>;
}
