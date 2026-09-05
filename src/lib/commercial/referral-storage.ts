import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PRO_CAPABILITIES, FREE_CAPABILITIES, type ProductCapabilities } from "./capabilities.ts";
import {
  REFERRAL_ANNUAL_CREDIT_CAP,
  REFERRAL_ANNUAL_PROMO_DAY_CAP,
  WELCOME_TRIAL_CREDITS,
  WELCOME_TRIAL_DAYS,
  addUtcDays,
  referralQualification,
  referralReward,
  resolveAccessSource,
  paidCreditAllowance,
  safeReferralCode,
} from "./referrals.ts";

const database = () => getCloudflareContext().env.LEARNING_DB;
const owner = (userId: string) => `user:${userId}`;
const iso = (date = new Date()) => date.toISOString();
const yearEnd = (date: Date) => `${date.getUTCFullYear() + 1}-01-01T00:00:00.000Z`;

export async function sha256ReferralDevice(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function codeForUser(userId: string) {
  const db = database();
  const current = await db.prepare("SELECT code FROM referral_codes WHERE user_id=? AND status='active'").bind(userId).first<{ code: string }>();
  if (current) return current.code;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const code = crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
    try {
      await db.prepare("INSERT INTO referral_codes(code,user_id,status,created_at,updated_at) VALUES(?,?,'active',?,?)").bind(code, userId, iso(), iso()).run();
      return code;
    } catch {
      const raced = await db.prepare("SELECT code FROM referral_codes WHERE user_id=? AND status='active'").bind(userId).first<{ code: string }>();
      if (raced) return raced.code;
    }
  }
  throw new Error("REFERRAL_CODE_CREATE_FAILED");
}

export async function activateWelcomeTrialAndReferral(input: { userId: string; emailVerified: boolean; referralCode?: string; deviceHash?: string }, now = new Date()) {
  const db = database();
  const timestamp = iso(now);
  const referralCode = safeReferralCode(input.referralCode);
  await codeForUser(input.userId);
  if (input.emailVerified) {
    const paid = await db.prepare("SELECT 1 ok FROM subscription_orders WHERE user_id=? AND status IN ('completed','refunded') LIMIT 1").bind(input.userId).first<{ ok: number }>();
    if (!paid) {
      await db.prepare("INSERT OR IGNORE INTO promotional_entitlements(id,owner_id,kind,status,starts_at,ends_at,source_reward_id,created_at,updated_at,ai_credits) VALUES(?,?,'welcome_trial','active',?,?,NULL,?,?,?)")
        .bind(crypto.randomUUID(), owner(input.userId), timestamp, addUtcDays(now, WELCOME_TRIAL_DAYS), timestamp, timestamp, WELCOME_TRIAL_CREDITS).run();
    }
  }
  if (referralCode) {
    const referrer = await db.prepare("SELECT user_id FROM referral_codes WHERE code=? AND status='active'").bind(referralCode).first<{ user_id: string }>();
    if (referrer && referrer.user_id !== input.userId) {
      const recentDevice = input.deviceHash ? await db.prepare("SELECT COUNT(*) count FROM referral_relationships WHERE signup_device_hash=? AND created_at>=?").bind(input.deviceHash, new Date(now.getTime() - 30 * 86_400_000).toISOString()).first<{ count: number }>() : null;
      const riskStatus = Number(recentDevice?.count ?? 0) >= 3 ? "review" : "clear";
      const relationshipId = crypto.randomUUID();
      try {
        await db.batch([
          db.prepare("INSERT INTO referral_relationships(id,referral_code,referrer_user_id,referred_user_id,email_verified,risk_status,signup_device_hash,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'signed_up',?,?)")
            .bind(relationshipId, referralCode, referrer.user_id, input.userId, input.emailVerified ? 1 : 0, riskStatus, input.deviceHash ?? null, timestamp, timestamp),
          ...(riskStatus === "review" ? [db.prepare("INSERT INTO referral_risk_flags(id,relationship_id,signal,status,detail,created_at) VALUES(?,?,'device_velocity','open','Four or more referred signups shared one pseudonymous browser token in 30 days',?)").bind(crypto.randomUUID(), relationshipId, timestamp)] : []),
        ]);
      } catch { /* one referred account can bind only once */ }
    }
  }
  return trialAndReferralSummary(input.userId, now);
}

export async function bonusCreditBalance(ownerId: string, at = new Date()) {
  const row = await database().prepare("SELECT MAX(0,COALESCE(SUM(units),0)) balance FROM credit_ledger WHERE owner_id=? AND expires_at>?").bind(ownerId, iso(at)).first<{ balance: number }>();
  return Math.max(0, Number(row?.balance ?? 0));
}

export async function resolveCommercialAccess(ownerId: string, at = new Date()): Promise<{ capabilities: ProductCapabilities; access: ReturnType<typeof resolveAccessSource>; bonusCredits: number }> {
  const db = database();
  await db.prepare("UPDATE promotional_entitlements SET status='ended',updated_at=? WHERE owner_id=? AND status='active' AND ends_at<=?").bind(iso(at), ownerId, iso(at)).run();
  const [paid, trial, promo, bonus, rolloverRow] = await Promise.all([
    db.prepare("SELECT status,ends_at FROM subscription_entitlements WHERE owner_id=?").bind(ownerId).first<{ status: "active" | "ended" | "revoked"; ends_at: string | null }>(),
    db.prepare("SELECT status,ends_at,ai_credits FROM promotional_entitlements WHERE owner_id=? AND kind='welcome_trial' ORDER BY created_at DESC LIMIT 1").bind(ownerId).first<{ status: "active" | "ended" | "revoked"; ends_at: string | null; ai_credits: number | null }>(),
    db.prepare("SELECT status,MAX(ends_at) ends_at FROM promotional_entitlements WHERE owner_id=? AND kind='referral_pass' AND status='active'").bind(ownerId).first<{ status: "active" | "ended" | "revoked"; ends_at: string | null }>(),
    bonusCreditBalance(ownerId, at),
    db.prepare("SELECT remaining_units,conversion_period,conversion_period_used FROM welcome_credit_rollovers WHERE owner_id=?").bind(ownerId).first<{ remaining_units: number; conversion_period: string; conversion_period_used: number }>(),
  ]);
  const access = resolveAccessSource({
    paid: paid ? { status: paid.status, endsAt: paid.ends_at } : null,
    trial: trial ? { status: trial.status, endsAt: trial.ends_at, aiCredits: trial.ai_credits } : null,
    promo: promo?.ends_at ? { status: promo.status, endsAt: promo.ends_at } : null,
  }, at);
  if (access.tier === "free") return { capabilities: FREE_CAPABILITIES, access, bonusCredits: bonus };
  if (access.source === "paid") {
    const rollover = rolloverRow ? { remainingCredits: Number(rolloverRow.remaining_units), conversionPeriod: rolloverRow.conversion_period, spentInConversionPeriod: Number(rolloverRow.conversion_period_used) } : null;
    const paidCredits = paidCreditAllowance({ rollover, currentPeriod: at.toISOString().slice(0, 7) });
    return { capabilities: { ...PRO_CAPABILITIES, aiMonthlyCredits: paidCredits.totalAllowance + bonus }, access, bonusCredits: bonus + paidCredits.bonusCredits };
  }
  return { capabilities: { ...PRO_CAPABILITIES, aiMonthlyCredits: access.baseAiCredits + bonus }, access, bonusCredits: bonus };
}

async function hasPaidPro(userId: string, at: Date) {
  const row = await database().prepare("SELECT 1 ok FROM subscription_entitlements WHERE owner_id=? AND status='active' AND (ends_at IS NULL OR ends_at>?)").bind(owner(userId), iso(at)).first<{ ok: number }>();
  return Boolean(row);
}

async function issueReward(relationshipId: string, stage: "qualified" | "paid", now = new Date()) {
  const db = database();
  const relationship = await db.prepare("SELECT * FROM referral_relationships WHERE id=? AND risk_status='clear' AND status!='blocked'").bind(relationshipId).first<any>();
  if (!relationship) throw new Error("REFERRAL_NOT_REWARDABLE");
  const existing = await db.prepare("SELECT * FROM reward_issuances WHERE relationship_id=? AND stage=?").bind(relationshipId, stage).first<any>();
  if (existing) return existing;
  const desired = referralReward(stage, await hasPaidPro(relationship.referrer_user_id, now));
  const bonusCredits = desired.bonusCredits;
  const promoDays = desired.promoDays;
  const timestamp = iso(now);
  const rewardId = crypto.randomUUID();
  const capAssertion = crypto.randomUUID();
  const rewardYear = now.getUTCFullYear();
  const promoStartRow = promoDays ? await db.prepare("SELECT MAX(ends_at) ends_at FROM promotional_entitlements WHERE owner_id=? AND kind='referral_pass' AND status='active'").bind(owner(relationship.referrer_user_id)).first<{ ends_at: string | null }>() : null;
  const promoStart = promoStartRow?.ends_at && Date.parse(promoStartRow.ends_at) > now.getTime() ? new Date(promoStartRow.ends_at) : now;
  const statements = [
    db.prepare("INSERT OR IGNORE INTO referral_annual_counters(referrer_user_id,reward_year,bonus_credits,promo_days,updated_at) VALUES(?,?,0,0,?)").bind(relationship.referrer_user_id, rewardYear, timestamp),
    db.prepare("UPDATE referral_annual_counters SET bonus_credits=bonus_credits+?,promo_days=promo_days+?,updated_at=? WHERE referrer_user_id=? AND reward_year=? AND bonus_credits+?<=? AND promo_days+?<=?")
      .bind(bonusCredits, promoDays, timestamp, relationship.referrer_user_id, rewardYear, bonusCredits, REFERRAL_ANNUAL_CREDIT_CAP, promoDays, REFERRAL_ANNUAL_PROMO_DAY_CAP),
    db.prepare("INSERT INTO referral_reward_assertions(id,ok) VALUES(?,CASE changes() WHEN 1 THEN 1 ELSE 0 END)").bind(capAssertion),
    db.prepare("INSERT INTO reward_issuances(id,relationship_id,referrer_user_id,stage,promo_days,bonus_credits,status,issued_at) VALUES(?,?,?,?,?,?,'issued',?)").bind(rewardId, relationshipId, relationship.referrer_user_id, stage, promoDays, bonusCredits, timestamp),
    db.prepare("UPDATE referral_relationships SET status=?,qualified_at=CASE WHEN ?='qualified' THEN COALESCE(qualified_at,?) ELSE qualified_at END,updated_at=? WHERE id=?").bind(stage, stage, timestamp, timestamp, relationshipId),
    db.prepare("DELETE FROM referral_reward_assertions WHERE id=?").bind(capAssertion),
  ];
  if (bonusCredits > 0) statements.push(db.prepare("INSERT INTO credit_ledger(id,owner_id,units,source,reward_id,expires_at,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(), owner(relationship.referrer_user_id), bonusCredits, stage === "paid" ? "referral_paid" : "referral_qualified", rewardId, yearEnd(now), timestamp));
  if (promoDays > 0) statements.push(db.prepare("INSERT INTO promotional_entitlements(id,owner_id,kind,status,starts_at,ends_at,source_reward_id,created_at,updated_at) VALUES(?,?,'referral_pass','active',?,?,?,?,?)").bind(crypto.randomUUID(), owner(relationship.referrer_user_id), iso(promoStart), addUtcDays(promoStart, promoDays), rewardId, timestamp, timestamp));
  try { await db.batch(statements); } catch (error) {
    const raced = await db.prepare("SELECT * FROM reward_issuances WHERE relationship_id=? AND stage=?").bind(relationshipId, stage).first<any>();
    if (raced) return raced;
    throw error;
  }
  return db.prepare("SELECT * FROM reward_issuances WHERE id=?").bind(rewardId).first<any>();
}

export async function qualifyReferral(relationshipId: string, now = new Date()) {
  const db = database();
  const relationship = await db.prepare("SELECT * FROM referral_relationships WHERE id=?").bind(relationshipId).first<any>();
  if (!relationship || relationship.status !== "signed_up") return null;
  const progress = await db.prepare("SELECT COUNT(DISTINCT local_day) days,COALESCE(SUM(units),0) units FROM referral_learning_events WHERE relationship_id=?").bind(relationshipId).first<{ days: number; units: number }>();
  const decision = referralQualification({ emailVerified: Boolean(relationship.email_verified), distinctLearningDays: Number(progress?.days ?? 0), learningUnits: Number(progress?.units ?? 0), riskStatus: relationship.risk_status });
  if (!decision.eligible) return { decision, progress };
  const reward = await issueReward(relationshipId, "qualified", now);
  await db.prepare("UPDATE referral_relationships SET status='paid_pending',updated_at=? WHERE id=? AND status='qualified' AND paid_charge_id IS NOT NULL").bind(iso(now), relationshipId).run();
  const paidReward = await reconcilePaidReferral(relationshipId, now);
  return { decision, progress, reward, paidReward };
}

export async function reconcileReferralLearningMilestone(userId: string, now = new Date()) {
  const relationship = await database().prepare("SELECT id FROM referral_relationships WHERE referred_user_id=? AND status='signed_up'").bind(userId).first<{ id: string }>();
  return relationship ? qualifyReferral(relationship.id, now) : null;
}

export async function recordReferralLearningActivity(ownerId: string, idempotencyKey: string, localDay: string, units = 1, now = new Date()) {
  if (!ownerId.startsWith("user:") || !/^\d{4}-\d{2}-\d{2}$/.test(localDay)) return null;
  const userId = ownerId.slice(5);
  const db = database();
  const relationship = await db.prepare("SELECT id FROM referral_relationships WHERE referred_user_id=? AND status='signed_up'").bind(userId).first<{ id: string }>();
  if (!relationship) return null;
  await db.prepare("INSERT OR IGNORE INTO referral_learning_events(id,relationship_id,referred_user_id,local_day,units,idempotency_key,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(), relationship.id, userId, localDay, units, idempotencyKey, iso(now)).run();
  return qualifyReferral(relationship.id, now);
}

export async function rewardFirstPaidReferral(subscriptionId: string, now = new Date()) {
  const db = database();
  const subscription = await db.prepare("SELECT user_id FROM subscriptions WHERE provider_subscription_id=?").bind(subscriptionId).first<{ user_id: string }>();
  if (!subscription) return null;
  const relationship = await db.prepare("SELECT id,status,risk_status FROM referral_relationships WHERE referred_user_id=? AND status IN ('signed_up','qualified','paid_pending')").bind(subscription.user_id).first<{ id: string; status: string; risk_status: string }>();
  if (!relationship || relationship.risk_status !== "clear") return null;
  const charge = await db.prepare("SELECT c.id,c.charged_at FROM subscription_charges c JOIN subscriptions s ON s.id=c.subscription_id WHERE s.user_id=? AND c.status='paid' ORDER BY COALESCE(c.charged_at,c.created_at) ASC LIMIT 1").bind(subscription.user_id).first<{ id: string; charged_at: string | null }>();
  if (!charge) return null;
  await db.prepare("UPDATE referral_relationships SET status=CASE WHEN status='qualified' THEN 'paid_pending' ELSE status END,paid_at=?,paid_charge_id=?,updated_at=? WHERE id=? AND status IN ('signed_up','qualified','paid_pending')")
    .bind(charge.charged_at ?? iso(now), charge.id, iso(now), relationship.id).run();
  return reconcilePaidReferral(relationship.id, now);
}

export async function reconcilePaidReferral(relationshipId: string, now = new Date()) {
  const db = database();
  const relationship = await db.prepare("SELECT * FROM referral_relationships WHERE id=?").bind(relationshipId).first<any>();
  if (!relationship || relationship.status !== "paid_pending" || relationship.risk_status !== "clear" || !relationship.paid_at || Date.parse(relationship.paid_at) + 7 * 86_400_000 > now.getTime()) return null;
  const charge = await db.prepare("SELECT status FROM subscription_charges WHERE id=? AND owner_id=?").bind(relationship.paid_charge_id, owner(relationship.referred_user_id)).first<{ status: string }>();
  if (charge?.status !== "paid") return null;
  return issueReward(relationshipId, "paid", now);
}

export async function flagRefundedReferralCharge(providerChargeId: string, now = new Date()) {
  const db = database();
  const relationship = await db.prepare("SELECT r.id FROM referral_relationships r JOIN subscription_charges c ON c.id=r.paid_charge_id WHERE c.provider_charge_id=?").bind(providerChargeId).first<{ id: string }>();
  if (!relationship) return null;
  const timestamp = iso(now);
  await db.batch([
    db.prepare("UPDATE referral_relationships SET risk_status='review',updated_at=? WHERE id=? AND risk_status='clear'").bind(timestamp, relationship.id),
    db.prepare("INSERT INTO referral_risk_flags(id,relationship_id,signal,status,detail,created_at) VALUES(?,?,'charge_refund','open','Tracked first-paid referral charge was refunded',?)").bind(crypto.randomUUID(), relationship.id, timestamp),
  ]);
  return { state: "review" };
}

export async function trialAndReferralSummary(userId: string, now = new Date()) {
  const db = database();
  await reconcileReferralLearningMilestone(userId, now);
  const referralCode = await codeForUser(userId);
  const relationshipQuery = "SELECT r.id,r.status,r.risk_status,r.created_at,r.qualified_at,r.paid_at,a.display_name referred_name,COALESCE((SELECT COUNT(DISTINCT e.local_day) FROM referral_learning_events e WHERE e.relationship_id=r.id),0) learning_days,COALESCE((SELECT SUM(e.units) FROM referral_learning_events e WHERE e.relationship_id=r.id),0) learning_units FROM referral_relationships r JOIN accounts a ON a.user_id=r.referred_user_id WHERE r.referrer_user_id=? ORDER BY r.created_at DESC LIMIT 50";
  let relationshipRows = await db.prepare(relationshipQuery).bind(userId).all<any>();
  let reconciled = false;
  for (const relationship of relationshipRows.results as any[]) {
    if (relationship.status === "paid_pending" && await reconcilePaidReferral(relationship.id, now)) reconciled = true;
  }
  if (reconciled) relationshipRows = await db.prepare(relationshipQuery).bind(userId).all<any>();
  const [trial, rewards, bonus, access] = await Promise.all([
    db.prepare("SELECT status,starts_at,ends_at FROM promotional_entitlements WHERE owner_id=? AND kind='welcome_trial' ORDER BY created_at DESC LIMIT 1").bind(owner(userId)).first<any>(),
    db.prepare("SELECT stage,promo_days,bonus_credits,status,issued_at FROM reward_issuances WHERE referrer_user_id=? ORDER BY issued_at DESC LIMIT 50").bind(userId).all<any>(),
    bonusCreditBalance(owner(userId), now),
    resolveCommercialAccess(owner(userId), now),
  ]);
  return { referralCode, sharePath: `/login?ref=${referralCode}`, trial, access: access.access, bonusCredits: bonus, bonusExpiresAt: yearEnd(now), referrals: relationshipRows.results, rewards: rewards.results };
}

export async function adminReferralAction(action: "block_referral" | "revoke_reward", id: string, reason: string, now = new Date()) {
  const db = database();
  const timestamp = iso(now);
  if (action === "block_referral") {
    await db.batch([
      db.prepare("UPDATE referral_relationships SET status='blocked',risk_status='blocked',updated_at=? WHERE id=?").bind(timestamp, id),
      db.prepare("INSERT INTO referral_risk_flags(id,relationship_id,signal,status,detail,created_at) VALUES(?,?,'manual_review','confirmed',?,?)").bind(crypto.randomUUID(), id, reason.slice(0, 240), timestamp),
    ]);
    return { state: "blocked" };
  }
  const reward = await db.prepare("SELECT * FROM reward_issuances WHERE id=? AND status='issued'").bind(id).first<any>();
  if (!reward) throw new Error("REWARD_NOT_FOUND");
  await db.batch([
    db.prepare("UPDATE reward_issuances SET status='revoked',revoked_at=?,revocation_reason=? WHERE id=? AND status='issued'").bind(timestamp, reason.slice(0, 240), id),
    db.prepare("UPDATE promotional_entitlements SET status='revoked',revoked_at=?,revocation_reason=?,updated_at=? WHERE source_reward_id=? AND status='active'").bind(timestamp, reason.slice(0, 240), timestamp, id),
    db.prepare("INSERT INTO credit_ledger(id,owner_id,units,source,reward_id,expires_at,created_at) VALUES(?,?,?,'admin_reversal',NULL,?,?)").bind(crypto.randomUUID(), owner(reward.referrer_user_id), -Number(reward.bonus_credits), yearEnd(now), timestamp),
  ]);
  return { state: "revoked" };
}

export async function adminReferralSummary() {
  const db = database();
  const [relationships, flags, rewards] = await Promise.all([
    db.prepare("SELECT * FROM referral_relationships ORDER BY created_at DESC LIMIT 100").all(),
    db.prepare("SELECT * FROM referral_risk_flags WHERE status='open' ORDER BY created_at DESC LIMIT 100").all(),
    db.prepare("SELECT * FROM reward_issuances ORDER BY issued_at DESC LIMIT 100").all(),
  ]);
  return { relationships: relationships.results, riskFlags: flags.results, rewards: rewards.results };
}
