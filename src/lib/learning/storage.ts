import { getCloudflareContext } from "@opennextjs/cloudflare";
import { emptyLearningState, type LearningState } from "./domain";
export async function db(){return (await getCloudflareContext({async:true})).env.LEARNING_DB;}
export async function loadState(ownerId:string){const row=await (await db()).prepare("SELECT state_json,revision FROM learning_states WHERE owner_id=?").bind(ownerId).first<{state_json:string;revision:number}>();return row?{state:JSON.parse(row.state_json) as LearningState,revision:row.revision}:{state:emptyLearningState(),revision:0};}
export async function saveState(ownerId: string, state: LearningState, revision: number) {
  const now = new Date().toISOString();
  const database = await db();
  const isAccount = ownerId.startsWith("user:");
  const userId = isAccount ? ownerId.slice(5) : "";
  const result = await database.prepare(
    "INSERT INTO learning_states(owner_id,state_json,revision,updated_at) SELECT ?,?,?,? WHERE ?=0 OR EXISTS(SELECT 1 FROM accounts WHERE user_id=? AND status='active') ON CONFLICT(owner_id) DO UPDATE SET state_json=excluded.state_json,revision=learning_states.revision+1,updated_at=excluded.updated_at WHERE learning_states.revision=? AND (?=0 OR EXISTS(SELECT 1 FROM accounts WHERE user_id=? AND status='active'))",
  ).bind(ownerId, JSON.stringify(state), 1, now, isAccount ? 1 : 0, userId, revision, isAccount ? 1 : 0, userId).run();
  if (!result.meta.changes) {
    if (isAccount) {
      const account = await database.prepare("SELECT status FROM accounts WHERE user_id=?").bind(userId).first<{ status: string }>();
      if (account?.status === "deleted") throw new Error("ACCOUNT_DELETED");
    }
    throw new Error("REVISION_CONFLICT");
  }
}
