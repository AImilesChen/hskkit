export const MEASUREMENT_ID = "G-W19896DKRJ";
const DISABLE_KEY = `ga-disable-${MEASUREMENT_ID}` as const;
type AnalyticsWindow = Window & { dataLayer?:unknown[];gtag?:(...args:unknown[])=>void;[DISABLE_KEY]?:boolean };
export function setGoogleAnalyticsConsent(allowed: boolean) {
  const target = window as AnalyticsWindow;
  target[DISABLE_KEY] = !allowed;
  if (!allowed) {
    target.gtag?.("consent", "update", {analytics_storage:"denied"});
    for (const item of document.cookie.split(";")) {
      const name = item.split("=",1)[0].trim();
      if (name !== "_ga" && !name.startsWith("_ga_")) continue;
      for (const domain of ["",`; domain=${location.hostname}`,`; domain=.${location.hostname}`]) document.cookie = `${name}=; Max-Age=0; path=/${domain}; SameSite=Lax`;
    }
    return;
  }
  if (target.gtag) {
    target.gtag("consent", "update", {analytics_storage:"granted"});
    if (document.querySelector("script[data-hskkit-ga4]")) return;
  }
  target.dataLayer ||= [];
  target.gtag = function () {
    // Google expects IArguments commands rather than plain arrays.
    // eslint-disable-next-line prefer-rest-params
    target.dataLayer?.push(arguments);
  };
  target.gtag("consent", "default", {analytics_storage:"granted",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"});
  target.gtag("js", new Date());
  target.gtag("config", MEASUREMENT_ID);
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  script.setAttribute("data-hskkit-ga4", "");
  document.head.appendChild(script);
}
