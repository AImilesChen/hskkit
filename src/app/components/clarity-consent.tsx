"use client";
import { useLayoutEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { canRecordPublicPage, startClarity, stopClarity } from "@/lib/clarity";
export function ClarityConsent({allowed}:{allowed:boolean}) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useLayoutEffect(() => {
    const apply = () => { if (allowed && canRecordPublicPage(location.href)) startClarity(); else stopClarity(); };
    apply();
    window.addEventListener("popstate", apply);
    window.addEventListener("hashchange", apply);
    return () => { window.removeEventListener("popstate", apply); window.removeEventListener("hashchange", apply); };
  }, [pathname, search, allowed]);
  useLayoutEffect(() => () => stopClarity(), []);
  return null;
}
