"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const sections = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/feedback", label: "Feedback" },
] as const;

function matchesSection(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNavigation() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => setPendingHref(null), [pathname]);

  return (
    <nav className="admin-nav" aria-label="Admin sections" aria-busy={!!pendingHref}>
      {sections.map((item) => {
        const isCurrent = matchesSection(pathname, item.href);
        const isPending = pendingHref === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            aria-current={isCurrent ? "page" : undefined}
            className={isPending ? "is-pending" : undefined}
            onClick={(event) => {
              if (!isCurrent && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                setPendingHref(item.href);
              }
            }}
          >
            <span>{item.label}</span>
            {isPending && <span className="admin-nav-loading" role="status">Loading…</span>}
          </Link>
        );
      })}
    </nav>
  );
}
