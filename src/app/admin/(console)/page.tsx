import AdminDashboard from "./admin-dashboard";

export default function AdminOverviewPage() {
  // The enclosing layout still requires the existing admin allowlist. Registrations
  // and other live operational totals load independently from cached SEO reports.
  return <AdminDashboard />;
}
