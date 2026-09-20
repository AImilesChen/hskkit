import type { Metadata } from "next";
import AccountClient from "./account-client";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";

export const metadata: Metadata = {
  title: "Your HSKKit Account | HSKKit",
  description: "Continue learning, understand your access, and manage your private HSKKit account.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AccountPage() {
  return <><SiteHeader/><main className="learn account-page">
    <header className="account-page-header">
      <p className="eyebrow">Your learning home</p>
      <h1>Your HSKKit account</h1>
      <p>Continue learning, understand your access, and manage your account. Google sign-in keeps it private across devices.</p>
    </header>
    <AccountClient />
  </main><SiteFooter/></>;
}
