import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";

export const metadata: Metadata = {
  title: "New HSK 3.0 Guide | HSKKit",
  description:
    "Understand the New HSK 3.0 discussion conservatively, compare beginner study planning, and choose practical HSK next steps.",
  alternates: {
    canonical: "https://hskkit.com/new-hsk-3-0",
  },
};

/* ────────── 2.0 vs 3.0 comparison ────────── */
const comparisonPoints = [
  {
    topic: "Level structure",
    hsk2:
      "Six levels (HSK 1–6). Each level has a fixed word list and a matching practice test format.",
    hsk3:
      "Discussion mentions a wider proficiency scale, possibly beyond six bands, with more detailed skill descriptors.",
    takeaway:
      "For now, most courses and tests still use HSK 1–6. Use what your school or test center requires.",
  },
  {
    topic: "Vocabulary scope",
    hsk2:
      "HSK 1 starts at ~150 words; HSK 6 covers roughly 5,000 words. The list is fixed and well documented.",
    hsk3:
      "Newer discussion suggests larger word pools and more flexible boundaries, but exact numbers are not finalized everywhere.",
    takeaway:
      "Keep building vocabulary steadily. A bigger list does not change the fact that you learn one word at a time.",
  },
  {
    topic: "Test format",
    hsk2:
      "Paper or computer-based tests with listening, reading, and writing sections at higher levels.",
    hsk3:
      "Possible changes to section weights, speaking integration, or digital-first delivery. Details vary by provider.",
    takeaway:
      "Check your test center's format before exam day. Do not assume every center uses the same setup.",
  },
  {
    topic: "Scoring and certificates",
    hsk2:
      "Pass/fail by level with a standardized certificate recognized by many schools and employers.",
    hsk3:
      "Discussion includes band-based scoring and updated certificate design. Rollout timelines differ by region.",
    takeaway:
      "If you need a certificate for a job or university, confirm which version they accept and when.",
  },
  {
    topic: "Study resources",
    hsk2:
      "Textbooks, apps, and vocabulary lists are widely available and aligned to the six-level system.",
    hsk3:
      "Some newer materials reference 3.0 bands, but coverage is still patchy. Many learners mix old and new resources.",
    takeaway:
      "Pick resources that match your current level, not just the newest label. Consistent review beats chasing updates.",
  },
];

/* ────────── Beginner guidance ────────── */
const beginnerSteps = [
  {
    title: "Start with HSK 1 basics",
    desc: "If you are still building your first Chinese words and short sentence recognition, HSK 1 is a practical starting point regardless of framework version.",
    cta: { href: "/hsk-1-vocabulary", label: "Open HSK 1 vocabulary" },
  },
  {
    title: "Connect sound, shape, and meaning",
    desc: "Use pinyin (pīnyīn) to link pronunciation with characters. Write characters by hand to build muscle memory.",
    cta: { href: "/hsk-1-practice-test", label: "Try HSK 1 practice" },
  },
  {
    title: "Test early and often",
    desc: "Try practice questions so level labels turn into real evidence about what you can recognize in context.",
    cta: { href: "/hsk-level-test", label: "Take the Level Check" },
  },
  {
    title: "Verify with your goal",
    desc: "Read a level guide when you need a wider plan, then confirm exam-specific requirements with your school or test center.",
    cta: { href: "/hsk-levels", label: "Compare HSK levels" },
  },
];

/* ────────── Pitfalls ────────── */
const pitfalls = [
  "Assuming every school or test center uses the same rollout timeline.",
  "Over-optimizing for level labels before building pronunciation, vocabulary, and practice habits.",
  "Treating this page as official policy or a replacement for exam-provider guidance.",
  "Switching resources too often because of label confusion instead of finishing one level solidly.",
];

/* ────────── FAQ ────────── */
const faqs = [
  {
    q: "Is this page official HSK policy?",
    a: "No. It is a learner-facing guide. Check your school, test center, or official exam provider when you need policy, timing, or registration details.",
  },
  {
    q: "Should a beginner wait before studying HSK 1 basics?",
    a: "No. Beginner vocabulary, simple reading attention, and short practice questions remain useful foundations while you compare the resources relevant to your goal.",
  },
  {
    q: "Why do HSK resources use different labels?",
    a: "Resources can reflect different study paths, publishing dates, or framework references. Check what a resource is built for before treating its labels as universal.",
  },
  {
    q: "Will my old HSK 2.0 certificate still be valid?",
    a: "Most institutions still accept HSK 2.0 certificates. If you are applying to a specific school or employer, ask them directly which version they recognize.",
  },
  {
    q: "Do I need to restart if I studied under HSK 2.0?",
    a: "No. The Chinese language has not changed. Your vocabulary and reading skills transfer. You may only need to adjust to a new test format if your center switches.",
  },
  {
    q: "When will HSK 3.0 fully replace 2.0?",
    a: "There is no single global date. Rollout varies by country, test center, and institution. Check with the provider that matters for your goal.",
  },
  {
    q: "Which should I prepare for—2.0 or 3.0?",
    a: "Prepare for the version your school or test center currently offers. If they have not announced a switch, 2.0 is still the safer bet.",
  },
];

/* ────────── Related pages ────────── */
const relatedPages = [
  {
    title: "HSK level test",
    desc: "Use a self-check guide when you want a rough starting point before choosing what to review.",
    href: "/hsk-level-test",
    label: "Open HSK level test guide",
  },
  {
    title: "HSK 1 vocabulary",
    desc: "Start with beginner words when your foundation matters more than the label on a future level chart.",
    href: "/hsk-1-vocabulary",
    label: "Open HSK 1 vocabulary",
  },
  {
    title: "HSK 1 practice",
    desc: "Try short questions to see whether beginner vocabulary stays clear in context.",
    href: "/hsk-1-practice-test",
    label: "Open HSK 1 practice guide",
  },
  {
    title: "HSK 3 vocabulary",
    desc: "Study HSK 3 words with a cautious eye on resource labels, word list boundaries, and the transition beyond HSK 2.",
    href: "/hsk-3-vocabulary",
    label: "Open HSK 3 vocabulary",
  },
  {
    title: "HSK 3 practice test",
    desc: "Use HSK 3 mock test guidance as practice support while still checking which framework or resource your goal uses.",
    href: "/hsk-3-practice-test",
    label: "Open HSK 3 practice test",
  },
  {
    title: "HSK 4 vocabulary",
    desc: "Review HSK 4 word-list guidance while checking which framework, course, or exam resource your goal follows.",
    href: "/hsk-4-vocabulary",
    label: "Open HSK 4 vocabulary",
  },
  {
    title: "HSK 4 practice test",
    desc: "Use HSK 4 mock test guidance as practice support while checking which framework or resource applies to your goal.",
    href: "/hsk-4-practice-test",
    label: "Open HSK 4 practice test",
  },
  {
    title: "HSK 5 vocabulary",
    desc: "Review HSK 5 word-list guidance while checking which framework, course, or exam resource your goal follows.",
    href: "/hsk-5-vocabulary",
    label: "Open HSK 5 vocabulary",
  },
  {
    title: "HSK levels guide",
    desc: "Compare the wider level path when you need a simple study map for planning next steps.",
    href: "/hsk-levels",
    label: "Open HSK levels guide",
  },
];

export default function NewHSK30Page() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="section pt-20">
          <div className="section-inner">
            <span className="eyebrow">New HSK 3.0 Guide</span>
            <h1 className="text-h1 max-sm:text-[32px] mb-6">
              New HSK 3.0 context for practical Chinese study
            </h1>
            <p className="text-body-lg text-ink-secondary max-w-[720px] mb-10">
              Learners often meet the phrase New HSK 3.0 while comparing HSK
              resources, level charts, and exam plans. Use this page as a cautious
              orientation guide, then check the school, test center, or official exam
              provider that applies to your goal.
            </p>
            <div className="flex gap-4 flex-wrap">
              <a href="/hsk-levels" className="btn btn-primary">
                Read HSK levels guide
              </a>
              <a href="/hsk-1-vocabulary" className="btn btn-secondary">
                Start HSK 1 vocabulary
              </a>
            </div>
          </div>
        </section>

        {/* What people mean */}
        <section className="section section-alt">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">
              What people usually mean by New HSK 3.0
            </h2>
            <div className="card-grid">
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">
                  Newer framework discussion
                </h3>
                <p className="text-body text-ink-secondary">
                  The phrase usually points to newer HSK-related proficiency
                  standards and level discussion beyond the older six-level study
                  shorthand many learners already know.
                </p>
              </article>
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">Resource comparison</h3>
                <p className="text-body text-ink-secondary">
                  It often appears when learners compare vocabulary lists, courses,
                  level charts, and exam preparation resources that may not use the
                  same labels.
                </p>
              </article>
              <article className="card">
                <h3 className="text-h3 max-sm:text-xl mb-3">
                  Verification still matters
                </h3>
                <p className="text-body text-ink-secondary">
                  A discussion label is not a personal exam notice. Confirm the
                  requirements and timing that matter for your own study or test
                  path.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="section">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-4">
              HSK 2.0 vs 3.0: what actually changes
            </h2>
            <p className="text-body-lg text-ink-secondary max-w-[720px] mb-10">
              For beginners, the safest comparison is about planning habits rather
              than guessing policy timelines. Here is what we know—and what you
              should verify.
            </p>
            <div className="flex flex-col gap-6">
              {comparisonPoints.map((item) => (
                <article
                  key={item.topic}
                  className="bg-white border border-[#E2E8F0] rounded-2xl p-7 shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                >
                  <p className="eyebrow mb-3">{item.topic}</p>
                  <div className="grid md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A] mb-1">
                        HSK 2.0
                      </p>
                      <p className="text-sm text-[#334155] leading-relaxed">
                        {item.hsk2}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A] mb-1">
                        HSK 3.0 discussion
                      </p>
                      <p className="text-sm text-[#334155] leading-relaxed">
                        {item.hsk3}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-[#E2E8F0]">
                    <p className="text-sm font-semibold text-[#2563EB] mb-1">
                      Practical takeaway
                    </p>
                    <p className="text-sm text-[#334155] leading-relaxed">
                      {item.takeaway}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Beginner guidance */}
        <section className="section section-alt">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-4">
              Keep the first study steps concrete
            </h2>
            <p className="text-body-lg text-ink-secondary max-w-[720px] mb-10">
              A beginner does not need to solve every framework question before
              learning. Build the foundation first, then compare level guidance with
              the resource and exam path you actually use.
            </p>
            <div className="flex flex-col gap-6 max-w-[800px]">
              {beginnerSteps.map((step, i) => (
                <div
                  key={i}
                  className="flex gap-4 items-start bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                >
                  <div className="w-10 h-10 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[15px] font-semibold text-[#0F172A] mb-1">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[#334155] leading-relaxed mb-3">
                      {step.desc}
                    </p>
                    <a
                      href={step.cta.href}
                      className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2563EB] no-underline hover:underline"
                    >
                      {step.cta.label}
                      <span>→</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pitfalls */}
        <section className="section">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">
              What learners should avoid
            </h2>
            <div className="max-w-[800px]">
              {pitfalls.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 py-4 border-b border-border"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#DC2626"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="flex-shrink-0 mt-0.5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  <p className="text-body text-ink-secondary">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section section-alt">
          <div className="section-inner max-w-[800px]">
            <h2 className="text-h2 max-sm:text-[28px] mb-8 text-center">
              Frequently asked questions
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

        {/* Related pages */}
        <section className="section">
          <div className="section-inner">
            <h2 className="text-h2 max-sm:text-[28px] mb-8">
              Continue with a practical HSK step
            </h2>
            <div className="card-grid">
              {relatedPages.map((page) => (
                <article className="card" key={page.href}>
                  <h3 className="text-h3 max-sm:text-xl mb-3">{page.title}</h3>
                  <p className="text-body text-ink-secondary mb-4">
                    {page.desc}
                  </p>
                  <a
                    href={page.href}
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2563EB] no-underline hover:underline"
                  >
                    {page.label}
                    <span>→</span>
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="section section-alt">
          <div className="section-inner text-center">
            <h2 className="text-h2 max-sm:text-[28px] mb-4">
              Still unsure where to start?
            </h2>
            <p className="text-body-lg text-ink-secondary max-w-[560px] mx-auto mb-8">
              Take the 8-question level check. No timer, no pressure—just a
              practical suggestion for your next step.
            </p>
            <a href="/hsk-level-test" className="btn btn-primary">
              Take the Level Check
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
