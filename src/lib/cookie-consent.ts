import { CLARITY_CONSENT_KEY, GOOGLE_ANALYTICS_CONSENT_KEY } from "./clarity.ts";
export const OPEN_COOKIE_SETTINGS = "hskkit-open-cookie-settings";
export type CookiePreferences = { ga4: boolean | null; clarity: boolean | null };
type ConsentStorage = Pick<Storage, "getItem" | "setItem">;
const choice = (value: string | null) => value === "accepted" ? true : value === "rejected" ? false : null;
export function readCookiePreferences(storage: ConsentStorage): CookiePreferences {
  return { ga4: choice(storage.getItem(GOOGLE_ANALYTICS_CONSENT_KEY)), clarity: choice(storage.getItem(CLARITY_CONSENT_KEY)) };
}
export function saveCookiePreferences(storage: ConsentStorage, preferences: {ga4:boolean;clarity:boolean}) {
  storage.setItem(GOOGLE_ANALYTICS_CONSENT_KEY, preferences.ga4 ? "accepted" : "rejected");
  storage.setItem(CLARITY_CONSENT_KEY, preferences.clarity ? "accepted" : "rejected");
}
export const completeCookieChoice = (preferences: CookiePreferences) => preferences.ga4 !== null && preferences.clarity !== null;
