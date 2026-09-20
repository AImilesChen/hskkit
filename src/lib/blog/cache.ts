import { unstable_cache } from "next/cache";
import type { PublicBlogQuery } from "./domain";
import {
  getPublishedBlogPostBySlug,
  listPublishedBlogFeed,
  listPublishedBlogPosts,
  listPublishedBlogSlugs,
  listRelatedBlogPosts,
  type PublicBlogPost,
} from "./repository";
import {
  BLOG_PUBLIC_LIST_TAG,
  BLOG_PUBLIC_REVALIDATE_SECONDS,
  blogPostTag,
} from "./cache-policy";

const cachedPublishedBlogPosts = unstable_cache(
  async (query: PublicBlogQuery) => listPublishedBlogPosts(query),
  ["blog-public-list-v1"],
  { revalidate: BLOG_PUBLIC_REVALIDATE_SECONDS, tags: [BLOG_PUBLIC_LIST_TAG] },
);

export function listCachedPublishedBlogPosts(query: PublicBlogQuery) {
  return cachedPublishedBlogPosts(query);
}

export function getCachedPublishedBlogPostBySlug(slug: string) {
  return unstable_cache(
    async () => getPublishedBlogPostBySlug(slug),
    ["blog-public-post-v1", slug],
    { revalidate: BLOG_PUBLIC_REVALIDATE_SECONDS, tags: [blogPostTag(slug)] },
  )();
}

export function listCachedRelatedBlogPosts(post: PublicBlogPost, limit = 3) {
  return unstable_cache(
    async () => listRelatedBlogPosts(post, limit),
    ["blog-public-related-v1", post.slug, post.category, String(post.hskLevel ?? ""), String(limit)],
    { revalidate: BLOG_PUBLIC_REVALIDATE_SECONDS, tags: [BLOG_PUBLIC_LIST_TAG] },
  )();
}

const cachedPublishedBlogFeed = unstable_cache(
  async (limit: number) => listPublishedBlogFeed(limit),
  ["blog-public-feed-v1"],
  { revalidate: BLOG_PUBLIC_REVALIDATE_SECONDS, tags: [BLOG_PUBLIC_LIST_TAG] },
);

export function listCachedPublishedBlogFeed(limit = 100) {
  return cachedPublishedBlogFeed(limit);
}

const cachedPublishedBlogSlugs = unstable_cache(
  async () => listPublishedBlogSlugs(),
  ["blog-public-sitemap-v1"],
  { revalidate: BLOG_PUBLIC_REVALIDATE_SECONDS, tags: [BLOG_PUBLIC_LIST_TAG] },
);

export function listCachedPublishedBlogSlugs() {
  return cachedPublishedBlogSlugs();
}
