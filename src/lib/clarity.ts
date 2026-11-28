// Public project ID verified in the existing Clarity project (hsk / HSKKit.com).
export const CLARITY_PROJECT_ID = "ww260eyvq1";
export const CLARITY_CONSENT_KEY = "hskkit-clarity-consent";
export const GOOGLE_ANALYTICS_CONSENT_KEY = "hskkit-google-analytics-consent";
export const ANALYTICS_CHOICE_EVENT = "hskkit-analytics-choice";

export function canRecordPublicPage(href: string) {
  let url: URL;
  try { url = new URL(href, "https://hskkit.com"); } catch { return false; }
  // Keep authentication, account state, answers and URL-carried data out of replay.
  if (url.origin !== "https://hskkit.com" || url.search || url.hash) return false;
  return /^\/(?:$|dictionary\/?$|levels\/?$|vocabulary\/[1-9]\/?$|word\/hsk[\w.-]+(?:\/practice)?\/?$|character\/[^/]+\/?$|blog(?:\/[a-z0-9-]+)?\/?$|topics(?:\/[a-z0-9-]+)?\/?$|tools(?:\/[a-z0-9-]+)?\/?$|hsk-[a-z0-9-]+\/?$|pricing\/?$|store\/?$|privacy-policy\/?$|terms-of-service\/?$)/.test(url.pathname);
}

type ClarityCall = ((...args: unknown[]) => void) & { q?: unknown[][] };
type ClarityWindow = Window & { clarity?: ClarityCall };
let recordingAllowed = false;

export function stopClarity() {
  recordingAllowed = false;
  const target = window as ClarityWindow;
  target.clarity?.("consentv2", { analytics_Storage: "denied", ad_Storage: "denied" });
  target.clarity?.("stop");
}

export function startClarity() {
  if (!canRecordPublicPage(window.location.href)) return;
  recordingAllowed = true;
  const target = window as ClarityWindow;
  if (!target.clarity) {
    const queued: ClarityCall = (...args: unknown[]) => { (queued.q ||= []).push(args); };
    target.clarity = queued;
  }
  target.clarity("consentv2", { analytics_Storage: "granted", ad_Storage: "denied" });
  const existing = document.querySelector<HTMLScriptElement>("script[data-hskkit-clarity]");
  if (existing) {
    if (existing.dataset.loaded === "true") target.clarity("start");
    return;
  }
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
  script.setAttribute("data-hskkit-clarity", "");
  script.onload = () => {
    script.dataset.loaded = "true";
    if (!recordingAllowed || !canRecordPublicPage(window.location.href)) stopClarity();
  };
  document.head.appendChild(script);
}
