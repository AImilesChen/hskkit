import { NextRequest, NextResponse } from "next/server";
import { accountOwnerId, requestIdentity } from "../../../../../lib/account/identity";
import { listSyncConflicts, listSyncDevices, registerSyncDevice, revokeSyncDevice, syncCheckpoint } from "../../../../../lib/account/storage";
import { resolveCapabilities } from "../../../../../lib/commercial/storage";
import { loadState } from "../../../../../lib/learning/storage";
import { projectLearningHistory } from "../../../../../lib/learning/projection";
import { accessDecision, createAuditEvent, errorContract } from "../../../../../lib/account/access-policy";
import { recordPolicyAudit } from "../../../../../lib/account/audit-storage";

const errorResponse = (code: string, status: number, extra: Record<string, unknown> = {}) => NextResponse.json({ ...errorContract(code), ...extra }, { status });
async function requireSyncAccess(identity: Awaited<ReturnType<typeof requestIdentity>>) {
  const subjectId = identity.account ? accountOwnerId(identity.account.userId) : identity.guestId ?? "anonymous";
  const decision = accessDecision({ accountStatus: identity.account?.status ?? "guest", permission: "account:sync" });
  if (!decision.allowed) await recordPolicyAudit(createAuditEvent({ subjectId, action: "account:sync", resourceType: "account", resourceId: subjectId, result: "denied", idempotencyKey: `sync-denied:${crypto.randomUUID()}` }));
  return { decision, subjectId };
}

export async function GET(req: NextRequest) {
  const identity = await requestIdentity();
  const access = await requireSyncAccess(identity);
  if (!access.decision.allowed) {
    const code = access.decision.code ?? "SYNC_FORBIDDEN";
    return errorResponse(code, code === "ACCOUNT_REQUIRED" ? 401 : 403);
  }
  if (!identity.account) return errorResponse("ACCOUNT_REQUIRED", 401);
  const deviceId = String(req.nextUrl.searchParams.get("deviceId") ?? "");
  if (!deviceId || deviceId.length > 80) return errorResponse("INVALID_DEVICE_ID", 422);
  const ownerId = accountOwnerId(identity.account.userId);
  try {
    const capabilities = await resolveCapabilities(ownerId);
    await registerSyncDevice(identity.account.userId, deviceId, capabilities.syncDevices);
    const [loaded, conflicts, devices] = await Promise.all([
      loadState(ownerId),
      listSyncConflicts(identity.account.userId),
      listSyncDevices(identity.account.userId),
    ]);
    return NextResponse.json({ state: "synced", revision: loaded.revision, snapshot: projectLearningHistory(loaded.state, capabilities), conflicts, devices, capabilities });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SYNC_FAILED";
    return errorResponse(code, code === "SYNC_DEVICE_LIMIT_REACHED" ? 409 : 500, code === "SYNC_DEVICE_LIMIT_REACHED" ? { upgradeHref: "/pricing" } : {});
  }
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
    const capabilities = await resolveCapabilities(accountOwnerId(identity.account.userId));
    await registerSyncDevice(identity.account.userId, deviceId, capabilities.syncDevices);
    const result = await syncCheckpoint(identity.account.userId, clientRevision, deviceId);
    const projectedResult = { ...result, snapshot: projectLearningHistory(result.snapshot, capabilities) };
    if (result.state !== "conflict") {
      await recordPolicyAudit(createAuditEvent({ subjectId: access.subjectId, action: "account_sync", resourceType: "account", resourceId: access.subjectId, result: "success", idempotencyKey: `sync:${deviceId}:${clientRevision}`, metadata: { revision: result.serverRevision } }));
      return NextResponse.json(projectedResult);
    }
    return errorResponse("SYNC_CONFLICT", 409, projectedResult);
  } catch (error) {
    const code = error instanceof Error ? error.message : "SYNC_FAILED";
    await recordPolicyAudit(createAuditEvent({ subjectId: access.subjectId, action: "account_sync", resourceType: "account", resourceId: access.subjectId, result: "failed", idempotencyKey: `sync-error:${crypto.randomUUID()}`, metadata: { code } }));
    return errorResponse(code, code.startsWith("INVALID") ? 422 : code === "SYNC_DEVICE_LIMIT_REACHED" ? 409 : 500, code === "SYNC_DEVICE_LIMIT_REACHED" ? { upgradeHref: "/pricing" } : {});
  }
}

export async function DELETE(req: NextRequest) {
  const identity = await requestIdentity();
  const access = await requireSyncAccess(identity);
  if (!access.decision.allowed || !identity.account) {
    const code = access.decision.code ?? "SYNC_FORBIDDEN";
    return errorResponse(code, code === "ACCOUNT_REQUIRED" ? 401 : 403);
  }
  try {
    const body = await req.json() as { deviceId?: unknown };
    const deviceId = String(body.deviceId ?? "");
    if (!deviceId || deviceId.length > 80) return errorResponse("INVALID_DEVICE_ID", 422);
    await revokeSyncDevice(identity.account.userId, deviceId);
    return NextResponse.json({ state: "revoked", deviceId });
  } catch {
    return errorResponse("INVALID_JSON", 400);
  }
}
