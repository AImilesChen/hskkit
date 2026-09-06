"use client";

import "./(console)/admin.css";

export default function AdminError() {
  return (
    <main className="admin-console">
      <section className="admin-error" role="alert">
        <span className="admin-kicker">HSKKit operations</span>
        <h1>Admin data is temporarily unavailable</h1>
        <p>The database is busy. No data was changed. Please retry this request.</p>
        <button type="button" onClick={() => window.location.reload()}>Try again</button>
      </section>
    </main>
  );
}
