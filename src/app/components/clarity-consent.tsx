"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ANALYTICS_CHOICE_EVENT, CLARITY_CONSENT_KEY, GOOGLE_ANALYTICS_CONSENT_KEY, canRecordPublicPage, startClarity, stopClarity } from "@/lib/clarity";

export function ClarityConsent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [choice, setChoice] = useState<string | null>("loading");
  const [googleChosen, setGoogleChosen] = useState(false);
  const [eligible, setEligible] = useState(false);
  useEffect(() => {
    const read = () => {
      try {
        const saved = localStorage.getItem(CLARITY_CONSENT_KEY);
        setChoice(saved === "accepted" || saved === "rejected" ? saved : null);
        setGoogleChosen(["accepted", "rejected"].includes(localStorage.getItem(GOOGLE_ANALYTICS_CONSENT_KEY) || ""));
      } catch { setChoice(null); setGoogleChosen(true); }
    };
    read();
    window.addEventListener(ANALYTICS_CHOICE_EVENT, read);
    window.addEventListener("storage", read);
    return () => { window.removeEventListener(ANALYTICS_CHOICE_EVENT, read); window.removeEventListener("storage", read); };
  }, []);

  useLayoutEffect(() => {
    const apply = () => {
      const allowed = canRecordPublicPage(location.href);
      setEligible(allowed);
      if (allowed && choice === "accepted") startClarity(); else stopClarity();
    };
    apply();
    window.addEventListener("popstate", apply);
    window.addEventListener("hashchange", apply);
    return () => { stopClarity(); window.removeEventListener("popstate", apply); window.removeEventListener("hashchange", apply); };
  }, [pathname, search, choice]);

  function choose(next: "accepted" | "rejected") {
    try { localStorage.setItem(CLARITY_CONSENT_KEY, next); } catch { /* current-page choice only */ }
    setChoice(next);
  }

  if (!eligible || choice !== null || !googleChosen) return null;
  return <aside role="dialog" aria-label="Clarity session recording choice" className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
    <p className="font-semibold text-slate-900">Help us improve how HSKKit works?</p>
    <p className="mt-2 text-sm text-slate-600">With your permission, Microsoft Clarity records clicks, scrolling and page interactions on public study pages. Sensitive inputs are masked. This is optional and separate from Google Analytics. Read our <a className="text-blue-600 underline" href="/privacy-policy">privacy policy</a>.</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" onClick={() => choose("accepted")} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Allow session recordings</button>
      <button type="button" onClick={() => choose("rejected")} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800">No thanks</button>
    </div>
  </aside>;
}

export function ClarityPreferencesButton() {
  return <button type="button" className="text-primary underline" onClick={() => {
    stopClarity();
    try { localStorage.removeItem(CLARITY_CONSENT_KEY); } catch { /* reload still stops this document */ }
    location.reload();
  }}>Change session recording choice</button>;
}
