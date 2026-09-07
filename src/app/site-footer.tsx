import Link from "next/link";

const studyLinks = [
  { href: "/levels", label: "Levels 1–9" },
  { href: "/vocabulary/1", label: "Vocabulary" },
  { href: "/dictionary", label: "Dictionary" },
  { href: "/today", label: "Today" },
  { href: "/listen", label: "Listening" },
  { href: "/account", label: "Account" },
  { href: "/exports", label: "Exports" },
  { href: "/pricing", label: "Pricing" },
];

const guideLinks = [
  { href: "/hsk-3-0", label: "HSK 3.0 guide" },
  { href: "/hsk-2-0-vs-3-0", label: "HSK 2.0 vs 3.0" },
  { href: "/content-license", label: "Content sources" },
];

const legalLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-of-service", label: "Terms of Service" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/contact", label: "Contact" },
];

const disclaimer = "HSKKit is an independent study tool and is not affiliated with, endorsed by, sponsored by, or operated by any HSK test organizer or trademark owner.";

const headingClass = "footer-group-heading mb-[24px] text-[13px] font-bold uppercase leading-[16px] tracking-[0.06em] text-slate-900";
const navLinkClass = "footer-nav-link inline-flex min-h-11 items-center lg:min-h-[20px] text-sm leading-5 text-slate-600 transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";
const legalLinkClass = "footer-legal-link inline-flex min-h-11 items-center text-sm leading-5 text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";

export default function SiteFooter() {
  return (
    <footer className="footer-density-shell mt-auto border-t border-slate-200 bg-white pt-[48px] sm:pt-[64px] pb-[32px]">
      <div className="footer-density-container mx-auto max-w-[1060px] px-[20px] sm:px-[32px]">
        <div className="footer-density-main grid gap-y-[32px] border-b border-slate-200 lg:grid-cols-[320px_320px_180px] lg:gap-x-[64px] pb-[48px] md:grid-cols-[320px_180px] md:justify-between">
          <div className="max-w-[320px] md:col-span-2 lg:col-span-1">
            <Link prefetch={false} href="/" className="inline-flex min-h-11 items-center gap-3 text-2xl font-bold text-slate-900">
              <span aria-hidden="true" className="grid h-[32px] w-[32px] place-items-center rounded-[8px] bg-blue-600 text-sm font-bold text-white">学</span>
              HSKKit
            </Link>
            <p className="mt-4 max-w-[320px] text-sm leading-[22px] text-slate-500">
              A connected HSK 3.0 Level 1–9 study path for placement, published vocabulary, daily learning, listening, and practice.
            </p>
          </div>

          <nav aria-label="Study links">
            <h2 className={headingClass}>Study</h2>
            <div className="footer-study-links grid grid-cols-2 gap-x-[24px] gap-y-0 sm:grid-cols-[repeat(2,130px)] sm:gap-x-[32px] lg:gap-y-[14px]">
              {studyLinks.map((item) => (
                <Link prefetch={false} key={item.href} href={item.href} className={navLinkClass}>{item.label}</Link>
              ))}
            </div>
          </nav>

          <nav aria-label="Standards links">
            <h2 className={headingClass}>Standards</h2>
            <div className="footer-standards-links grid gap-y-0 lg:gap-y-[14px]">
              {guideLinks.map((item) => (
                <Link prefetch={false} key={item.href} href={item.href} className={navLinkClass}>{item.label}</Link>
              ))}
            </div>
          </nav>
        </div>

        <div className="footer-legal-links mt-[28px] flex flex-wrap items-center justify-center gap-x-[28px] gap-y-[10px]">
          {legalLinks.map((item) => (
            <Link prefetch={false} key={item.href} href={item.href} className={legalLinkClass}>{item.label}</Link>
          ))}
        </div>
        <p className="footer-copyright mt-[24px] text-center text-[13px] leading-[18px] text-slate-500">© 2026 HSKKit</p>
        <p className="mx-auto mt-2 max-w-[800px] text-center text-[13px] leading-relaxed text-slate-500">{disclaimer}</p>
      </div>
    </footer>
  );
}
