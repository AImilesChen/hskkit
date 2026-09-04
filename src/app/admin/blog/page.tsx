import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BlogAdminClient from "./blog-admin-client";
import { BlogHttpError, requireBlogAdmin } from "@/lib/blog/access";
import { listAdminBlogPosts } from "@/lib/blog/repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blog admin | HSKKit", robots: { index: false, follow: false, nocache: true } };

export default async function BlogAdminPage() {
  try {
    const admin = await requireBlogAdmin();
    return <BlogAdminClient initialPosts={await listAdminBlogPosts()} adminEmail={admin.email} />;
  } catch (error) {
    if (error instanceof BlogHttpError && error.status === 401) redirect("/login?returnTo=%2Fadmin%2Fblog");
    return <main className="mx-auto max-w-2xl px-5 py-20"><p className="text-sm font-bold uppercase text-red-700">403</p><h1 className="mt-3 text-3xl font-bold">Access denied</h1><p className="mt-4 text-slate-600">This publishing area is restricted to approved internal Google accounts.</p></main>;
  }
}
