"use client";

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { SIGN_IN_NOTICE_PARAM } from '@/lib/account/sign-in';
import styles from './sign-in-progress-notice.module.css';

export default function SignInProgressNotice() {
  const [visible, setVisible] = useState(false);
  const requested = useRef(false);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get(SIGN_IN_NOTICE_PARAM) === '1') requested.current = true;
    if (!requested.current) return;
    url.searchParams.delete(SIGN_IN_NOTICE_PARAM);
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    if (/^\/account(?:\/|$)/.test(url.pathname)) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    void fetch('/api/v1/account', { cache: 'no-store', signal: controller.signal })
      .then(async response => response.ok ? response.json() : undefined)
      .then(data => { if (!controller.signal.aborted) setVisible(Boolean(data?.account && data?.guest?.hasData)); })
      .catch(() => undefined)
      .finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);
  if (!visible) return null;
  return <aside className={styles.notice} aria-label="Guest progress" role="status"><p><strong>Your guest progress is ready to review.</strong><span>Choose what to merge, or keep learning for now.</span></p><div><Link prefetch={false} href="/account#guest-progress">Review progress</Link><button type="button" onClick={() => setVisible(false)}>Not now</button></div></aside>;
}
