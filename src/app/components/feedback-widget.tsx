"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { usePathname } from "next/navigation";

type FeedbackType = "bug" | "suggestion" | "other";

function browserCategory(): string {
  const userAgent = navigator.userAgent;
  if (/Edg\//.test(userAgent)) return "Edge";
  if (/Firefox\//.test(userAgent)) return "Firefox";
  if (/Chrome\//.test(userAgent)) return "Chrome";
  if (/Safari\//.test(userAgent)) return "Safari";
  return "Other";
}

function deviceCategory(): "desktop" | "mobile" | "tablet" {
  if (window.innerWidth < 600) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
}

export function FeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const idempotencyRef = useRef("");

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  function closeDialog() {
    setOpen(false);
    setError("");
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function openDialog() {
    setOpen(true);
    setSubmitted(false);
    setError("");
  }

  function trapDialogFocus(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) || []);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setError("Please enter a message.");
      return;
    }
    setSubmitting(true);
    setError("");
    if (!idempotencyRef.current) idempotencyRef.current = crypto.randomUUID();

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": idempotencyRef.current,
        },
        body: JSON.stringify({
          type,
          message: trimmedMessage,
          email: email.trim() || null,
          pagePath: `${window.location.pathname}${window.location.search}`,
          browserCategory: browserCategory(),
          deviceCategory: deviceCategory(),
        }),
      });
      if (!response.ok) {
        if (response.status === 429) throw new Error("rate_limited");
        throw new Error("request_failed");
      }
      setSubmitted(true);
      setMessage("");
      setEmail("");
      idempotencyRef.current = "";
    } catch (requestError) {
      setError(requestError instanceof Error && requestError.message === "rate_limited"
        ? "Please wait and try again."
        : "Feedback could not be sent. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button ref={triggerRef} className={`feedback-trigger${pathname.startsWith("/reading") ? " feedback-trigger--reading" : ""}`} type="button" aria-label="Send feedback" onClick={openDialog}>
        <span aria-hidden="true">✦</span><span>Feedback</span>
      </button>
      {open && (
        <div className="feedback-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
          <aside
            ref={dialogRef}
            className="feedback-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
            onKeyDown={trapDialogFocus}
          >
            <button ref={closeRef} className="feedback-close" type="button" aria-label="Close feedback" onClick={closeDialog}>×</button>
            {!submitted ? (
              <>
                <p className="feedback-eyebrow">Help us improve</p>
                <h2 id="feedback-title">Send feedback</h2>
                <p className="feedback-intro">Report a bug or share an idea. You can submit anonymously.</p>
                <form className="feedback-form" onSubmit={submit}>
                  <fieldset>
                    <legend>Feedback type</legend>
                    <div className="feedback-types">
                      {(["bug", "suggestion", "other"] as const).map((option) => (
                        <label key={option}>
                          <input type="radio" name="feedback-type" value={option} checked={type === option} onChange={() => setType(option)} />
                          <span>{option[0].toUpperCase() + option.slice(1)}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <label className="feedback-field">
                    <span>Message <small>{message.length}/2,000</small></span>
                    <textarea aria-label="Message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} rows={6} required />
                  </label>
                  <label className="feedback-field">
                    <span>Email (optional)</span>
                    <input aria-label="Email (optional)" type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} autoComplete="email" />
                  </label>
                  <p className="feedback-privacy">We save your message, optional email, current page, and basic browser/device category. Do not include sensitive information.</p>
                  {error && <p className="feedback-error" role="alert">{error}</p>}
                  <button className="btn btn-primary feedback-submit" type="submit" disabled={submitting || !message.trim()}>
                    {submitting ? "Submitting…" : "Submit feedback"}
                  </button>
                </form>
              </>
            ) : (
              <div className="feedback-success">
                <p className="feedback-success-icon" aria-hidden="true">✓</p>
                <h2 id="feedback-title">Thanks for helping us improve.</h2>
                <p>Your feedback was saved.</p>
                <button className="btn btn-primary" type="button" onClick={closeDialog}>Done</button>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
