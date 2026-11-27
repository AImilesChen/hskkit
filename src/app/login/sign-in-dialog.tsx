"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { googleSignInHref } from "@/lib/account/sign-in";
import GoogleSignInLink from "./google-sign-in-link";
import styles from "./sign-in-dialog.module.css";

export default function SignInDialog({ open, returnTo, onClose }: { open: boolean; returnTo: string; onClose(): void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [openingGoogle, setOpeningGoogle] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    element.showModal();
    const reset = () => { setOpeningGoogle(false); setSlow(false); };
    window.addEventListener("pageshow", reset);
    return () => {
      window.removeEventListener("pageshow", reset);
      element.close();
      reset();
    };
  }, [open]);

  useEffect(() => {
    if (!openingGoogle) return;
    const timer = setTimeout(() => { setOpeningGoogle(false); setSlow(true); }, 10_000);
    return () => clearTimeout(timer);
  }, [openingGoogle]);

  function startGoogle(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (openingGoogle) { event.preventDefault(); return; }
    setSlow(false);
    setOpeningGoogle(true);
  }

  return <dialog ref={dialog} id="site-sign-in-dialog" className={styles.dialog} aria-labelledby="site-sign-in-title" aria-describedby="site-sign-in-description" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  }}>
    <button type="button" className={styles.close} aria-label="Close sign-in" onClick={onClose}><span aria-hidden="true">×</span></button>
    <div className={styles.brand} aria-hidden="true">学</div>
    <p className={styles.kicker}>Your learning, connected</p>
    <h2 id="site-sign-in-title">Welcome to HSKKit</h2>
    <p id="site-sign-in-description" className={styles.description}>Sign in or create your account to save your progress and continue across devices.</p>
    <GoogleSignInLink href={googleSignInHref(returnTo)} currentPage className={styles.google} onClick={startGoogle} aria-disabled={openingGoogle}>
      <svg aria-hidden="true" viewBox="0 0 48 48" width="20" height="20"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.03 46.98 31.92 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.27-3.13.78-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>
      {openingGoogle ? "Opening Google…" : "Continue with Google"}
    </GoogleSignInLink>
    <p className={styles.status} role="status" aria-live="polite">{slow ? "Google is taking longer to open. You can try again." : openingGoogle ? "Connecting to Google securely…" : "New here? Your account is created when you continue."}</p>
    <div className={styles.guest}><p>Your guest progress stays here. You choose whether to merge it after signing in.</p><button type="button" onClick={onClose}>Keep browsing</button></div>
    <p className={styles.legal}><a href="/privacy-policy">Privacy Policy</a><span aria-hidden="true">·</span><a href="/terms-of-service">Terms of Service</a></p>
  </dialog>;
}
