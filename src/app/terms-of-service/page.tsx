import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";

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
          <p className="text-small text-ink-muted mb-8">Last updated: 2026-05-21</p>

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
