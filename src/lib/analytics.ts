// HSKKit Analytics — minimal tracking scaffold
// Does NOT include real measurement IDs. Set via env vars.

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
export const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || "";

/**
 * Track a custom event. Safe to call before analytics loads.
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined") return;

  // Google Analytics 4
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

  const gtag = (window as any).gtag;
  if (gtag && GA_ID) {
    gtag("config", GA_ID, { page_path: url });
  }
}
