import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";
import GoogleSignInLink from "./google-sign-in-link";
import { SESSION_COOKIE, requestIdentity } from "@/lib/account/identity";
import { canReuseGoogleSession, googleSignInHref, signInReturnTo } from "@/lib/account/sign-in";

export const metadata: Metadata = {
  title: "Sign in | HSKKit",
  description: "Sign in to HSKKit with Google to save learning progress and continue across devices.",
  robots: { index: false, follow: true },
};

const messages: Record<string, string> = {
  google_cancelled: "Google sign-in was cancelled. Your guest progress is unchanged.",
  invalid_callback: "That sign-in link expired or could not be verified.",
  google_failed: "Google sign-in did not finish. Please try again.",
  oauth_not_configured: "Google sign-in is temporarily unavailable. Please try again later.",
  account_deleted: "This HSKKit account was deleted and cannot be reopened with the old identity.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; logout?: string; deleted?: string; returnTo?: string; ref?: string; selectAccount?: string }> }) {
  const params = await searchParams;
  const returnTo = signInReturnTo(params.returnTo);
  const selectAccount = params.selectAccount === '1';
  if (!params.error && !params.logout && !params.deleted && !selectAccount && (await cookies()).get(SESSION_COOKIE)?.value) {
    const identity = await requestIdentity().catch(() => undefined);
    if (canReuseGoogleSession(identity, selectAccount)) redirect(returnTo);
  }
  const referralSuffix = params.ref ? `&ref=${encodeURIComponent(params.ref)}` : "";
  const message = params.error ? messages[params.error] ?? messages.google_failed : undefined;
  const guestHref = params.returnTo === "/start" ? "/placement?onboarding=1" : "/today";
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-[70vh] max-w-xl px-5 py-14 sm:py-20">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">HSKKit account</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Continue your learning anywhere</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">Sign in with a verified Google account to save progress and start a 7-day Pro trial with 20 AI credits. No card required and no automatic charge.</p>
        {message ? <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800" role="alert">{message}</p> : null}
        {params.logout === "success" ? <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">You are signed out. Private account data is no longer available in this browser.</p> : null}
        {params.deleted === "success" ? <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">Account deletion completed. Sessions, Sync Keys, and private exports were revoked.</p> : null}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <GoogleSignInLink href={`${googleSignInHref(returnTo, selectAccount)}${referralSuffix}`}>
            {params.error ? "Try Google sign-in again" : "Continue with Google"}
          </GoogleSignInLink>
          <p className="mt-4 text-sm leading-6 text-slate-600">Your guest progress stays available. You choose whether to review and merge it after sign-in.</p>
          {!selectAccount && <GoogleSignInLink className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 underline underline-offset-4" href={`${googleSignInHref(returnTo, true)}${referralSuffix}`}>Use a different Google account</GoogleSignInLink>}
        </div>
        <Link className="mt-6 inline-flex min-h-11 items-center font-bold text-blue-700" href={guestHref}>Continue as a guest</Link>
      </main>
      <SiteFooter />
    </>
  );
}
