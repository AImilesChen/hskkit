import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import ReadingArticleCheck from "@/app/components/reading-article-check";
import ReadingArticleText from "@/app/components/reading-article-text";
import HomeIcon from "@/app/components/home-icon";
import { READING_ARTICLES, chineseCharacterCount, readingArticleBySlug } from "@/lib/learning/reading-articles";
import { paragraphAnchor, readingGuidance } from "@/lib/learning/reading-article-guidance";
import styles from "./reading-article-page.module.css";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return READING_ARTICLES.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = readingArticleBySlug((await params).slug);
  return article ? { title: `${article.title} · HSK ${article.level} Reading | HSKKit`, description: article.englishSummary, alternates: { canonical: `/reading/article/${article.slug}` } } : { title: "Article unavailable | HSKKit", robots: { index: false, follow: false } };
}
export default async function ReadingArticlePage({ params }: Props) {
  const article = readingArticleBySlug((await params).slug);
  if (!article) notFound();
  const guide = readingGuidance(article);
  return <><SiteHeader/><main className={styles.page}>
    <nav className={styles.nav} aria-label="Reading navigation"><Link prefetch={false} href="/reading#articles"><HomeIcon name="arrow" className={styles.backIcon}/> All reading articles</Link><Link prefetch={false} href={`/reading/start?level=${article.level}&size=10`}>HSK {article.level} question practice <HomeIcon name="arrow"/></Link></nav>
    <header className={styles.header}>
      <div><div className={styles.meta}><span>HSK {article.level}</span><span>{article.topic}</span><span>{chineseCharacterCount(article.paragraphs)} Chinese characters</span></div><h1 lang="zh-Hans">{article.title}</h1><p className={styles.goal}>{guide.goal}</p><ul className={styles.focus} aria-label="Reading focus">{guide.focus.map(focus=><li key={focus}>{focus}</li>)}</ul></div>
      {guide.image && <figure className={styles.visual}><img src={guide.image.src} alt={guide.image.alt} width="768" height="512" decoding="async"/><figcaption>Everyday Chinese, one story at a time.</figcaption></figure>}
    </header>
    <nav className={styles.sections} aria-label="On this page"><a href="#article-text">Read the story</a><a href="#key-vocabulary">Key vocabulary</a><a href="#language-patterns">Language patterns</a><a href="#comprehension-check">Check understanding</a></nav>
    <ReadingArticleText key={article.slug} title={article.title} paragraphs={article.paragraphs} words={guide.words}/>
    <details className={styles.summary}><summary><span>English summary</span><span className={styles.summaryAction}>Show / hide</span></summary><p>{article.englishSummary}</p></details>
    <section className={styles.vocabulary} id="key-vocabulary" aria-labelledby="vocabulary-heading">
      <div className={styles.sectionHeading}><span className={styles.sectionIcon}><HomeIcon name="book"/></span><div><span className={styles.eyebrow}>02 · Words in context</span><h2 id="vocabulary-heading">Key vocabulary</h2><p>Meet the words, then see how they work in the story.</p></div></div>
      <dl className={styles.wordGrid}>{guide.words.map(item=><div key={item.word} className={styles.wordCard}><dt lang="zh-Hans">{item.word}</dt><dd><span className={styles.pinyin}>{item.pinyin}</span><span className={styles.meaning}>{item.meaning}</span><blockquote lang="zh-Hans">{item.example.quote}</blockquote><a href={`#${paragraphAnchor(item.example.paragraph)}`}>See in paragraph {item.example.paragraph+1} <span aria-hidden="true">↑</span></a></dd></div>)}</dl>
    </section>
    <section className={styles.patterns} id="language-patterns" aria-labelledby="patterns-heading">
      <div className={styles.sectionHeading}><span className={styles.sectionIcon}><HomeIcon name="grammar"/></span><div><span className={styles.eyebrow}>03 · Notice the pattern</span><h2 id="patterns-heading">A little language to take with you.</h2><p>Use these sentences to understand how the ideas fit together.</p></div></div>
      <div className={styles.patternGrid}>{guide.patterns.map(pattern=><article key={pattern.pattern} className={styles.patternCard}><h3>{pattern.pattern}</h3><p>{pattern.explanation}</p><blockquote lang="zh-Hans">{pattern.example.quote}</blockquote><a href={`#${paragraphAnchor(pattern.example.paragraph)}`}>Back to paragraph {pattern.example.paragraph+1} <span aria-hidden="true">↑</span></a></article>)}</div>
    </section>
    <ReadingArticleCheck key={article.slug} questions={guide.questions}/>
    <section className={styles.next} aria-labelledby="next-heading"><div><span className={styles.eyebrow}>Keep your reading going</span><h2 id="next-heading">Practise a little more at HSK {article.level}.</h2><p>Try a 10-question reading session, or choose another article from the collection.</p></div><div><Link prefetch={false} className={styles.primary} href={`/reading/start?level=${article.level}&size=10`}>Start HSK {article.level} practice <HomeIcon name="arrow"/></Link><Link prefetch={false} href="/reading#articles">Browse more articles <HomeIcon name="arrow"/></Link></div></section>
  </main><SiteFooter/></>;
}
