import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import {
  PUBLIC_ACCOUNT_SCOPE,
  PUBLIC_FORMAL_CONTENT_SCOPE,
} from "@/lib/public-copy";

export const metadata: Metadata = {
  title: "Terms of Service | HSKKit",
  description: "Terms for using the current HSKKit study guide website.",
  alternates: {
    canonical: "https://hskkit.com/terms-of-service",
  },
  openGraph: {
    title: "Terms of Service | HSKKit",
    description:
      "Terms for using the current HSKKit study guide website.",
    url: "https://hskkit.com/terms-of-service",
    siteName: "HSKKit",
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="section pt-20">
        <div className="max-w-[800px] mx-auto">
          <h1 className="text-h1 max-sm:text-[32px] mb-4">Terms of Service</h1>
          <p className="text-small text-ink-muted mb-8">Last updated: 2026-08-23</p>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">Acceptance of Terms</h2>
            <p className="text-body text-ink-secondary mb-4">
              By accessing and using HSKKit, you accept and agree to be bound by these Terms of Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">Use of Service</h2>
            <p className="text-body text-ink-secondary mb-4">
              HSKKit provides independent Chinese learning guides and practice-planning resources. Content is for study support and may contain mistakes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">Current Content and Account Scope</h2>
            <p className="text-body text-ink-secondary mb-4">{PUBLIC_FORMAL_CONTENT_SCOPE}</p>
            <p className="text-body text-ink-secondary mb-4">{PUBLIC_ACCOUNT_SCOPE}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">Subscriptions, Cancellation, and Refunds</h2>
            <p className="text-body text-ink-secondary mb-4">HSKKit offers Pro Monthly at US$5.99 per month and Pro Yearly at US$49 per year. Both renew automatically until cancelled and grant the same account-based Pro entitlement. Cancellation takes effect at the current paid period end.</p>
            <p className="text-body text-ink-secondary mb-4">Eligible refund requests are reviewed under the <a href="/refund-policy" className="text-primary hover:underline">Refund Policy</a>. A full refund revokes Pro access after signed Stripe webhook confirmation. Checkout remains in Stripe Test mode until live payment is separately authorized.</p>
            <p className="text-body text-ink-secondary mb-4"><strong>Advanced Study PDF Pack: US$9.99 one-time in Stripe Test mode.</strong> It creates a separate personal PackPurchase for one selected HSK 3.0 level and is not included in Pro. Access lasts 14 days and permits up to 3 successful downloads; failed delivery does not consume a download. A signed Stripe refund revokes the purchase licence and private delivery.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">Intellectual Property</h2>
            <p className="text-body text-ink-secondary mb-4">
              All content on HSKKit is provided for personal study use. You may not reproduce, distribute, or create derivative works without permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">Disclaimer</h2>
            <p className="text-body text-ink-secondary mb-4">
              HSKKit is an independent study tool and is not affiliated with, endorsed by, sponsored by, or operated by any HSK test organizer or trademark owner. Learners should verify important learning decisions with teachers or trusted resources.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">Limitation of Liability</h2>
            <p className="text-body text-ink-secondary mb-4">
              HSKKit is provided as-is without warranties. We are not liable for any damages arising from the use of our study materials.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">Changes to Terms</h2>
            <p className="text-body text-ink-secondary mb-4">
              We may update these terms from time to time. Continued use of the site after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">Contact</h2>
            <p className="text-body text-ink-secondary">
              Contact: <a href="mailto:support@hskkit.com" className="text-primary hover:underline">support@hskkit.com</a>
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
