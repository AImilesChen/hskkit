import type { Metadata } from "next";
import AccountClient from "./account-client";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";

export const metadata: Metadata = {
  title: "Your HSKKit Account | HSKKit",
  description: "Manage your HSKKit plan, AI credits, connected devices and private account data.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <><SiteHeader/><main className="learn account-page">
    <header className="account-page-header">
      <p className="eyebrow">Account & access</p>
      <h1>Your HSKKit account</h1>
      <p>Manage your plan, AI credits, devices and data in one place. Google sign-in keeps your account private across devices.</p>
    </header>
    <AccountClient />
  </main><SiteFooter/></>;
}
