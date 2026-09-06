import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import SubscriptionCheckout from "./subscription-checkout";
import { PUBLIC_ACCOUNT_SCOPE, PUBLIC_FORMAL_CONTENT_SCOPE } from "@/lib/public-copy";

export const metadata: Metadata = { title: "Pricing | HSKKit", description: "Compare HSKKit Free with Pro Monthly and Pro Yearly.", alternates: { canonical: "/pricing" } };

const proBenefits = [
  "Unlimited learning and reviews (anti-abuse safeguards still apply)",
  "Focused Review prioritizes unresolved mistakes and due weak memories",
  "500 AI credits each month for grounded explanations and plan tips",
  "10 AI requests per hour · 1 concurrent AI request",
  "Long-term history, up to 10,000 entries",
  "Sync up to 3 active devices",
];

const freeBenefits = [
  "Published HSK 3.0 catalog, Placement and Today path",
  "10 new items daily",
  "20 successful SRS ratings daily",
  "Practice, mistakes and standard review",
  "Recent 7 days, up to 100 history entries",
  "After the trial: no Focused Review or monthly AI credits",
  "Sync 1 active device",
];

export default function PricingPage() {
  return <><SiteHeader /><main className="mx-auto w-full max-w-[1120px] px-5 py-10 sm:py-16">
    <header className="mx-auto max-w-3xl rounded-[28px] border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-6 py-8 text-center sm:px-10 sm:py-11">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">New account welcome offer</p>
      <h1 className="mt-3 text-[34px] font-extrabold leading-tight tracking-tight text-slate-950 sm:text-[48px]">Try Pro free for 7 days</h1>
      <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-700">New verified accounts receive 7 days of Pro and 20 AI credits. No card required. It returns to Free automatically.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/login?returnTo=%2Faccount" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-5 font-bold text-white">Start my free Pro trial</Link><Link href="#plans" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 font-bold text-slate-800">Compare plans</Link></div>
      <p className="mt-4 text-sm font-semibold text-amber-800">Secure checkout is powered by Stripe. Pro access is granted only after verified payment lifecycle events.</p>
    </header>

    <section id="plans" className="mt-8 grid scroll-mt-24 gap-5 lg:grid-cols-3" aria-label="Plans">
      <article className="flex h-full flex-col rounded-[24px] border border-slate-200 bg-white p-6 sm:p-7">
        <p className="font-bold text-slate-600">FREE</p><h2 className="mt-2 text-4xl font-extrabold text-slate-950">US$0</h2><p className="mt-2 text-sm text-slate-600">No card required.</p>
        <p className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold leading-6 text-blue-900">New account bonus: 7-day Pro trial + 20 AI credits</p>
        <ul className="mt-6 grid gap-3 text-sm leading-6 text-slate-700">{freeBenefits.map(item => <li key={item} className="flex gap-2"><span aria-hidden="true" className="font-bold text-emerald-600">✓</span><span>{item}</span></li>)}</ul>
        <Link href="/today" className="mt-auto inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-blue-600 px-5 font-bold text-blue-700">Continue Free</Link>
      </article>
      <article className="relative flex h-full flex-col rounded-[24px] border-2 border-blue-600 bg-slate-950 p-6 text-white shadow-[0_18px_50px_rgba(37,99,235,0.18)] sm:p-7">
        <p className="font-bold text-blue-300">PRO MONTHLY</p><h2 className="mt-2 text-4xl font-extrabold text-white">US$5.99 <span className="text-base font-medium text-slate-300">/ month</span></h2><p className="mt-2 text-sm text-slate-300">Same Pro entitlement. Renews monthly.</p>
        <ul className="mt-6 grid gap-3 text-sm leading-6 text-slate-100">{proBenefits.map(item => <li key={item} className="flex gap-2"><span aria-hidden="true" className="font-bold text-blue-300">✓</span><span>{item}</span></li>)}</ul>
        <SubscriptionCheckout planId="pro_monthly" label="Choose Pro Monthly" />
      </article>
      <article className="relative flex h-full flex-col rounded-[24px] border-2 border-emerald-600 bg-white p-6 shadow-[0_18px_50px_rgba(5,150,105,0.12)] sm:p-7">
        <p className="font-bold text-emerald-700">PRO YEARLY · SAVE 32%</p><h2 className="mt-2 text-4xl font-extrabold text-slate-950">US$49 <span className="text-base font-medium text-slate-600">/ year</span></h2><p className="mt-2 text-sm text-slate-600">Same Pro entitlement. Renews yearly.</p>
        <ul className="mt-6 grid gap-3 text-sm leading-6 text-slate-700">{proBenefits.map(item => <li key={item} className="flex gap-2"><span aria-hidden="true" className="font-bold text-emerald-600">✓</span><span>{item}</span></li>)}</ul>
        <SubscriptionCheckout planId="pro_yearly" label="Choose Pro Yearly" />
      </article>
    </section>

    <section className="mt-6 rounded-[24px] border border-emerald-300 bg-emerald-50 px-5 py-5 shadow-[0_12px_35px_rgba(5,150,105,0.10)] sm:px-7" aria-labelledby="referral-heading">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">Referral rewards</p><h2 id="referral-heading" className="mt-1 text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">Invite friends, earn up to 200 AI credits</h2><p className="mt-2 text-sm leading-6 text-slate-700">Earn 50 AI credits when a verified friend completes 30 eligible learning actions across 3 different days, then another 150 AI credits after their first Pro payment clears the 7-day refund-risk window.</p><p className="mt-1 text-xs leading-5 text-slate-600">Free members also receive 3 days of Pro at the learning milestone, then 14 days of Pro after the paid milestone. Paid Pro members receive credits only; Stripe billing dates never change. Annual caps: 600 referral credits and 60 promotional Pro days; anti-abuse review applies.</p></div>
        <Link href="/login?returnTo=%2Faccount" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-emerald-700 px-5 font-bold text-white">Sign in to get your referral link</Link>
      </div>
    </section>

    <section id="ai-value" className="mt-12 scroll-mt-24 overflow-hidden rounded-[28px] border border-slate-200 bg-white" aria-labelledby="ai-value-heading">
      <div className="bg-blue-50 px-6 py-7 sm:px-9"><p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">500 monthly AI credits</p><h2 id="ai-value-heading" className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Credits map to real study actions—not a vague chatbot.</h2><p className="mt-3 max-w-3xl leading-7 text-slate-700">1 credit per successful AI explanation. 5 credits per successful study-plan suggestion. That is about 500 explanations or 100 plan suggestions each month; failed AI responses never use credits.</p></div>
      <div className="grid gap-px bg-slate-200 lg:grid-cols-2">
        <article className="bg-white p-6 sm:p-8"><p className="text-sm font-bold text-blue-700">COMPLETED PRACTICE AND REVIEW ANSWERS</p><h3 className="mt-2 text-xl font-bold text-slate-950">Why did this answer miss the point?</h3><div className="mt-5 grid gap-4"><div className="rounded-xl bg-slate-100 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Before AI</p><p className="mt-2 text-sm text-slate-700">Your answer: 因为天气很好。<br />Correct answer: 因为他错过了公交车。</p></div><div className="rounded-xl border border-blue-200 bg-blue-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-blue-700">After AI explanation</p><p className="mt-2 text-sm leading-6 text-blue-950">The question asks why he arrived late. “错过了公交车” directly explains the delay; good weather does not establish a cause. Next time, match the answer to the question word 为什么.</p></div></div></article>
        <article className="bg-white p-6 sm:p-8"><p className="text-sm font-bold text-emerald-700">SAVED WEEKLY PLAN</p><h3 className="mt-2 text-xl font-bold text-slate-950">Turn a schedule into a usable study plan.</h3><div className="mt-5 grid gap-4"><div className="rounded-xl bg-slate-100 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Before AI plan tips</p><p className="mt-2 text-sm text-slate-700">Mon–Fri: 30 minutes each day. Goal: HSK 4.</p></div><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">After AI plan tips</p><p className="mt-2 text-sm leading-6 text-emerald-950">Use 20 minutes for the weakest skill and 10 minutes for due review. Add a Friday mistake check and reduce new items after two low-accuracy days.</p></div></div></article>
      </div>
      <p className="border-t border-slate-200 px-6 py-5 text-sm leading-6 text-slate-600 sm:px-9">Current AI coverage is intentionally narrow: grounded explanations after completed supported practice or review feedback, plus suggestions after saving a weekly plan. Pro does not add AI to Dictionary, writing, speaking, or an open-ended chatbot.</p>
    </section>

    <section className="mt-10 grid gap-5 md:grid-cols-3" aria-label="Pro workflow benefits">
      <div className="border-l-4 border-rose-500 pl-5"><p className="text-sm font-bold text-rose-700">WHEN A MISTAKE STAYS OPEN</p><h2 className="mt-2 text-xl font-bold text-slate-950">Review it first.</h2><p className="mt-2 leading-7 text-slate-600">Focused Review moves unresolved mistakes and due weak memories ahead of routine cards, and tells you why each card was selected.</p></div>
      <div className="border-l-4 border-blue-600 pl-5"><p className="text-sm font-bold text-blue-700">WHEN YOU NEED THE WHY</p><h2 className="mt-2 text-xl font-bold text-slate-950">Ask from real feedback.</h2><p className="mt-2 leading-7 text-slate-600">The AI action appears after a supported answer is checked, so the prompt is grounded in the exercise, correct answer and your result.</p></div>
      <div className="border-l-4 border-emerald-600 pl-5"><p className="text-sm font-bold text-emerald-700">WHEN YOUR WEEK CHANGES</p><h2 className="mt-2 text-xl font-bold text-slate-950">Save, then refine.</h2><p className="mt-2 leading-7 text-slate-600">Planner suggestions use the weekly plan you saved; they do not create unrelated tasks or modify your plan without confirmation.</p></div>
    </section>

    <section className="mt-10 rounded-[24px] border border-slate-300 bg-slate-50 p-6 sm:p-8"><p className="text-sm font-bold text-slate-700">ONE-TIME STORE PRODUCTS</p><h2 className="mt-2 text-2xl font-bold text-slate-950">Complete vocabulary PDFs and practical packs · From US$3.99</h2><p className="mt-2 max-w-3xl leading-7 text-slate-600">Vocabulary PDFs, Bundles and learner or teacher resources are one-time purchases with 3 successful downloads and a 14-day private access window. Each product page lists exact contents and samples. Does not include one-time Store products in Pro.</p><Link href="/store" className="mt-4 inline-flex min-h-11 items-center font-bold text-blue-700">Open Store →</Link></section>
    <div className="mx-auto mt-8 max-w-3xl space-y-3 text-sm leading-6 text-slate-600"><p>{PUBLIC_FORMAL_CONTENT_SCOPE}</p><p>{PUBLIC_ACCOUNT_SCOPE}</p><p>Subscriptions renew automatically. Cancel anytime; access continues through the paid period. Seven-day refund review is available when AI usage is 10 credits or less. Store products are not included in Pro.</p></div>
  </main><SiteFooter /></>;
}
