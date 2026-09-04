import type { Metadata } from "next";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { StudyPage } from "@/app/components/study-shell";
import { estimateReadingMinutes, extractBlogFaqs, extractBlogHeadings, markdownToSafeHtml } from "@/lib/blog/domain";
import { blogLearningActions, recommendedBlogLearningAction } from "@/lib/blog/learning-actions";
import { blogMediaUrl, getPublishedBlogPostBySlug, listRelatedBlogPosts } from "@/lib/blog/repository";
import BlogActionLink from "../blog-action-link";

export const dynamic = "force-dynamic";
const absolute = (path: string) => `https://hskkit.com${path}`;
const safeJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" }) : "";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  if (!post) return { title: "Article not found | HSKKit", robots: { index: false, follow: false } };
  const image = post.featuredImageKey ? absolute(blogMediaUrl(post.featuredImageKey)) : absolute("/og-image.png");
  return {
    title: `${post.title} | HSKKit Blog`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title: post.title, description: post.excerpt, url: `/blog/${post.slug}`, type: "article", publishedTime: post.publishedAt, modifiedTime: post.updatedAt, images: [{ url: image, alt: post.featuredImageAlt || post.title }] },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt, images: [image] },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  if (!post) notFound();
  const headings = extractBlogHeadings(post.contentMarkdown).filter((heading) => heading.text.toLowerCase() !== "faq" && heading.text.toLowerCase() !== "frequently asked questions");
  const faqs = extractBlogFaqs(post.contentMarkdown);
  const bodyMarkdown = post.contentMarkdown.replace(/^#\s+.+\n+/, "").split(/\n##\s+(?:FAQ|Frequently asked questions)\s*\n/i)[0].trim();
  const bodyHtml = markdownToSafeHtml(bodyMarkdown);
  const related = await listRelatedBlogPosts(post);
  const actions = blogLearningActions(post.hskLevel);
  const recommended = recommendedBlogLearningAction(post.hskLevel);
  const levelName = post.hskLevel ? `HSK ${post.hskLevel >= 7 ? "7–9" : post.hskLevel}` : "All HSK levels";
  const articleUrl = absolute(`/blog/${post.slug}`);
  const blogPosting = {
    "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.excerpt,
    datePublished: post.publishedAt, dateModified: post.updatedAt, mainEntityOfPage: articleUrl, url: articleUrl,
    author: { "@type": "Organization", name: "HSKKit Editorial" }, publisher: { "@type": "Organization", name: "HSKKit", url: "https://hskkit.com" },
    image: post.featuredImageKey ? absolute(blogMediaUrl(post.featuredImageKey)) : absolute("/og-image.png"),
    articleSection: post.category, about: levelName,
  };
  const faqPage = faqs.length ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) } : undefined;

  return <StudyPage>
    <main className="blog-article-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(blogPosting) }} />
      {faqPage && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(faqPage) }} />}
      <nav className="blog-breadcrumb" aria-label="Breadcrumb"><Link href="/blog">Blog</Link><span aria-hidden="true">/</span><span>{post.category}</span></nav>
      <article>
        <header className="blog-article-header">
          <div className="blog-article-kicker"><span>{post.category}</span><span>{levelName}</span></div>
          <h1>{post.title}</h1>
          <p className="blog-deck">{post.excerpt}</p>
          <div className="blog-byline"><span>HSKKit Editorial</span><time dateTime={post.publishedAt}>{dateLabel(post.publishedAt)}</time><span>{estimateReadingMinutes(post.contentMarkdown)} min read</span></div>
          {post.featuredImageKey ? <img className="blog-cover" src={blogMediaUrl(post.featuredImageKey)} alt={post.featuredImageAlt || ""} /> : <div className="blog-cover-graphic" aria-hidden="true"><span>{levelName}</span><strong>Read · Recall · Apply</strong></div>}
        </header>

        <div className="blog-article-grid">
          <aside className="blog-toc"><div><p>On this page</p><ol>{headings.map((heading) => <li className={heading.level === 3 ? "nested" : ""} key={heading.id}><a href={`#${heading.id}`}>{heading.text}</a></li>)}</ol></div></aside>
          <div className="blog-reading-column">
            <section className="blog-inline-actions" aria-labelledby="article-actions-heading"><div><p className="blog-eyebrow">Turn the guide into practice</p><h2 id="article-actions-heading">Use this article with your learning tools</h2></div><div className="blog-inline-action-grid">{actions.slice(0, 3).map((action) => <BlogActionLink key={action.id} action={action} articleSlug={post.slug} hskLevel={post.hskLevel} compact />)}</div></section>
            <div className="blog-prose" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

            {faqs.length > 0 && <section className="blog-faq" aria-labelledby="faq-heading"><p className="blog-eyebrow">Quick answers</p><h2 id="faq-heading">Frequently asked questions</h2>{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</section>}

            <section className="blog-next-step" aria-labelledby="next-step-heading"><div><p className="blog-eyebrow">Recommended next step</p><h2 id="next-step-heading">Continue while this idea is fresh</h2><p>{recommended.description}</p></div><BlogActionLink action={recommended} articleSlug={post.slug} hskLevel={post.hskLevel} /></section>

            <section className="blog-more-actions" aria-labelledby="more-actions-heading"><h2 id="more-actions-heading">More ways to apply this guide</h2><div>{actions.filter((action) => action.id !== recommended.id).map((action) => <BlogActionLink key={action.id} action={action} articleSlug={post.slug} hskLevel={post.hskLevel} />)}</div></section>
          </div>
        </div>
      </article>

      <section className="blog-related" aria-labelledby="related-heading"><div className="blog-results-heading"><div><p className="blog-eyebrow">Keep learning</p><h2 id="related-heading">Related articles</h2></div><Link href="/blog">View all articles</Link></div>{related.length ? <div className="blog-related-grid">{related.map((item) => <article key={item.id}><div><span>{item.category}</span>{item.hskLevel && <span>HSK {item.hskLevel >= 7 ? "7–9" : item.hskLevel}</span>}</div><h3><Link href={`/blog/${item.slug}`}>{item.title}</Link></h3><p>{item.excerpt}</p></article>)}</div> : <p className="blog-related-empty">More published guides will appear here as the library grows.</p>}</section>
    </main>
  </StudyPage>;
}
