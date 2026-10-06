"use client";

import type { MouseEvent } from "react";

export default function GoogleSignInLink({ href, children }: { href: string; children: React.ReactNode }) {
  function start(event: MouseEvent<HTMLAnchorElement>) {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timezone) return;
    event.preventDefault();
    const url = new URL(href, window.location.origin);
    url.searchParams.set("timezone", timezone);
    window.location.assign(url.toString());
  }

  return <a className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-base font-bold text-white hover:bg-blue-700" href={href} onClick={start}>{children}</a>;
}
