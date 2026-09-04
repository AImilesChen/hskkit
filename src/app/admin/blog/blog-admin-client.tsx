"use client";

import { useMemo, useState } from "react";
import { markdownToSafeHtml, type BlogStatus } from "@/lib/blog/domain";
import type { AdminBlogPostSummary, BlogPost } from "@/lib/blog/repository";

type Draft = { id?: string; revision?: number; title: string; slug: string; excerpt: string; contentMarkdown: string; featuredImageKey: string; featuredImageAlt: string; status: BlogStatus };
const blank = (): Draft => ({ title: "", slug: "", excerpt: "", contentMarkdown: "", featuredImageKey: "", featuredImageAlt: "", status: "draft" });
const fromPost = (post: BlogPost): Draft => ({ ...post, featuredImageKey: post.featuredImageKey ?? "", featuredImageAlt: post.featuredImageAlt ?? "" });
const toSummary = (post: BlogPost): AdminBlogPostSummary => {
  const { contentMarkdown: _contentMarkdown, ...summary } = post;
  return summary;
};

export default function BlogAdminClient({ initialPosts, adminEmail }: { initialPosts: AdminBlogPostSummary[]; adminEmail: string }) {
  const [posts, setPosts] = useState(initialPosts);
  const [draft, setDraft] = useState<Draft>(() => blank());
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const preview = useMemo(() => markdownToSafeHtml(draft.contentMarkdown), [draft.contentMarkdown]);
  const set = (key: keyof Draft, value: string) => setDraft((current) => ({ ...current, [key]: value }));

  async function selectPost(id: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/v1/admin/blog/${id}`, { cache: "no-store" });
      const payload = await response.json() as { post?: BlogPost; error?: string };
      if (!response.ok || !payload.post) throw new Error(payload.error || "Article could not be loaded");
      setDraft(fromPost(payload.post));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Article could not be loaded"); }
    finally { setBusy(false); }
  }

  async function save(status: BlogStatus) {
    setBusy(true); setMessage("");
    try {
      let response = await fetch(draft.id ? `/api/v1/admin/blog/${draft.id}` : "/api/v1/admin/blog", {
        method: draft.id ? "PATCH" : "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...draft, status: draft.id ? status : "draft" }),
      });
      let payload = await response.json() as { post?: BlogPost; error?: string };
      if (!response.ok || !payload.post) throw new Error(payload.error || "Save failed");
      if (!draft.id && status === "published") {
        response = await fetch(`/api/v1/admin/blog/${payload.post.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload.post, status: "published" }) });
        payload = await response.json() as { post?: BlogPost; error?: string };
        if (!response.ok || !payload.post) throw new Error(payload.error || "Publish failed");
      }
      setDraft(fromPost(payload.post));
      setPosts((current) => [toSummary(payload.post!), ...current.filter((item) => item.id !== payload.post!.id)]);
      setMessage(status === "published" ? "Published." : status === "withdrawn" ? "Withdrawn from public view." : "Draft saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Save failed"); }
    finally { setBusy(false); }
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true); setMessage("");
    try {
      const body = new FormData(); body.set("file", file);
      const response = await fetch("/api/v1/admin/blog/media", { method: "POST", body });
      const payload = await response.json() as { key?: string; url?: string; error?: string };
      if (!response.ok || !payload.key) throw new Error(payload.error || "Upload failed");
      setDraft((current) => ({ ...current, featuredImageKey: payload.key! }));
      setMessage("Featured image uploaded. Add accurate alt text before saving.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed"); }
    finally { setBusy(false); }
  }

  return <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-wider text-blue-700">Internal publishing</p><h1 className="mt-2 text-3xl font-bold text-slate-950">HSKKit Blog</h1><p className="mt-2 text-sm text-slate-600">Signed in as {adminEmail}. All changes are versioned and audited.</p></div><button type="button" onClick={() => setDraft(blank())} className="min-h-11 rounded-lg bg-blue-600 px-5 font-bold text-white">New article</button></header>
    {message && <p role="status" className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">{message}</p>}
    <div className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4"><h2 className="font-bold">Articles</h2><div className="mt-3 grid gap-2">{posts.length ? posts.map((post) => <button type="button" key={post.id} disabled={busy} onClick={() => selectPost(post.id)} className={`min-h-16 rounded-lg border p-3 text-left disabled:opacity-50 ${draft.id === post.id ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}><strong className="block text-sm text-slate-950">{post.title}</strong><span className="mt-1 block text-xs uppercase text-slate-500">{post.status} · v{post.revision}</span></button>) : <p className="text-sm text-slate-500">No articles yet.</p>}</div></aside>
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Title<input value={draft.title} onChange={(e) => set("title", e.target.value)} maxLength={120} className="min-h-11 rounded-lg border border-slate-300 px-3 font-normal" /></label><label className="grid gap-2 text-sm font-bold">Slug<input value={draft.slug} onChange={(e) => set("slug", e.target.value)} maxLength={100} placeholder="generated-from-title" className="min-h-11 rounded-lg border border-slate-300 px-3 font-normal" /></label></div>
        <label className="mt-5 grid gap-2 text-sm font-bold">Excerpt<textarea value={draft.excerpt} onChange={(e) => set("excerpt", e.target.value)} maxLength={300} rows={3} className="rounded-lg border border-slate-300 p-3 font-normal" /></label>
        <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_1fr] sm:items-end"><label className="grid gap-2 text-sm font-bold">Upload image<input type="file" accept="image/png,image/jpeg" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} className="min-h-11 rounded-lg border border-slate-300 p-2 font-normal" /></label><label className="grid gap-2 text-sm font-bold">Featured image alt text<input value={draft.featuredImageAlt} onChange={(e) => set("featuredImageAlt", e.target.value)} maxLength={180} className="min-h-11 rounded-lg border border-slate-300 px-3 font-normal" /></label></div>
        <div className="mt-6 grid gap-6 xl:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Markdown<textarea value={draft.contentMarkdown} onChange={(e) => set("contentMarkdown", e.target.value)} rows={24} className="min-h-[500px] rounded-lg border border-slate-300 p-4 font-mono text-sm font-normal leading-6" /></label><div><h2 className="text-sm font-bold">Preview</h2><article className="mt-2 min-h-[500px] [overflow-wrap:anywhere] rounded-lg border border-slate-200 bg-slate-50 p-5 leading-7 text-slate-800 [&_a]:text-blue-700 [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-slate-200 [&_h1]:mb-5 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:my-5 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:my-4 [&_h3]:text-xl [&_h3]:font-bold [&_img]:my-5 [&_img]:max-w-full [&_li]:ml-5 [&_li]:list-disc [&_p]:my-4" dangerouslySetInnerHTML={{ __html: preview }} /></div></div>
        <div className="mt-6 flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={() => save(draft.id ? draft.status : "draft")} className="min-h-11 rounded-lg border border-blue-600 px-5 font-bold text-blue-700 disabled:opacity-50">{draft.id ? "Save changes" : "Save draft"}</button><button type="button" disabled={busy} onClick={() => save("published")} className="min-h-11 rounded-lg bg-blue-600 px-5 font-bold text-white disabled:opacity-50">Publish</button>{draft.id && <button type="button" disabled={busy} onClick={() => save("withdrawn")} className="min-h-11 rounded-lg border border-red-300 px-5 font-bold text-red-700 disabled:opacity-50">Withdraw</button>}</div>
      </section>
    </div>
  </main>;
}
