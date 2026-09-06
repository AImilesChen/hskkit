import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";
import DashboardCore from "./dashboard-core";
import { accountOwnerId, requestIdentity } from "@/lib/account/identity";
import { hasEstablishedLearning, loadDashboardServerData } from "@/lib/learning/dashboard";
import { loadState } from "@/lib/learning/storage";

export const metadata: Metadata = {
  title: "Learning dashboard | HSKKit",
  description: "Continue today’s HSK learning from one clear next step.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const result = await loadDashboardServerData(async () => {
    const identity = await requestIdentity();
    const account = identity.account;
    if (!account) return { account: null, state: null };
    const loaded = await loadState(accountOwnerId(account.userId));
    return { account, state: loaded.state };
  });
  if (result.status === "temporarily_unavailable") {
    return <><SiteHeader /><main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-12 sm:py-16"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-6" role="alert"><h1 className="text-2xl font-black text-slate-950">Dashboard temporarily unavailable</h1><p className="mt-2 text-slate-700">Your learning data is safe. The service is busy right now—please try again.</p><a className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-6 font-bold text-white" href="/dashboard">Try again</a></div></main><SiteFooter /></>;
  }
  if (!result.data.account) redirect("/login?returnTo=%2Fdashboard");
  if (!hasEstablishedLearning(result.data.state!)) redirect("/placement?onboarding=1");
  return <><SiteHeader /><DashboardCore /><SiteFooter /></>;
}
