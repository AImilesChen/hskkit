import type { Metadata } from "next";
import SiteFooter from "../site-footer";

export const metadata: Metadata = {
  title: "Terms of Service | HSKKit",
  description: "Terms for using the current HSKKit study guide website.",
};

export default function TermsPage() {
  return (
    <main className="section">
      <h1>Terms of Service</h1>
      <p>Last updated: 2026-05-21</p>
      <p>
        HSKKit provides independent Chinese learning guides and
        practice-planning resources. Content is for study support and may
        contain mistakes. Learners should verify important learning decisions
        with teachers or trusted resources.
      </p>
      <p>
        The current implementation does not include account registration, paid
        subscriptions, checkout, or generated learning services.
      </p>
      <p>
        Contact: <a href="mailto:support@hskkit.com">support@hskkit.com</a>
      </p>
      <SiteFooter />
    </main>
  );
}
