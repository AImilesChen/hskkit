"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { encodeSignInReturnTo, signInReturnFromPage } from "@/lib/account/sign-in";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; currentPage?: boolean };

export default function GoogleSignInLink({ href, children, currentPage = false, className, onClick, ...props }: Props) {
  function start(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    const url = new URL(href, window.location.origin);
    if (currentPage) url.searchParams.set('returnTo', encodeSignInReturnTo(signInReturnFromPage(`${window.location.pathname}${window.location.search}${window.location.hash}`)));
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone) url.searchParams.set("timezone", timezone);
    } catch { /* The browser's timezone is optional. */ }
    event.currentTarget.href = url.toString();
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === '_blank') return;
    event.preventDefault();
    window.location.assign(url.toString());
  }

  return <a {...props} className={className ?? "inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-base font-bold text-white hover:bg-blue-700"} href={href} onClick={start}>{children}</a>;
}
