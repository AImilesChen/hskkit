"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const primaryLinks = [
  { href: "/today", label: "Today" },
  { href: "/levels", label: "Levels 1–9" },
  { href: "/placement", label: "Placement" },
  { href: "/practice/1/vocabulary", label: "Practice" },
  { href: "/mistakes", label: "Mistakes" },
];

const resourceLinks = [
  { href: "/hsk-3-0", label: "HSK 3.0 guide" },
  { href: "/hsk-2-0-vs-3-0", label: "2.0 vs 3.0" },
  { href: "/dictionary", label: "Dictionary" },
  { href: "/account", label: "Account" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className="sticky top-0 z-[100] border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav aria-label="Primary navigation" className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-8">
        <Link href="/" className="text-[22px] font-bold tracking-tight text-slate-900" onClick={() => setOpen(false)}>
          HSK<span className="text-blue-600">Kit</span>
        </Link>
        <div className="hidden items-center gap-1 [@media(min-width:920px)]:flex">
          {primaryLinks.map((item) => (
            <Link key={item.href} href={item.href} className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700">
              {item.label}
            </Link>
          ))}
          <details className="relative">
            <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700">Resources</summary>
            <div className="absolute right-0 mt-2 grid w-56 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              {resourceLinks.map((item) => <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-blue-50 hover:text-blue-700">{item.label}</Link>)}
            </div>
          </details>
          <Link href="/placement" className="ml-2 inline-flex min-h-11 items-center rounded-full bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700">Find my level</Link>
        </div>
        <button type="button" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-900 [@media(min-width:920px)]:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((value) => !value)}>
          <span aria-hidden="true" className="text-2xl leading-none">{open ? "×" : "☰"}</span>
        </button>
      </nav>
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-16 overflow-y-auto bg-white [@media(min-width:920px)]:hidden">
          <nav aria-label="Mobile navigation" className="grid gap-1 px-4 py-5">
            {[...primaryLinks, ...resourceLinks].map((item) => (
              <Link key={item.href} href={item.href} className="flex min-h-12 items-center rounded-xl px-4 font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-700" onClick={() => setOpen(false)}>{item.label}</Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
