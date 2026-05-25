const disclaimer =
  "HSKKit is an independent study tool and is not affiliated with, endorsed by, sponsored by, or operated by any HSK test organizer or trademark owner.";

export default function SiteFooter() {
  return (
    <footer className="py-10 border-t border-[#E2E8F0] text-center">
      <div className="max-w-[1200px] mx-auto px-8 max-sm:px-4">
        <div className="flex justify-center gap-6 flex-wrap mb-4">
          <a href="/privacy-policy" className="text-sm text-[#64748B] no-underline hover:text-[#0F172A]">Privacy Policy</a>
          <a href="/terms-of-service" className="text-sm text-[#64748B] no-underline hover:text-[#0F172A]">Terms of Service</a>
          <a href="/hsk-levels" className="text-sm text-[#64748B] no-underline hover:text-[#0F172A]">HSK Levels</a>
          <a href="mailto:support@hskkit.com" className="text-sm text-[#64748B] no-underline hover:text-[#0F172A]">Contact</a>
        </div>
        <p className="text-[13px] text-[#64748B] mb-2">© 2026 HSKKit</p>
        <p className="text-[12px] text-[#94A3B8] max-w-[800px] mx-auto leading-relaxed">{disclaimer}</p>
      </div>
    </footer>
  );
}
