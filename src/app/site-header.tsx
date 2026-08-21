"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const primaryLinks = [
  { href: "/levels", label: "Levels 1–9" },
  { href: "/vocabulary/1", label: "Vocabulary" },
  { href: "/dictionary", label: "Dictionary" },
  { href: "/today", label: "Today" },
  { href: "/listen", label: "Listening" },
  { href: "/account", label: "Account" },
];

export const legacyRoutePattern = /^\/(?:hsk-[1-6]-(?:vocabulary|practice-test)|hsk-1-reading-practice)(?:\/|$)/;

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isTraditionalRoute = legacyRoutePattern.test(pathname);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-[100] border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav aria-label="Primary navigation" className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-8">
        <Link href="/" className="text-[22px] font-bold tracking-tight text-slate-900" onClick={() => setOpen(false)}>
          HSK<span className="text-blue-600">Kit</span>
        </Link>
        <div className="hidden items-center gap-0.5 [@media(min-width:1040px)]:flex">
          {primaryLinks.map((item) => (
            <Link key={item.href} href={item.href} className="inline-flex min-h-11 items-center rounded-lg px-2.5 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700">
              {item.label}
            </Link>
          ))}
          <Link href="/placement" className="ml-2 inline-flex min-h-11 items-center rounded-full bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700">Find my level</Link>
        </div>
        <button type="button" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-900 [@media(min-width:1040px)]:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((value) => !value)}>
          <span aria-hidden="true" className="text-2xl leading-none">{open ? "×" : "☰"}</span>
        </button>
      </nav>
      {isTraditionalRoute && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm leading-6 text-amber-950">
          <strong>Traditional HSK 2.0 resource.</strong>{" "}
          This page keeps its original standard label. For the current Level 1–9 path, <Link href="/levels" className="font-bold underline">open HSK 3.0 Levels</Link>.
        </div>
      )}
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-16 overflow-y-auto border-t border-slate-200 bg-white [@media(min-width:1040px)]:hidden">
          <nav aria-label="Mobile navigation" className="grid gap-1 px-4 py-5">
            {primaryLinks.map((item) => (
              <Link key={item.href} href={item.href} className="flex min-h-12 items-center rounded-xl px-4 font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-700" onClick={() => setOpen(false)}>{item.label}</Link>
            ))}
            <Link href="/placement" className="mt-3 flex min-h-12 items-center justify-center rounded-full bg-blue-600 px-5 font-bold text-white" onClick={() => setOpen(false)}>Find my level</Link>
            <div className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-500"><Link href="/hsk-3-0" className="inline-flex min-h-11 items-center px-4 font-semibold hover:text-blue-700" onClick={() => setOpen(false)}>HSK 3.0 guide</Link><Link href="/hsk-2-0-vs-3-0" className="inline-flex min-h-11 items-center px-4 font-semibold hover:text-blue-700" onClick={() => setOpen(false)}>HSK 2.0 vs 3.0</Link></div>
          </nav>
        </div>
      )}
    </header>
  );
}
