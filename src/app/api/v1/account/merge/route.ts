import { NextRequest, NextResponse } from "next/server";
import { GUEST_COOKIE, requestIdentity } from "../../../../../lib/account/identity";
import { closeMerge, createMergePreview } from "../../../../../lib/account/storage";
import { accessDecision, createAuditEvent, errorContract } from "../../../../../lib/account/access-policy";
import { recordPolicyAudit } from "../../../../../lib/account/audit-storage";

const errorResponse = (code: string, status: number) => NextResponse.json(errorContract(code), { status });

export async function POST(req: NextRequest) {
  const identity = await requestIdentity();
  const subjectId = identity.account ? `user:${identity.account.userId}` : identity.guestId ?? "anonymous";
  const access = accessDecision({ accountStatus: identity.account?.status ?? "guest", permission: "account:merge" });
  if (!access.allowed) {
    await recordPolicyAudit(createAuditEvent({ subjectId, action: "account:merge", resourceType: "account", resourceId: subjectId, result: "denied", idempotencyKey: `merge-denied:${crypto.randomUUID()}` }));
    return errorResponse(access.code, access.code === "ACCOUNT_REQUIRED" ? 401 : 403);
  }
  if (!identity.account) return errorResponse("ACCOUNT_REQUIRED", 401);
  if (!identity.guestId) return errorResponse("NO_GUEST_DATA", 422);
  try {
    const text = await req.text();
    if (text.length > 2048) return errorResponse("PAYLOAD_TOO_LARGE", 413);
    const body = JSON.parse(text);
    if (body.action === "preview") {
      return NextResponse.json(await createMergePreview(identity.account.userId, identity.guestId), { status: 201 });
    }
    if (body.action === "confirm" || body.action === "cancel") {
      const mergeId = typeof body.mergeId === "string" ? body.mergeId : "";
      const mergeKey = typeof body.mergeKey === "string" ? body.mergeKey : "";
      if (!mergeId || !mergeKey) throw new Error("INVALID_MERGE_TOKEN");
      const result = await closeMerge(identity.account.userId, mergeId, mergeKey, body.action);
      const response = NextResponse.json(result);
      if (body.action === "confirm") response.cookies.delete(GUEST_COOKIE);
      return response;
    }
    return errorResponse("INVALID_ACTION", 422);
  } catch (error) {
    const code = error instanceof Error ? error.message : "MERGE_FAILED";
    const status = code === "MERGE_PREVIEW_STALE" || code.includes("ALREADY") ? 409 : code === "MERGE_EXPIRED" ? 410 : 422;
    await recordPolicyAudit(createAuditEvent({ subjectId, action: "account:merge", resourceType: "account", resourceId: subjectId, result: status === 409 ? "conflict" : "failed", idempotencyKey: `merge-error:${crypto.randomUUID()}`, metadata: { code } }));
    return errorResponse(code, status);
  }
}
