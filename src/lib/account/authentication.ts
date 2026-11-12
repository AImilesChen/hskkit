import { getCloudflareContext } from "@opennextjs/cloudflare";

// Keep session reads independent of account merges and learning-content setup.
export interface Account {
  userId: string;
  displayName: string;
  timezone: string;
  status: "active" | "deleted";
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type AccountRow = {
  user_id: string;
  display_name: string;
  timezone: string;
  status: "active" | "deleted";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function accountFromRow(row: AccountRow): Account {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    timezone: row.timezone,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
  };
}

const db = () => getCloudflareContext().env.LEARNING_DB;
const SESSION_TOUCH_INTERVAL_MS = 15 * 60_000;
const sessionTouchThreshold = (timestamp: string) => new Date(Date.parse(timestamp) - SESSION_TOUCH_INTERVAL_MS).toISOString();

async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function authenticateAccount(syncKey: string | undefined, touchSession = false) {
  if (!syncKey || syncKey.length < 20 || syncKey.length > 100) return undefined;
  const tokenHash = await hash(syncKey);
  const row = await db().prepare("SELECT a.* FROM account_tokens t JOIN accounts a ON a.user_id=t.user_id WHERE t.token_hash=? AND t.revoked_at IS NULL AND a.status='active'").bind(tokenHash).first<AccountRow>();
  if (!row) return undefined;
  const timestamp = new Date().toISOString();
  if (touchSession) await db().prepare("UPDATE account_tokens SET last_used_at=? WHERE token_hash=? AND (last_used_at IS NULL OR last_used_at < ?)").bind(timestamp, tokenHash, sessionTouchThreshold(timestamp)).run().catch(() => undefined);
  return accountFromRow(row);
}

export async function authenticateSession(sessionToken: string | undefined, touchSession = false) {
  if (!sessionToken || sessionToken.length < 20 || sessionToken.length > 100) return undefined;
  const tokenHash = await hash(sessionToken);
  const timestamp = new Date().toISOString();
  const row = await db().prepare("SELECT a.* FROM account_sessions s JOIN accounts a ON a.user_id=s.user_id WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? AND a.status='active'").bind(tokenHash, timestamp).first<AccountRow>();
  if (!row) return undefined;
  if (touchSession) await db().prepare("UPDATE account_sessions SET last_used_at=? WHERE token_hash=? AND (last_used_at IS NULL OR last_used_at < ?)").bind(timestamp, tokenHash, sessionTouchThreshold(timestamp)).run().catch(() => undefined);
  return accountFromRow(row);
}
