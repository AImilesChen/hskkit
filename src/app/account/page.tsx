import type { Metadata } from "next";
import Link from "next/link";
import AccountClient from "./account-client";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";

export const metadata: Metadata = {
  title: "Account & Sync | HSKKit",
  description: "Manage HSKKit progress sync, streak and guest progress merging.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <><SiteHeader/><main className="learn account-page">
    <header>
      <p className="eyebrow">Private learning account</p>
      <h1>Account, sign-in, and sync</h1>
      <p>Use Google sign-in for persistent private learning across devices. A Sync Key remains available for recovery and device connection.</p>
      <nav aria-label="Learning navigation"><Link href="/today">Today</Link><Link href="/review">Review</Link><Link href="/mistakes">Mistakes</Link><Link href="/listen">Listen</Link><Link href="/account/data">Data</Link><Link href="/exports">Exports</Link></nav>
    </header>
    <AccountClient />
  </main><SiteFooter/></>;
}
