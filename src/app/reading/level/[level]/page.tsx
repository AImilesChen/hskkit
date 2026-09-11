import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import ReadingLevelLibrary from "@/app/components/reading-level-library";
import { articlesForLevel, READING_ARTICLE_SUMMARIES } from "@/lib/learning/reading-articles";
import pageStyles from "../../reading-page.module.css";

export function generateStaticParams() {
  return Array.from({ length: 9 }, (_, index) => ({ level: String(index + 1) }));
}

export async function generateMetadata({ params }: { params: Promise<{ level: string }> }): Promise<Metadata> {
  const level = Number((await params).level);
  return level >= 1 && level <= 9 ? { title: `HSK ${level} Article Library | HSKKit`, description: `Browse complete graded Chinese articles for HSK ${level}.` } : {};
}

export default async function ReadingLevelPage({ params }: { params: Promise<{ level: string }> }) {
  const level = Number((await params).level);
  if (!Number.isInteger(level) || level < 1 || level > 9) notFound();
  const articleSlugs = new Set(articlesForLevel(level).map((article) => article.slug));
  const summaries = READING_ARTICLE_SUMMARIES.filter((article) => articleSlugs.has(article.slug));
  return <><SiteHeader/><main className={pageStyles.page}><ReadingLevelLibrary level={level} articles={summaries}/></main><SiteFooter/></>;
}
