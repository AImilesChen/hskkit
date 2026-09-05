"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isEligibleLearningPath } from "@/lib/engagement/domain";

export function LearningEngagementTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isEligibleLearningPath(pathname)) return;
    let lastActivityAt = 0;
    let lastTickAt = Date.now();
    let stopped = false;
    let sessionToken = "";
    let sessionExpiresAt = 0;

    const markActive = () => { lastActivityAt = Date.now(); };
    const activityEvents: Array<keyof DocumentEventMap> = ["pointerdown", "keydown", "touchstart", "timeupdate"];
    for (const event of activityEvents) document.addEventListener(event, markActive, { capture: true, passive: true });

    const begin = async () => {
      const response = await fetch("/api/v1/account/learning-rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", route: pathname }),
      });
      if (response.status === 401) { stopped = true; return false; }
      if (!response.ok) return false;
      const payload = await response.json() as { sessionToken: string; sessionExpiresAt: string };
      sessionToken = payload.sessionToken;
      sessionExpiresAt = Date.parse(payload.sessionExpiresAt);
      return true;
    };

    void begin();
    const timer = window.setInterval(async () => {
      const now = Date.now();
      const elapsed = Math.min(30, Math.max(1, Math.round((now - lastTickAt) / 1000)));
      lastTickAt = now;
      if (stopped || document.visibilityState !== "visible" || now - lastActivityAt > 45_000) return;
      try {
        if (!sessionToken || sessionExpiresAt - now < 35_000) {
          const started = await begin();
          if (!started) return;
        }
        const response = await fetch("/api/v1/account/learning-rewards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            heartbeatId: crypto.randomUUID().replaceAll("-", ""),
            sessionToken,
            route: pathname,
            seconds: elapsed,
          }),
          keepalive: true,
        });
        if (response.status === 401) { stopped = true; return; }
        if (response.status === 409) { sessionToken = ""; return; }
        if (response.ok) {
          const snapshot = await response.json();
          window.dispatchEvent(new CustomEvent("hskkit:learning-reward", { detail: snapshot }));
        }
      } catch { /* learning remains available if reward telemetry is temporarily unavailable */ }
    }, 30_000);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      for (const event of activityEvents) document.removeEventListener(event, markActive, { capture: true });
    };
  }, [pathname]);
  return null;
}
