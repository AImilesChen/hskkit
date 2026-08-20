import { NextRequest, NextResponse } from "next/server";
import { requestIdentity } from "../../../../../lib/account/identity";
import { closeMerge, createMergePreview } from "../../../../../lib/account/storage";

export async function POST(req: NextRequest) {
  const identity = await requestIdentity();
  if (!identity.account || identity.account.status !== "active") return NextResponse.json({ error: "ACCOUNT_REQUIRED" }, { status: 401 });
  if (!identity.guestId) return NextResponse.json({ error: "NO_GUEST_DATA" }, { status: 422 });
  try {
    const text = await req.text();
    if (text.length > 2048) return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    const body = JSON.parse(text);
    if (body.action === "preview") {
      return NextResponse.json(await createMergePreview(identity.account.userId, identity.guestId), { status: 201 });
    }
    if (body.action === "confirm" || body.action === "cancel") {
      const mergeId = typeof body.mergeId === "string" ? body.mergeId : "";
      const mergeKey = typeof body.mergeKey === "string" ? body.mergeKey : "";
      if (!mergeId || !mergeKey) throw new Error("INVALID_MERGE_TOKEN");
      return NextResponse.json(await closeMerge(identity.account.userId, mergeId, mergeKey, body.action));
    }
    return NextResponse.json({ error: "INVALID_ACTION" }, { status: 422 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "MERGE_FAILED";
    const status = code === "MERGE_PREVIEW_STALE" || code.includes("ALREADY") ? 409 : code === "MERGE_EXPIRED" ? 410 : 422;
    return NextResponse.json({ error: code }, { status });
  }
}
