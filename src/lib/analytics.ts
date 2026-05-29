// HSKKit Analytics — Plausible-first tracking scaffold
// Set NEXT_PUBLIC_PLAUSIBLE_DOMAIN in env vars to override the default domain.

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
export const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || "";
export const AHREFS_ID = process.env.NEXT_PUBLIC_AHREFS_ID || "";

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || "hskkit.com";

function getPlausible() {
  if (typeof window === "undefined") return null;
  return (window as any).plausible || null;
}

/**
 * Track a custom event via Plausible (primary) with GA4 fallback.
 * Safe to call before analytics loads.
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined") return;

  // Plausible (primary)
  const plausible = getPlausible();
  if (plausible) {
    plausible(eventName, { props: params });
  }

  // Google Analytics 4 (fallback)
  const gtag = (window as any).gtag;
  if (gtag) {
    gtag("event", eventName, params);
  }

  // Fallback: console log in dev
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[Analytics]", eventName, params);
  }
}

/**
 * Track a page view manually (for SPA navigation if needed).
 */
export function trackPageView(url: string) {
  if (typeof window === "undefined") return;

  // Plausible pageview
  const plausible = getPlausible();
  if (plausible) {
    plausible("pageview", { u: url });
  }

  // GA4 fallback
  const gtag = (window as any).gtag;
  if (gtag && GA_ID) {
    gtag("config", GA_ID, { page_path: url });
  }
}
