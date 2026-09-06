import { escapeLike, maskEmail, maskReference, pageMeta, type ReviewStatus, withAdminD1Retry } from "./domain.ts";

type AdminStatement = {
  bind(...values: unknown[]): AdminStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
};
export type AdminDb = {
  prepare(sql: string): AdminStatement;
  batch(statements: AdminStatement[]): Promise<unknown[]>;
};

type ListOptions = { page: number; pageSize: number; query: string; status?: string; access?: string; mode?: string; type?: string };
type CountRow = { count: number };

async function count(db: AdminDb, sql: string, values: unknown[] = []) {
  const row = await withAdminD1Retry(() => db.prepare(sql).bind(...values).first<CountRow>());
  return Number(row?.count || 0);
}

export async function getAdminOverview(db: AdminDb, now = new Date().toISOString()) {
  const day = new Date(Date.parse(now) - 86_400_000).toISOString();
  const week = new Date(Date.parse(now) - 7 * 86_400_000).toISOString();
  const row = await withAdminD1Retry(() => db.prepare(`SELECT
    (SELECT COUNT(*) FROM accounts) registrations,
    (SELECT COUNT(*) FROM accounts WHERE created_at>=?) registrations_day,
    (SELECT COUNT(*) FROM accounts WHERE created_at>=?) registrations_week,
    (SELECT COUNT(*) FROM promotional_entitlements WHERE kind='welcome_trial' AND status='active' AND ends_at>?) active_trials,
    (SELECT COUNT(*) FROM subscriptions WHERE plan_id='pro_monthly' AND stripe_livemode=1 AND status IN ('active','trialing')) monthly_live,
    (SELECT COUNT(*) FROM subscriptions WHERE plan_id='pro_yearly' AND stripe_livemode=1 AND status IN ('active','trialing')) yearly_live,
    (SELECT COUNT(*) FROM subscriptions WHERE plan_id='pro_monthly' AND stripe_livemode=0 AND status IN ('active','trialing')) monthly_test,
    (SELECT COUNT(*) FROM subscriptions WHERE plan_id='pro_yearly' AND stripe_livemode=0 AND status IN ('active','trialing')) yearly_test,
    (SELECT COUNT(*) FROM feedback_submissions WHERE review_status='unread') unread_feedback,
    (SELECT COUNT(*) FROM feedback_submissions WHERE review_status='resolved') resolved_feedback`).bind(day, week, now).first<Record<string, number>>());
  const metric = (key: string) => Number(row?.[key] || 0);
  return {
    registrations: metric("registrations"),
    registrationsDay: metric("registrations_day"),
    registrationsWeek: metric("registrations_week"),
    activeTrials: metric("active_trials"),
    subscriptions: { live: { monthly: metric("monthly_live"), yearly: metric("yearly_live") }, test: { monthly: metric("monthly_test"), yearly: metric("yearly_test") } },
    feedback: { unread: metric("unread_feedback"), resolved: metric("resolved_feedback") },
  };
}

function userCte() {
  return `WITH user_access AS (
    SELECT a.user_id,a.display_name,a.timezone,a.status,a.created_at,a.updated_at,
      (SELECT email FROM account_oauth_identities oi WHERE oi.user_id=a.user_id AND oi.provider='google' AND oi.email_verified=1 ORDER BY oi.updated_at DESC LIMIT 1) email,
      (SELECT s.plan_id FROM subscriptions s WHERE s.user_id=a.user_id AND s.stripe_livemode=1 AND s.status IN ('active','trialing') ORDER BY s.updated_at DESC LIMIT 1) live_plan,
      (SELECT s.cancel_at_period_end FROM subscriptions s WHERE s.user_id=a.user_id AND s.stripe_livemode=1 AND s.status IN ('active','trialing') ORDER BY s.updated_at DESC LIMIT 1) cancel_at_period_end,
      (SELECT p.ends_at FROM promotional_entitlements p WHERE p.owner_id='user:'||a.user_id AND p.kind='welcome_trial' AND p.status='active' ORDER BY p.ends_at DESC LIMIT 1) trial_ends_at
    FROM accounts a
  )`;
}
function accessExpression() { return "CASE WHEN live_plan='pro_yearly' THEN 'pro_yearly' WHEN live_plan='pro_monthly' THEN 'pro_monthly' WHEN trial_ends_at>? THEN 'trial' ELSE 'free' END"; }

export async function listAdminUsers(db: AdminDb, options: ListOptions, now = new Date().toISOString()) {
  const values: unknown[] = [];
  const where: string[] = [];
  if (options.query) { const q = `%${escapeLike(options.query)}%`; where.push("(display_name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR user_id LIKE ? ESCAPE '\\')"); values.push(q, q, q); }
  if (options.status && ["active", "deleted"].includes(options.status)) { where.push("status=?"); values.push(options.status); }
  if (options.access && ["free", "trial", "pro_monthly", "pro_yearly"].includes(options.access)) { where.push(`${accessExpression()}=?`); values.push(now, options.access); }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const totalRow = await withAdminD1Retry(() => db.prepare(`${userCte()} SELECT COUNT(*) count FROM user_access ${clause}`).bind(...values).first<CountRow>());
  const offset = (options.page - 1) * options.pageSize;
  const result = await withAdminD1Retry(() => db.prepare(`${userCte()} SELECT *,${accessExpression()} access_state FROM user_access ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .bind(now, ...values, options.pageSize, offset).all<Record<string, unknown>>());
  return {
    items: result.results.map((row) => ({ ...row, email: maskEmail(row.email as string | null), user_id: row.user_id, cancel_at_period_end: Boolean(row.cancel_at_period_end) }) as Record<string, unknown>),
    meta: pageMeta(Number(totalRow?.count || 0), options.page, options.pageSize),
  };
}

export async function getAdminUser(db: AdminDb, userId: string, now = new Date().toISOString()) {
  const account = await withAdminD1Retry(() => db.prepare(`${userCte()} SELECT *,${accessExpression()} access_state FROM user_access WHERE user_id=?`).bind(now, userId).first<Record<string, unknown>>());
  if (!account) return null;
  const ownerId = `user:${userId}`;
  const subscriptions = await withAdminD1Retry(() => db.prepare("SELECT id,plan_id,status,cancel_at_period_end,current_period_start,current_period_end,provider_customer_id,provider_subscription_id,stripe_livemode,created_at,updated_at FROM subscriptions WHERE owner_id=? ORDER BY updated_at DESC LIMIT 20").bind(ownerId).all<Record<string, unknown>>());
  const charges = await withAdminD1Retry(() => db.prepare("SELECT id,subscription_id,provider_invoice_id,amount_cents,amount_refunded_cents,currency,status,stripe_livemode,charged_at FROM subscription_charges WHERE owner_id=? ORDER BY created_at DESC LIMIT 20").bind(ownerId).all<Record<string, unknown>>());
  return {
    account: { ...account, email: maskEmail(account.email as string | null), cancel_at_period_end: Boolean(account.cancel_at_period_end) } as Record<string, unknown>,
    subscriptions: subscriptions.results.map(minimizeSubscription),
    charges: charges.results.map((row) => ({ ...row, provider_invoice_id: maskReference(row.provider_invoice_id as string | null) }) as Record<string, unknown>),
  };
}

function minimizeSubscription(row: Record<string, unknown>): Record<string, unknown> {
  return { ...row, cancel_at_period_end: Boolean(row.cancel_at_period_end), stripe_livemode: Boolean(row.stripe_livemode), provider_customer_id: maskReference(row.provider_customer_id as string | null), provider_subscription_id: maskReference(row.provider_subscription_id as string | null) };
}

export async function listAdminSubscriptions(db: AdminDb, options: ListOptions) {
  const values: unknown[] = [];
  const where: string[] = [];
  if (options.query) { const q = `%${escapeLike(options.query)}%`; where.push("(s.owner_id LIKE ? ESCAPE '\\' OR oi.email LIKE ? ESCAPE '\\' OR s.provider_subscription_id LIKE ? ESCAPE '\\')"); values.push(q, q, q); }
  if (options.status) { where.push("s.status=?"); values.push(options.status.slice(0, 40)); }
  if (options.access && ["pro_monthly", "pro_yearly"].includes(options.access)) { where.push("s.plan_id=?"); values.push(options.access); }
  if (options.mode && ["live", "test"].includes(options.mode)) { where.push("s.stripe_livemode=?"); values.push(options.mode === "live" ? 1 : 0); }
  const from = "FROM subscriptions s LEFT JOIN account_oauth_identities oi ON oi.user_id=s.user_id AND oi.provider='google' AND oi.email_verified=1";
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = await count(db, `SELECT COUNT(DISTINCT s.id) count ${from} ${clause}`, values);
  const result = await withAdminD1Retry(() => db.prepare(`SELECT s.id,s.user_id,s.plan_id,s.status,s.cancel_at_period_end,s.current_period_start,s.current_period_end,s.provider_customer_id,s.provider_subscription_id,s.stripe_livemode,s.created_at,s.updated_at,MAX(oi.email) email ${from} ${clause} GROUP BY s.id ORDER BY s.updated_at DESC LIMIT ? OFFSET ?`)
    .bind(...values, options.pageSize, (options.page - 1) * options.pageSize).all<Record<string, unknown>>());
  return { items: result.results.map((row) => ({ ...minimizeSubscription(row), email: maskEmail(row.email as string | null) }) as Record<string, unknown>), meta: pageMeta(total, options.page, options.pageSize) };
}

export async function listAdminFeedback(db: AdminDb, options: ListOptions) {
  const total = await count(db, "SELECT COUNT(*) count FROM feedback_submissions", []);
  const result = await withAdminD1Retry(() => db.prepare(`
    SELECT f.id,f.message,f.email,f.created_at,MAX(oi.user_id) account_user_id
    FROM feedback_submissions f
    LEFT JOIN account_oauth_identities oi
      ON oi.email_verified=1 AND lower(oi.email)=lower(f.email)
    GROUP BY f.id
    ORDER BY f.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(options.pageSize, (options.page - 1) * options.pageSize).all<Record<string, unknown>>());
  return { items: result.results, meta: pageMeta(total, options.page, options.pageSize) };
}

export async function reviewFeedback(
  db: Pick<AdminDb, "prepare" | "batch">,
  feedbackId: string,
  review: { reviewStatus: ReviewStatus; adminNote: string | null },
  adminUserId: string,
  generateId = () => crypto.randomUUID(),
  clock = () => new Date().toISOString(),
) {
  const before = await withAdminD1Retry(() => db.prepare("SELECT id,review_status,admin_note FROM feedback_submissions WHERE id=?").bind(feedbackId).first<{ id: string; review_status: ReviewStatus; admin_note: string | null }>());
  if (!before) throw new Error("FEEDBACK_NOT_FOUND");
  const timestamp = clock();
  const update = db.prepare("UPDATE feedback_submissions SET review_status=?,admin_note=?,reviewed_at=?,reviewed_by=? WHERE id=?").bind(review.reviewStatus, review.adminNote, timestamp, adminUserId, feedbackId);
  const audit = db.prepare("INSERT INTO admin_audit_logs(id,admin_user_id,action,target_type,target_id,before_json,after_json,created_at) VALUES(?,?,'feedback_reviewed','feedback',?,?,?,?)")
    .bind(generateId(), adminUserId, feedbackId, JSON.stringify({ reviewStatus: before.review_status, adminNote: before.admin_note }), JSON.stringify(review), timestamp);
  await withAdminD1Retry(() => db.batch([update, audit]));
  return { id: feedbackId, reviewStatus: review.reviewStatus, adminNote: review.adminNote, reviewedAt: timestamp };
}
