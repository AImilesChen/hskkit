"use client";

import { useEffect, useState } from "react";

const MEASUREMENT_ID = "G-W19896DKRJ";
const CONSENT_KEY = "hskkit-google-analytics-consent";

type Choice = "accepted" | "rejected";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[][];
  gtag?: (...args: unknown[]) => void;
};

function enableGoogleAnalytics() {
  if (document.querySelector("script[data-hskkit-ga4]")) return;

  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
  analyticsWindow.gtag = (...args: unknown[]) => {
    analyticsWindow.dataLayer?.push(args);
  };
  analyticsWindow.gtag("js", new Date());
  analyticsWindow.gtag("config", MEASUREMENT_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  script.setAttribute("data-hskkit-ga4", "");
  document.head.appendChild(script);
}

export function GoogleAnalyticsConsent() {
  const [choice, setChoice] = useState<Choice | null | "loading">("loading");

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(CONSENT_KEY);
    } catch {
      // Storage may be unavailable in a private browsing context.
    }

    if (saved === "accepted") {
      enableGoogleAnalytics();
      setChoice("accepted");
    } else {
      setChoice(saved === "rejected" ? "rejected" : null);
    }
  }, []);

  function choose(nextChoice: Choice) {
    try {
      window.localStorage.setItem(CONSENT_KEY, nextChoice);
    } catch {
      // The choice still applies to the current page.
    }
    setChoice(nextChoice);
    if (nextChoice === "accepted") enableGoogleAnalytics();
  }

  if (choice !== null) return null;

  return (
    <aside
      role="dialog"
      aria-label="Google Analytics choice"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
    >
      <p className="font-semibold text-slate-900">Help us improve HSKKit?</p>
      <p className="mt-2 text-sm text-slate-600">
        With your permission, we use Google Analytics to understand visits and improve the site.
        Our existing Plausible statistics remain active. Read our{" "}
        <a className="text-blue-600 underline" href="/privacy-policy">privacy policy</a>.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={() => choose("accepted")} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          Allow Google Analytics
        </button>
        <button type="button" onClick={() => choose("rejected")} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800">
          No thanks
        </button>
      </div>
    </aside>
  );
}

export function AnalyticsPreferencesButton() {
  return (
    <button
      type="button"
      className="text-primary underline"
      onClick={() => {
        try {
          window.localStorage.removeItem(CONSENT_KEY);
        } catch {
          // The banner will still reappear after a reload when storage is unavailable.
        }
        window.location.reload();
      }}
    >
      Change Google Analytics choice
    </button>
  );
}
