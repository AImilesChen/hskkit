import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import { FreePlanAction, ProPlanChoice, WelcomeTrialAction } from "./subscription-checkout";
import { FREE_PLAN_BENEFITS, PLAN_COMPARISON, AI_CREDIT_COSTS } from "@/lib/commercial/plan-presentation";
import { FREE_CAPABILITIES, PRO_CAPABILITIES } from "@/lib/commercial/capabilities";
import { PUBLIC_ACCOUNT_SCOPE, PUBLIC_FORMAL_CONTENT_SCOPE } from "@/lib/public-copy";
import "./pricing.css";
import "../components/mock-offer.css";
import { MockExamShowcase } from "./mock-exam-showcase";
import { FREE_MOCK_COUNT, TOTAL_MOCK_COUNT, MOCK_LEVEL_RANGE } from "@/lib/formal-exams/offer";

export const metadata: Metadata = {
  title: "HSKKit Pricing | Free & Pro Learning and HSK 1–6 Mock Exams",
  description: `Compare HSKKit Free and Pro. Start with ${FREE_MOCK_COUNT} free HSK mock papers or unlock all ${TOTAL_MOCK_COUNT} across ${MOCK_LEVEL_RANGE}, plus unlimited new learning and monthly AI credits.`,
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return <><SiteHeader/><main className="pricing-page">
    <header className="pricing-hero">
      <p className="pricing-eyebrow">Your next step in Chinese</p>
      <h1>Learn daily.<br/><span>Practise for your HSK.</span></h1>
      <p className="pricing-intro">Start with {FREE_MOCK_COUNT} free HSK mock papers. Pro unlocks all {TOTAL_MOCK_COUNT} across {MOCK_LEVEL_RANGE}, plus more room for daily learning and AI support.</p>
      <div className="pricing-hero-actions"><Link className="pricing-button pricing-button-primary" href="#mock-papers">Explore free papers <span aria-hidden="true">→</span></Link><Link className="pricing-compare-link" href="#plans">Compare plans ↓</Link></div>
      <aside className="pricing-trial" aria-label="Trial offer"><span aria-hidden="true">✦</span><WelcomeTrialAction /></aside>
    </header>

    <section id="plans" className="pricing-plans" aria-label="Free and Pro plans">
      <article className="pricing-plan pricing-free" aria-labelledby="free-plan-title">
        <div className="pricing-plan-heading"><h2 id="free-plan-title">Free</h2><span className="pricing-tag">A lasting start</span></div>
        <p className="pricing-plan-description">Build your foundation. Try Paper A at each level.</p>
        <div className="pricing-price"><p><strong>US$0</strong><span> / forever</span></p><p className="pricing-price-detail">No card required. No expiry.</p></div>
        <ul className="pricing-benefits">{FREE_PLAN_BENEFITS.map((item, index) => <li key={item}><span aria-hidden="true">✓</span><div>{index === 0 ? <><strong>{FREE_MOCK_COUNT} free HSK mock papers</strong><p>Paper A at every level from {MOCK_LEVEL_RANGE}.</p></> : item}</div></li>)}</ul>
        <div className="pricing-free-note"><strong>Your reviews keep going.</strong><p>Learn {FREE_CAPABILITIES.dailyNewItems} new items each day, then revisit learned items without a daily review cap.</p></div>
        <div className="pricing-checkout"><FreePlanAction/><p>Guest study is welcome. Sign in when you want to save and sync.</p></div>
      </article>
      <article className="pricing-plan pricing-pro" aria-labelledby="pro-plan-title">
        <div className="pricing-plan-heading"><h2 id="pro-plan-title">Pro</h2><span className="pricing-tag">More complete practice</span></div>
        <p className="pricing-plan-description">Prepare with more complete papers, then keep your learning going.</p>
        <ProPlanChoice/>
      </article>
    </section>
    <p className="pricing-fair-use">Standard review has no daily rating cap on either plan. Anti-abuse safeguards still apply. Store products are purchased separately.</p>

    <MockExamShowcase/>
    <section className="pricing-section" aria-labelledby="course-pricing-title"><div className="pricing-section-heading"><p className="pricing-eyebrow">Also included · Chinese 1–4 course review</p><h2 id="course-pricing-title">Practise everyday Chinese across four skills.</h2><p>Each course has three complete papers. All four A papers are free. Pro includes all twelve, adding eight B/C papers with new listening, reading, writing and speaking tasks. Speaking and writing include references for self-review or review by your own teacher.</p></div><Link className="pricing-button pricing-button-secondary" href="/chinese-course-tests">Explore Chinese 1–4 papers →</Link></section>
    <section className="pricing-section" aria-labelledby="ap-pricing-title"><div className="pricing-section-heading"><p className="pricing-eyebrow">Also included · AP Chinese</p><h2 id="ap-pricing-title">Three complete papers for four-skill practice.</h2><p>AP Chinese 2027-format Paper A is free. Pro adds B and C: fresh listening and reading, original four-picture stories, emails and music-research speaking tasks. Speaking and writing include references for manual review, without an official score prediction.</p></div><Link className="pricing-button pricing-button-secondary" href="/ap-chinese-practice-test">Explore AP Chinese papers →</Link></section>

    <section id="compare" className="pricing-section" aria-labelledby="compare-title">
      <div className="pricing-section-heading"><p className="pricing-eyebrow">The details, side by side</p><h2 id="compare-title">Choose the room you need.</h2><p>Monthly and yearly billing include the same Pro entitlement.</p></div>
      <div className="pricing-table-wrap"><table className="pricing-table"><caption className="sr-only">Compare HSKKit Free and Pro subscription benefits</caption><thead><tr><th scope="col">What you get</th><th scope="col">Free</th><th scope="col">Pro</th></tr></thead><tbody>{PLAN_COMPARISON.map(([label, free, pro]) => <tr key={label}><th scope="row">{label}</th><td>{free}</td><td>{pro}</td></tr>)}</tbody></table></div>
    </section>

    <section id="ai-value" className="pricing-section" aria-labelledby="workflow-title">
      <div className="pricing-section-heading"><p className="pricing-eyebrow">Pro, in your study day</p><h2 id="workflow-title">Help with the next useful step.</h2><p>Examples of how the existing tools support your learning.</p></div>
      <div className="pricing-workflows">
        <article className="pricing-workflow pricing-rose"><span className="pricing-workflow-number">01 · Focused Review</span><h3>Start with what needs attention.</h3><p>Pro puts unresolved mistakes and due weak memories ahead of routine cards.</p><figure className="pricing-example"><figcaption>Example review order</figcaption><ol><li><span>1</span><div><strong>Missed question</strong><small>Open mistake · Review first</small></div></li><li><span>2</span><div><strong>Due memory check</strong><small>Time to revisit it</small></div></li></ol></figure><Link href="/review">Explore review →</Link></article>
        <article className="pricing-workflow pricing-blue"><span className="pricing-workflow-number">02 · AI explanations</span><h3>Understand why an answer missed.</h3><p>Ask from supported exercise feedback, with the question and your answer as context.</p><figure className="pricing-example"><figcaption>Example explanation</figcaption><p lang="zh-Hans">他为什么迟到了？</p><div className="pricing-example-answer">“错过了公交车” explains the delay. Match the answer to 为什么.</div></figure><p className="pricing-credit-label">{AI_CREDIT_COSTS.explanation} credit per successful explanation</p></article>
        <article className="pricing-workflow pricing-green"><span className="pricing-workflow-number">03 · Plan suggestions</span><h3>Make your saved plan workable.</h3><p>Get suggestions for your saved weekly plan, then choose which changes to make.</p><figure className="pricing-example"><figcaption>Example suggestion</figcaption><p>30 minutes after work</p><div className="pricing-example-schedule"><span><strong>20 min</strong>Weakest skill</span><span><strong>10 min</strong>Due review</span></div></figure><p className="pricing-credit-label">{AI_CREDIT_COSTS.studyPlan} credits per successful suggestion</p></article>
      </div>
    </section>

    <section className="pricing-section pricing-faq" aria-labelledby="faq-title">
      <div className="pricing-section-heading"><p className="pricing-eyebrow">Before you choose</p><h2 id="faq-title">A few useful answers.</h2></div>
      <details><summary>Which mock papers are included?</summary><div><p>Free includes Paper A at every level from {MOCK_LEVEL_RANGE}: {FREE_MOCK_COUNT} complete papers. Pro includes Papers A, B and C: {TOTAL_MOCK_COUNT} in total. Each level has its own question count and timed sections.</p><p>Retaking a paper uses the same questions. Choose B or C for a different set at that level.</p></div></details>
      <details><summary>Are mock-exam writing tasks automatically marked?</summary><div><p>No. Writing tasks, where included, provide reference responses and self-review guidance. Objective answers receive raw practice marks; writing is reviewed separately. These are independent HSKKit papers, not official examinations or pass predictions.</p><p>AI credits cover supported practice and review explanations, saved plan suggestions and uploaded mistake analysis. They do not add automatic assessment to mock-exam writing.</p></div></details>
      <details><summary>How does the free trial work?</summary><div><p>Your 7-day Pro trial starts automatically after sign-up with an eligible verified Google account and includes 20 AI credits. No card is required and there is no automatic charge. It returns to Free automatically.</p><p>If you buy during the trial, your paid subscription starts immediately. Trial and reward credits follow their existing eligibility and expiry rules.</p></div></details>
      <details><summary>What can I do with the AI credits?</summary><div><p>Paid Pro includes {PRO_CAPABILITIES.aiMonthlyCredits} AI credits each month, including on annual billing. Successful exercise explanations use {AI_CREDIT_COSTS.explanation} credit; saved study-plan suggestions and uploaded mistake analyses use {AI_CREDIT_COSTS.studyPlan} credits each. Failed AI responses do not consume credits.</p><p>AI explanations appear after supported practice or review feedback. Uploaded mistake analysis is available from <Link href="/review">Review</Link>. Pro does not include an open-ended chatbot, AI speaking assessment or AI handwriting assessment.</p><p>Usage limits: {PRO_CAPABILITIES.aiRequestsPerHour} AI requests per hour and {PRO_CAPABILITIES.aiConcurrency} concurrent AI request. Free has no recurring monthly AI allowance; eligible trial or reward credits can still be used under their own rules.</p></div></details>
      <details><summary>How are standard review and Focused Review different?</summary><div><p>Standard review lets both plans revisit learned items without a daily rating limit. Pro Focused Review prioritizes unresolved mistakes and due weak memories, and explains why an item was selected.</p><p>History limits apply to past activity records. Learned items keep their review schedule even when their original activity falls outside that history window.</p></div></details>
      <details><summary>Can I cancel, switch billing periods or request a refund?</summary><div><p>Subscriptions renew automatically. Cancel from your account; access continues through the paid period. Monthly members can review a switch to yearly billing in Stripe before confirming the prorated charge.</p><p>Seven-day refund review is available when AI usage is 10 credits or less. See the <Link href="/refund-policy">refund policy</Link> for the full conditions. Cancellation and refund are separate actions.</p></div></details>
      <details><summary>Are PDF packs included in Pro?</summary><div><p>Store products are not included in Pro. Vocabulary PDFs, bundles and learner or teacher resources are one-time purchases with 3 successful downloads and a 14-day private access window. Each product page lists its exact contents, price and samples.</p><Link href="/store">Explore Store resources →</Link></div></details>
      <details><summary>Which content and account features are included?</summary><div><p>{PUBLIC_FORMAL_CONTENT_SCOPE}</p><p>{PUBLIC_ACCOUNT_SCOPE}</p><p>Free shows up to {FREE_CAPABILITIES.historyMaxEntries} history entries from the last {FREE_CAPABILITIES.historyRetentionDays} days; Pro shows up to {PRO_CAPABILITIES.historyMaxEntries.toLocaleString("en-US")} entries without that time window. Only records that are still available can be shown.</p></div></details>
    </section>

    <aside className="pricing-referrals" aria-labelledby="referral-heading"><div><p className="pricing-eyebrow">Learn together</p><h2 id="referral-heading">Invite a friend. Earn learning rewards.</h2><p>Earn up to 200 AI credits per qualifying friend, within annual reward limits.</p><details><summary>How referral rewards work</summary><p>Earn 50 AI credits when a verified friend completes 30 eligible learning actions across 3 different days, then another 150 after their first Pro payment clears the 7-day refund-risk window.</p><p>Free members also receive 3 days of Pro at the learning milestone, then 14 days after the paid milestone. Paid Pro members receive credits only; billing dates do not change. Annual caps: 600 referral credits and 60 promotional Pro days. Anti-abuse review applies.</p></details></div><Link href="/account#referrals" className="pricing-button pricing-button-secondary">View your rewards →</Link></aside>
    <footer className="pricing-page-footer"><p>Secure payments through Stripe.</p><nav aria-label="Pricing policies"><Link href="/terms-of-service">Terms</Link><Link href="/privacy-policy">Privacy</Link><Link href="/refund-policy">Refunds</Link><Link href="/contact">Contact</Link></nav></footer>
  </main><SiteFooter/></>;
}
