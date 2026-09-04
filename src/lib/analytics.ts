// HSKKit Analytics — Plausible-first tracking scaffold
// Set NEXT_PUBLIC_PLAUSIBLE_DOMAIN in env vars to override the default domain.

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
export const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || "";
export const AHREFS_ID = process.env.NEXT_PUBLIC_AHREFS_ID || "";

type AnalyticsWindow = Window & {
  plausible?: (eventName: string, options?: { props?: Record<string, string | number | boolean>; u?: string }) => void;
  gtag?: (command: string, eventName: string, params?: Record<string, string | number | boolean>) => void;
};

function getPlausible() {
  if (typeof window === "undefined") return null;
  return (window as AnalyticsWindow).plausible || null;
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
  const gtag = (window as AnalyticsWindow).gtag;
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
  const gtag = (window as AnalyticsWindow).gtag;
  if (gtag && GA_ID) {
    gtag("config", GA_ID, { page_path: url });
  }
}

/**
 * Named event constants for HSKKit P0 Full tracking.
 */
export const AnalyticsEvents = {
  // Core events
  page_view: "page_view",
  level_test_start: "level_test_start",
  level_test_complete: "level_test_complete",
  practice_test_complete: "practice_test_complete",
  // Worksheet events (P0 Full)
  worksheet_generate: "worksheet_generate",
  worksheet_print: "worksheet_print",
  worksheet_reset: "worksheet_reset",
  // Reading events (P0 Full)
  reading_start: "reading_start",
  reading_story_view: "reading_story_view",
  reading_vocab_tap: "reading_vocab_tap",
  reading_story_complete: "reading_story_complete",
  // Flashcard events
  flashcard_flip: "flashcard_flip",
  // Tool card clicks
  tool_card_click: "tool_card_click",
  // Public blog learning actions
  blog_learning_action: "blog_learning_action",
} as const;
