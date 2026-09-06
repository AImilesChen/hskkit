import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, unauthorized } from "next/navigation";
import { AdminDomainError } from "@/lib/admin/domain";
import { requireAdmin } from "@/lib/admin/access";
import "./admin.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin | HSKKit", robots: { index: false, follow: false, nocache: true } };

export default async function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  try { await requireAdmin(); } catch (error) {
    if (error instanceof AdminDomainError && error.status === 401) unauthorized();
    if (error instanceof AdminDomainError && error.status === 403) forbidden();
    throw error;
  }
  return <main className="admin-console">
    <header className="admin-header"><div><span className="admin-kicker">HSKKit operations</span><h1>Admin console</h1><p>Read-only account and subscription visibility with an audited feedback workflow.</p></div><Link href="/account">Back to account</Link></header>
    <nav className="admin-nav" aria-label="Admin sections"><Link href="/admin">Overview</Link><Link href="/admin/users">Users</Link><Link href="/admin/subscriptions">Subscriptions</Link><Link href="/admin/feedback">Feedback</Link></nav>
    {children}
  </main>;
}
