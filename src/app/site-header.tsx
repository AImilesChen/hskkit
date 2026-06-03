"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const vocabLevels = [
  { level: 1, href: "/hsk-1-vocabulary", label: "HSK 1 Vocabulary" },
  { level: 2, href: "/hsk-2-vocabulary", label: "HSK 2 Vocabulary" },
  { level: 3, href: "/hsk-3-vocabulary", label: "HSK 3 Vocabulary" },
  { level: 4, href: "/hsk-4-vocabulary", label: "HSK 4 Vocabulary" },
  { level: 5, href: "/hsk-5-vocabulary", label: "HSK 5 Vocabulary" },
  { level: 6, href: "/hsk-6-vocabulary", label: "HSK 6 Planned", planned: true },
];

const practiceLevels = [
  { level: 1, href: "/hsk-1-practice-test", label: "HSK 1 Practice Test" },
  { level: 2, href: "/hsk-2-practice-test", label: "HSK 2 Practice Test" },
  { level: 3, href: "/hsk-3-practice-test", label: "HSK 3 Practice Test" },
  { level: 4, href: "/hsk-4-practice-test", label: "HSK 4 Practice Test" },
  { level: 5, href: "/hsk-5-practice-test", label: "HSK 5 Practice Test" },
];

const studyTools = [
  { href: "/hsk-1-reading-practice", label: "Reading Practice", icon: "book-open" },
  { href: "/worksheet", label: "Worksheet Generator", icon: "file-text" },
  { href: "/hsk-1-vocabulary#flashcards", label: "Flashcards", icon: "layers" },
];

function ToolIcon({ name }: { name: string }) {
  if (name === "target") {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    );
  }
  if (name === "clipboard") {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M4 7h16v14H4z" />
        <path d="M9 11h6" />
        <path d="M9 15h4" />
      </svg>
    );
  }
  if (name === "book-open") {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    );
  }
  if (name === "file-text") {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    );
  }
  if (name === "layers") {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}

function LevelBadge({ level, planned }: { level: number; planned?: boolean }) {
  return (
    <span
      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
        planned
          ? "bg-[#F1F5F9] text-[#64748B]"
          : "bg-[#EFF6FF] text-[#2563EB]"
      }`}
    >
      {level}
    </span>
  );
}

function DesktopDropdown({
  label,
  items,
  sectionLabel,
  openId,
  setOpenId,
  id,
  isTools,
}: {
  label: string;
  items: { level?: number; href: string; label: string; planned?: boolean; icon?: string }[];
  sectionLabel: string;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  id: string;
  isTools?: boolean;
}) {
  const isOpen = openId === id;

  return (
    <div className="relative">
      <button
        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
          isOpen
            ? "text-[#0F172A] bg-[#F8FAFC]"
            : "text-[#334155] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
        }`}
        onClick={() => setOpenId(isOpen ? null : id)}
        aria-expanded={isOpen}
      >
        {label}
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div
        className={`absolute top-[calc(100%+8px)] left-0 bg-white border border-[#E2E8F0] rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.08)] p-2 min-w-[220px] z-[200] transition-all duration-200 ${
          isOpen
            ? "opacity-100 visible translate-y-0"
            : "opacity-0 invisible -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="px-3.5 py-1.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
          {sectionLabel}
        </div>
        {items.map((item, idx) => (
          <div key={item.href + idx}>
            {item.planned && idx > 0 && (
              <div className="h-px bg-[#E2E8F0] my-1.5" />
            )}
            <Link
              href={item.href}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                item.planned
                  ? "text-[#64748B] opacity-60 hover:bg-[#F8FAFC] hover:text-[#64748B]"
                  : "text-[#334155] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
              }`}
              onClick={() => setOpenId(null)}
            >
              {isTools && item.icon ? (
                <span className="text-[#64748B]"><ToolIcon name={item.icon} /></span>
              ) : item.level ? (
                <LevelBadge level={item.level} planned={item.planned} />
              ) : null}
              {item.label}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(".desktop-dropdown-trigger")) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function toggleAccordion(id: string) {
    setOpenAccordion((prev) => (prev === id ? null : id));
  }

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 850 && mobileOpen) {
        setMobileOpen(false);
        setOpenAccordion(null);
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileOpen]);

  function closeMobile() {
    setMobileOpen(false);
    setOpenAccordion(null);
  }

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
        <div className="hidden [@media(min-width:850px)]:flex items-center gap-1 desktop-dropdown-trigger">
          <DesktopDropdown
            label="Vocabulary"
            items={vocabLevels}
            sectionLabel="Select Level"
            openId={openDropdown}
            setOpenId={setOpenDropdown}
            id="vocab"
          />
          <DesktopDropdown
            label="Practice"
            items={practiceLevels}
            sectionLabel="Practice Tests"
            openId={openDropdown}
            setOpenId={setOpenDropdown}
            id="practice"
          />
          <Link
            href="/hsk-levels"
            className="px-4 py-2 text-sm font-medium text-[#334155] no-underline transition-colors duration-150 hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg"
          >
            Levels
          </Link>
          <DesktopDropdown
            label="Study Tools"
            items={studyTools}
            sectionLabel="All Tools"
            openId={openDropdown}
            setOpenId={setOpenDropdown}
            id="tools"
            isTools
          />
          <Link
            href="/hsk-level-test"
            className="inline-flex items-center gap-2 bg-[#2563EB] text-white px-5 py-2.5 rounded-full text-sm font-semibold no-underline transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#1D4ED8] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] ml-2"
          >
            Take the Level Check
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="[@media(min-width:850px)]:hidden bg-none border-none cursor-pointer p-2"
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

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="[@media(min-width:850px)]:hidden fixed inset-0 top-16 bg-white z-[99] overflow-y-auto">
          <div className="px-6 py-4 flex flex-col">
            {/* Vocabulary Accordion */}
            <button
              className="flex items-center justify-between w-full py-3.5 text-base font-medium text-[#334155] bg-none border-none cursor-pointer"
              onClick={() => toggleAccordion("vocab")}
              aria-expanded={openAccordion === "vocab"}
            >
              Vocabulary
              <svg
                className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${
                  openAccordion === "vocab" ? "rotate-180" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                openAccordion === "vocab" ? "max-h-[400px]" : "max-h-0"
              }`}
            >
              <div className="bg-[#F8FAFC] rounded-lg mb-2">
                {vocabLevels.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 text-[15px] font-medium ${
                      item.planned
                        ? "text-[#64748B]"
                        : "text-[#334155] hover:text-[#2563EB]"
                    }`}
                    onClick={closeMobile}
                  >
                    <LevelBadge level={item.level} planned={item.planned} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Practice Accordion */}
            <button
              className="flex items-center justify-between w-full py-3.5 text-base font-medium text-[#334155] bg-none border-none cursor-pointer"
              onClick={() => toggleAccordion("practice")}
              aria-expanded={openAccordion === "practice"}
            >
              Practice
              <svg
                className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${
                  openAccordion === "practice" ? "rotate-180" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                openAccordion === "practice" ? "max-h-[400px]" : "max-h-0"
              }`}
            >
              <div className="bg-[#F8FAFC] rounded-lg mb-2">
                {practiceLevels.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 text-[15px] font-medium text-[#334155] hover:text-[#2563EB]"
                    onClick={closeMobile}
                  >
                    <LevelBadge level={item.level} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Levels link */}
            <Link
              href="/hsk-levels"
              className="py-3.5 text-base font-medium text-[#334155] no-underline"
              onClick={closeMobile}
            >
              Levels
            </Link>

            {/* Study Tools Accordion */}
            <button
              className="flex items-center justify-between w-full py-3.5 text-base font-medium text-[#334155] bg-none border-none cursor-pointer"
              onClick={() => toggleAccordion("tools")}
              aria-expanded={openAccordion === "tools"}
            >
              Study Tools
              <svg
                className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${
                  openAccordion === "tools" ? "rotate-180" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                openAccordion === "tools" ? "max-h-[400px]" : "max-h-0"
              }`}
            >
              <div className="bg-[#F8FAFC] rounded-lg mb-2">
                {studyTools.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 text-[15px] font-medium text-[#334155] hover:text-[#2563EB]"
                    onClick={closeMobile}
                  >
                    <span className="text-[#64748B]"><ToolIcon name={item.icon} /></span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
              <Link
                href="/hsk-level-test"
                className="flex items-center justify-center w-full bg-[#2563EB] text-white px-5 py-3.5 rounded-full text-base font-semibold no-underline"
                onClick={closeMobile}
              >
                Take the Level Check
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
