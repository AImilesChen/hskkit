import Link from "next/link";

export type LearningLoopLabel = "Today" | "Review" | "Mistakes" | "Listen";

const links: Array<{ label: LearningLoopLabel; href: string }> = [
  { label: "Today", href: "/today" },
  { label: "Review", href: "/review" },
  { label: "Mistakes", href: "/mistakes" },
  { label: "Listen", href: "/listen" },
];

export default function LearningLoopNav({ active }: { active: LearningLoopLabel }) {
  return <nav aria-label="Learning loop">{links.map((link) => <Link
    key={link.href}
    href={link.href}
    prefetch={false}
    aria-current={active === link.label ? "page" : undefined}
    className={`${active === link.label ? "border-blue-600 bg-blue-600 text-white" : ""} px-3`}
  >{link.label}</Link>)}</nav>;
}
