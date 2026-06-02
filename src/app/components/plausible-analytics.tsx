"use client";

import { useEffect } from "react";

type PlausibleOptions = {
  callback?: (result?: { status?: number; error?: unknown }) => void;
  interactive?: boolean;
  meta?: Record<string, string | number | boolean>;
  props?: Record<string, string | number | boolean>;
};

declare global {
  interface Window {
    plausible?: ((eventName: string, options?: PlausibleOptions) => void) & {
      q?: Array<[string, PlausibleOptions?]>;
      l?: boolean;
    };
  }
}

function sameUrlWithoutHash(a: string, b: string) {
  const left = new URL(a, window.location.href);
  const right = new URL(b, window.location.href);
  left.hash = "";
  right.hash = "";
  return left.toString() === right.toString();
}

export function PlausibleAnalytics({
  domain,
  endpoint,
}: {
  domain: string;
  endpoint: string;
}) {
  useEffect(() => {
    let lastPageviewUrl = "";

    const sendEvent = (eventName: string, options?: PlausibleOptions) => {
      const payload: Record<string, unknown> = {
        n: eventName,
        v: 33,
        u: window.location.href,
        d: domain,
        r: document.referrer || null,
      };

      if (options?.props) payload.p = options.props;
      if (options?.meta) payload.m = JSON.stringify(options.meta);
      if (options?.interactive === false) payload.i = false;

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        keepalive: true,
        body: JSON.stringify(payload),
      })
        .then((response) => options?.callback?.({ status: response.status }))
        .catch((error) => options?.callback?.({ error }));
    };

    const trackPageview = () => {
      const currentUrl = window.location.href;
      if (lastPageviewUrl && sameUrlWithoutHash(lastPageviewUrl, currentUrl)) return;
      lastPageviewUrl = currentUrl;
      sendEvent("pageview");
      sendEvent("page_view");
    };

    const queuedEvents = window.plausible?.q || [];
    const plausible = ((eventName: string, options?: PlausibleOptions) => {
      sendEvent(eventName, options);
    }) as NonNullable<Window["plausible"]>;
    plausible.q = [];
    plausible.l = true;
    window.plausible = plausible;
    queuedEvents.forEach(([eventName, options]) => sendEvent(eventName, options));

    trackPageview();

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function pushState(...args) {
      originalPushState.apply(this, args);
      window.setTimeout(trackPageview, 0);
    };

    window.history.replaceState = function replaceState(...args) {
      originalReplaceState.apply(this, args);
      window.setTimeout(trackPageview, 0);
    };

    window.addEventListener("popstate", trackPageview);
    window.addEventListener("pageshow", trackPageview);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", trackPageview);
      window.removeEventListener("pageshow", trackPageview);
    };
  }, [domain, endpoint]);

  return null;
}
