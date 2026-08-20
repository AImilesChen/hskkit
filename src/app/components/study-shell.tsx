"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function StudyHeader() {
  const pathname = usePathname();
  const navigation = [
    { href: "/levels", label: "Levels", active: pathname === "/levels" },
    { href: "/dictionary", label: "Dictionary", active: pathname === "/dictionary" },
    { href: "/vocabulary/1", label: "Vocabulary", active: pathname.startsWith("/vocabulary/") || pathname.startsWith("/word/") || pathname.startsWith("/character/") },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-20 max-w-[1140px] flex-wrap items-center justify-between gap-3 px-5 py-3 md:px-16">
        <Link href="/" className="text-2xl font-bold text-slate-900">HSKKit</Link>
        <nav aria-label="Study navigation" className="flex items-center gap-1 overflow-x-auto text-sm font-semibold sm:gap-3">
          {navigation.map((item) => <Link key={item.href} aria-current={item.active ? "page" : undefined} href={item.href} className={`min-h-11 rounded-lg px-3 py-3 transition sm:px-4 ${item.active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"}`}>{item.label}</Link>)}
        </nav>
      </div>
    </header>
  );
}

export function StudyFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1140px] flex-col gap-5 px-5 py-10 text-sm text-slate-500 md:flex-row md:items-center md:justify-between md:px-16">
        <strong className="text-xl text-slate-700">HSKKit</strong>
        <nav className="flex flex-wrap gap-x-5 gap-y-3" aria-label="Legal navigation">
          <Link href="/privacy-policy" className="hover:text-blue-600">Privacy</Link>
          <Link href="/terms-of-service" className="hover:text-blue-600">Terms</Link>
          <Link href="/disclaimer" className="hover:text-blue-600">Disclaimer</Link>
          <Link href="/contact" className="hover:text-blue-600">Contact</Link>
        </nav>
        <span>Independent study tool · Not an examination authority</span>
      </div>
    </footer>
  );
}

export function StudyPage({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900"><StudyHeader />{children}<StudyFooter /></div>;
}
