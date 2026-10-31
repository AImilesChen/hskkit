import type { MetadataRoute } from "next";
import { sitemapContentRoutes } from "@/lib/dictionary/catalog";
import { getHsk3LevelStatuses } from "@/lib/content/level-status";
import { publishedGrammarLessons, publishedReadingLessons } from "@/lib/learning/step7-content";
import { READING_ARTICLES } from "@/lib/learning/reading-articles";
import { resourceProductDetails } from "@/lib/commercial/resource-products";
import {
  learningTopics,
  publishedTopicRoutesForVerifiedAssets,
  topicsSourceReleaseId,
} from "@/lib/topics/catalog";
import blogManifest from "../../content/blog/manifest.json";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://hskkit.com";
  const topicAssetIds = [...new Set(learningTopics.flatMap((topic) => topic.wordAssetIds))];
  const verifiedTopicRoutes = publishedTopicRoutesForVerifiedAssets(topicsSourceReleaseId, topicAssetIds);
  const publishedBlogRoutes = blogManifest.articles.filter((post) => Date.parse(post.publishedAt) <= Date.now());
  const existingPublicRoutes = [
    "",
    "/tools/chinese-character-practice-sheet-generator",
    "/contact",
    "/hsk-3-0",
    "/hsk-2-0-vs-3-0",
    "/levels",
    "/reading",
    "/pricing",
    "/store",
    "/blog",
    "/content-license",

    "/privacy-policy",
    "/terms-of-service",
    "/refund-policy",
    "/disclaimer",
  ];
  const routes = [...new Set([
    ...existingPublicRoutes,
    ...sitemapContentRoutes().filter((route) => !route.startsWith("/vocabulary/")),
    ...getHsk3LevelStatuses().filter((entry) => entry.availability === "ready").map((entry) => `/vocabulary/${entry.level}`),
    ...publishedGrammarLessons.map((lesson) => `/grammar/${lesson.slug}`),
    ...publishedReadingLessons.map((lesson) => `/reading/${lesson.slug}`),
    ...READING_ARTICLES.map((article) => `/reading/article/${article.slug}`),
    ...resourceProductDetails.map((product) => `/store/${product.slug}`),
    ...verifiedTopicRoutes,
  ])];
  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route.startsWith("/word/") || route.startsWith("/character/") ? "monthly" : "weekly",
  }));
  const blogEntries: MetadataRoute.Sitemap = publishedBlogRoutes.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly",
  }));
  return [...staticEntries, ...blogEntries];
}
