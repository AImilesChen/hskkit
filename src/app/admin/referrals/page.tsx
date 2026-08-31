import type { Metadata } from "next";
import ReferralAdminClient from "./referral-admin-client";

export const metadata: Metadata = { title: "Referral operations | HSKKit", robots: { index: false, follow: false } };

export default function ReferralAdminPage() {
  return <main className="mx-auto min-h-screen max-w-6xl px-5 py-10">
    <header className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Restricted operations</p><h1 className="mt-2 text-3xl font-extrabold text-slate-950">Referral and reward review</h1><p className="mt-3 leading-7 text-slate-600">Inspect referral relationships, open anti-abuse flags and issued rewards. Administrative actions require the server-configured operations token and a written reason.</p></header>
    <ReferralAdminClient />
  </main>;
}
