import { getCloudflareContext } from "@opennextjs/cloudflare";

const db = () => getCloudflareContext().env.LEARNING_DB;

export async function createStep7PlaybackTicket(ownerId: string, exerciseId: string, now = new Date()) {
  const id = crypto.randomUUID();
  const assertionId = crypto.randomUUID();
  const createdAt = now.toISOString();
  const notBefore = new Date(now.getTime() + 1_200).toISOString();
  const expiresAt = new Date(now.getTime() + 10 * 60_000).toISOString();
  try {
    await db().batch([
      db().prepare("INSERT INTO account_cas_assertions(id,ok) VALUES(?, CASE WHEN (substr(?,1,5)!='user:' OR EXISTS(SELECT 1 FROM accounts WHERE user_id=substr(?,6) AND status='active')) AND NOT EXISTS(SELECT 1 FROM guest_merges WHERE guest_owner_id=? AND state='confirmed') THEN 1 ELSE 0 END)").bind(assertionId, ownerId, ownerId, ownerId),
      db().prepare("DELETE FROM step7_playback_tickets WHERE owner_id=? AND expires_at<?").bind(ownerId, createdAt),
      db().prepare("INSERT INTO step7_playback_tickets(id,owner_id,exercise_id,not_before,expires_at,created_at) VALUES(?,?,?,?,?,?)").bind(id, ownerId, exerciseId, notBefore, expiresAt, createdAt),
      db().prepare("DELETE FROM account_cas_assertions WHERE id=?").bind(assertionId),
    ]);
  } catch (error) {
    if (String(error).includes("account_cas_assertions") || String(error).includes("CHECK constraint")) throw new Error("ACCOUNT_DELETED");
    throw error;
  }
  return { id, notBefore, expiresAt };
}

export async function consumeStep7PlaybackTicket(ownerId: string, exerciseId: string, ticketId: string, attemptKey: string, now = new Date()) {
  const timestamp = now.toISOString();
  const result = await db().prepare("UPDATE step7_playback_tickets SET used_by_key=COALESCE(used_by_key,?) WHERE id=? AND owner_id=? AND exercise_id=? AND not_before<=? AND expires_at>? AND (used_by_key IS NULL OR used_by_key=?) AND (substr(owner_id,1,5)!='user:' OR EXISTS(SELECT 1 FROM accounts WHERE user_id=substr(owner_id,6) AND status='active')) AND NOT EXISTS(SELECT 1 FROM guest_merges WHERE guest_owner_id=? AND state='confirmed')")
    .bind(attemptKey, ticketId, ownerId, exerciseId, timestamp, timestamp, attemptKey, ownerId).run();
  if ((result.meta.changes ?? 0) !== 1) throw new Error("AUDIO_PLAYBACK_REQUIRED");
}
