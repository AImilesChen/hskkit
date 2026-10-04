import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import ReadingArticleCheck from "@/app/components/reading-article-check";
import { READING_ARTICLES, chineseCharacterCount, readingArticleBySlug } from "@/lib/learning/reading-articles";
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
  return <><SiteHeader/><main className={styles.page}>
    <nav className={styles.nav} aria-label="Reading navigation"><Link href="/reading#articles">← All articles</Link><Link href={`/reading/start?level=${article.level}&size=10`}>HSK {article.level} question practice</Link></nav>
    <header className={styles.header}><span>HSK {article.level} · {article.topic} · {chineseCharacterCount(article.paragraphs)} Chinese characters</span><h1 lang="zh-CN">{article.title}</h1><p>Read the whole article first. Then check what you understood below.</p></header>
    <article className={styles.article} aria-label={article.title}>{article.paragraphs.map((paragraph) => <p key={paragraph} lang="zh-CN">{paragraph}</p>)}</article>
    <section className={styles.help} aria-label="Reading help"><div><h2>Key vocabulary</h2><dl>{article.vocabulary.map((item) => <div key={item.word}><dt lang="zh-CN">{item.word}</dt><dd>{item.pinyin} · {item.meaning}</dd></div>)}</dl></div><details><summary>Show English summary</summary><p>{article.englishSummary}</p></details></section>
    <ReadingArticleCheck questions={article.questions}/>
    <div className={styles.next}><Link href="/reading#articles">Browse more articles</Link><Link href={`/reading/start?level=${article.level}&size=10`}>Start saved HSK {article.level} practice</Link></div>
  </main><SiteFooter/></>;
}
