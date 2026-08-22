import { getCloudflareContext } from "@opennextjs/cloudflare";
import { POLICY_AUDIT_SQL, policyAuditBindings } from "../account/audit-storage";
import type { AuditEvent } from "../account/access-policy";
import { emptyLearningState, type LearningState } from "./domain";
export async function db(){return (await getCloudflareContext({async:true})).env.LEARNING_DB;}
export async function loadState(ownerId:string){const row=await (await db()).prepare("SELECT state_json,revision FROM learning_states WHERE owner_id=?").bind(ownerId).first<{state_json:string;revision:number}>();return row?{state:JSON.parse(row.state_json) as LearningState,revision:row.revision}:{state:emptyLearningState(),revision:0};}
export async function saveState(ownerId: string, state: LearningState, revision: number, audit?: AuditEvent) {
  const now = new Date().toISOString();
  const database = await db();
  const isAccount = ownerId.startsWith("user:");
  const userId = isAccount ? ownerId.slice(5) : "";
  const stateStatement = database.prepare(
    "INSERT INTO learning_states(owner_id,state_json,revision,updated_at) SELECT ?,?,?,? WHERE (?=0 OR EXISTS(SELECT 1 FROM accounts WHERE user_id=? AND status='active')) AND NOT EXISTS(SELECT 1 FROM guest_merges WHERE guest_owner_id=? AND state='confirmed') ON CONFLICT(owner_id) DO UPDATE SET state_json=excluded.state_json,revision=learning_states.revision+1,updated_at=excluded.updated_at WHERE learning_states.revision=? AND (?=0 OR EXISTS(SELECT 1 FROM accounts WHERE user_id=? AND status='active')) AND NOT EXISTS(SELECT 1 FROM guest_merges WHERE guest_owner_id=? AND state='confirmed')",
  ).bind(ownerId, JSON.stringify(state), 1, now, isAccount ? 1 : 0, userId, ownerId, revision, isAccount ? 1 : 0, userId, ownerId);
  let changes = 0;
  if (audit) {
    const assertionId = crypto.randomUUID();
    try {
      const results = await database.batch([
        database.prepare("INSERT INTO account_cas_assertions(id,ok) VALUES(?, CASE WHEN COALESCE((SELECT revision FROM learning_states WHERE owner_id=?),0)=? AND (?=0 OR EXISTS(SELECT 1 FROM accounts WHERE user_id=? AND status='active')) AND NOT EXISTS(SELECT 1 FROM guest_merges WHERE guest_owner_id=? AND state='confirmed') THEN 1 ELSE 0 END)").bind(assertionId, ownerId, revision, isAccount ? 1 : 0, userId, ownerId),
        stateStatement,
        database.prepare(POLICY_AUDIT_SQL).bind(...policyAuditBindings(audit)),
        database.prepare("DELETE FROM account_cas_assertions WHERE id=?").bind(assertionId),
      ]);
      changes = results[1].meta.changes ?? 0;
    } catch {
      if (isAccount) {
        const account = await database.prepare("SELECT status FROM accounts WHERE user_id=?").bind(userId).first<{ status: string }>();
        if (account?.status === "deleted") throw new Error("ACCOUNT_DELETED");
      }
      throw new Error("REVISION_CONFLICT");
    }
  } else {
    changes = (await stateStatement.run()).meta.changes ?? 0;
  }
  if (!changes) {
    if (isAccount) {
      const account = await database.prepare("SELECT status FROM accounts WHERE user_id=?").bind(userId).first<{ status: string }>();
      if (account?.status === "deleted") throw new Error("ACCOUNT_DELETED");
    }
    throw new Error("REVISION_CONFLICT");
  }
}
