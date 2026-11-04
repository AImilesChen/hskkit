"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export function TestLandingEvents({ page, level }: { page: "test_center" | "placement_landing" | "level_landing"; level?: string }) {
  useEffect(() => {
    trackEvent("test_landing_view", { page, ...(level ? { level } : {}) });
    const click = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-test-entry]") : null;
      if (link?.closest(".test-public-page")) trackEvent("test_landing_click", { page, entry: link.dataset.testEntry ?? "unknown", ...(link.dataset.testLevel || level ? { level: link.dataset.testLevel || level! } : {}) });
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, [page, level]);
  return null;
}
