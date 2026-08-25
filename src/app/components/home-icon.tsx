import type { SVGProps } from "react";

export type HomeIconName =
  | "arrow"
  | "book"
  | "calendar"
  | "check"
  | "file"
  | "grammar"
  | "headphones"
  | "pencil"
  | "reading"
  | "route"
  | "search"
  | "target"
  | "timer"
  | "review";

type Props = SVGProps<SVGSVGElement> & { name: HomeIconName };

export default function HomeIcon({ name, ...props }: Props) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
    ...props,
  };

  switch (name) {
    case "arrow":
      return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case "book":
      return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z"/></svg>;
    case "calendar":
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 15h3M8 18h6"/></svg>;
    case "check":
      return <svg {...common}><path d="m5 12 4 4L19 6"/></svg>;
    case "file":
      return <svg {...common}><path d="M6 2h8l4 4v16H6zM14 2v5h5M9 13h6M9 17h4"/></svg>;
    case "grammar":
      return <svg {...common}><path d="M4 5h10M9 5c0 6-2 10-5 13M7 11c1.5 2.5 3.5 4.5 6 6M14 11l3 9M20 20l-3-9-3 9M15 17h4"/></svg>;
    case "headphones":
      return <svg {...common}><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M18 19h-2v-6h4v4a2 2 0 0 1-2 2ZM6 19h2v-6H4v4a2 2 0 0 0 2 2Z"/></svg>;
    case "pencil":
      return <svg {...common}><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10zM14 7l3 3M4 20l1-4 3 3"/></svg>;
    case "reading":
      return <svg {...common}><path d="M4 4h6a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4z"/><path d="M20 4h-4a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h4z"/></svg>;
    case "route":
      return <svg {...common}><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h3a3 3 0 0 0 3-3v-6a3 3 0 0 1 3-3"/></svg>;
    case "search":
      return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
    case "target":
      return <svg {...common}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m15 9 5-5M16 4h4v4"/></svg>;
    case "timer":
      return <svg {...common}><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6M12 2v3"/></svg>;
    case "review":
      return <svg {...common}><path d="M20 7v5h-5M4 17v-5h5"/><path d="M7.2 7.2A7 7 0 0 1 20 12M4 12a7 7 0 0 0 12.8 4.8"/></svg>;
  }
}
