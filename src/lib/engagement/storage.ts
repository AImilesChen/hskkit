import { getCloudflareContext } from "@opennextjs/cloudflare";
import { badgeMilestones, buildRewardSnapshot, isEligibleLearningPath } from "./domain.ts";
import { LEARNING_HEARTBEAT_DAY_SQL, LEARNING_POINT_AWARD_SQL } from "./sql.ts";

const database = () => getCloudflareContext().env.LEARNING_DB;
const iso = (date: Date) => date.toISOString();

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
  await db.prepare("INSERT OR IGNORE INTO learning_reward_profiles(owner_id,timezone,created_at) VALUES(?,?,?)")
    .bind(ownerId, suggestedTimezone, iso(now)).run();
  const profile = await db.prepare("SELECT timezone FROM learning_reward_profiles WHERE owner_id=?")
    .bind(ownerId).first<{ timezone: string }>();
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
  const periodKey = activity.localDay.slice(0, 7);
  return [
    db.prepare("INSERT OR IGNORE INTO learning_qualifying_tasks(id,owner_id,local_day,action,idempotency_key,created_at) VALUES(?,?,?,?,?,?)")
      .bind(crypto.randomUUID(), ownerId, activity.localDay, activity.action, activity.idempotencyKey, createdAt),
    db.prepare("INSERT INTO learning_engagement_days(owner_id,local_day,active_seconds,last_heartbeat_at,created_at,updated_at) VALUES(?,?,0,?,?,?) ON CONFLICT(owner_id,local_day) DO UPDATE SET updated_at=excluded.updated_at")
      .bind(ownerId, activity.localDay, createdAt, createdAt, createdAt),
    db.prepare(LEARNING_POINT_AWARD_SQL)
      .bind(crypto.randomUUID(), ownerId, activity.localDay, periodKey, ownerId, periodKey, ownerId, periodKey, ownerId, periodKey, `effective-day:${activity.localDay}`, createdAt, ownerId, activity.localDay, ownerId, activity.localDay),
  ];
}

async function reconcileReward(ownerId: string, localDay: string, now: Date) {
  const db = database();
  const [day, task, existing] = await Promise.all([
    db.prepare("SELECT active_seconds FROM learning_engagement_days WHERE owner_id=? AND local_day=?").bind(ownerId, localDay).first<{ active_seconds: number }>(),
    db.prepare("SELECT COUNT(*) count FROM learning_qualifying_tasks WHERE owner_id=? AND local_day=?").bind(ownerId, localDay).first<{ count: number }>(),
    db.prepare("SELECT units FROM learning_point_ledger WHERE owner_id=? AND local_day=?").bind(ownerId, localDay).first<{ units: number }>(),
  ]);
  if (!existing && Number(day?.active_seconds ?? 0) >= 900 && Number(task?.count ?? 0) >= 1) {
    const periodKey = localDay.slice(0, 7);
    try {
      await db.prepare(LEARNING_POINT_AWARD_SQL)
        .bind(crypto.randomUUID(), ownerId, localDay, periodKey, ownerId, periodKey, ownerId, periodKey, ownerId, periodKey, `effective-day:${localDay}`, iso(now), ownerId, localDay, ownerId, localDay).run();
    } catch (error) {
      const raced = await db.prepare("SELECT units FROM learning_point_ledger WHERE owner_id=? AND local_day=?").bind(ownerId, localDay).first<{ units: number }>();
      if (!raced) throw error;
    }
  }
}

async function persistUnlockedBadges(ownerId: string, snapshot: ReturnType<typeof buildRewardSnapshot>, now: Date) {
  const unlocked = badgeMilestones.filter((days) => snapshot.longestStreak >= days);
  if (!unlocked.length) return;
  const db = database();
  await db.batch(unlocked.map((days) => db.prepare("INSERT OR IGNORE INTO learning_badges(id,owner_id,badge_key,milestone_days,awarded_at) VALUES(?,?,?,?,?)")
    .bind(crypto.randomUUID(), ownerId, `streak-${days}`, days, iso(now))));
}

export async function learningRewardSnapshot(ownerId: string, suggestedTimezone: string, now = new Date()) {
  const timezone = await rewardProfile(ownerId, suggestedTimezone, now);
  const localDay = localDayInTimezone(now, timezone);
  await reconcileReward(ownerId, localDay, now);
  const db = database();
  const [day, task, rewarded, total] = await Promise.all([
    db.prepare("SELECT active_seconds FROM learning_engagement_days WHERE owner_id=? AND local_day=?").bind(ownerId, localDay).first<{ active_seconds: number }>(),
    db.prepare("SELECT COUNT(*) count FROM learning_qualifying_tasks WHERE owner_id=? AND local_day=?").bind(ownerId, localDay).first<{ count: number }>(),
    db.prepare("SELECT local_day,units FROM learning_point_ledger WHERE owner_id=? ORDER BY local_day ASC").bind(ownerId).all<{ local_day: string; units: number }>(),
    db.prepare("SELECT COALESCE(SUM(units),0) total FROM learning_point_ledger WHERE owner_id=?").bind(ownerId).first<{ total: number }>(),
  ]);
  const snapshot = buildRewardSnapshot({
    today: localDay,
    activeSeconds: Number(day?.active_seconds ?? 0),
    qualifyingTasks: Number(task?.count ?? 0),
    rewardedDays: (rewarded.results as Array<{ local_day: string; units: number }>).map((entry) => ({ localDay: entry.local_day, points: Number(entry.units) })),
    lifetimePoints: Number(total?.total ?? 0),
  });
  await persistUnlockedBadges(ownerId, snapshot, now);
  return { ...snapshot, timezone };
}

export async function startLearningEngagement(ownerId: string, suggestedTimezone: string, route: string, now = new Date()) {
  if (!isEligibleLearningPath(route)) throw new Error("INELIGIBLE_LEARNING_ROUTE");
  const timezone = await rewardProfile(ownerId, suggestedTimezone, now);
  const localDay = localDayInTimezone(now, timezone);
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(now.getTime() + 5 * 60_000);
  const db = database();
  await db.batch([
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
  if (!Number.isInteger(input.seconds) || input.seconds < 1 || input.seconds > 30) throw new Error("INVALID_ACTIVE_SECONDS");
  const timezone = await rewardProfile(ownerId, suggestedTimezone, now);
  const localDay = localDayInTimezone(now, timezone);
  const db = database();
  const timestamp = iso(now);
  const session = await db.prepare("SELECT 1 ok FROM learning_engagement_sessions WHERE id=? AND owner_id=? AND local_day=? AND route=? AND expires_at>=?")
    .bind(input.sessionToken, ownerId, localDay, input.route, timestamp).first<{ ok: number }>();
  if (!session) throw new Error("ENGAGEMENT_SESSION_EXPIRED");
  try {
    await db.batch([
      db.prepare("INSERT INTO learning_engagement_heartbeats(id,owner_id,local_day,credited_seconds,created_at) VALUES(?,?,?,?,?)").bind(input.heartbeatId, ownerId, localDay, input.seconds, timestamp),
      db.prepare(LEARNING_HEARTBEAT_DAY_SQL).bind(ownerId, localDay, input.seconds, timestamp, timestamp, timestamp),
    ]);
  } catch (error) {
    const replay = await db.prepare("SELECT 1 ok FROM learning_engagement_heartbeats WHERE id=? AND owner_id=?").bind(input.heartbeatId, ownerId).first<{ ok: number }>();
    if (!replay) throw error;
  }
  return learningRewardSnapshot(ownerId, timezone, now);
}
