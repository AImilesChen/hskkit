import type { Metadata } from "next";
import AccountClient from "./account-client";
import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";
import "./account-page.css";

export const metadata: Metadata = {
  title: "Your HSKKit Account | HSKKit",
  description: "Manage your HSKKit plan, AI credits, connected devices and private account data.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <><SiteHeader/><main className="learn account-page account-overview-page">
    <header className="account-page-header">
      <h1>Account</h1>
      <p>Manage your plan, credits and account settings.</p>
    </header>
    <AccountClient />
  </main><SiteFooter/></>;
}
