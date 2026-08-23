import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../site-header";
import SiteFooter from "../site-footer";

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

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; logout?: string; deleted?: string }> }) {
  const params = await searchParams;
  const message = params.error ? messages[params.error] ?? messages.google_failed : undefined;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-[70vh] max-w-xl px-5 py-14 sm:py-20">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">HSKKit account</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Continue your learning anywhere</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">Guests can use Placement, Today, and Planner. Sign in to save progress privately and sync it across devices.</p>
        {message ? <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800" role="alert">{message}</p> : null}
        {params.logout === "success" ? <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">You are signed out. Private account data is no longer available in this browser.</p> : null}
        {params.deleted === "success" ? <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">Account deletion completed. Sessions, Sync Keys, and private exports were revoked.</p> : null}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <a className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-base font-bold text-white hover:bg-blue-700" href="/api/v1/auth/google/start">
            {params.error ? "Try Google sign-in again" : "Continue with Google"}
          </a>
          <p className="mt-4 text-sm leading-6 text-slate-600">After sign-in, HSKKit previews eligible guest progress. Nothing is merged until you confirm.</p>
          <div className="my-6 h-px bg-slate-200" />
          <Link className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 px-4 font-bold text-slate-800 hover:bg-slate-50" href="/account">Use a Sync Key for recovery</Link>
          <p className="mt-3 text-xs leading-5 text-slate-500">A Sync Key is a recovery and device-connection method, not the primary sign-in.</p>
        </div>
        <Link className="mt-6 inline-flex min-h-11 items-center font-bold text-blue-700" href="/today">Continue as a guest</Link>
      </main>
      <SiteFooter />
    </>
  );
}
