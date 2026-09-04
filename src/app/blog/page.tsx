import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StudyPage } from "@/app/components/study-shell";
import { blogMediaUrl, blogPublicEnabled, listPublishedBlogPosts } from "@/lib/blog/repository";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const enabled = blogPublicEnabled();
  return { title: "HSK Study Guides & Learning Advice | HSKKit", description: "Practical HSK 3.0 study guides, vocabulary routines, review advice, and learning strategies from HSKKit.", alternates: { canonical: "/blog" }, robots: enabled ? undefined : { index: false, follow: false } };
}

export default async function BlogPage() {
  const enabled = blogPublicEnabled();
  if (!enabled) notFound();
  const posts = await listPublishedBlogPosts();
  return <StudyPage><main className="mx-auto w-full max-w-[1140px] flex-1 px-5 py-12 md:px-16 md:py-16">
    <header className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.15em] text-blue-600">HSKKit guides</p><h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Build a clearer HSK study routine</h1><p className="mt-5 text-lg leading-8 text-slate-600">Practical guides for HSK 3.0 vocabulary, review, listening, and level-by-level progress.</p></header>
    {posts.length ? <section className="mt-10 grid gap-6 md:grid-cols-2">{posts.map((post) => <article key={post.slug} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{post.featuredImageKey && <img src={blogMediaUrl(post.featuredImageKey)} alt={post.featuredImageAlt} className="aspect-[16/9] w-full object-cover" />}<div className="p-6"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">{new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}</p><h2 className="mt-3 text-2xl font-bold text-slate-950"><Link href={`/blog/${post.slug}`} className="hover:text-blue-700">{post.title}</Link></h2><p className="mt-3 leading-7 text-slate-600">{post.excerpt}</p><Link href={`/blog/${post.slug}`} className="mt-5 inline-flex min-h-11 items-center font-bold text-blue-700">Read guide →</Link></div></article>)}</section>
    : <p className="mt-10 text-slate-600">No published guides yet.</p>}
  </main></StudyPage>;
}
