import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";
import DashboardCore from "./dashboard-core";
import { accountOwnerId, requestIdentity } from "@/lib/account/identity";
import { hasEstablishedLearning } from "@/lib/learning/dashboard";
import { loadState } from "@/lib/learning/storage";

export const metadata: Metadata = {
  title: "Learning dashboard | HSKKit",
  description: "Continue today’s HSK learning from one clear next step.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const identity = await requestIdentity();
  if (!identity.account) redirect("/login?returnTo=%2Fdashboard");
  const loaded = await loadState(accountOwnerId(identity.account.userId));
  if (!hasEstablishedLearning(loaded.state)) redirect("/placement?onboarding=1");
  return <><SiteHeader /><DashboardCore /><SiteFooter /></>;
}
