import bankJson from "./reading-articles.json" with { type: "json" };

export type ReadingArticleQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  evidence: string;
};
export type ReadingArticle = {
  id: string;
  slug: string;
  level: number;
  title: string;
  summary: string;
  topic: string;
  minutes: number;
  wordCount: number;
  difficulty: "foundation" | "developing" | "independent" | "advanced";
  paragraphs: string[];
  pinyin: string[];
  translation: string[];
  vocabulary: Array<{ hanzi: string; pinyin: string; meaning: string }>;
  grammar: Array<{ pattern: string; explanation: string; example: string }>;
  audioSrc: string;
  audioDisclosure: string;
  questions: ReadingArticleQuestion[];
  sourceLicense: string;
  reviewStatus: "editorial-draft" | "first-pass-reviewed";
  contentVersion: string;
};

const bank = bankJson as { version: string; coverageNotice: string; articles: ReadingArticle[] };
export const READING_ARTICLES = bank.articles;
export type ReadingArticleSummary = Pick<ReadingArticle, "slug" | "level" | "title" | "summary" | "topic" | "minutes" | "wordCount" | "difficulty" | "audioSrc" | "reviewStatus">;
export const READING_ARTICLE_SUMMARIES: ReadingArticleSummary[] = READING_ARTICLES.map(({ slug, level, title, summary, topic, minutes, wordCount, difficulty, audioSrc, reviewStatus }) => ({ slug, level, title, summary, topic, minutes, wordCount, difficulty, audioSrc, reviewStatus }));
export const READING_ARTICLE_NOTICE = bank.coverageNotice;
export const READING_ARTICLE_COUNTS = Array.from({ length: 9 }, (_, index) => ({
  level: index + 1,
  count: bank.articles.filter((article) => article.level === index + 1).length,
}));
export function articlesForLevel(level: number) {
  return READING_ARTICLES.filter((article) => article.level === level);
}
export function articleBySlug(slug: string) {
  return READING_ARTICLES.find((article) => article.slug === slug);
}
export function adjacentArticles(article: ReadingArticle) {
  const sameLevel = articlesForLevel(article.level);
  const index = sameLevel.findIndex((candidate) => candidate.slug === article.slug);
  return { previous: sameLevel[index - 1], next: sameLevel[index + 1] ?? sameLevel[0] };
}
export function articleQuestion(articleSlug: string, questionId: string) {
  const article = articleBySlug(articleSlug);
  const question = article?.questions.find((candidate) => candidate.id === questionId);
  return article && question ? { article, question } : undefined;
}
