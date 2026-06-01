import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";

export const metadata: Metadata = {
  title: "Disclaimer | HSKKit",
  description: "Disclaimer and important notices for HSKKit users.",
  alternates: {
    canonical: "https://hskkit.com/disclaimer",
  },
};

export default function DisclaimerPage() {
  return (
    <>
      <SiteHeader />
      <main className="section pt-20">
        <div className="max-w-[800px] mx-auto">
          <h1 className="text-h1 max-sm:text-[32px] mb-4">Disclaimer</h1>
          <p className="text-small text-ink-muted mb-8">Last updated: 2026-05-21</p>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">Educational Purpose</h2>
            <p className="text-body text-ink-secondary mb-4">
              HSKKit is an independent educational website designed to support Chinese language learners in preparing for the HSK (Hanyu Shuiping Kaoshi) test. All content, including vocabulary lists, practice questions, and study guides, is provided solely for educational and self-study purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">No Official Affiliation</h2>
            <p className="text-body text-ink-secondary mb-4">
              HSKKit is <strong>not affiliated with, endorsed by, sponsored by, or operated by</strong> any HSK test organizer, Hanban, the Center for Language Education and Cooperation, or any other official examination body. "HSK" and related trademarks are the property of their respective owners.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">Practice Test Results</h2>
            <p className="text-body text-ink-secondary mb-4">
              Practice tests and quizzes on this site are intended as study aids only. Performance on these practice materials <strong>does not guarantee</strong> any specific score or result on the official HSK examination. Actual test difficulty, format, and scoring may differ.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">Learning Advice</h2>
            <p className="text-body text-ink-secondary mb-4">
              Any study plans, learning suggestions, or recommendations provided on HSKKit are general in nature. Learners should use their own judgment and, where appropriate, consult qualified teachers or official sources before making important learning decisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">Accuracy of Content</h2>
            <p className="text-body text-ink-secondary mb-4">
              While we strive to keep all content accurate and up to date, errors or omissions may occur. HSKKit is provided "as is" without warranties of any kind. We are not liable for any damages or losses arising from the use of our materials.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-h3 mb-4">Contact</h2>
            <p className="text-body text-ink-secondary">
              If you have any questions about this disclaimer, please contact us at{" "}
              <a href="mailto:support@hskkit.com" className="text-primary hover:underline">support@hskkit.com</a>.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
