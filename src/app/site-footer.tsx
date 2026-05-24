const disclaimer =
  "HSKKit is an independent study tool and is not affiliated with, endorsed by, sponsored by, or operated by any HSK test organizer or trademark owner.";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-links">
          <a href="/privacy-policy">Privacy</a>
          <a href="/terms-of-service">Terms</a>
          <a href="mailto:support@hskkit.com">support@hskkit.com</a>
        </div>
        <p className="site-footer-copy">© 2026 HSKKit</p>
        <p className="site-footer-disclaimer">{disclaimer}</p>
      </div>
    </footer>
  );
}
