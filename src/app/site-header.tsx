"use client";

import { useState } from "react";
import Link from "next/link";

const navLinks = [
  { href: "/hsk-level-test", label: "Level Check" },
  { href: "/hsk-1-vocabulary", label: "Vocabulary" },
  { href: "/hsk-1-practice-test", label: "Practice" },
  { href: "/hsk-levels", label: "Levels" },
];

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-[100] bg-white/95 backdrop-blur-[12px] border-b border-[#F1F5F9]">
      <div className="max-w-[1200px] mx-auto px-8 h-16 flex items-center justify-between max-sm:px-4">
        <Link
          href="/"
          className="text-[22px] font-bold text-[#0F172A] tracking-tight no-underline"
        >
          HSK<span className="text-[#2563EB]">Kit</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#334155] no-underline transition-colors duration-150 hover:text-[#0F172A]"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/hsk-level-test"
            className="inline-flex items-center gap-2 bg-[#2563EB] text-white px-5 py-2.5 rounded-full text-sm font-semibold no-underline transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#1D4ED8] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
          >
            Take the Level Check
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden bg-none border-none cursor-pointer p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
          aria-expanded={mobileOpen}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0F172A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {mobileOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-[#E2E8F0] px-6 py-6 flex flex-col gap-4 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base font-medium text-[#334155] no-underline py-2"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/hsk-level-test"
            className="inline-flex items-center justify-center bg-[#2563EB] text-white px-5 py-3 rounded-full text-base font-semibold no-underline mt-2"
            onClick={() => setMobileOpen(false)}
          >
            Take the Level Check
          </Link>
        </div>
      )}
    </nav>
  );
}
