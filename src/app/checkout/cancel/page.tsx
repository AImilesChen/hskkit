import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../../site-header";
import SiteFooter from "../../site-footer";
export const metadata:Metadata={title:"Stripe checkout cancelled | HSKKit",robots:{index:false,follow:false}};
export default function CheckoutCancel(){return <><SiteHeader/><main className="mx-auto max-w-2xl px-5 py-20 text-center"><div className="rounded-2xl border border-slate-200 bg-white p-8"><h1 className="text-3xl font-bold">Stripe checkout cancelled</h1><p className="mt-3 text-slate-600">No payment was completed and no PackPurchase was granted. Existing orders and subscription entitlements are unchanged.</p><Link href="/store" className="mt-6 inline-flex min-h-11 items-center rounded-lg border border-blue-600 px-6 font-bold text-blue-700">Return to Store</Link></div></main><SiteFooter/></>}
