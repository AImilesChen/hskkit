export const BLOG_PUBLIC_REVALIDATE_SECONDS = 120;
export const BLOG_PUBLIC_LIST_TAG = "blog:public:list";

export type BlogPublicationIntent = "save" | "autosave" | "publish" | "schedule" | "withdraw";

export function blogPostTag(slug: string) {
  return `blog:public:post:${slug}`;
}

export function publicBlogInvalidationTags(intent: BlogPublicationIntent, slug: string) {
  return intent === "publish" || intent === "schedule" || intent === "withdraw"
    ? [BLOG_PUBLIC_LIST_TAG, blogPostTag(slug)]
    : [];
}
