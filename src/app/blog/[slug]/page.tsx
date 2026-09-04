import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StudyPage } from "@/app/components/study-shell";
import { markdownToSafeHtml } from "@/lib/blog/domain";
import { blogMediaUrl, getPublishedBlogPost } from "@/lib/blog/repository";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublishedBlogPost((await params).slug);
  if (!post) return { title: "Guide not found | HSKKit", robots: { index: false, follow: false } };
  const image = post.featuredImageKey ? blogMediaUrl(post.featuredImageKey) : "/og-image.png";
  return { title: `${post.title} | HSKKit`, description: post.excerpt, alternates: { canonical: `/blog/${post.slug}` }, openGraph: { type: "article", url: `/blog/${post.slug}`, title: post.title, description: post.excerpt, publishedTime: post.publishedAt, modifiedTime: post.updatedAt, images: [{ url: image, alt: post.featuredImageAlt || post.title }] }, twitter: { card: "summary_large_image", title: post.title, description: post.excerpt, images: [image] } };
}

export default async function BlogArticlePage({ params }: Props) {
  const post = await getPublishedBlogPost((await params).slug);
  if (!post) notFound();
  const url = `https://hskkit.com/blog/${post.slug}`;
  const image = post.featuredImageKey ? `https://hskkit.com${blogMediaUrl(post.featuredImageKey)}` : "https://hskkit.com/og-image.png";
  const schemas = [{ "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.excerpt, image: [image], datePublished: post.publishedAt, dateModified: post.updatedAt, mainEntityOfPage: url, author: { "@type": "Organization", name: "HSKKit" }, publisher: { "@type": "Organization", name: "HSKKit", logo: { "@type": "ImageObject", url: "https://hskkit.com/icon.png" } } }, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "https://hskkit.com" }, { "@type": "ListItem", position: 2, name: "Blog", item: "https://hskkit.com/blog" }, { "@type": "ListItem", position: 3, name: post.title, item: url }] }];
  return <StudyPage><main className="mx-auto w-full max-w-[860px] flex-1 px-5 py-10 sm:px-8 md:py-16">
    <nav aria-label="Breadcrumb" className="text-sm text-slate-500"><Link href="/blog" className="font-semibold text-blue-700">Blog</Link><span aria-hidden="true"> / </span><span>{post.title}</span></nav>
    <article className="mt-8"><header><p className="text-sm font-bold uppercase tracking-wider text-blue-700">HSKKit study guide</p><h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">{post.title}</h1><p className="mt-5 text-xl leading-8 text-slate-600">{post.excerpt}</p>{post.publishedAt && <p className="mt-5 text-sm text-slate-500">Published {new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}</p>}</header>
      {post.featuredImageKey && <img src={blogMediaUrl(post.featuredImageKey)} alt={post.featuredImageAlt} className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover" />}
      <div className="mt-10 [overflow-wrap:anywhere] text-lg leading-8 text-slate-800 [&_a]:font-semibold [&_a]:text-blue-700 [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-300 [&_blockquote]:pl-5 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_h1]:my-7 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-3xl [&_h2]:font-bold [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-2xl [&_h3]:font-bold [&_img]:my-8 [&_img]:w-full [&_img]:rounded-xl [&_li]:ml-6 [&_li]:list-disc [&_p]:my-5 [&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-950 [&_pre]:p-5 [&_pre]:text-sm [&_pre]:text-white" dangerouslySetInnerHTML={{ __html: markdownToSafeHtml(post.contentMarkdown) }} />
    </article><aside className="mt-12 rounded-2xl border border-blue-100 bg-blue-50 p-6"><h2 className="text-2xl font-bold">Put the guide into practice</h2><p className="mt-3 text-slate-700">Use your real due items and daily plan in HSKKit.</p><Link href="/today" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-5 font-bold text-white">Open Today</Link></aside>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas).replace(/</g, "\\u003c") }} />
  </main></StudyPage>;
}
