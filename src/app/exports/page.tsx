import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import ExportsClient from "./exports-client";
export const metadata:Metadata={title:"Private exports | HSKKit",description:"Create and download private HSKKit account data and authorized Test-mode study-pack files.",robots:{index:false,follow:false}};
export default function ExportsPage(){return <><SiteHeader/><main className="mx-auto w-full max-w-[960px] px-5 py-12 sm:py-16"><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Private files</p><h1 className="mt-3 text-[32px] font-extrabold tracking-tight sm:text-[40px]">Exports & downloads</h1><p className="mt-4 max-w-2xl text-slate-600">Create private files, follow generation status and use short-lived owner-only download links.</p><div className="mt-8"><ExportsClient/></div></main><SiteFooter/></>}
