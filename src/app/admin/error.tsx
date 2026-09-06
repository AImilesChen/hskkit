"use client";

import { useState } from "react";
import "./(console)/admin.css";

export default function AdminError() {
  const [retrying, setRetrying] = useState(false);

  function retry() {
    if (retrying) return;
    setRetrying(true);
    window.setTimeout(() => window.location.reload(), 50);
  }

  return (
    <main className="admin-console">
      <section className="admin-error" role="alert">
        <span className="admin-kicker">HSKKit operations</span>
        <h1>Admin data is temporarily unavailable</h1>
        <p>The database is busy. No data was changed. Please retry this request.</p>
        <button type="button" onClick={retry} disabled={retrying} aria-live="polite">
          {retrying ? "Retrying…" : "Try again"}
        </button>
      </section>
    </main>
  );
}
