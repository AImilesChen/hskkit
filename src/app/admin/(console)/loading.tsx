export default function AdminLoading() {
  return (
    <section className="admin-loading" aria-busy="true" aria-live="polite">
      <span className="admin-loading-spinner" aria-hidden="true" />
      <div>
        <strong>Loading admin data…</strong>
        <p>The current section will stay selected while this request completes.</p>
      </div>
    </section>
  );
}
