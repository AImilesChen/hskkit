"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { completeCookieChoice, OPEN_COOKIE_SETTINGS, readCookiePreferences, saveCookiePreferences, type CookiePreferences } from "@/lib/cookie-consent";
import { stopClarity } from "@/lib/clarity";
import { setGoogleAnalyticsConsent } from "@/lib/google-analytics";
import { GoogleAnalyticsConsent } from "./google-analytics-consent";
import { ClarityConsent } from "./clarity-consent";

const button = "min-h-11 rounded-lg border px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
const secondary = `${button} border-slate-300 bg-white text-slate-800 hover:bg-slate-50`;
const primary = `${button} border-blue-600 bg-blue-600 text-white hover:bg-blue-700`;

export function CookieSettingsButton({className="text-primary underline"}:{className?:string}) {
  return <button type="button" data-cookie-settings className={className} onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS))}>Cookie settings</button>;
}

export function CookieConsent() {
  const pathname = usePathname();
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [managing, setManaging] = useState(false);
  const [draft, setDraft] = useState({ga4:false,clarity:false});
  const manager = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const read = () => {
      try { setPreferences(readCookiePreferences(localStorage)); }
      catch { setPreferences({ga4:null,clarity:null}); }
    };
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, []);

  function openManager() {
    previousFocus.current = document.activeElement as HTMLElement;
    setDraft({ga4:preferences?.ga4 === true,clarity:preferences?.clarity === true});
    setManaging(true);
  }
  useEffect(() => {
    window.addEventListener(OPEN_COOKIE_SETTINGS, openManager);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS, openManager);
  }, [preferences]);

  useEffect(() => {
    if (!managing) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    manager.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setManaging(false); }
      if (event.key !== "Tab") return;
      const items = manager.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),a[href]');
      if (!items?.length) return;
      const first = items[0], last = items[items.length-1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      const target = previousFocus.current?.isConnected ? previousFocus.current : document.querySelector<HTMLElement>("[data-cookie-settings]");
      target?.focus();
    };
  }, [managing]);

  function save(next: {ga4:boolean;clarity:boolean}) {
    // Revoke immediately without reloading or interrupting a learning session.
    if (!next.ga4) setGoogleAnalyticsConsent(false);
    if (!next.clarity) stopClarity();
    try { saveCookiePreferences(localStorage, next); } catch { /* still applies to this document */ }
    setPreferences(next);
    setManaging(false);
  }
  const showBanner = preferences && !completeCookieChoice(preferences) && !managing && !/^\/(admin|account|login|checkout|api)(\/|$)/.test(pathname);
  return <>
    {preferences && <GoogleAnalyticsConsent allowed={preferences.ga4 === true}/>}
    {preferences && <ClarityConsent allowed={preferences.clarity === true}/>}
    {showBanner && <aside role="dialog" aria-labelledby="cookie-banner-title" className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
      <h2 id="cookie-banner-title" className="text-lg font-semibold text-slate-900">Cookie choices</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">We use optional cookies to understand visits and improve your experience. You choose what to allow. <a href="/privacy-policy" className="text-blue-600 underline">Privacy policy</a></p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button type="button" className={primary} onClick={() => save({ga4:true,clarity:true})}>Accept all</button>
        <button type="button" className={secondary} onClick={() => save({ga4:false,clarity:false})}>Reject optional</button>
        <button type="button" className={secondary} onClick={openManager}>Manage preferences</button>
      </div>
    </aside>}
    {managing && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 p-4">
      <div ref={manager} role="dialog" aria-modal="true" aria-labelledby="cookie-manager-title" aria-describedby="cookie-manager-description" className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6" data-clarity-mask="true">
        <div className="flex items-start justify-between gap-4"><h2 id="cookie-manager-title" className="text-xl font-semibold text-slate-900">Cookie preferences</h2><button type="button" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl text-slate-600 hover:bg-slate-100" aria-label="Close cookie preferences" onClick={() => setManaging(false)}>×</button></div>
        <p id="cookie-manager-description" className="mt-2 text-sm leading-6 text-slate-600">Choose which optional services can run. Existing choices are preserved. Closing this window does not save changes.</p>
        <fieldset className="mt-4 space-y-3"><legend className="sr-only">Cookie categories</legend>
          <label className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><input type="checkbox" checked disabled className="mt-1 h-4 w-4"/><span><strong className="block text-sm text-slate-900">Necessary · always on</strong><span className="text-sm leading-6 text-slate-600">Required for secure sign-in, learning progress and your saved choices.</span></span></label>
          <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4"><input type="checkbox" checked={draft.ga4} onChange={e => setDraft({...draft,ga4:e.target.checked})} className="mt-1 h-4 w-4 accent-blue-600"/><span><strong className="block text-sm text-slate-900">Google Analytics 4</strong><span className="text-sm leading-6 text-slate-600">Measures visits, page views and usage. No advertising storage is enabled.</span></span></label>
          <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4"><input type="checkbox" checked={draft.clarity} onChange={e => setDraft({...draft,clarity:e.target.checked})} className="mt-1 h-4 w-4 accent-blue-600"/><span><strong className="block text-sm text-slate-900">Microsoft Clarity recordings</strong><span className="text-sm leading-6 text-slate-600">Records clicks, scrolling and interactions on eligible public pages. Sensitive inputs are masked; private account and admin pages are excluded.</span></span></label>
        </fieldset>
        <a href="/privacy-policy" className="mt-4 inline-block text-sm text-blue-600 underline">Read our privacy policy</a>
        <div className="mt-4 grid gap-2 sm:grid-cols-3"><button type="button" className={primary} onClick={() => save(draft)}>Save preferences</button><button type="button" className={secondary} onClick={() => save({ga4:false,clarity:false})}>Reject optional</button><button type="button" className={secondary} onClick={() => save({ga4:true,clarity:true})}>Accept all</button></div>
      </div>
    </div>}
  </>;
}
