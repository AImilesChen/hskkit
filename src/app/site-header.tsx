"use client";

import { useState } from "react";
import Link from "next/link";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/hsk-levels", label: "Levels" },
  { href: "/hsk-level-test", label: "Level test" },
  { href: "/privacy-policy", label: "Privacy" },
];

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-[100] bg-[rgba(253,251,247,0.95)] backdrop-blur-[10px] border-b border-[#E5E1DB]">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-heading text-xl font-bold text-primary tracking-tight"
        >
          HSKKit
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-ink-secondary font-medium text-[15px] px-4 py-2 rounded-md transition-all duration-base hover:text-primary hover:bg-primary-light"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile toggle */}
        <button
          className="sm:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            {mobileOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="sm:hidden absolute top-16 left-0 right-0 bg-surface border-b border-border px-4 py-4 flex flex-col gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-ink-secondary font-medium px-4 py-3 rounded-md hover:text-primary hover:bg-primary-light"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
