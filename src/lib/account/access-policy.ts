export type AccessPermission = "learning:read" | "learning:write" | "planner:read" | "planner:write" | "account:merge" | "account:sync";
export type AccountStatus = "guest" | "active" | "deleted" | "revoked";

export function accessDecision(input: { accountStatus: AccountStatus; permission: AccessPermission }) {
  if (input.accountStatus === "deleted" || input.accountStatus === "revoked") {
    return { allowed: false as const, policy: "hskkit-access-v1" as const, code: "ACCESS_REVOKED" as const };
  }
  if (input.accountStatus === "guest" && (input.permission === "account:merge" || input.permission === "account:sync")) {
    return { allowed: false as const, policy: "hskkit-access-v1" as const, code: "ACCOUNT_REQUIRED" as const };
  }
  return { allowed: true as const, policy: "hskkit-access-v1" as const };
}

export function errorContract(code: string) {
  if (code === "REVISION_CONFLICT" || code === "PLAN_REVISION_CONFLICT" || code === "SYNC_CONFLICT") return { error: code, recoverable: true, recovery: "reload_then_retry" as const };
  if (code === "NETWORK_UNAVAILABLE" || code === "SAVE_FAILED") return { error: code, recoverable: true, recovery: "retry" as const };
  if (code === "ACCESS_REVOKED" || code === "ACCOUNT_DELETED") return { error: code === "ACCOUNT_DELETED" ? "ACCESS_REVOKED" : code, recoverable: false, recovery: "sign_out" as const };
  if (code === "ACCOUNT_REQUIRED") return { error: code, recoverable: true, recovery: "sign_in" as const };
  return { error: code, recoverable: false, recovery: "none" as const };
}

export interface AuditEvent {
  id: string;
  subjectId: string;
  policy: "hskkit-access-v1";
  action: string;
  resourceType: "learning" | "planner" | "account";
  resourceId: string;
  result: "allowed" | "denied" | "success" | "conflict" | "failed";
  idempotencyKey: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export function createAuditEvent(input: Omit<AuditEvent, "id" | "policy" | "createdAt"> & { createdAt?: string }): AuditEvent {
  return { ...input, id: crypto.randomUUID(), policy: "hskkit-access-v1", createdAt: input.createdAt ?? new Date().toISOString() };
}
