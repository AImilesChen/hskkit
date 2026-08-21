import Link from "next/link";

const studyLinks = [
  { href: "/levels", label: "Levels 1–9" },
  { href: "/vocabulary/1", label: "Vocabulary" },
  { href: "/dictionary", label: "Dictionary" },
  { href: "/today", label: "Today" },
  { href: "/listen", label: "Listening" },
  { href: "/account", label: "Account" },
];

const guideLinks = [
  { href: "/hsk-3-0", label: "HSK 3.0 guide" },
  { href: "/hsk-2-0-vs-3-0", label: "HSK 2.0 vs 3.0" },
  { href: "/content-license", label: "Content sources" },
];

const disclaimer = "HSKKit is an independent study tool and is not affiliated with, endorsed by, sponsored by, or operated by any HSK test organizer or trademark owner.";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
        <div className="grid gap-8 border-b border-slate-200 pb-8 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr]">
          <div><Link href="/" className="text-2xl font-bold text-slate-900">HSK<span className="text-blue-600">Kit</span></Link><p className="mt-3 max-w-md text-sm leading-6 text-slate-500">A connected HSK 3.0 Level 1–9 study path for placement, published vocabulary, daily learning, listening, and practice.</p></div>
          <nav aria-label="Study links"><h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Study</h2><div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">{studyLinks.map((item) => <Link key={item.href} href={item.href} className="inline-flex min-h-10 items-center text-sm text-slate-600 hover:text-blue-700">{item.label}</Link>)}</div></nav>
          <nav aria-label="Standards links"><h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Standards</h2><div className="mt-3 grid gap-2">{guideLinks.map((item) => <Link key={item.href} href={item.href} className="inline-flex min-h-10 items-center text-sm text-slate-600 hover:text-blue-700">{item.label}</Link>)}</div></nav>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/privacy-policy" className="text-sm text-slate-500 hover:text-slate-900">Privacy Policy</Link>
          <Link href="/terms-of-service" className="text-sm text-slate-500 hover:text-slate-900">Terms of Service</Link>
          <Link href="/disclaimer" className="text-sm text-slate-500 hover:text-slate-900">Disclaimer</Link>
          <Link href="/contact" className="text-sm text-slate-500 hover:text-slate-900">Contact</Link>
        </div>
        <p className="mt-5 text-center text-[13px] text-slate-500">© 2026 HSKKit</p>
        <p className="mx-auto mt-2 max-w-[800px] text-center text-[13px] leading-relaxed text-slate-500">{disclaimer}</p>
      </div>
    </footer>
  );
}
