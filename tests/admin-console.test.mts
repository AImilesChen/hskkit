import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function adminModules() {
  return Promise.all([
    import("../src/lib/admin/domain.ts"),
    import("../src/lib/admin/repository.ts"),
  ]);
}

test("admin allowlist fails closed and authorizes immutable user ids only", async () => {
  const [{ parseAdminUserIds, authorizeAdminIdentity }] = await adminModules();
  assert.deepEqual([...parseAdminUserIds(undefined)], []);
  assert.deepEqual([...parseAdminUserIds(" ,  ")], []);
  assert.deepEqual([...parseAdminUserIds("user_a, user_b,user_a")], ["user_a", "user_b"]);
  assert.throws(() => authorizeAdminIdentity(undefined, "user_a"), /AUTHENTICATION_REQUIRED/);
  assert.throws(() => authorizeAdminIdentity({ userId: "user_x", connection: "google" }, "user_a"), /ADMIN_FORBIDDEN/);
  assert.throws(() => authorizeAdminIdentity({ userId: "user_a", connection: "sync_key" }, "user_a"), /AUTHENTICATION_REQUIRED/);
  assert.deepEqual(authorizeAdminIdentity({ userId: "user_a", connection: "google" }, "user_a"), { userId: "user_a" });
});

test("admin data is minimized and list input is bounded", async () => {
  const [{ maskEmail, maskReference, parseListQuery }] = await adminModules();
  assert.equal(maskEmail("learner@example.com"), "l***@example.com");
  assert.equal(maskEmail(null), null);
  assert.equal(maskReference("cus_1234567890abcdef"), "cus_…cdef");
  assert.equal(maskReference(null), null);
  assert.deepEqual(parseListQuery(new URL("https://hskkit.com/admin/users?page=999999&pageSize=500&q=%20mei%20").searchParams), {
    page: 10000,
    pageSize: 50,
    query: "mei",
  });
});

test("feedback review validates workflow and preserves original submission", async () => {
  const [{ validateFeedbackReview }, { reviewFeedback }] = await adminModules();
  assert.deepEqual(validateFeedbackReview({ reviewStatus: "resolved", adminNote: "  Fixed  " }), {
    reviewStatus: "resolved",
    adminNote: "Fixed",
  });
  assert.throws(() => validateFeedbackReview({ reviewStatus: "deleted" }), /INVALID_REVIEW_STATUS/);
  assert.throws(() => validateFeedbackReview({ reviewStatus: "read", adminNote: "x".repeat(1001) }), /ADMIN_NOTE_TOO_LONG/);

  const operations: Array<{ sql: string; values: unknown[] }> = [];
  const original = { id: "fb_1", review_status: "unread", admin_note: null };
  const db = {
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          operations.push({ sql, values });
          return {
            async first() { return sql.includes("FROM feedback_submissions") ? original : null; },
            async run() { return { meta: { changes: 1 } }; },
          };
        },
      };
    },
    async batch(statements: Array<{ run(): Promise<unknown> }>) { return Promise.all(statements.map((statement) => statement.run())); },
  };
  await reviewFeedback(db as never, "fb_1", { reviewStatus: "resolved", adminNote: "Fixed" }, "admin_1", () => "audit_1", () => "2026-09-06T10:00:00.000Z");
  const update = operations.find(({ sql }) => sql.startsWith("UPDATE feedback_submissions"));
  assert.ok(update);
  assert.doesNotMatch(update.sql, /message\s*=/i);
  assert.ok(operations.some(({ sql }) => sql.includes("INSERT INTO admin_audit_logs")));
  assert.equal(operations.some(({ values }) => values.includes("The review button is stuck.")), false);
});

test("admin pages, protected APIs, migration and mobile containment are wired without payment controls", async () => {
  const files = await Promise.all([
    readFile(new URL("../migrations/0035_admin_console.sql", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/admin/access.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/admin/(console)/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/admin/(console)/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/admin/(console)/users/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/admin/(console)/subscriptions/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/admin/(console)/feedback/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/admin/(console)/admin.css", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/v1/admin/overview/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/v1/admin/feedback/[id]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/admin/repository.ts", import.meta.url), "utf8"),
    readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
  ]);
  const [migration, access, layout, overview, users, subscriptions, feedback, css, overviewRoute, feedbackRoute, repository, nextConfig] = files;
  assert.match(migration, /review_status[\s\S]*unread[\s\S]*read[\s\S]*resolved/);
  assert.match(migration, /CREATE TABLE admin_audit_logs/);
  assert.match(access, /ADMIN_USER_IDS/);
  assert.match(access, /private, no-store/);
  assert.match(access, /X-Frame-Options/);
  assert.match(layout, /robots:\s*\{\s*index:\s*false/);
  assert.match(layout, /requireAdmin/);
  assert.match(overview, /Registrations/);
  assert.match(users, /Search users/);
  assert.match(subscriptions, /Stripe mode/);
  assert.match(feedback, /Feedback/);
  assert.match(css, /overflow-x:\s*auto/);
  assert.match(css, /@media\s*\(max-width:\s*640px\)/);
  assert.match(css, /admin-console \+ \.feedback-trigger\{display:none\}/);
  assert.match(overviewRoute, /requireAdmin/);
  assert.match(feedbackRoute, /PATCH/);
  const fullSurface = files.join("\n");
  assert.match(fullSurface, /s\.user_id=a\.user_id/);
  assert.match(fullSurface, /p\.owner_id='user:'\|\|a\.user_id/);
  assert.match(fullSurface, /const ownerId = `user:\$\{userId\}`/);
  assert.match(nextConfig, /source: "\/admin\/:path\*"/);
  assert.match(nextConfig, /X-Frame-Options[\s\S]*DENY/);
  assert.match(nextConfig, /X-Robots-Tag[\s\S]*noindex/);
  assert.doesNotMatch(fullSurface, /s\.owner_id=a\.user_id/);
  assert.doesNotMatch(fullSurface, /refund subscription|cancel subscription|adjust entitlement/i);
});

test("admin navigation disables automatic route prefetch to prevent D1 request bursts", async () => {
  const [navigation, users, components] = await Promise.all([
    readFile(new URL("../src/app/admin/(console)/admin-navigation.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/admin/(console)/users/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/admin/(console)/components.tsx", import.meta.url), "utf8"),
  ]);

  for (const [name, source] of [["navigation", navigation], ["users", users], ["components", components]] as const) {
    const links = source.match(/<Link\b[^>]*>/g) || [];
    assert.ok(links.length > 0, `${name} should contain admin links`);
    for (const link of links) assert.match(link, /prefetch=\{false\}/, `${name} link must not prefetch: ${link}`);
  }
});

test("admin navigation exposes the current section and immediate pending feedback", async () => {
  const [layout, navigation, css] = await Promise.all([
    readFile(new URL("../src/app/admin/(console)/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/admin/(console)/admin-navigation.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/admin/(console)/admin.css", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /<AdminNavigation\s*\/>/);
  assert.match(navigation, /usePathname/);
  assert.match(navigation, /aria-current=\{isCurrent \? "page" : undefined\}/);
  assert.match(navigation, /aria-busy=\{!!pendingHref\}/);
  assert.match(navigation, /setPendingHref\(item\.href\)/);
  assert.match(navigation, /Loading…/);
  assert.match(css, /admin-nav a\[aria-current="page"\]/);
  assert.match(css, /admin-nav a\.is-pending/);
});

test("admin D1 retry is bounded and only retries overload errors", async () => {
  const [{ withAdminD1Retry, AdminStorageUnavailableError }] = await adminModules();
  assert.equal(typeof withAdminD1Retry, "function");
  const waits: number[] = [];
  let attempts = 0;
  const result = await withAdminD1Retry(async () => {
    attempts += 1;
    if (attempts < 3) throw new Error("D1_ERROR: D1 DB is overloaded. Requests queued for too long.");
    return "ok";
  }, async (milliseconds: number) => { waits.push(milliseconds); });
  assert.equal(result, "ok");
  assert.equal(attempts, 3);
  assert.deepEqual(waits, [40, 120]);

  attempts = 0;
  await assert.rejects(
    withAdminD1Retry(async () => {
      attempts += 1;
      throw new Error("D1_ERROR: D1 DB is overloaded. Requests queued for too long.");
    }, async () => {}),
    AdminStorageUnavailableError,
  );
  assert.equal(attempts, 3);

  attempts = 0;
  await assert.rejects(withAdminD1Retry(async () => {
    attempts += 1;
    throw new Error("D1_ERROR: no such column");
  }, async () => {}), /no such column/);
  assert.equal(attempts, 1);
});

test("admin renders a retryable fallback when D1 remains unavailable", async () => {
  const source = await readFile(new URL("../src/app/admin/error.tsx", import.meta.url), "utf8").catch(() => "");
  assert.match(source, /Admin data is temporarily unavailable/);
  assert.match(source, /reset\(\)/);
  assert.match(source, /Try again/);
});

test("admin feedback is a compact read-only list and hides identity fields for anonymous messages", async () => {
  const [page, repository] = await Promise.all([
    readFile(new URL("../src/app/admin/(console)/feedback/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/admin/repository.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /email\s*&&/);
  assert.match(page, /accountUserId\s*&&/);
  assert.match(page, />Account</);
  assert.match(page, />Email</);
  assert.match(page, /admin-feedback-message/);
  assert.doesNotMatch(page, /Search feedback|Review status|Internal note|Save review|<Badge|>Page<|>Device<|Anonymous/);
  assert.match(repository, /LEFT JOIN account_oauth_identities/);
  assert.match(repository, /account_user_id/);
  const feedbackRepository = repository.slice(
    repository.indexOf("export async function listAdminFeedback"),
    repository.indexOf("export async function reviewFeedback"),
  );
  assert.doesNotMatch(feedbackRepository, /maskEmail\(row\.email/);
});
