import type { ReactNode } from "react";
import { categoryIconNames, topicIconFor, topicVisualFor } from "@/lib/topics/visuals";

type IconProps = { name: string; className?: string; title?: string };

export function TopicIcon({ name, className = "size-6", title }: IconProps) {
  let paths: ReactNode;
  switch (name) {
    case "calendar-clock":
      paths = <><path d="M6 3v3M18 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v6"/><circle cx="15.5" cy="16.5" r="4.5"/><path d="M15.5 14v2.8l1.8 1"/></>;
      break;
    case "sun-cloud":
      paths = <><circle cx="8" cy="8" r="3"/><path d="M8 2V1M8 15v-1M2 8H1M15 8h-1M3.8 3.8 3 3M13 13l-.8-.8M12.2 3.8 13 3"/><path d="M8 19h10a3 3 0 0 0 .2-6 5 5 0 0 0-9.5 1.5A2.5 2.5 0 0 0 8 19Z"/></>;
      break;
    case "menu-bowl":
      paths = <><path d="M4 4h7v10H4zM6 7h3M6 10h3M13 12h8c0 4-1.8 7-4 7s-4-3-4-7ZM14 21h6M17 4v6M20 5v5"/></>;
      break;
    case "shopping-basket":
      paths = <><path d="m6 10 3-6M18 10l-3-6M3 10h18l-2 9H5l-2-9Z"/><path d="M8 13v3M12 13v3M16 13v3"/></>;
      break;
    case "cooking-pan":
      paths = <><path d="M3 9h13v3a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V9ZM16 11h5"/><path d="M7 5c0-1 1-1 1-2M11 5c0-1 1-1 1-2"/></>;
      break;
    case "departure-ticket":
      paths = <><path d="M3 8a2 2 0 0 0 0 4v5h18v-5a2 2 0 0 0 0-4V5H3v3Z"/><path d="M8 5v12M12 11l6-3-2 3 2 3-6-3Z"/></>;
      break;
    case "transit-route":
      paths = <><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h2a4 4 0 0 0 4-4v-4a4 4 0 0 1 4-4M5 4h4v5H5zM7 9v4"/></>;
      break;
    case "hotel-key":
      paths = <><path d="M4 20V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v15M2 20h20M8 7h5M8 11h2"/><circle cx="17" cy="13" r="2"/><path d="M17 15v3h3"/></>;
      break;
    case "home-sun":
      paths = <><path d="m3 11 9-7 9 7M5 10v10h14V10M9 20v-6h6v6"/><circle cx="18" cy="5" r="2"/></>;
      break;
    case "bowl-chopsticks":
      paths = <><path d="M4 11h16c0 5-3 9-8 9s-8-4-8-9ZM7 23h10M15 2l-2 7M19 3l-3 6"/></>;
      break;
    case "map-route":
      paths = <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6ZM9 3v15M15 6v15"/><circle cx="6" cy="9" r="1.5"/><circle cx="18" cy="14" r="1.5"/><path d="M7.5 9c4 0 5 5 9 5"/></>;
      break;
    case "sunrise":
    default:
      paths = <><path d="M3 18h18M5 14a7 7 0 0 1 14 0M12 3v3M4.2 6.2l2.1 2.1M19.8 6.2l-2.1 2.1"/><path d="M8 21h8"/></>;
  }
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} role={title ? "img" : undefined}>{title ? <title>{title}</title> : null}{paths}</svg>;
}

export function CategoryVisual({ categorySlug, title }: { categorySlug: string; title: string }) {
  const visual = topicVisualFor(categorySlug);
  return <div className={`relative h-[92px] overflow-hidden rounded-2xl border ${visual.border} ${visual.softSurface}`} aria-hidden="true">
    <span className={`absolute -right-5 -top-8 size-24 rounded-full opacity-70 ${visual.iconSurface}`} />
    <span className={`absolute bottom-3 right-8 h-2 w-20 rounded-full opacity-50 ${visual.line}`} />
    <span className={`absolute left-4 top-4 grid size-14 place-items-center rounded-2xl bg-white/85 shadow-sm ${visual.iconText}`}><TopicIcon name={categoryIconNames[categorySlug]} className="size-8" /></span>
    <span className={`absolute bottom-3 left-4 text-[11px] font-black uppercase tracking-[0.14em] ${visual.mutedText}`}>{visual.label}</span>
    <span className="sr-only">{title} scene</span>
  </div>;
}

export function TopicScene({ topicSlug, categorySlug, title }: { topicSlug: string; categorySlug: string; title: string }) {
  const visual = topicVisualFor(categorySlug);
  return <div className={`relative h-[84px] overflow-hidden rounded-2xl border ${visual.border} ${visual.softSurface}`} aria-hidden="true">
    <span className={`absolute -right-4 -top-5 size-20 rounded-full opacity-75 ${visual.iconSurface}`} />
    <span className="absolute bottom-0 left-0 h-8 w-full bg-white/35" />
    <span className={`absolute left-4 top-4 grid size-12 place-items-center rounded-2xl bg-white/90 shadow-sm ${visual.iconText}`}><TopicIcon name={topicIconFor(topicSlug)} className="size-7" /></span>
    <span className={`absolute bottom-3 right-4 text-[10px] font-black uppercase tracking-[0.13em] ${visual.mutedText}`}>{visual.label}</span>
    <span className="sr-only">{title} scene</span>
  </div>;
}

export function TopicHeroScene({ visualKey, categorySlug, title, titleZh }: { visualKey: string; categorySlug: string; title: string; titleZh: string }) {
  const visual = topicVisualFor(categorySlug);
  return <div className={`relative min-h-[190px] overflow-hidden rounded-3xl border p-5 ${visual.border} ${visual.softSurface}`} aria-label={`${title} learning scene`}>
    <span className={`absolute -right-10 -top-10 size-40 rounded-full opacity-70 ${visual.iconSurface}`} aria-hidden="true" />
    <span className={`absolute -bottom-12 left-12 size-32 rounded-full opacity-40 ${visual.iconSurface}`} aria-hidden="true" />
    <div className="relative flex h-full min-h-[150px] flex-col justify-between">
      <div className="flex items-start justify-between gap-4"><span className={`grid size-16 place-items-center rounded-2xl bg-white/90 shadow-sm ${visual.iconText}`}><TopicIcon name={topicIconFor(visualKey)} className="size-9" title={`${title} icon`} /></span><span className={`rounded-full bg-white/75 px-3 py-1 text-xs font-black ${visual.mutedText}`}>{visual.label}</span></div>
      <div><p className={`text-2xl font-black ${visual.text}`} lang="zh-Hans">{titleZh}</p><p className={`mt-1 text-sm font-bold ${visual.mutedText}`}>{title}</p></div>
    </div>
  </div>;
}
