import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../../site-header";
import SiteFooter from "../../site-footer";
import CheckoutSuccessClient from "./checkout-success-client";
export const metadata:Metadata={title:"Stripe checkout result | HSKKit",robots:{index:false,follow:false}};
export default async function CheckoutSuccess({searchParams}:{searchParams:Promise<{session_id?:string}>}){const sessionId=(await searchParams).session_id??"";return <><SiteHeader/><main className="mx-auto max-w-2xl px-5 py-20 text-center"><div className="rounded-2xl border border-slate-200 bg-white p-8"><h1 className="text-3xl font-bold">Stripe checkout returned</h1>{sessionId?<CheckoutSuccessClient sessionId={sessionId}/>:<p className="mt-4 text-red-700">Missing checkout session. No purchase can be confirmed from this page.</p>}<Link href="/orders" className="mt-6 inline-flex min-h-11 items-center px-3 font-bold text-blue-700">Open orders</Link></div></main><SiteFooter/></>}
