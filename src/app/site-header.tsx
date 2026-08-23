"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  isNavigationEntryActive,
  isNavigationGroup,
  isNavigationItemActive,
  siteNavigation,
} from "./site-navigation";

export const legacyRoutePattern = /^\/(?:hsk-[1-6]-(?:vocabulary|practice-test)|hsk-1-reading-practice)(?:\/|$)/;

export default function SiteHeader() {
  const pathname = usePathname();
  const [desktopGroup, setDesktopGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement | null>(null);
  const groupTriggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isTraditionalRoute = legacyRoutePattern.test(pathname);

  function closeNavigation() {
    setDesktopGroup(null);
    setMobileGroup(null);
    setMobileOpen(false);
  }

  useEffect(() => {
    closeNavigation();
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (desktopGroup) {
          const trigger = groupTriggerRefs.current[desktopGroup];
          setDesktopGroup(null);
          requestAnimationFrame(() => trigger?.focus());
        } else if (mobileOpen) {
          setMobileOpen(false);
          setMobileGroup(null);
          requestAnimationFrame(() => mobileTriggerRef.current?.focus());
        }
      }
    };
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (desktopGroup && !headerRef.current?.contains(event.target as Node)) setDesktopGroup(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, [desktopGroup, mobileOpen]);

  useEffect(() => {
    const breakpoint = window.matchMedia("(min-width: 1040px)");
    const closeAcrossBreakpoint = () => closeNavigation();
    breakpoint.addEventListener("change", closeAcrossBreakpoint);
    return () => breakpoint.removeEventListener("change", closeAcrossBreakpoint);
  }, []);

  return (
    <header ref={headerRef} className="sticky top-0 z-[100] border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav aria-label="Primary navigation" className="mx-auto flex h-[72px] max-w-[1204px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex min-h-11 items-center gap-2 text-[22px] font-bold tracking-tight text-slate-900" onClick={closeNavigation}>
          <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-sm font-bold text-white">学</span>
          HSKKit
        </Link>

        <div className="hidden items-center gap-1 [@media(min-width:1040px)]:flex">
          {siteNavigation.map((entry) => isNavigationGroup(entry) ? (
            <div key={entry.label} className="relative">
              <button
                ref={(node) => { groupTriggerRefs.current[entry.label] = node; }}
                type="button"
                aria-expanded={desktopGroup === entry.label}
                aria-controls={`desktop-${entry.label.toLowerCase()}-menu`}
                aria-current={isNavigationEntryActive(pathname, entry) ? "page" : undefined}
                className="inline-flex min-h-11 items-center gap-1 border-b-2 border-transparent px-3 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-700 aria-[current=page]:border-blue-600 aria-[current=page]:text-blue-700"
                onClick={() => setDesktopGroup((current) => current === entry.label ? null : entry.label)}
              >
                {entry.label}<span aria-hidden="true" className="text-xs">▾</span>
              </button>
              {desktopGroup === entry.label && (
                <div id={`desktop-${entry.label.toLowerCase()}-menu`} className="absolute left-1/2 top-full w-[340px] -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  {entry.items.map((item) => (
                    <Link key={item.href} href={item.href} aria-current={isNavigationItemActive(pathname, item) ? "page" : undefined} className="block min-h-14 rounded-lg px-4 py-3 hover:bg-blue-50 aria-[current=page]:bg-blue-50" onClick={closeNavigation}>
                      <span className="block font-semibold text-slate-900">{item.label}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-500">{item.description}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link key={entry.href} href={entry.href} aria-label={`${entry.label} — ${entry.description}`} aria-current={isNavigationItemActive(pathname, entry) ? "page" : undefined} className="inline-flex min-h-11 items-center border-b-2 border-transparent px-3 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-700 aria-[current=page]:border-blue-600 aria-[current=page]:text-blue-700" onClick={closeNavigation}>
              {entry.label}
            </Link>
          ))}
        </div>

        <button ref={mobileTriggerRef} type="button" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-900 [@media(min-width:1040px)]:hidden" aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen} aria-controls="mobile-menu" onClick={() => { setMobileOpen((value) => !value); setMobileGroup(null); }}>
          <span aria-hidden="true" className="text-2xl leading-none">{mobileOpen ? "×" : "☰"}</span>
        </button>
      </nav>

      {isTraditionalRoute && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm leading-6 text-amber-950">
          <strong>Traditional HSK 2.0 resource.</strong>{" "}
          This page keeps its original standard label. For the current Level 1–9 path, <Link href="/levels" className="font-bold underline">open HSK 3.0 Levels</Link>.
        </div>
      )}

      {mobileOpen && (
        <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-[72px] overflow-y-auto border-t border-slate-200 bg-white [@media(min-width:1040px)]:hidden">
          <nav aria-label="Mobile navigation" className="grid gap-2 px-4 py-5">
            {siteNavigation.map((entry) => isNavigationGroup(entry) ? (
              <div key={entry.label} className="rounded-xl border border-slate-200 bg-white">
                <button type="button" aria-expanded={mobileGroup === entry.label} aria-controls={`mobile-${entry.label.toLowerCase()}-menu`} className="flex min-h-12 w-full items-center justify-between rounded-xl px-4 text-left font-bold text-slate-900" onClick={() => setMobileGroup((current) => current === entry.label ? null : entry.label)}>
                  {entry.label}<span aria-hidden="true">{mobileGroup === entry.label ? "−" : "+"}</span>
                </button>
                {mobileGroup === entry.label && (
                  <div id={`mobile-${entry.label.toLowerCase()}-menu`} className="grid gap-1 border-t border-slate-200 p-2">
                    {entry.items.map((item) => (
                      <Link key={item.href} href={item.href} aria-current={isNavigationItemActive(pathname, item) ? "page" : undefined} className="flex min-h-16 flex-col justify-center rounded-lg px-3 py-2 hover:bg-blue-50 aria-[current=page]:bg-blue-50" onClick={closeNavigation}>
                        <span className="font-semibold text-slate-900">{item.label}</span>
                        <span className="mt-0.5 text-xs leading-5 text-slate-500">{item.description}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link key={entry.href} href={entry.href} aria-label={`${entry.label} — ${entry.description}`} aria-current={isNavigationItemActive(pathname, entry) ? "page" : undefined} className="flex min-h-16 flex-col justify-center rounded-xl border border-slate-200 px-4 py-2 hover:bg-blue-50 aria-[current=page]:border-blue-300 aria-[current=page]:bg-blue-50" onClick={closeNavigation}>
                <span className="font-bold text-slate-900">{entry.label}</span>
                <span className="mt-0.5 text-xs leading-5 text-slate-500">{entry.description}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
