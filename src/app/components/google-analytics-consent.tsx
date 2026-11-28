"use client";
import { useEffect } from "react";
import { setGoogleAnalyticsConsent } from "@/lib/google-analytics";
export function GoogleAnalyticsConsent({allowed}:{allowed:boolean}) {
  useEffect(() => { setGoogleAnalyticsConsent(allowed); }, [allowed]);
  return null;
}
