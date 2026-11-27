# Admin operations dashboard

## Scope and data

The existing allowlisted `/admin` console gains a dashboard. Users, subscriptions,
feedback, account permissions, public pages, tracking scripts and consent behavior
are unchanged. The overview API remains the source of live operational counts.
SEO metrics use a separate authenticated snapshot API; one failure does not block
other panels. There is no public dashboard or anonymous refresh endpoint.

GSC: property-level clicks, impressions, CTR, average position, daily clicks, ten
keywords and ten pages. Property totals are fetched separately rather than summed
from limited keyword tables. Uses finalized Web Search data, through three days
before the Pacific calendar day. GA4: period-wide active users, sessions, pageviews,
Organic Search sessions, daily sessions and ten landing pages. Its date window ends
two days before the Pacific calendar day; dates are interpreted in the property
timezone returned by GA4. Each panel displays its actual dates and timezone.
The 7/28/90-day selector applies to provider reports; operational totals remain
current totals and explicitly label rolling 24-hour and last-seven-days registrations.
Percentage changes compare equal-length preceding periods. A zero baseline has no
invented percentage. Missing data uses a dash and connection state, not fake zeros.

## Read-only provider access

Administrators can now use the protected **Connect Google reports** form on the
dashboard. This POST requires the existing admin session and a same-origin request.
The flow uses the existing Google OAuth client and registered callback, PKCE, and
an encrypted `__Host-` state cookie bound to the initiating admin for ten minutes.
Only reporting-prefixed callbacks are internally rewritten to the dedicated admin
handler; ordinary login callbacks, scopes, sessions and learning state are unchanged.

The Google consent screen asks for `webmasters.readonly` and `analytics.readonly`
with offline access. A successful grant is stored as one encrypted D1 row. AES-GCM
uses an HKDF-derived, purpose-separated key from the existing Google client secret;
the raw refresh token and client secret are never returned to the dashboard or logs.
The existing domain property and numeric GA4 property `538727924` are reused unless
explicit operator configuration overrides them. The callback collects the first
28-day report; other windows are filled on first explicit selection or daily.
Failed/cancelled grants keep the last successful connection and existing reports.

The project already has GA4 collection and GSC verification; do not reinstall them.
Reporting needs server-side read access to those **existing** properties. The
following secrets/configuration are supported on the main Worker only
(never `NEXT_PUBLIC_`):

- `ADMIN_ANALYTICS_GSC_SITE`: exact existing property, e.g. `sc-domain:hskkit.com`.
- `ADMIN_ANALYTICS_GA4_PROPERTY_ID`: existing numeric property ID; **not** `G-...`.
- `ADMIN_ANALYTICS_GOOGLE_SERVICE_ACCOUNT`: service-account JSON with Viewer access
  to the existing GA4 property and suitable read access to the existing GSC site.
- Alternatively `ADMIN_ANALYTICS_GOOGLE_REFRESH_TOKEN`, issued with
  `webmasters.readonly` and `analytics.readonly`, together with the existing
  `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Ordinary website-login tokens do
  not confer reporting permissions. Do not enlarge login scopes for learners.

No credential is created or permission changed by this implementation. Whether
production already has reporting credentials must be verified before activation.
Plausible and Ahrefs retain links; no unsupported API access or paid plan is assumed.

## Storage, sync and release

Migration `0060_admin_analytics_snapshots.sql` defines two bounded internal tables.
On first authorized use, the application initializes these cache tables through
its existing D1 binding if absent. A fixed atomic batch uses CREATE IF NOT EXISTS
and INSERT OR IGNORE, never arbitrary SQL or updates to business tables. Normal
reads do not repeat schema writes. Deployment credentials need no new D1 management
permission. The checked-in migration remains compatible and idempotent.
There are at most six snapshot rows (two providers × three ranges), with payloads
limited to 64,000 bytes each, plus one lock row. Updates replace the current snapshot;
failures update status while retaining the last good payload. No R2 objects are
created. Concurrent syncs share a DB lease; each provider/range is throttled for
15 minutes including failures. Provider HTTP requests time out after eight seconds,
without retry loops; errors are sanitized before being stored or sent to the UI.

- GET `/api/v1/admin/analytics?days=7|28|90`: allowlisted session; reads snapshots
  only (initializing its fixed cache schema on first authorized use if absent),
  never invokes third-party APIs. `private, no-store` and `noindex` are inherited
  from the existing admin response helper. Storage failures show a retryable error.
- POST same URL: allowlisted session **and** same-origin Origin required. Manually
  refreshes the selected window. Concurrent collection returns 409; recent attempt
  returns `recent`. Other API failures keep previously shown good data.
- `workers/admin-analytics-worker.ts` runs from the existing commercial maintenance
  Worker's unchanged `*/15 * * * *` schedule, only at 09:15 UTC. Its private service
  binding targets the main Worker's named `AdminAnalyticsSync` entrypoint. No new
  Worker, cron trigger, Google secret or R2 binding is created. Existing export queue
  processing and export cleanup run unchanged; either task can fail independently.
  The reporting entrypoint only accepts the three fixed windows and uses the main
  Worker's existing database binding and encrypted connection. Deployment verification
  checks the actual service target, entrypoint and existing schedule.
  The standalone `wrangler-admin-analytics.jsonc` is not deployed by production CI.

Before production: verify the exact current production source, configure already-authorized
reporting credentials/property IDs, deploy the main app and scheduler, and validate
one authenticated sync plus anonymous denial. Verify successful snapshots for both
providers and all ranges. Merely building or deploying a scheduler is **not** proof
that production data has been connected. Unconfigured sources must remain labeled
as waiting for report access. No remote migration or deployment has been done here.

Official references:
- https://developers.google.com/webmaster-tools/v1/searchanalytics/query
- https://developers.google.com/analytics/devguides/reporting/data/v1/basics
- https://developers.google.com/identity/protocols/oauth2/service-account
