import type { Metadata } from "next";
import Link from "next/link";
import AccountClient from "./account-client";

export const metadata: Metadata = {
  title: "Account & Sync | HSKKit",
  description: "Manage HSKKit progress sync, streak and guest progress merging.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <main className="learn account-page">
    <header>
      <p className="eyebrow">Private learning account</p>
      <h1>Account & sync</h1>
      <p>Connect devices, preview guest progress before merging, and review conflict-safe sync status.</p>
      <nav aria-label="Learning navigation"><Link href="/today">Today</Link><Link href="/review">Review</Link><Link href="/mistakes">Mistakes</Link><Link href="/listen">Listen</Link><Link href="/account/data">Data</Link></nav>
    </header>
    <AccountClient />
  </main>;
}
