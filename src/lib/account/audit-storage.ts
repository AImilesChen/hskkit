import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { AuditEvent } from "./access-policy";

export const POLICY_AUDIT_SQL = "INSERT OR IGNORE INTO policy_audit_events(id,subject_id,policy,action,resource_type,resource_id,result,idempotency_key,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)";

export function policyAuditBindings(event: AuditEvent) {
  return [
    event.id,
    event.subjectId,
    event.policy,
    event.action,
    event.resourceType,
    event.resourceId,
    event.result,
    event.idempotencyKey,
    JSON.stringify(event.metadata ?? {}),
    event.createdAt,
  ] as const;
}

export async function recordPolicyAudit(event: AuditEvent) {
  const database = getCloudflareContext().env.LEARNING_DB;
  await database.prepare(POLICY_AUDIT_SQL).bind(...policyAuditBindings(event)).run();
}
