import type { MetadataRoute } from "next";
import { sitemapContentRoutes } from "@/lib/dictionary/catalog";
import { getHsk3LevelStatuses } from "@/lib/content/level-status";
import { GRAMMAR_LESSONS, READING_LESSONS } from "@/lib/learning/step7-content";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://hskkit.com";
  const existingPublicRoutes = [
    "",
    "/hsk-levels",
    "/hsk-level-test",
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
    "/new-hsk-3-0",
    "/hsk-3-0",
    "/hsk-2-0-vs-3-0",
    "/levels",
    "/content-license",
    "/today",
    "/mistakes",
    "/account",
    "/privacy-policy",
    "/terms-of-service",
    "/disclaimer",
  ];
  const routes = [...new Set([
    ...existingPublicRoutes,
    ...sitemapContentRoutes(),
    ...getHsk3LevelStatuses().filter((entry) => entry.availability === "ready").map((entry) => `/vocabulary/${entry.level}`),
    ...GRAMMAR_LESSONS.map((lesson) => `/grammar/${lesson.slug}`),
    ...READING_LESSONS.map((lesson) => `/reading/${lesson.slug}`),
  ])];
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route.startsWith("/word/") || route.startsWith("/character/") ? "monthly" : "weekly",
  }));
}
