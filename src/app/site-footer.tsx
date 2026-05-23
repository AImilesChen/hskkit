const disclaimer =
  "HSKKit is an independent study tool and is not affiliated with, endorsed by, sponsored by, or operated by any HSK test organizer or trademark owner.";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <span>© 2026 HSKKit</span>
      <a href="/privacy-policy">Privacy</a>
      <a href="/terms-of-service">Terms</a>
      <a href="mailto:support@hskkit.com">support@hskkit.com</a>
      <p className="footerDisclaimer">{disclaimer}</p>
    </footer>
  );
}
