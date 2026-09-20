import type { MetadataRoute } from "next";
import { listCachedPublishedBlogSlugs } from "@/lib/blog/cache";
import { sitemapContentRoutes } from "@/lib/dictionary/catalog";
import { getHsk3LevelStatuses } from "@/lib/content/level-status";
import { publishedGrammarLessons, publishedReadingLessons } from "@/lib/learning/step7-content";
import { resourceProductDetails } from "@/lib/commercial/resource-products";
import {
  learningTopics,
  publishedTopicRoutesForVerifiedAssets,
  topicsSourceReleaseId,
} from "@/lib/topics/catalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://hskkit.com";
  const topicAssetIds = [...new Set(learningTopics.flatMap((topic) => topic.wordAssetIds))];
  const verifiedTopicRoutes = publishedTopicRoutesForVerifiedAssets(topicsSourceReleaseId, topicAssetIds);
  const publishedBlogRoutes = await listCachedPublishedBlogSlugs();
  const existingPublicRoutes = [
    "",
    "/hsk-1-vocabulary",
    "/hsk-1-practice-test",
    "/hsk-2-vocabulary",
    "/hsk-2-practice-test",
    "/hsk-3-vocabulary",
    "/hsk-3-practice-test",
    "/hsk-4-vocabulary",
    "/hsk-4-practice-test",
    "/hsk-5-vocabulary",
    "/hsk-5-practice-test",
    "/hsk-1-reading-practice",
    "/tools/chinese-character-practice-sheet-generator",
    "/contact",
    "/hsk-3-0",
    "/hsk-2-0-vs-3-0",
    "/levels",
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
    ...getHsk3LevelStatuses()
      .filter((entry) => entry.availability === "ready" && entry.level <= 7)
      .map((entry) => `/vocabulary/${entry.level}`),
    ...publishedGrammarLessons.map((lesson) => `/grammar/${lesson.slug}`),
    ...publishedReadingLessons.map((lesson) => `/reading/${lesson.slug}`),
    ...resourceProductDetails.map((product) => `/store/${product.slug}`),
    ...verifiedTopicRoutes,
  ])];
  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route.startsWith("/word/") || route.startsWith("/character/") ? "monthly" : "weekly",
  }));
  const blogEntries: MetadataRoute.Sitemap = publishedBlogRoutes.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at || post.published_at),
    changeFrequency: "monthly",
  }));
  return [...staticEntries, ...blogEntries];
}
