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
          <p className="text-small text-ink-muted mb-8">Last updated: 2026-10-06</p>

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
            <p className="text-body text-ink-secondary mb-4">Eligible refund requests are reviewed under the <a href="/refund-policy" className="text-primary hover:underline">Refund Policy</a>, including its 2/5/3 UTC-calendar-day service timeline. A full refund revokes Pro access after signed Stripe webhook confirmation. Checkout is processed securely by Stripe. Mandatory consumer rights remain unaffected.</p>
            <p className="text-body text-ink-secondary mb-4"><strong>Store products are one-time digital purchases processed by Stripe and are not included in Pro.</strong> Complete Level 1–6 vocabulary PDFs range from US$3.99 to US$17.99; vocabulary Bundles range from US$9.99 to US$49.99; practical learner, Bundle and teacher resources range from US$4.99 to US$24.99. The selected product detail page and Stripe checkout are the price and scope controls. Private access lasts 14 days and permits up to 3 successful downloads per delivery; failed delivery does not consume a download. A signed Stripe refund revokes the purchase licence and private delivery access.</p>
            <p className="text-body text-ink-secondary mb-4">For every Store product, the purchaser may keep and use downloaded files without a time limit and print as many copies as needed for personal study or learners they teach. Printed copies may be given to those learners without charge. HSKKit does not grant permission to sell or resell its original printed or digital materials. Teacher Lesson Plan Pack purchasers may also adapt its editable lesson-plan files for their own teaching. Third-party vocabulary data and definitions retain their MIT and CC BY-SA 4.0 licences; these terms do not limit rights under those licences. The 14-day access window and three-download limit apply only to retrieving files, not to the use or printing of saved copies.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">Intellectual Property</h2>
            <p className="text-body text-ink-secondary mb-4">
              Purchased Store products carry the use and printing rights stated above; a purchase does not transfer copyright ownership. Third-party vocabulary source material keeps its original licences. Other HSKKit site content is provided for personal study and may not be reproduced, distributed or adapted without permission. All other intellectual-property rights remain reserved.
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
