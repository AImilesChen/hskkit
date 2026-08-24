import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import SubscriptionCheckout from "./subscription-checkout";
import { PUBLIC_ACCOUNT_SCOPE, PUBLIC_FORMAL_CONTENT_SCOPE } from "@/lib/public-copy";

export const metadata:Metadata={title:"Pricing | HSKKit",description:"HSKKit Free and Pro Monthly or Yearly subscription plans.",alternates:{canonical:"/pricing"}};
const billingBenefits=["One private account-based Pro entitlement","Automatic renewal and billing status in Account","Cancel anytime; access continues through the paid period","Seven-day refund review when AI usage is 10 credits or less"];

export default function PricingPage(){return <><SiteHeader/><main className="mx-auto w-full max-w-[1120px] px-5 py-12 sm:py-16">
  <div className="text-center"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Stripe Test mode</p><h1 className="mt-3 text-[32px] font-extrabold tracking-tight sm:text-[40px]">Free core or one clear Pro plan.</h1><p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">Monthly and yearly billing grant the same Pro entitlement. Checkout is currently a controlled Stripe Test flow—no live card charge is enabled.</p></div>
  <div className="mt-10 grid gap-5 lg:grid-cols-3">
    <section className="rounded-2xl border border-slate-200 bg-white p-7"><p className="font-bold text-blue-700">FREE</p><h2 className="mt-3 text-3xl font-bold">US$0</h2><p className="mt-2 text-sm text-slate-600">No card required.</p><ul className="mt-6 grid gap-3 text-slate-700"><li>✓ Published HSK 3.0 catalog</li><li>✓ Placement and Today path</li><li>✓ Practice, mistakes and review</li><li>✓ Private account tools</li></ul><Link href="/today" className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-blue-600 px-5 font-bold text-blue-700">Continue free</Link></section>
    <section className="rounded-2xl border-2 border-blue-600 bg-white p-7"><p className="font-bold text-blue-700">PRO MONTHLY</p><h2 className="mt-3 text-3xl font-bold">US$5.99 <span className="text-base font-medium text-slate-600">/ month</span></h2><p className="mt-2 text-sm text-slate-600">Renews monthly until cancelled.</p><ul className="mt-6 grid gap-3 text-slate-700">{billingBenefits.map(item=><li key={item}>✓ {item}</li>)}</ul><SubscriptionCheckout planId="pro_monthly" label="Choose Pro Monthly"/></section>
    <section className="rounded-2xl border-2 border-emerald-600 bg-white p-7"><p className="font-bold text-emerald-700">PRO YEARLY · SAVE 32%</p><h2 className="mt-3 text-3xl font-bold">US$49 <span className="text-base font-medium text-slate-600">/ year</span></h2><p className="mt-2 text-sm text-slate-600">Same Pro entitlement; renews yearly.</p><ul className="mt-6 grid gap-3 text-slate-700">{billingBenefits.map(item=><li key={item}>✓ {item}</li>)}</ul><SubscriptionCheckout planId="pro_yearly" label="Choose Pro Yearly"/></section>
  </div>
  <section className="mt-8 rounded-2xl border border-slate-300 bg-slate-50 p-6"><h2 className="text-xl font-bold">Advanced Study PDF Pack · US$9.99 one-time</h2><p className="mt-2 text-slate-600">A separate PackPurchase for one selected HSK 3.0 level. It is not included in Pro; Stripe Test checkout is available without a live card charge.</p><Link href="/store" className="mt-4 inline-flex min-h-11 items-center font-bold text-blue-700">Open Store →</Link></section>
  <div className="mx-auto mt-8 max-w-3xl space-y-3 rounded-xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600"><p>{PUBLIC_FORMAL_CONTENT_SCOPE}</p><p>{PUBLIC_ACCOUNT_SCOPE}</p><p>Subscriptions renew automatically. Cancellation takes effect at the current period end. Approved full refunds revoke Pro access through the signed Stripe webhook.</p></div>
</main><SiteFooter/></>}
