import { NextRequest, NextResponse } from "next/server";
import { accountOwnerId, requestIdentity } from "../../../../../lib/account/identity";
import { listSyncConflicts, syncCheckpoint } from "../../../../../lib/account/storage";
import { loadState } from "../../../../../lib/learning/storage";
import { accessDecision, createAuditEvent, errorContract } from "../../../../../lib/account/access-policy";
import { recordPolicyAudit } from "../../../../../lib/account/audit-storage";

const errorResponse = (code: string, status: number, extra: Record<string, unknown> = {}) => NextResponse.json({ ...errorContract(code), ...extra }, { status });
async function requireSyncAccess(identity: Awaited<ReturnType<typeof requestIdentity>>) {
  const subjectId = identity.account ? accountOwnerId(identity.account.userId) : identity.guestId ?? "anonymous";
  const decision = accessDecision({ accountStatus: identity.account?.status ?? "guest", permission: "account:sync" });
  if (!decision.allowed) await recordPolicyAudit(createAuditEvent({ subjectId, action: "account:sync", resourceType: "account", resourceId: subjectId, result: "denied", idempotencyKey: `sync-denied:${crypto.randomUUID()}` }));
  return { decision, subjectId };
}

export async function GET() {
  const identity = await requestIdentity();
  const access = await requireSyncAccess(identity);
  if (!access.decision.allowed) return errorResponse(access.decision.code, access.decision.code === "ACCOUNT_REQUIRED" ? 401 : 403);
  if (!identity.account) return errorResponse("ACCOUNT_REQUIRED", 401);
  const [loaded, conflicts] = await Promise.all([
    loadState(accountOwnerId(identity.account.userId)),
    listSyncConflicts(identity.account.userId),
  ]);
  return NextResponse.json({ state: "synced", revision: loaded.revision, snapshot: loaded.state, conflicts });
}

export async function POST(req: NextRequest) {
  const identity = await requestIdentity();
  const access = await requireSyncAccess(identity);
  if (!access.decision.allowed) return errorResponse(access.decision.code, access.decision.code === "ACCOUNT_REQUIRED" ? 401 : 403);
  if (!identity.account) return errorResponse("ACCOUNT_REQUIRED", 401);
  try {
    const text = await req.text();
    if (text.length > 2048) return errorResponse("PAYLOAD_TOO_LARGE", 413);
    const body = JSON.parse(text);
    const clientRevision = Number(body.clientRevision);
    const deviceId = String(body.deviceId ?? "");
    const result = await syncCheckpoint(identity.account.userId, clientRevision, deviceId);
    if (result.state !== "conflict") {
      await recordPolicyAudit(createAuditEvent({ subjectId: access.subjectId, action: "account_sync", resourceType: "account", resourceId: access.subjectId, result: "success", idempotencyKey: `sync:${deviceId}:${clientRevision}`, metadata: { revision: result.serverRevision } }));
      return NextResponse.json(result);
    }
    return errorResponse("SYNC_CONFLICT", 409, result);
  } catch (error) {
    const code = error instanceof Error ? error.message : "SYNC_FAILED";
    await recordPolicyAudit(createAuditEvent({ subjectId: access.subjectId, action: "account_sync", resourceType: "account", resourceId: access.subjectId, result: "failed", idempotencyKey: `sync-error:${crypto.randomUUID()}`, metadata: { code } }));
    return errorResponse(code, code.startsWith("INVALID") ? 422 : 500);
  }
}
