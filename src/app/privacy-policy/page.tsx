import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";

export const metadata: Metadata = {
  title: "Privacy Policy | HSKKit",
  description: "How HSKKit handles privacy for the current study guide website.",
  alternates: {
    canonical: "https://hskkit.com/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="section pt-20">
        <div className="max-w-[800px] mx-auto">
          <h1 className="text-h1 max-sm:text-[32px] mb-4">Privacy Policy</h1>
          <p className="text-small text-ink-muted mb-8">Last updated: 2026-05-21</p>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">Introduction</h2>
            <p className="text-body text-ink-secondary mb-4">
              HSKKit is currently a static study guide website for HSK learners. The site does not provide user accounts, checkout, or server-side learning progress storage in the current implementation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">Information We Collect</h2>
            <p className="text-body text-ink-secondary mb-4">
              We do not collect personal information through forms, logins, or user accounts on this website. Standard web server logs may include IP addresses and browser information for security purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">How We Use Information</h2>
            <p className="text-body text-ink-secondary mb-4">
              If you contact support by email, your email address and message are used only to respond to your request.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">Cookies and Tracking</h2>
            <p className="text-body text-ink-secondary mb-4">
              We do not use cookie-based analytics in the current version. If analytics are added in the future, they will use privacy-first, cookieless approaches such as Plausible. You can control cookies through your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">Data Sharing</h2>
            <p className="text-body text-ink-secondary mb-4">
              We do not sell or share personal data with third parties for marketing purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">Your Rights</h2>
            <p className="text-body text-ink-secondary mb-4">
              You have the right to access, correct, or delete your personal information. Since we do not store user accounts, most requests relate to support emails or standard security/access logs.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">Contact Information</h2>
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
