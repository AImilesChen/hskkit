import { NextRequest, NextResponse } from "next/server";
import { requestIdentity } from "../../../../../lib/account/identity";
import { accountAudit, actOnDataRequest, createAccountDataRequest, getAccountDataRequest, listAccountDataRequests } from "../../../../../lib/account/storage";
import type { DataRequestAction, DataRequestType } from "../../../../../lib/account/domain";

export async function GET(req: NextRequest) {
  const identity = await requestIdentity();
  if (!identity.account) return NextResponse.json({ error: "ACCOUNT_REQUIRED" }, { status: 401 });
  const requestId = req.nextUrl.searchParams.get("download");
  if (requestId) {
    if (identity.account.status !== "active") return NextResponse.json({ error: "ACCOUNT_DELETED" }, { status: 403 });
    const item = await getAccountDataRequest(identity.account.userId, requestId);
    if (!item) return NextResponse.json({ error: "REQUEST_NOT_FOUND" }, { status: 404 });
    if (item.state !== "ready" || !item.resultJson) return NextResponse.json({ error: "EXPORT_NOT_READY" }, { status: 409 });
    if (!item.expiresAt || Date.parse(item.expiresAt) <= Date.now()) return NextResponse.json({ error: "EXPORT_EXPIRED" }, { status: 410 });
    return new NextResponse(item.resultJson, { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="hskkit-account-${requestId}.json"`, "cache-control": "private, no-store" } });
  }
  const [requests, audit] = await Promise.all([listAccountDataRequests(identity.account.userId), accountAudit(identity.account.userId)]);
  return NextResponse.json({ accountStatus: identity.account.status, requests, audit });
}

export async function POST(req: NextRequest) {
  const identity = await requestIdentity();
  if (!identity.account || identity.account.status !== "active") return NextResponse.json({ error: "ACCOUNT_REQUIRED" }, { status: 401 });
  try {
    const body = JSON.parse(await req.text());
    const type = body.type === "export" || body.type === "delete" ? body.type as DataRequestType : undefined;
    if (!type) throw new Error("INVALID_REQUEST_TYPE");
    if (type === "delete" && body.confirmation !== "DELETE") throw new Error("DELETE_CONFIRMATION_REQUIRED");
    const item = await createAccountDataRequest(identity.account.userId, type, String(body.idempotencyKey ?? ""));
    return NextResponse.json({ request: item }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "REQUEST_FAILED";
    return NextResponse.json({ error: code }, { status: code.startsWith("INVALID") || code.includes("CONFIRMATION") ? 422 : 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const identity = await requestIdentity();
  if (!identity.account || identity.account.status !== "active") return NextResponse.json({ error: "ACCOUNT_REQUIRED" }, { status: 401 });
  try {
    const body = JSON.parse(await req.text());
    const action = ["confirm", "process", "cancel", "retry"].includes(body.action) ? body.action as DataRequestAction : undefined;
    if (!action || typeof body.requestId !== "string") throw new Error("INVALID_ACTION");
    if (action === "confirm" && body.confirmation !== "DELETE") throw new Error("DELETE_CONFIRMATION_REQUIRED");
    const item = await actOnDataRequest(identity.account.userId, body.requestId, action);
    return NextResponse.json({ request: item });
  } catch (error) {
    const code = error instanceof Error ? error.message : "REQUEST_FAILED";
    const status = code === "REQUEST_NOT_FOUND" ? 404 : code.includes("CONFLICT") || code.includes("TRANSITION") ? 409 : 422;
    return NextResponse.json({ error: code }, { status });
  }
}
