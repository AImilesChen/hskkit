import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { GUEST_COOKIE } from "@/lib/account/identity";
import { d1UnavailableResponse } from "@/lib/d1/user-protection";
import { examPaper } from "@/lib/formal-exams/hsk5/catalog";
import { FORMAL_PREFIX, formalSession, formalView, isForm, saveFormalAnswer, startFormal, submitFormal } from "@/lib/formal-exams/hsk5/domain";
import { formalIdentity, requirePaperAccess } from "@/lib/formal-exams/hsk5/server";
import { createMockSession, discardMockSession, findMockByStartKey, loadMockSession, saveMockProgress, saveMockSubmission } from "@/lib/mock/storage";

export const dynamic = "force-dynamic";
const privateHeaders = { "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: privateHeaders });
const short = (value: unknown, max = 160): value is string => typeof value === "string" && value.length > 0 && value.length <= max;
function failure(error: unknown) {
  const unavailable = d1UnavailableResponse(error);
  if (unavailable) return unavailable;
  const code = error instanceof Error ? error.message : "EXAM_UNAVAILABLE";
  const status = code === "SIGN_IN_REQUIRED" ? 401 : code === "PRO_REQUIRED" || code === "ACCOUNT_UNAVAILABLE" ? 403
    : code === "EXAM_NOT_FOUND" ? 404 : code === "EXAM_TIME_EXPIRED" ? 410
    : code === "REVISION_CONFLICT" || code === "IDEMPOTENCY_KEY_REUSED" || code === "SECTION_LOCKED" ? 409 : 422;
  const known = /^(SIGN_IN_REQUIRED|PRO_REQUIRED|ACCOUNT_UNAVAILABLE|EXAM_NOT_FOUND|EXAM_TIME_EXPIRED|REVISION_CONFLICT|IDEMPOTENCY_KEY_REUSED|SECTION_LOCKED|INVALID_[A-Z_]+|EXAM_ALREADY_SUBMITTED|EXAM_VERSION_CHANGED)$/.test(code);
  return json({ error: known ? code : "EXAM_UNAVAILABLE", retryable: !known }, known ? status : 503);
}
async function loadOwned(sessionId: unknown) {
  if (!short(sessionId) || !sessionId.startsWith("formal_")) throw new Error("EXAM_NOT_FOUND");
  const identity = await formalIdentity();
  if (!identity.id) throw new Error("EXAM_NOT_FOUND");
  const session = await loadMockSession(identity.id, sessionId);
  if (!session || !formalSession(session)) throw new Error("EXAM_NOT_FOUND");
  const form = session.questionSetVersion.slice(FORMAL_PREFIX.length).match(/^hsk5-([abc])-v1$/)?.[1];
  if (!isForm(form)) throw new Error("EXAM_NOT_FOUND");
  await requirePaperAccess(form, identity);
  return { session, paper: examPaper(form) };
}
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    if (sessionId) {
      const { session, paper } = await loadOwned(sessionId);
      return json({ session: formalView(session, paper, new Date().toISOString()) });
    }
    const identity = await formalIdentity();
    if (!identity.id) return json({ history: [] });
    const db = (await getCloudflareContext({ async: true })).env.LEARNING_DB;
    const rows = await db.prepare("SELECT id,question_set_version,status,started_at,result_json FROM mock_sessions WHERE owner_id=? AND question_set_version LIKE 'formal:hsk5-%' ORDER BY started_at DESC LIMIT 30")
      .bind(identity.id).all<{ id: string; question_set_version: string; status: string; started_at: string; result_json: string | null }>();
    return json({ history: rows.results.map((row: { id: string; question_set_version: string; status: string; started_at: string; result_json: string | null }) => ({ id: row.id, form: row.question_set_version.match(/^formal:hsk5-([abc])-v1$/)?.[1],
      status: row.status, startedAt: row.started_at, correct: row.result_json ? (JSON.parse(row.result_json) as { correctCount: number }).correctCount : undefined })) });
  } catch (error) { return failure(error); }
}
export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    if (origin) {
      try {
        const parsed = new URL(origin);
        // Next's development/proxy URL may use an internal host. The browser's
        // Origin must match the incoming Host, never a client-supplied forwarded host.
        const host = req.headers.get("host") ?? req.nextUrl.host;
        if (!["http:", "https:"].includes(parsed.protocol) || parsed.host !== host) return json({ error: "INVALID_ORIGIN" }, 403);
      } catch { return json({ error: "INVALID_ORIGIN" }, 403); }
    }
    const text = await req.text();
    if (text.length > 12000) return json({ error: "INVALID_PAYLOAD" }, 413);
    let body: Record<string, unknown>;
    try { body = JSON.parse(text); } catch { return json({ error: "INVALID_JSON" }, 400); }
    if (!body || typeof body !== "object" || !short(body.key, 120)) throw new Error("INVALID_REQUEST");
    const now = new Date().toISOString();
    if (body.action === "start") {
      if (!isForm(body.form)) throw new Error("INVALID_FORM");
      const identity = await formalIdentity(true);
      await requirePaperAccess(body.form, identity);
      const key = `formal:hsk5:${body.form}:${body.key}`;
      const prior = await findMockByStartKey(identity.id, "basic", key);
      const session = prior ?? await createMockSession(startFormal(examPaper(body.form), identity.id, body.key, now));
      const result = json({ session: formalView(session, examPaper(body.form), now) });
      if (identity.fresh) result.cookies.set(GUEST_COOKIE, identity.id, { httpOnly: true, sameSite: "lax", secure: req.nextUrl.protocol === "https:", maxAge: 31_536_000, path: "/" });
      return result;
    }
    const { session, paper } = await loadOwned(body.sessionId);
    if (body.action === "discard") {
      if (session.status !== "in_progress") throw new Error("EXAM_ALREADY_SUBMITTED");
      await discardMockSession(session, session.revision);
      return json({ discarded: true });
    }
    if (body.action === "answer") {
      if (!short(body.questionId) || (typeof body.answer !== "string" || body.answer.length > 2000)) throw new Error("INVALID_ANSWER");
      const updated = saveFormalAnswer(session, { questionId: body.questionId, answer: body.answer, idempotencyKey: body.key, now });
      if (updated !== session) await saveMockProgress(updated, session.revision);
      return json({ session: formalView(updated, paper, now) });
    }
    if (body.action === "submit") {
      const updated = submitFormal(session, body.key, now);
      const durable = session.status === "submitted" ? session : await saveMockSubmission(updated, session.revision);
      return json({ session: formalView(durable, paper, now) });
    }
    throw new Error("INVALID_ACTION");
  } catch (error) { return failure(error); }
}
