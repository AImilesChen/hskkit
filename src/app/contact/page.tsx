import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";

export const metadata: Metadata = {
  title: "Contact HSKKit | Get Help & Support",
  description:
    "Reach out to HSKKit for questions, feedback, or support. We typically respond within 1–2 business days.",
  alternates: {
    canonical: "https://hskkit.com/contact",
  },
  openGraph: {
    title: "Contact HSKKit | Get Help & Support",
    description:
      "Reach out to HSKKit for questions, feedback, or support. We typically respond within 1–2 business days.",
    url: "https://hskkit.com/contact",
    siteName: "HSKKit",
    type: "website",
  },
};

const faqs = [
  {
    q: "How fast will you reply?",
    a: "We usually respond within 1–2 business days. For simple questions, check the FAQs below first—you might find an instant answer.",
  },
  {
    q: "Can I request a new feature or report a bug?",
    a: "Yes. Use the form below and pick 'Feedback' as the topic. A short description plus a screenshot link helps us act faster.",
  },
  {
    q: "Is HSKKit an official HSK test platform?",
    a: "No. HSKKit is an independent study tool. We are not affiliated with, endorsed by, or operated by any HSK test organizer. For official exam registration and policy, contact your test center directly.",
  },
  {
    q: "Do you offer tutoring or live classes?",
    a: "Not at the moment. HSKKit focuses on self-study vocabulary guides, practice questions, and level-check tools. If you need a tutor, we can suggest how to evaluate one.",
  },
  {
    q: "I forgot my progress. Can you recover it?",
    a: "Sign in with Google to save progress privately and continue across devices. If you previously created a Sync Key, you can also use it from Account as a recovery method. Guest progress remains in its guest session until you preview and confirm a merge.",
  },
];

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="section pt-20">
          <div className="section-inner max-w-[640px]">
            <span className="eyebrow">Contact</span>
            <h1 className="text-h1 max-sm:text-[32px] mb-6">
              We are here to help
            </h1>
            <p className="text-body-lg text-ink-secondary mb-10">
              Have a question about HSK study, found something confusing, or want
              to suggest an improvement? Send us a message and we will get back to
              you as soon as we can.
            </p>

            {/* Contact Form */}
            <form
              className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-[0_4px_12px_rgba(0,0,0,0.06)] mb-10"
              action="mailto:support@hskkit.com"
              method="post"
              encType="text/plain"
            >
              <div className="flex flex-col gap-5">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-[#0F172A] mb-2"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Your name"
                    className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-[#0F172A] mb-2"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                </div>

                <div>
                  <label
                    htmlFor="topic"
                    className="block text-sm font-semibold text-[#0F172A] mb-2"
                  >
                    Topic
                  </label>
                  <select
                    id="topic"
                    name="topic"
                    required
                    className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-base text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  >
                    <option value="">Select a topic</option>
                    <option value="general">General question</option>
                    <option value="study">Study advice</option>
                    <option value="feedback">Feedback / Feature request</option>
                    <option value="bug">Bug report</option>
                    <option value="business">Business inquiry</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-semibold text-[#0F172A] mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    placeholder="Tell us what is on your mind..."
                    className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-y"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full sm:w-auto self-start"
                >
                  Send Message
                </button>
              </div>
            </form>

            {/* Response Promise */}
            <div className="flex items-start gap-4 p-5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl mb-10">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0 mt-0.5"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-[#0F172A] mb-1">
                  Response time
                </p>
                <p className="text-sm text-[#334155]">
                  We read every message and typically reply within 1–2 business
                  days. For urgent study questions, the FAQ section below may save
                  you time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section section-alt">
          <div className="section-inner max-w-[720px]">
            <h2 className="text-h2 max-sm:text-[28px] mb-8 text-center">
              Common questions
            </h2>
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] overflow-hidden">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="border-b border-[#E2E8F0] last:border-b-0"
                >
                  <summary className="flex items-center justify-between px-6 py-5 text-base font-semibold text-[#0F172A] cursor-pointer list-none hover:bg-[#F8FAFC]">
                    <span>{faq.q}</span>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      stroke="#64748B"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-5 text-base leading-relaxed text-[#334155]">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section">
          <div className="section-inner text-center">
            <h2 className="text-h2 max-sm:text-[28px] mb-4">
              Ready to keep studying?
            </h2>
            <p className="text-body-lg text-ink-secondary max-w-[560px] mx-auto mb-8">
              While you wait for a reply, try a quick level check or jump into
              vocabulary review.
            </p>
            <div className="flex gap-4 flex-wrap justify-center">
              <a href="/hsk-level-test" className="btn btn-primary">
                Take the Level Check
              </a>
              <a href="/hsk-1-vocabulary" className="btn btn-secondary">
                Start HSK 1 Vocabulary
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
