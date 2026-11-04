"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export function TestLandingEvents({ page }: { page: "test_center" | "placement_landing" }) {
  useEffect(() => {
    trackEvent("test_landing_view", { page });
    const click = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-test-entry]") : null;
      if (link?.closest(".test-public-page")) trackEvent("test_landing_click", { page, entry: link.dataset.testEntry ?? "unknown" });
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, [page]);
  return null;
}
