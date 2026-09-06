import type { Metadata } from "next";
import Link from "next/link";
import { StudyPage } from "@/app/components/study-shell";
import { BLOG_CATEGORIES, normalizePublicBlogQuery } from "@/lib/blog/domain";
import { blogMediaUrl, listPublishedBlogPosts } from "@/lib/blog/repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "HSK 3.0 Study Guides and Learning Tips | HSKKit Blog",
  description: "Practical HSK 3.0 study guides for vocabulary, grammar, reading, listening, review, and exam preparation.",
  alternates: { canonical: "/blog" },
  openGraph: { title: "HSKKit Blog — practical HSK 3.0 study guides", description: "Useful level-aware HSK learning guides connected to real vocabulary, practice, and review tools.", url: "/blog", type: "website" },
};

const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" }) : "";

export default async function BlogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = normalizePublicBlogQuery(await searchParams);
  const { posts, hasMore } = await listPublishedBlogPosts(query);
  const nextQuery = new URLSearchParams();
  if (query.q) nextQuery.set("q", query.q);
  if (query.category) nextQuery.set("category", query.category);
  if (query.sort !== "newest") nextQuery.set("sort", query.sort);
  nextQuery.set("page", String(query.page + 1));

  return <StudyPage>
    <main className="blog-index">
      <header className="blog-index-hero">
        <div>
          <p className="blog-eyebrow">HSK 3.0 learning library</p>
          <h1>Study guides that lead to the next useful action</h1>
          <p>Read practical explanations, then open the related vocabulary, practice, review queue, or study resource.</p>
        </div>
        <div className="blog-hero-mark" aria-hidden="true"><span>读</span><small>READ · RECALL · APPLY</small></div>
      </header>

      <form className="blog-filters" action="/blog" method="get">
        <label><span>Search articles</span><input name="q" type="search" defaultValue={query.q} maxLength={80} placeholder="Try review, vocabulary, listening…" /></label>
        <label><span>Category</span><select name="category" defaultValue={query.category}><option value="">All categories</option>{BLOG_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
        <label><span>Sort</span><select name="sort" defaultValue={query.sort}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option></select></label>
        <button type="submit">Apply</button>
      </form>

      <section className="blog-results" aria-labelledby="articles-heading">
        <div className="blog-results-heading"><div><p className="blog-eyebrow">Published and ready to read</p><h2 id="articles-heading">Articles</h2></div>{(query.q || query.category) && <Link href="/blog">Clear filters</Link>}</div>
        {posts.length ? <div className="blog-card-grid">{posts.map((post, index) => <article className="blog-card" key={post.id}>
          {post.featuredImageKey ? <img src={`${blogMediaUrl(post.featuredImageKey)}?w=640&q=75&tv=2`} srcSet={`${blogMediaUrl(post.featuredImageKey)}?w=480&q=75&tv=2 480w, ${blogMediaUrl(post.featuredImageKey)}?w=640&q=75&tv=2 640w, ${blogMediaUrl(post.featuredImageKey)}?w=960&q=75&tv=2 960w`} alt={post.featuredImageAlt || ""} width={640} height={380} sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw" loading={index < 3 ? "eager" : "lazy"} fetchPriority={index < 3 ? "high" : "auto"} decoding="async" /> : <div className="blog-card-graphic" aria-hidden="true"><span>HSK {post.hskLevel ?? "3.0"}</span><b>{post.category}</b></div>}
          <div className="blog-card-body">
            <div className="blog-card-meta"><span>{post.category}</span>{post.hskLevel && <span>HSK {post.hskLevel >= 7 ? "7–9" : post.hskLevel}</span>}<time dateTime={post.publishedAt}>{dateLabel(post.publishedAt)}</time></div>
            <h3><Link href={`/blog/${post.slug}`}>{post.title}</Link></h3>
            <p>{post.excerpt}</p>
            <Link className="blog-read-link" href={`/blog/${post.slug}`}>Read article <span aria-hidden="true">→</span></Link>
          </div>
        </article>)}</div> : <div className="blog-empty"><h3>No published articles match these filters.</h3><p>Try a broader search or clear the selected category.</p><Link href="/blog">View all articles</Link></div>}
        {hasMore && <div className="blog-load-more"><Link href={`/blog?${nextQuery.toString()}`}>Load more</Link></div>}
      </section>
    </main>
  </StudyPage>;
}
