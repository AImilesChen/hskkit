import type { Metadata } from "next";
import SiteFooter from "../site-footer";

export const metadata: Metadata = {
  title: "Privacy Policy | HSKKit",
  description:
    "How HSKKit handles privacy for the current study guide website.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="section">
      <h1>Privacy Policy</h1>
      <p>Last updated: 2026-05-21</p>
      <p>
        HSKKit is currently a static study guide website for HSK learners. The
        site does not provide user accounts, checkout, or server-side learning
        progress storage in the current implementation.
      </p>
      <p>
        If you contact support by email, your email address and message are used
        to respond to your request.
      </p>
      <p>
        Contact: <a href="mailto:support@hskkit.com">support@hskkit.com</a>
      </p>
      <SiteFooter />
    </main>
  );
}
