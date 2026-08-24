import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import OrdersClient from "./orders-client";
export const metadata:Metadata={title:"Private orders | HSKKit",description:"Review your private one-time PackPurchase records.",robots:{index:false,follow:false}};
export default function OrdersPage(){return <><SiteHeader/><main className="mx-auto w-full max-w-[960px] px-5 py-12 sm:py-16"><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Private commerce</p><h1 className="mt-3 text-[32px] font-extrabold tracking-tight sm:text-[40px]">Orders</h1><p className="mt-4 max-w-2xl text-slate-600">Review one-time PackPurchase payment and access status. Subscription entitlements remain separate in Account Billing.</p><div className="mt-8"><OrdersClient/></div></main><SiteFooter/></>}
