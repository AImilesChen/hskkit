import type { ReactNode } from "react";
import { topicIconFor, topicVisualFor } from "@/lib/topics/visuals";
import { topicCoverFor } from "@/lib/topics/covers";

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

function sceneImage(categorySlug: string) {
  return ["daily-life", "food-drink", "travel-transport"].includes(categorySlug) ? categorySlug : "daily-life";
}

export function CategoryVisual({ categorySlug }: { categorySlug: string; title: string }) {
  return <div className="topics-category-art" aria-hidden="true">
    <img src={`/illustrations/${sceneImage(categorySlug)}.webp`} alt="" width="768" height="512" loading="lazy" decoding="async" />
  </div>;
}

export function TopicScene({ topicSlug, categorySlug }: { topicSlug: string; categorySlug: string; title: string }) {
  const visual = topicVisualFor(categorySlug);
  const cover = topicCoverFor(topicSlug);
  return <div className="topics-scene" aria-hidden="true">
    <img src={cover ?? `/illustrations/${sceneImage(categorySlug)}.webp`} alt="" width="960" height="640" loading="lazy" decoding="async" />
    <span className={`topics-scene-icon ${visual.iconText}`}><TopicIcon name={topicIconFor(topicSlug)} className="size-6" /></span>
    <span className="topics-scene-label">{visual.label}</span>
  </div>;
}

export function TopicHeroScene({ visualKey, categorySlug }: { visualKey: string; categorySlug: string; title: string; titleZh: string }) {
  const cover = topicCoverFor(visualKey);
  return <div className="topics-hero-art" aria-hidden="true">
    <img src={cover ?? `/illustrations/${sceneImage(categorySlug)}.webp`} alt="" width="960" height="640" decoding="async" />
  </div>;
}
