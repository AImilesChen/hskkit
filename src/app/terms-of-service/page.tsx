import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service | HSKKit", description: "HSKKit terms of service draft." };

export default function TermsPage() {
  return (
    <main className="section">
      <h1>Terms of Service</h1>
      <p>Last updated: 2026-05-21</p>
      <p>HSKKit provides AI-assisted Chinese learning tools. Outputs are for study support and may contain mistakes. Users should review important learning content independently.</p>
      <p>Pro subscription is planned at $5.99/month or $49/year with 500 credits per month. Credits reset monthly and do not roll over.</p>
      <p>Refund window: 7 days. Failed payment grace period: 3 days.</p>
      <p>Contact: <a href="mailto:support@hskkit.com">support@hskkit.com</a></p>
    </main>
  );
}
