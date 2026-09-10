"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isEligibleLearningPath } from "@/lib/engagement/domain";

type RewardEvent = {
  todayAward: number;
  activeSeconds: number;
  nextTierPoints: number | null;
  remainingSeconds: number;
  [key: string]: unknown;
};

export function LearningEngagementTracker() {
  const pathname = usePathname();
  const [notice, setNotice] = useState("");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!isEligibleLearningPath(pathname)) return;
    let cancelled = false;
    let sessionToken = "";
    let lastActivityAt = Date.now();
    let lastHeartbeatAt = Date.now();
    let lastAward = 0;
    let noticeTimer: ReturnType<typeof setTimeout> | undefined;

    const publish = (payload: RewardEvent, showTier = false) => {
      window.dispatchEvent(new CustomEvent("hskkit:learning-reward", { detail: payload }));
      if (showTier && payload.todayAward > lastAward) {
        setNotice(`Online learning reached ${Math.floor(payload.activeSeconds / 60)} minutes. +${payload.todayAward - lastAward} learning points.`);
        if (noticeTimer) clearTimeout(noticeTimer);
        noticeTimer = setTimeout(() => setNotice(""), 6_000);
      }
      lastAward = payload.todayAward;
    };

    const begin = async () => {
      const response = await fetch("/api/v1/account/learning-rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", route: pathname }),
      });
      if (!response.ok || cancelled) return false;
      const payload = await response.json() as RewardEvent & { sessionToken: string };
      sessionToken = payload.sessionToken;
      lastHeartbeatAt = Date.now();
      publish(payload, false);
      return true;
    };

    const heartbeat = async () => {
      const now = Date.now();
      const inactive = now - lastActivityAt > 90_000;
      const hidden = document.visibilityState !== "visible";
      setPaused(hidden || inactive);
      if (hidden || inactive) {
        lastHeartbeatAt = now;
        return;
      }
      if (!sessionToken && !(await begin())) return;
      const seconds = Math.max(1, Math.min(60, Math.floor((now - lastHeartbeatAt) / 1_000)));
      lastHeartbeatAt = now;
      const response = await fetch("/api/v1/account/learning-rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "heartbeat",
          route: pathname,
          heartbeatId: crypto.randomUUID(),
          sessionToken,
          seconds,
        }),
      });
      if (response.status === 409) {
        sessionToken = "";
        await begin();
        return;
      }
      if (!response.ok || cancelled) return;
      publish(await response.json() as RewardEvent, true);
    };

    const markActive = () => {
      lastActivityAt = Date.now();
      setPaused(false);
    };
    const onVisibility = () => {
      lastHeartbeatAt = Date.now();
      if (document.visibilityState === "visible") markActive();
      else setPaused(true);
    };
    const activityEvents: Array<keyof DocumentEventMap> = ["pointerdown", "keydown", "touchstart", "scroll", "timeupdate"];
    activityEvents.forEach((event) => document.addEventListener(event, markActive, { passive: true, capture: true }));
    document.addEventListener("visibilitychange", onVisibility);
    void begin();
    const timer = window.setInterval(() => void heartbeat(), 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      if (noticeTimer) clearTimeout(noticeTimer);
      activityEvents.forEach((event) => document.removeEventListener(event, markActive, { capture: true }));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pathname]);

  if (!isEligibleLearningPath(pathname) || (!notice && !paused)) return null;
  return <div className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,30rem)] -translate-x-1/2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-xl" role="status" aria-live="polite">
    {notice || "Timer paused. Return to learning and interact to keep adding time."}
  </div>;
}
