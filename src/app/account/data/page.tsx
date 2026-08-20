import type { Metadata } from "next";
import Link from "next/link";
import AccountDataClient from "./account-data-client";

export const metadata: Metadata = {
  title: "Account Data | HSKKit",
  description: "Export or delete HSKKit account learning data with recoverable request states.",
  robots: { index: false, follow: false },
};

export default function AccountDataPage() {
  return <main className="learn account-page">
    <header>
      <p className="eyebrow">Private account controls</p>
      <h1>Account data</h1>
      <p>Export, cancel, retry or delete with explicit state and a minimal audit trail.</p>
      <nav aria-label="Account navigation"><Link href="/account">Account & sync</Link><Link href="/today">Today</Link></nav>
    </header>
    <AccountDataClient />
  </main>;
}
