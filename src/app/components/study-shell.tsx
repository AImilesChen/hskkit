import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";

export function StudyHeader() {
  return <SiteHeader />;
}

export function StudyFooter() {
  return <SiteFooter />;
}

export function StudyPage({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900"><SiteHeader />{children}<SiteFooter /></div>;
}
