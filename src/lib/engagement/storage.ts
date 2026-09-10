import { getCloudflareContext } from "@opennextjs/cloudflare";
import { badgeMilestones, buildRewardSnapshot, creditedHeartbeatSeconds, isEligibleLearningPath, type LearningRewardDay } from "./domain.ts";
import { LEARNING_HEARTBEAT_DAY_SQL, LEARNING_POINT_AWARD_SQL } from "./sql.ts";

const database = () => getCloudflareContext().env.LEARNING_DB;
const iso = (date: Date) => date.toISOString();
const accountUserId = (ownerId: string) => ownerId.startsWith("user:") ? ownerId.slice(5) : null;

function accountGuardStatements(db: ReturnType<typeof database>, ownerId: string) {
  const assertionId = crypto.randomUUID();
  const userId = accountUserId(ownerId);
  return {
    before: db.prepare("INSERT INTO account_cas_assertions(id,ok) VALUES(?,CASE WHEN (?=0 OR EXISTS(SELECT 1 FROM accounts WHERE user_id=? AND status='active')) THEN 1 ELSE 0 END)")
      .bind(assertionId, userId ? 1 : 0, userId ?? ""),
    after: db.prepare("DELETE FROM account_cas_assertions WHERE id=?").bind(assertionId),
  };
}

async function guardedBatch(db: ReturnType<typeof database>, ownerId: string, statements: Array<ReturnType<typeof db.prepare>>) {
  const guard = accountGuardStatements(db, ownerId);
  return db.batch([guard.before, ...statements, guard.after]);
}

export function localDayInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  if (!values.year || !values.month || !values.day) throw new Error("INVALID_TIMEZONE");
  return `${values.year}-${values.month}-${values.day}`;
}

async function rewardProfile(ownerId: string, suggestedTimezone: string, now = new Date()) {
  localDayInTimezone(now, suggestedTimezone);
  const db = database();
  const userId = accountUserId(ownerId);
  await db.prepare("INSERT OR IGNORE INTO learning_reward_profiles(owner_id,timezone,created_at) SELECT ?,?,? WHERE (?=0 OR EXISTS(SELECT 1 FROM accounts WHERE user_id=? AND status='active'))")
    .bind(ownerId, suggestedTimezone, iso(now), userId ? 1 : 0, userId ?? "").run();
  const profile = await db.prepare("SELECT timezone FROM learning_reward_profiles WHERE owner_id=? AND (?=0 OR EXISTS(SELECT 1 FROM accounts WHERE user_id=? AND status='active'))")
    .bind(ownerId, userId ? 1 : 0, userId ?? "").first<{ timezone: string }>();
  if (!profile?.timezone) throw new Error("REWARD_PROFILE_UNAVAILABLE");
  return profile.timezone;
}

export async function learningRewardLocalDay(ownerId: string, suggestedTimezone: string, now = new Date()) {
  return localDayInTimezone(now, await rewardProfile(ownerId, suggestedTimezone, now));
}

export type LearningEngagementActivity = {
  localDay: string;
  action: string;
  idempotencyKey: string;
};

export function engagementTaskStatements(
  db: ReturnType<typeof database>,
  ownerId: string,
  activity: LearningEngagementActivity,
  createdAt: string,
) {
  const guard = accountGuardStatements(db, ownerId);
  return [
    guard.before,
    db.prepare("INSERT OR IGNORE INTO learning_qualifying_tasks(id,owner_id,local_day,action,idempotency_key,created_at) VALUES(?,?,?,?,?,?)")
      .bind(crypto.randomUUID(), ownerId, activity.localDay, activity.action, activity.idempotencyKey, createdAt),
    guard.after,
  ];
}

export async function recordLearningTask(ownerId: string, activity: LearningEngagementActivity, createdAt = new Date().toISOString()) {
  const db = database();
  await db.batch(engagementTaskStatements(db, ownerId, activity, createdAt));
}

async function reconcileReward(ownerId: string, localDay: string, now: Date) {
  const db = database();
  await guardedBatch(db, ownerId, [
    db.prepare(LEARNING_POINT_AWARD_SQL).bind(
      crypto.randomUUID(), ownerId, localDay, localDay.slice(0, 7),
      `daily-online:${localDay}`, iso(now), ownerId, localDay,
    ),
  ]);
}

async function rewardActivityDays(ownerId: string): Promise<LearningRewardDay[]> {
  const rows = await database().prepare(`
    SELECT d.local_day,d.active_seconds,COALESCE(p.units,0) points
    FROM learning_engagement_days d
    LEFT JOIN learning_point_ledger p ON p.owner_id=d.owner_id AND p.local_day=d.local_day
    WHERE d.owner_id=?
    ORDER BY d.local_day ASC
  `).bind(ownerId).all<{ local_day: string; active_seconds: number; points: number }>();
  return (rows.results as Array<{ local_day: string; active_seconds: number; points: number }>).map((row) => ({
    localDay: row.local_day,
    activeSeconds: Number(row.active_seconds),
    points: Number(row.points),
  }));
}

async function persistUnlockedBadges(ownerId: string, snapshot: ReturnType<typeof buildRewardSnapshot>, now: Date) {
  const unlocked = badgeMilestones.filter((days) => snapshot.longestStreak >= days);
  if (!unlocked.length) return;
  const db = database();
  await guardedBatch(db, ownerId, unlocked.map((days) => db.prepare("INSERT OR IGNORE INTO learning_badges(id,owner_id,badge_key,milestone_days,awarded_at) VALUES(?,?,?,?,?)")
    .bind(crypto.randomUUID(), ownerId, `streak-${days}`, days, iso(now))));
}

export async function learningRewardSnapshot(ownerId: string, suggestedTimezone: string, now = new Date()) {
  const timezone = await rewardProfile(ownerId, suggestedTimezone, now);
  const localDay = localDayInTimezone(now, timezone);
  await reconcileReward(ownerId, localDay, now);
  const db = database();
  const [activityDays, total, redeemed, history] = await Promise.all([
    rewardActivityDays(ownerId),
    db.prepare("SELECT COALESCE(SUM(units),0) total FROM learning_point_ledger WHERE owner_id=?").bind(ownerId).first<{ total: number }>(),
    db.prepare("SELECT COALESCE(SUM(points_spent),0) total FROM learning_point_redemptions WHERE owner_id=?").bind(ownerId).first<{ total: number }>(),
    db.prepare("SELECT id,points_spent,credits_granted,created_at FROM learning_point_redemptions WHERE owner_id=? ORDER BY created_at DESC LIMIT 10")
      .bind(ownerId).all<{ id: string; points_spent: number; credits_granted: number; created_at: string }>(),
  ]);
  const activeSeconds = activityDays.find((day: LearningRewardDay) => day.localDay === localDay)?.activeSeconds ?? 0;
  const snapshot = buildRewardSnapshot({
    today: localDay,
    activeSeconds,
    activityDays,
    lifetimePoints: Number(total?.total ?? 0),
    redeemedPoints: Number(redeemed?.total ?? 0),
  });
  await persistUnlockedBadges(ownerId, snapshot, now);
  return {
    ...snapshot,
    timezone,
    redemptionHistory: (history.results as Array<{ id: string; points_spent: number; credits_granted: number; created_at: string }>).map((row) => ({
      id: row.id,
      pointsSpent: Number(row.points_spent),
      creditsGranted: Number(row.credits_granted),
      createdAt: row.created_at,
    })),
  };
}

export async function redeemLearningPoints(
  ownerId: string,
  suggestedTimezone: string,
  input: { idempotencyKey: string; credits: number },
  now = new Date(),
) {
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(input.idempotencyKey)) throw new Error("INVALID_IDEMPOTENCY_KEY");
  if (!Number.isInteger(input.credits) || input.credits < 1 || input.credits > 100) throw new Error("POINTS_MUST_BE_MULTIPLE_OF_10");
  const db = database();
  const existing = await db.prepare("SELECT id FROM learning_point_redemptions WHERE owner_id=? AND idempotency_key=?")
    .bind(ownerId, input.idempotencyKey).first<{ id: string }>();
  if (!existing) {
    const points = input.credits * 10;
    const redemptionId = crypto.randomUUID();
    const assertionId = crypto.randomUUID();
    const timestamp = iso(now);
    try {
      await guardedBatch(db, ownerId, [
        db.prepare(`INSERT INTO learning_reward_assertions(id,ok)
          SELECT ?,CASE WHEN
            COALESCE((SELECT SUM(units) FROM learning_point_ledger WHERE owner_id=?),0)
            - COALESCE((SELECT SUM(points_spent) FROM learning_point_redemptions WHERE owner_id=?),0) >= ?
          THEN 1 ELSE 0 END`).bind(assertionId, ownerId, ownerId, points),
        db.prepare("INSERT INTO learning_point_redemptions(id,owner_id,idempotency_key,points_spent,credits_granted,created_at) VALUES(?,?,?,?,?,?)")
          .bind(redemptionId, ownerId, input.idempotencyKey, points, input.credits, timestamp),
        db.prepare("INSERT INTO credit_ledger(id,owner_id,units,source,reward_id,operation_id,expires_at,created_at) VALUES(?,?,?,?,?,?,?,?)")
          .bind(crypto.randomUUID(), ownerId, input.credits, "learning_points_exchange", redemptionId, null, "9999-12-31T23:59:59.999Z", timestamp),
        db.prepare("DELETE FROM learning_reward_assertions WHERE id=?").bind(assertionId),
      ]);
    } catch (error) {
      const replay = await db.prepare("SELECT id FROM learning_point_redemptions WHERE owner_id=? AND idempotency_key=?")
        .bind(ownerId, input.idempotencyKey).first<{ id: string }>();
      if (!replay) {
        const total = await db.prepare(`SELECT
          COALESCE((SELECT SUM(units) FROM learning_point_ledger WHERE owner_id=?),0)
          - COALESCE((SELECT SUM(points_spent) FROM learning_point_redemptions WHERE owner_id=?),0) available`)
          .bind(ownerId, ownerId).first<{ available: number }>();
        if (Number(total?.available ?? 0) < points) throw new Error("INSUFFICIENT_LEARNING_POINTS");
        throw error;
      }
    }
  }
  return learningRewardSnapshot(ownerId, suggestedTimezone, now);
}

export async function startLearningEngagement(ownerId: string, suggestedTimezone: string, route: string, now = new Date()) {
  if (!isEligibleLearningPath(route)) throw new Error("INELIGIBLE_LEARNING_ROUTE");
  const timezone = await rewardProfile(ownerId, suggestedTimezone, now);
  const localDay = localDayInTimezone(now, timezone);
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(now.getTime() + 5 * 60_000);
  const db = database();
  await guardedBatch(db, ownerId, [
    db.prepare("INSERT INTO learning_engagement_sessions(id,owner_id,local_day,route,expires_at,created_at) VALUES(?,?,?,?,?,?)")
      .bind(sessionToken, ownerId, localDay, route, iso(expiresAt), iso(now)),
    db.prepare("DELETE FROM learning_engagement_sessions WHERE owner_id=? AND expires_at<?")
      .bind(ownerId, iso(new Date(now.getTime() - 24 * 60 * 60_000))),
  ]);
  return { ...(await learningRewardSnapshot(ownerId, timezone, now)), sessionToken, sessionExpiresAt: iso(expiresAt) };
}

export async function recordForegroundHeartbeat(
  ownerId: string,
  suggestedTimezone: string,
  input: { heartbeatId: string; sessionToken: string; route: string; seconds: number },
  now = new Date(),
) {
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(input.heartbeatId)) throw new Error("INVALID_HEARTBEAT_ID");
  if (!/^[a-f0-9-]{36}$/.test(input.sessionToken)) throw new Error("INVALID_ENGAGEMENT_SESSION");
  if (!isEligibleLearningPath(input.route)) throw new Error("INELIGIBLE_LEARNING_ROUTE");
  if (!Number.isInteger(input.seconds) || input.seconds < 1 || input.seconds > 60) throw new Error("INVALID_ACTIVE_SECONDS");
  const timezone = await rewardProfile(ownerId, suggestedTimezone, now);
  const localDay = localDayInTimezone(now, timezone);
  const db = database();
  const timestamp = iso(now);
  const session = await db.prepare("SELECT created_at FROM learning_engagement_sessions WHERE id=? AND owner_id=? AND local_day=? AND route=? AND expires_at>=?")
    .bind(input.sessionToken, ownerId, localDay, input.route, timestamp).first<{ created_at: string }>();
  if (!session) throw new Error("ENGAGEMENT_SESSION_EXPIRED");
  const creditedSeconds = creditedHeartbeatSeconds(input.seconds, new Date(session.created_at), now);
  const periodKey = localDay.slice(0, 7);
  try {
    await guardedBatch(db, ownerId, [
      db.prepare("INSERT INTO learning_engagement_heartbeats(id,owner_id,local_day,credited_seconds,created_at) VALUES(?,?,?,?,?)")
        .bind(input.heartbeatId, ownerId, localDay, creditedSeconds, timestamp),
      db.prepare(LEARNING_HEARTBEAT_DAY_SQL).bind(ownerId, localDay, creditedSeconds, timestamp, timestamp, timestamp),
      db.prepare(LEARNING_POINT_AWARD_SQL).bind(
        crypto.randomUUID(), ownerId, localDay, periodKey,
        `daily-online:${localDay}`, timestamp, ownerId, localDay,
      ),
      db.prepare("UPDATE learning_engagement_sessions SET expires_at=? WHERE id=? AND owner_id=?")
        .bind(iso(new Date(now.getTime() + 5 * 60_000)), input.sessionToken, ownerId),
    ]);
  } catch (error) {
    const replay = await db.prepare("SELECT 1 ok FROM learning_engagement_heartbeats WHERE id=? AND owner_id=?")
      .bind(input.heartbeatId, ownerId).first<{ ok: number }>();
    if (!replay) throw error;
  }
  return learningRewardSnapshot(ownerId, timezone, now);
}
