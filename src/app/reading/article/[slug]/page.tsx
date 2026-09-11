import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import ReadingArticleReader from "@/app/components/reading-article-reader";
import { adjacentArticles, articleBySlug, articlesForLevel, READING_ARTICLES } from "@/lib/learning/reading-articles";
import pageStyles from "../../reading-page.module.css";

export function generateStaticParams() {
  return READING_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const article = articleBySlug((await params).slug);
  return article ? { title: `${article.title} · HSK ${article.level} Reading | HSKKit`, description: article.summary } : {};
}

export default async function ReadingArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = articleBySlug((await params).slug);
  if (!article) notFound();
  const { next } = adjacentArticles(article);
  const higherLevel = article.level < 9 ? articlesForLevel(article.level + 1)[0] : undefined;
  return <><SiteHeader/><main className={pageStyles.page}><ReadingArticleReader article={article} next={next} higherLevel={higherLevel}/></main><SiteFooter/></>;
}
