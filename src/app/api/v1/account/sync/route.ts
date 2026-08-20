import { NextRequest, NextResponse } from "next/server";
import { accountOwnerId, requestIdentity } from "../../../../../lib/account/identity";
import { listSyncConflicts, syncCheckpoint } from "../../../../../lib/account/storage";
import { loadState } from "../../../../../lib/learning/storage";

export async function GET() {
  const identity = await requestIdentity();
  if (!identity.account || identity.account.status !== "active") return NextResponse.json({ error: "ACCOUNT_REQUIRED" }, { status: 401 });
  const [loaded, conflicts] = await Promise.all([
    loadState(accountOwnerId(identity.account.userId)),
    listSyncConflicts(identity.account.userId),
  ]);
  return NextResponse.json({ state: "synced", revision: loaded.revision, snapshot: loaded.state, conflicts });
}

export async function POST(req: NextRequest) {
  const identity = await requestIdentity();
  if (!identity.account || identity.account.status !== "active") return NextResponse.json({ error: "ACCOUNT_REQUIRED" }, { status: 401 });
  try {
    const text = await req.text();
    if (text.length > 2048) return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    const body = JSON.parse(text);
    const result = await syncCheckpoint(identity.account.userId, Number(body.clientRevision), String(body.deviceId ?? ""));
    return NextResponse.json(result, { status: result.state === "conflict" ? 409 : 200 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SYNC_FAILED";
    return NextResponse.json({ error: code }, { status: code.startsWith("INVALID") ? 422 : 500 });
  }
}
