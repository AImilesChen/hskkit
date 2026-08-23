"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function PdfPackPurchase() {
  const [level, setLevel] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [commerceEnabled, setCommerceEnabled] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/commercial/config")
      .then((response) => response.json())
      .then((config) => {
        if (active) setCommerceEnabled(config.enabled === true);
      })
      .catch(() => {
        if (active) setCommerceEnabled(false);
      })
      .finally(() => {
        if (active) setConfigLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  async function checkout() {
    if (!commerceEnabled) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/v1/commercial/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ level, idempotencyKey: `pdf-pack-${level}-${crypto.randomUUID()}` }),
      });
      const data = await response.json();
      if (response.status === 401) {
        setMessage("Sign in or create your private HSKKit account before purchasing.");
        return;
      }
      if (!response.ok) throw new Error(data.error || "Checkout could not start");
      if (data.checkoutUrl) location.assign(data.checkoutUrl);
      else setMessage(`Order ${data.orderId} is already ${data.status}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout could not start");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <label htmlFor="pack-level" className="block font-semibold text-slate-950">Choose one HSK 3.0 level</label>
      <select id="pack-level" value={level} onChange={(event) => setLevel(Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 sm:max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7].map((value) => <option key={value} value={value}>Level {value}</option>)}
      </select>
      <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-slate-600">
        <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-5 w-5" />
        <span>I understand this is a one-time digital purchase for one selected level: up to 3 successful downloads, expiring 14 days after the first file is ready. Refund requests are manually reviewed and generally require zero successful downloads within 7 UTC days, except where law requires otherwise.</span>
      </label>
      <button type="button" disabled={!commerceEnabled||!accepted||busy} onClick={checkout} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-6 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
        {busy ? "Opening secure checkout…" : "Buy selected level — US$9.99"}
      </button>
      {message && <p role="status" className="mt-4 text-sm text-amber-800">{message} {message.startsWith("Sign in") && <Link className="font-bold underline" href="/account">Open account</Link>}</p>}
      <p className="mt-4 text-xs leading-5 text-slate-500">
        {!configLoaded ? "Checking purchase availability…" : commerceEnabled ? "Test checkout only during release validation. No live payment collection is enabled." : "Purchasing is not available in this release."}
      </p>
    </div>
  );
}
